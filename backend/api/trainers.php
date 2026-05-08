<?php
/**
 * Trainers API Endpoints
 * RESTful API for trainer-specific features
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

$authService = new AuthService();
$rbacService = new RBACService();

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

try {
    switch ($method) {
        case 'GET':
            handleGetTrainerData();
            break;
        case 'POST':
            handleTrainerAction();
            break;
        case 'PUT':
            handleUpdateTrainerData();
            break;
        default:
            sendErrorResponse('Method not allowed', 405);
    }
} catch (Exception $e) {
    sendErrorResponse($e->getMessage(), 400);
}

/**
 * Handle getting trainer data
 */
function handleGetTrainerData() {
    global $rbacService, $userId;
    
    $endpoint = $_GET['endpoint'] ?? 'clients';
    
    switch ($endpoint) {
        case 'clients':
            handleGetClients();
            break;
        case 'client-progress':
            handleGetClientProgress();
            break;
        case 'workout-plans':
            handleGetWorkoutPlans();
            break;
        case 'available-clients':
            handleGetAvailableClients();
            break;
        default:
            sendErrorResponse('Invalid endpoint', 404);
    }
}

/**
 * Get trainer's assigned clients
 */
function handleGetClients() {
    global $rbacService, $userId;
    
    // Check if user has trainer permissions
    if (!$rbacService->hasPermission($userId, 'view_client_list')) {
        sendErrorResponse('Insufficient permissions', 403);
    }
    
    $clients = $rbacService->getTrainerClients($userId);
    
    sendJsonResponse([
        'success' => true,
        'clients' => $clients,
        'total' => count($clients)
    ]);
}

/**
 * Get client progress data
 */
function handleGetClientProgress() {
    global $rbacService, $userId;
    
    if (!$rbacService->hasPermission($userId, 'view_client_progress')) {
        sendErrorResponse('Insufficient permissions', 403);
    }
    
    $clientId = $_GET['client_id'] ?? null;
    if (!$clientId) {
        sendErrorResponse('Client ID is required', 400);
    }
    
    // Check if trainer can access this client's data
    if (!$rbacService->canAccessUserData($userId, (int) $clientId, 'progress')) {
        sendErrorResponse('Cannot access this client\'s data', 403);
    }
    
    // Get client's recent activities, meals, and goals
    require_once __DIR__ . '/../models/Activity.php';
    require_once __DIR__ . '/../models/Meal.php';
    require_once __DIR__ . '/../models/Goal.php';
    
    $activityModel = new Activity();
    $mealModel = new Meal();
    $goalModel = new Goal();
    
    $recentActivities = $activityModel->getRecentActivities((int) $clientId, 10);
    $recentMeals = $mealModel->getRecentMeals((int) $clientId, 10);
    $activeGoal = $goalModel->getActiveGoal((int) $clientId);
    
    // Get weekly stats
    $weeklyActivities = $activityModel->getWeeklyStats((int) $clientId);
    $weeklyMeals = $mealModel->getWeeklyStats((int) $clientId);
    
    sendJsonResponse([
        'success' => true,
        'client_id' => $clientId,
        'recent_activities' => $recentActivities,
        'recent_meals' => $recentMeals,
        'active_goal' => $activeGoal,
        'weekly_summary' => [
            'activities' => $weeklyActivities,
            'meals' => $weeklyMeals
        ]
    ]);
}

/**
 * Get trainer's workout plans
 */
function handleGetWorkoutPlans() {
    global $rbacService, $userId;
    
    if (!$rbacService->hasPermission($userId, 'create_workout_plans')) {
        sendErrorResponse('Insufficient permissions', 403);
    }
    
    // This would fetch workout plans from database
    // For now, return empty array
    sendJsonResponse([
        'success' => true,
        'workout_plans' => [],
        'total' => 0
    ]);
}

/**
 * Get available clients (not assigned to this trainer)
 */
function handleGetAvailableClients() {
    global $rbacService, $userId;
    
    if (!$rbacService->hasPermission($userId, 'manage_client_assignments')) {
        sendErrorResponse('Insufficient permissions', 403);
    }
    
    require_once __DIR__ . '/../models/User.php';
    $userModel = new User();
    
    // Get all customers
    $allCustomers = $userModel->getUsersByRole('customer');
    
    // Get trainer's current clients
    $currentClients = $rbacService->getTrainerClients($userId);
    $currentClientIds = array_column($currentClients, 'client_id');
    
    // Filter out already assigned clients
    $availableClients = array_filter($allCustomers, function($customer) use ($currentClientIds) {
        return !in_array($customer['user_id'], $currentClientIds);
    });
    
    sendJsonResponse([
        'success' => true,
        'available_clients' => array_values($availableClients),
        'total' => count($availableClients)
    ]);
}

