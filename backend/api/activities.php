<?php
/**
 * Activities API Endpoints
 * RESTful API for activity logging and tracking
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
require_once __DIR__ . '/../models/Activity.php';
require_once __DIR__ . '/../services/CalorieCalculator.php';

$authService = new AuthService();
$rbacService = new RBACService();
$activityModel = new Activity();
$calorieCalculator = new CalorieCalculator();

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
        case 'POST':
            handleCreateActivity();
            break;
        case 'GET':
            handleGetActivities();
            break;
        case 'PUT':
            handleUpdateActivity();
            break;
        case 'DELETE':
            handleDeleteActivity();
            break;
        default:
            sendErrorResponse('Method not allowed', 405);
    }
} catch (Exception $e) {
    sendErrorResponse($e->getMessage(), 400);
}

/**
 * Handle activity creation
 */
function handleCreateActivity() {
    global $activityModel, $calorieCalculator, $userId;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendErrorResponse('Invalid JSON input', 400);
    }
    
    // Validate required fields
    $requiredFields = ['activity_type', 'duration_minutes', 'intensity_level', 'activity_date'];
    foreach ($requiredFields as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            sendErrorResponse("Field '{$field}' is required", 400);
        }
    }
    
    // Calculate calories burned
    $caloriesBurned = $calorieCalculator->calculateActivityCalories(
        $userId,
        $input['activity_type'],
        $input['intensity_level'],
        (int) $input['duration_minutes'],
        isset($input['distance_km']) ? floatval($input['distance_km']) : null
    );
    
    // Prepare activity data
    $activityData = [
        'user_id' => $userId,
        'activity_type' => $input['activity_type'],
        'activity_name' => $input['activity_name'] ?? ucfirst($input['activity_type']),
        'duration_minutes' => (int) $input['duration_minutes'],
        'distance_km' => isset($input['distance_km']) ? floatval($input['distance_km']) : null,
        'calories_burned' => $caloriesBurned,
        'intensity_level' => $input['intensity_level'],
        'activity_date' => $input['activity_date'],
        'notes' => $input['notes'] ?? null
    ];
    
    // Create activity
    $activityId = $activityModel->create($activityData);
    
    sendJsonResponse([
        'success' => true,
        'activity_id' => $activityId,
        'calories_burned' => $caloriesBurned,
        'message' => 'Activity logged successfully'
    ], 201);
}

/**
 * Handle getting activities
 */
function handleGetActivities() {
    global $activityModel, $userId, $rbacService;
    
    $date = $_GET['date'] ?? date('Y-m-d');
    $startDate = $_GET['start_date'] ?? null;
    $endDate = $_GET['end_date'] ?? null;
    $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 10;
    
    // Check if requesting another user's activities
    $targetUserId = $_GET['user_id'] ?? $userId;
    
    // Verify access permissions
    if ($targetUserId != $userId) {
        if (!$rbacService->canAccessUserData($userId, (int) $targetUserId, 'activity')) {
            sendErrorResponse('Cannot access this user\'s activities', 403);
        }
    }
    
    if ($startDate && $endDate) {
        $activities = $activityModel->getActivitiesByDateRange((int) $targetUserId, $startDate, $endDate);
    } else {
        $activities = $activityModel->getActivitiesByDate((int) $targetUserId, $date);
    }
    
    // Format activities for frontend
    $formattedActivities = array_map(function($activity) {
        return [
            'id' => $activity['activity_id'],
            'type' => $activity['activity_type'],
            'name' => $activity['activity_name'],
            'duration' => $activity['duration_minutes'],
            'distance' => $activity['distance_km'],
            'calories' => $activity['calories_burned'],
            'intensity' => $activity['intensity_level'],
            'date' => $activity['activity_date'],
            'notes' => $activity['notes'],
            'created_at' => $activity['created_at']
        ];
    }, $activities);
    
    sendJsonResponse([
        'success' => true,
        'activities' => $formattedActivities,
        'total' => count($formattedActivities)
    ]);
}

/**
 * Handle activity update
 */
function handleUpdateActivity() {
    global $activityModel, $userId;
    
    $activityId = $_GET['id'] ?? null;
    if (!$activityId) {
        sendErrorResponse('Activity ID is required', 400);
    }
    
    // Verify activity belongs to user
    $activity = $activityModel->findById((int) $activityId);
    if (!$activity || $activity['user_id'] != $userId) {
        sendErrorResponse('Activity not found', 404);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        sendErrorResponse('Invalid JSON input', 400);
    }
    
    $success = $activityModel->update((int) $activityId, $input);
    
    if ($success) {
        sendJsonResponse(['success' => true, 'message' => 'Activity updated successfully']);
    } else {
        sendErrorResponse('Failed to update activity', 500);
    }
}

/**
 * Handle activity deletion
 */
function handleDeleteActivity() {
    global $activityModel, $userId;
    
    $activityId = $_GET['id'] ?? null;
    if (!$activityId) {
        sendErrorResponse('Activity ID is required', 400);
    }
    
    // Verify activity belongs to user
    $activity = $activityModel->findById((int) $activityId);
    if (!$activity || $activity['user_id'] != $userId) {
        sendErrorResponse('Activity not found', 404);
    }
    
    $success = $activityModel->delete((int) $activityId);
    
    if ($success) {
        sendJsonResponse(['success' => true, 'message' => 'Activity deleted successfully']);
    } else {
        sendErrorResponse('Failed to delete activity', 500);
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
