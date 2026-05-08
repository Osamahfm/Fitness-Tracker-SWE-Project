<?php
/**
 * Authentication API Endpoints
 * RESTful API for user registration, login, and session management
 */

// Load configuration
require_once __DIR__ . '/../config/Config.php';
require_once __DIR__ . '/../helpers/ValidationHelper.php';
require_once __DIR__ . '/../helpers/RateLimiter.php';
require_once __DIR__ . '/../helpers/ResponseHelper.php';
require_once __DIR__ . '/../services/AuthService.php';

// Set security headers
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');

// Handle CORS with configured origins
$allowedOrigins = explode(',', Config::get('CORS_ALLOWED_ORIGINS', 'http://localhost:8000'));
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
}

header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Max-Age: 86400');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

$authService = new AuthService();
$rateLimiter = new RateLimiter();
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// Get the endpoint (last part of path)
$endpoint = end($pathParts);

// Get client identifier
$clientId = $_SERVER['REMOTE_ADDR'] . '_' . $endpoint;

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
        return;
    }
    
    // Validate input
    $validationErrors = ValidationHelper::validateRegistrationData($input);
    if (!empty($validationErrors)) {
        sendErrorResponse('Validation failed', 422, $validationErrors);
        return;
    }
    
    // Sanitize inputs
    $input['email'] = ValidationHelper::sanitizeEmail($input['email']);
    $input['username'] = ValidationHelper::sanitizeString($input['username']);
    $input['first_name'] = ValidationHelper::sanitizeString($input['first_name']);
    $input['last_name'] = ValidationHelper::sanitizeString($input['last_name']);
    
    try {
        $result = $authService->register($input);
        
        if ($result['success']) {
            sendJsonResponse($result, 201);
        } else {
            sendErrorResponse($result['message'], 400);
        }
    } catch (Exception $e) {
        sendErrorResponse($e->getMessage(), 400);
    }
}

/**
 * Handle user login
 */
function handleLogin() {
    global $authService;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendErrorResponse('Invalid JSON input', 400);
        return;
    }
    
    // Validate input
    $validationErrors = ValidationHelper::validateLoginData($input);
    if (!empty($validationErrors)) {
        sendErrorResponse('Validation failed', 422, $validationErrors);
        return;
    }
    
    // Sanitize inputs
    $email = ValidationHelper::sanitizeEmail($input['email']);
    $password = $input['password'];
    
    $ipAddress = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    
    try {
        $result = $authService->login($email, $password, $ipAddress, $userAgent);
        
        if ($result['success']) {
            // Set session cookie with secure settings
            setcookie('session_id', $result['session_id'], [
                'expires' => time() + Config::getInt('SESSION_TIMEOUT', 3600),
                'path' => '/',
                'domain' => '',
                'secure' => Config::getBoolean('SESSION_SECURE', false),
                'httponly' => Config::getBoolean('SESSION_HTTPONLY', true),
                'samesite' => 'Strict'
            ]);
            
            sendJsonResponse($result, 200);
        } else {
            sendErrorResponse('Login failed', 401);
        }
    } catch (Exception $e) {
        sendErrorResponse($e->getMessage(), 400);
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
function sendErrorResponse($message, $statusCode = 400, $errors = null) {
    http_response_code($statusCode);
    $response = [
        'success' => false,
        'message' => $message
    ];
    
    if ($errors !== null && is_array($errors)) {
        $response['errors'] = $errors;
    }
    
    echo json_encode($response);
    exit;
}
?>
