<?php
/**
 * Users API Endpoints
 * RESTful API for user management (Admin only)
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../services/AuthService.php';
require_once __DIR__ . '/../services/RBACService.php';
require_once __DIR__ . '/../models/User.php';

$authService = new AuthService();
$rbacService = new RBACService();
$userModel = new User();

$method = $_SERVER['REQUEST_METHOD'];

// Authenticate user for all endpoints
$sessionId = $_COOKIE['session_id'] ?? '';
$ipAddress = $_SERVER['REMOTE_ADDR'];
$user = $authService->validateSession($sessionId, $ipAddress);

if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

$userId = $user['user_id'];

// Check if user has admin permissions for user management
if (!$rbacService->hasPermission($userId, 'manage_all_users')) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Insufficient permissions']);
    exit;
}

try {
    switch ($method) {
        case 'GET':
            handleGetUsers();
            break;
        case 'POST':
            handleCreateUser();
            break;
        case 'PUT':
            handleUpdateUser();
            break;
        case 'DELETE':
            handleDeleteUser();
            break;
        default:
            sendErrorResponse('Method not allowed', 405);
    }
} catch (Exception $e) {
    sendErrorResponse($e->getMessage(), 400);
}

/**
 * Handle getting users
 */
function handleGetUsers() {
    global $userModel;
    
    $role = $_GET['role'] ?? null;
    $activeOnly = isset($_GET['active']) ? $_GET['active'] === 'true' : true;
    
    if ($role) {
        $users = $userModel->getUsersByRole($role);
    } else {
        $users = $userModel->getAllUsers();
        if ($activeOnly) {
            $users = array_filter($users, function($user) {
                return $user['is_active'] == 1;
            });
        }
    }
    
    // Remove sensitive data
    $sanitizedUsers = array_map(function($user) {
        unset($user['password_hash']);
        return $user;
    }, $users);
    
    sendJsonResponse([
        'success' => true,
        'users' => array_values($sanitizedUsers),
        'total' => count($sanitizedUsers)
    ]);
}

/**
 * Handle creating user (admin only)
 */
function handleCreateUser() {
    global $userModel, $authService;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendErrorResponse('Invalid JSON input', 400);
    }
    
    // Validate required fields
    $requiredFields = ['username', 'email', 'password', 'first_name', 'last_name', 
                      'date_of_birth', 'gender', 'height_cm', 'weight_kg', 'activity_level', 'role'];
    
    foreach ($requiredFields as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            sendErrorResponse("Field '{$field}' is required", 400);
        }
    }
    
    // Validate role
    $validRoles = ['customer', 'trainer', 'admin'];
    if (!in_array($input['role'], $validRoles)) {
        sendErrorResponse('Invalid role', 400);
    }
    
    // Hash password
    $input['password_hash'] = password_hash($input['password'], PASSWORD_DEFAULT);
    unset($input['password']);
    
    try {
        $newUserId = $userModel->create($input);
        
        // Create default goal for customer users
        if ($input['role'] === 'customer') {
            $authService->createDefaultGoal($newUserId);
        }
        
        sendJsonResponse([
            'success' => true,
            'user_id' => $newUserId,
            'message' => 'User created successfully'
        ], 201);
        
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
            sendErrorResponse('Username or email already exists', 409);
        }
        throw $e;
    }
}

/**
 * Handle updating user
 */
function handleUpdateUser() {
    global $userModel, $rbacService;
    
    $targetUserId = $_GET['id'] ?? null;
    if (!$targetUserId) {
        sendErrorResponse('User ID is required', 400);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        sendErrorResponse('Invalid JSON input', 400);
    }
    
    // Check if trying to update role (requires admin permission)
    if (isset($input['role'])) {
        if (!$rbacService->hasPermission($GLOBALS['userId'], 'manage_roles')) {
            sendErrorResponse('Insufficient permissions to change roles', 403);
        }
        
        $validRoles = ['customer', 'trainer', 'admin'];
        if (!in_array($input['role'], $validRoles)) {
            sendErrorResponse('Invalid role', 400);
        }
        
        $success = $userModel->updateRole((int) $targetUserId, $input['role']);
        unset($input['role']); // Remove from general update
    }
    
    // Update other user fields
    if (!empty($input)) {
        $allowedFields = ['first_name', 'last_name', 'height_cm', 'weight_kg', 'activity_level'];
        $updateData = array_intersect_key($input, array_flip($allowedFields));
        
        if (!empty($updateData)) {
            $success = $userModel->update((int) $targetUserId, $updateData) && $success;
        }
    }
    
    if ($success) {
        sendJsonResponse(['success' => true, 'message' => 'User updated successfully']);
    } else {
        sendErrorResponse('Failed to update user', 500);
    }
}

/**
 * Handle deleting/deactivating user
 */
function handleDeleteUser() {
    global $userModel, $userId;
    
    $targetUserId = $_GET['id'] ?? null;
    if (!$targetUserId) {
        sendErrorResponse('User ID is required', 400);
    }
    
    // Prevent self-deletion
    if ((int) $targetUserId === $userId) {
        sendErrorResponse('Cannot delete your own account', 400);
    }
    
    $action = $_GET['action'] ?? 'deactivate'; // 'deactivate' or 'activate'
    
    if ($action === 'deactivate') {
        $success = $userModel->deactivateUser((int) $targetUserId);
        $message = 'User deactivated successfully';
    } elseif ($action === 'activate') {
        $success = $userModel->activateUser((int) $targetUserId);
        $message = 'User activated successfully';
    } else {
        sendErrorResponse('Invalid action', 400);
    }
    
    if ($success) {
        sendJsonResponse(['success' => true, 'message' => $message]);
    } else {
        sendErrorResponse('Failed to update user status', 500);
    }
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