/**
 * Handle trainer actions (POST)
 */
function handleTrainerAction() {
    global $rbacService, $userId;
    
    $action = $_GET['action'] ?? '';
    
    switch ($action) {
        case 'assign-client':
            handleAssignClient();
            break;
        case 'remove-client':
            handleRemoveClient();
            break;
        case 'create-note':
            handleCreateNote();
            break;
        case 'create-workout-plan':
            handleCreateWorkoutPlan();
            break;
        default:
            sendErrorResponse('Invalid action', 404);
    }
}

/**
 * Assign client to trainer
 */
function handleAssignClient() {
    global $rbacService, $userId;
    
    if (!$rbacService->hasPermission($userId, 'manage_client_assignments')) {
        sendErrorResponse('Insufficient permissions', 403);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || !isset($input['client_id'])) {
        sendErrorResponse('Client ID is required', 400);
    }
    
    $clientId = (int) $input['client_id'];
    
    if ($rbacService->assignClientToTrainer($userId, $clientId)) {
        sendJsonResponse([
            'success' => true,
            'message' => 'Client assigned successfully'
        ]);
    } else {
        sendErrorResponse('Failed to assign client', 500);
    }
}

/**
 * Remove client from trainer
 */
function handleRemoveClient() {
    global $rbacService, $userId;
    
    if (!$rbacService->hasPermission($userId, 'manage_client_assignments')) {
        sendErrorResponse('Insufficient permissions', 403);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || !isset($input['client_id'])) {
        sendErrorResponse('Client ID is required', 400);
    }
    
    $clientId = (int) $input['client_id'];
    
    if ($rbacService->removeClientFromTrainer($clientId)) {
        sendJsonResponse([
            'success' => true,
            'message' => 'Client removed successfully'
        ]);
    } else {
        sendErrorResponse('Failed to remove client', 500);
    }
}

/**
 * Create trainer note for client
 */
function handleCreateNote() {
    global $rbacService, $userId;
    
    if (!$rbacService->hasPermission($userId, 'create_trainer_notes')) {
        sendErrorResponse('Insufficient permissions', 403);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || !isset($input['client_id']) || !isset($input['note_title']) || !isset($input['note_content'])) {
        sendErrorResponse('Client ID, note title, and note content are required', 400);
    }
    
    $clientId = (int) $input['client_id'];
    
    // Check if trainer can access this client
    if (!$rbacService->canAccessUserData($userId, $clientId, 'notes')) {
        sendErrorResponse('Cannot access this client\'s data', 403);
    }
    
    // This would create a trainer note in the database
    // For now, return success
    sendJsonResponse([
        'success' => true,
        'message' => 'Note created successfully'
    ]);
}

/**
 * Create workout plan
 */
function handleCreateWorkoutPlan() {
    global $rbacService, $userId;
    
    if (!$rbacService->hasPermission($userId, 'create_workout_plans')) {
        sendErrorResponse('Insufficient permissions', 403);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || !isset($input['plan_name']) || !isset($input['difficulty_level'])) {
        sendErrorResponse('Plan name and difficulty level are required', 400);
    }
    
    // This would create a workout plan in the database
    // For now, return success
    sendJsonResponse([
        'success' => true,
        'message' => 'Workout plan created successfully'
    ]);
}

/**
 * Handle updating trainer data
 */
function handleUpdateTrainerData() {
    global $rbacService, $userId;
    
    $action = $_GET['action'] ?? '';
    
    switch ($action) {
        case 'update-note':
            handleUpdateNote();
            break;
        case 'update-workout-plan':
            handleUpdateWorkoutPlan();
            break;
        default:
            sendErrorResponse('Invalid action', 404);
    }
}

/**
 * Update trainer note
 */
function handleUpdateNote() {
    global $rbacService, $userId;
    
    if (!$rbacService->hasPermission($userId, 'create_trainer_notes')) {
        sendErrorResponse('Insufficient permissions', 403);
    }
    
    // This would update a trainer note in the database
    sendJsonResponse([
        'success' => true,
        'message' => 'Note updated successfully'
    ]);
}

/**
 * Update workout plan
 */
function handleUpdateWorkoutPlan() {
    global $rbacService, $userId;
    
    if (!$rbacService->hasPermission($userId, 'manage_workout_plans')) {
        sendErrorResponse('Insufficient permissions', 403);
    }
    
    // This would update a workout plan in the database
    sendJsonResponse([
        'success' => true,
        'message' => 'Workout plan updated successfully'
    ]);
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
