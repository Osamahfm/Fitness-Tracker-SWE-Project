<?php
/**
 * Authentication API Endpoints
 * RESTful API for user registration, login, and session management
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../services/AuthService.php';

$authService = new AuthService();
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// Get the endpoint (last part of path)
$endpoint = end($pathParts);

try {
    switch ($method) {
        case 'POST':
            switch ($endpoint) {
                case 'register':
                    handleRegister();
                    break;
                case 'login':
                    handleLogin();
                    break;
                case 'logout':
                    handleLogout();
                    break;
                case 'change-password':
                    handleChangePassword();
                    break;
                default:
                    sendErrorResponse('Invalid endpoint', 404);
            }
            break;
        case 'GET':
            switch ($endpoint) {
                case 'validate':
                    handleValidateSession();
                    break;
                default:
                    sendErrorResponse('Invalid endpoint', 404);
            }
            break;
        default:
            sendErrorResponse('Method not allowed', 405);
    }
} catch (Exception $e) {
    sendErrorResponse($e->getMessage(), 400);
}

/**
 * Handle user registration
 */
function handleRegister() {
    global $authService;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendErrorResponse('Invalid JSON input', 400);
    }
    
    $result = $authService->register($input);
    
    if ($result['success']) {
        sendJsonResponse($result, 201);
    } else {
        sendErrorResponse($result['message'], 400);
    }
}

/**
 * Handle user login
 */
function handleLogin() {
    global $authService;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['email']) || !isset($input['password'])) {
        sendErrorResponse('Email and password are required', 400);
    }
    
    $ipAddress = $_SERVER['REMOTE_ADDR'];
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    
    $result = $authService->login($input['email'], $input['password'], $ipAddress, $userAgent);
    
    if ($result['success']) {
        // Set session cookie
        setcookie('session_id', $result['session_id'], [
            'expires' => time() + 86400, // 24 hours
            'path' => '/',
            'domain' => '',
            'secure' => false, // Set to true in production with HTTPS
            'httponly' => true,
            'samesite' => 'Strict'
        ]);
        
        sendJsonResponse($result, 200);
    } else {
        sendErrorResponse('Login failed', 401);
    }
}

/**
 * Handle user logout
 */
function handleLogout() {
    global $authService;
    
    $sessionId = $_COOKIE['session_id'] ?? '';
    
    if (empty($sessionId)) {
        sendErrorResponse('No active session', 401);
    }
    
    $success = $authService->logout($sessionId);
    
    // Clear session cookie
    setcookie('session_id', '', [
        'expires' => time() - 3600,
        'path' => '/',
        'domain' => '',
        'secure' => false,
        'httponly' => true,
        'samesite' => 'Strict'
    ]);
    
    sendJsonResponse(['success' => $success, 'message' => 'Logged out successfully'], 200);
}

/**
 * Handle session validation
 */
function handleValidateSession() {
    global $authService;
    
    $sessionId = $_COOKIE['session_id'] ?? '';
    $ipAddress = $_SERVER['REMOTE_ADDR'];
    
    if (empty($sessionId)) {
        sendErrorResponse('No session found', 401);
    }
    
    $user = $authService->validateSession($sessionId, $ipAddress);
    
    if ($user) {
        sendJsonResponse(['success' => true, 'user' => $user], 200);
    } else {
        sendErrorResponse('Invalid or expired session', 401);
    }
}

/**
 * Handle password change
 */
function handleChangePassword() {
    global $authService;
    
    $sessionId = $_COOKIE['session_id'] ?? '';
    $ipAddress = $_SERVER['REMOTE_ADDR'];
    
    // Validate session first
    $user = $authService->validateSession($sessionId, $ipAddress);
    if (!$user) {
        sendErrorResponse('Unauthorized', 401);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['current_password']) || !isset($input['new_password'])) {
        sendErrorResponse('Current password and new password are required', 400);
    }
    
    $success = $authService->changePassword($user['user_id'], $input['current_password'], $input['new_password']);
    
    sendJsonResponse(['success' => $success, 'message' => 'Password changed successfully'], 200);
}

/**
 * Send JSON response
 */
function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

/**
 * Send error response
 */
function sendErrorResponse($message, $statusCode = 400) {
    http_response_code($statusCode);
    echo json_encode(['success' => false, 'error' => $message]);
    exit;
}
?>
