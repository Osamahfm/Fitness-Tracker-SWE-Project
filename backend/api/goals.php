<?php
/**
 * Goals API Endpoints
 * RESTful API for goal tracking and recommendations
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
require_once __DIR__ . '/../models/Goal.php';
require_once __DIR__ . '/../services/CalorieCalculator.php';

$authService = new AuthService();
$goalModel = new Goal();
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
            handleCreateGoal();
            break;
        case 'GET':
            handleGetGoals();
            break;
        case 'PUT':
            handleUpdateGoal();
            break;
        case 'DELETE':
            handleDeleteGoal();
            break;
        default:
            sendErrorResponse('Method not allowed', 405);
    }
} catch (Exception $e) {
    sendErrorResponse($e->getMessage(), 400);
}

/**
 * Handle goal creation
 */
function handleCreateGoal() {
    global $goalModel, $calorieCalculator, $userId;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendErrorResponse('Invalid JSON input', 400);
    }
    
    // Validate required fields
    $requiredFields = ['goal_type'];
    foreach ($requiredFields as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            sendErrorResponse("Field '{$field}' is required", 400);
        }
    }
    
    // Validate goal type
    $validGoalTypes = ['weight_loss', 'weight_gain', 'muscle_gain', 'endurance', 'maintenance'];
    if (!in_array($input['goal_type'], $validGoalTypes)) {
        sendErrorResponse('Invalid goal type', 400);
    }
    
    // Calculate daily calorie target
    $dailyCalorieTarget = $calorieCalculator->calculateDailyCalorieTarget($userId, $input['goal_type']);
    
    // Prepare goal data
    $goalData = [
        'user_id' => $userId,
        'goal_type' => $input['goal_type'],
        'target_weight_kg' => isset($input['target_weight_kg']) ? floatval($input['target_weight_kg']) : null,
        'target_date' => $input['target_date'] ?? null,
        'daily_calorie_target' => $dailyCalorieTarget,
        'weekly_activity_minutes' => isset($input['weekly_activity_minutes']) ? (int) $input['weekly_activity_minutes'] : 150
    ];
    
    // Deactivate existing goals
    $existingGoal = $goalModel->getActiveGoal($userId);
    if ($existingGoal) {
        $goalModel->deactivate($existingGoal['goal_id']);
    }
    
    // Create new goal
    $goalId = $goalModel->create($goalData);
    
    // Get goal timeline estimate
    $timeline = $calorieCalculator->estimateGoalTimeline($userId, $input['goal_type'], $goalData['target_weight_kg']);
    
    sendJsonResponse([
        'success' => true,
        'goal_id' => $goalId,
        'daily_calorie_target' => $dailyCalorieTarget,
        'timeline_estimate' => $timeline,
        'message' => 'Goal created successfully'
    ], 201);
}

/**
 * Handle getting goals
 */
function handleGetGoals() {
    global $goalModel, $userId;
    
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $pathParts = explode('/', trim($path, '/'));
    $endpoint = end($pathParts);
    
    switch ($endpoint) {
        case 'active':
            handleGetActiveGoal();
            break;
        case 'all':
            handleGetAllGoals();
            break;
        case 'recommendations':
            handleGetRecommendations();
            break;
        default:
            sendErrorResponse('Invalid endpoint', 404);
    }
}

/**
 * Handle getting active goal
 */
function handleGetActiveGoal() {
    global $goalModel, $userId;
    
    $activeGoal = $goalModel->getActiveGoal($userId);
    
    if ($activeGoal) {
        sendJsonResponse([
            'success' => true,
            'goal' => $activeGoal
        ]);
    } else {
        sendJsonResponse([
            'success' => true,
            'goal' => null,
            'message' => 'No active goal found'
        ]);
    }
}

/**
 * Handle getting all goals
 */
function handleGetAllGoals() {
    global $goalModel, $userId;
    
    $goals = $goalModel->getUserGoals($userId);
    
    sendJsonResponse([
        'success' => true,
        'goals' => $goals,
        'total' => count($goals)
    ]);
}

/**
 * Handle getting recommendations
 */
function handleGetRecommendations() {
    global $goalModel, $calorieCalculator, $userId;
    
    $activeGoal = $goalModel->getActiveGoal($userId);
    
    if (!$activeGoal) {
        sendErrorResponse('No active goal found', 404);
    }
    
    $recommendations = generateGoalRecommendations($userId, $activeGoal);
    
    sendJsonResponse([
        'success' => true,
        'recommendations' => $recommendations
    ]);
}

/**
 * Generate goal-based recommendations
 */
function generateGoalRecommendations($userId, $goal) {
    global $calorieCalculator;
    
    $recommendations = [];
    
    switch ($goal['goal_type']) {
        case 'weight_loss':
            $recommendations = [
                'activities' => [
                    ['type' => 'running', 'frequency' => '3-4 times per week', 'duration' => '30-45 minutes'],
                    ['type' => 'walking', 'frequency' => 'daily', 'duration' => '30 minutes'],
                    ['type' => 'cycling', 'frequency' => '2-3 times per week', 'duration' => '45-60 minutes']
                ],
                'nutrition' => [
                    'Focus on high-protein foods to maintain muscle mass',
                    'Include plenty of vegetables for fiber and nutrients',
                    'Limit processed foods and added sugars',
                    'Stay hydrated with water throughout the day'
                ],
                'targets' => [
                    'Create a 500-calorie daily deficit',
                    'Aim for 1-2 lbs weight loss per week',
                    'Include strength training 2-3 times per week'
                ]
            ];
            break;
            
        case 'muscle_gain':
            $recommendations = [
                'activities' => [
                    ['type' => 'gym', 'frequency' => '4-5 times per week', 'duration' => '45-60 minutes'],
                    ['type' => 'protein intake', 'frequency' => 'with each meal', 'duration' => 'consistent timing']
                ],
                'nutrition' => [
                    'Consume 1.6-2.2g protein per kg body weight',
                    'Include complex carbs for energy',
                    'Eat healthy fats for hormone production',
                    'Time protein intake around workouts'
                ],
                'targets' => [
                    'Create a 300-calorie daily surplus',
                    'Focus on progressive overload in training',
                    'Ensure adequate sleep for recovery'
                ]
            ];
            break;
            
        case 'maintenance':
            $recommendations = [
                'activities' => [
                    ['type' => 'mixed', 'frequency' => '4-5 times per week', 'duration' => '30-45 minutes'],
                    ['type' => 'variety', 'frequency' => 'weekly', 'duration' => 'change routine']
                ],
                'nutrition' => [
                    'Maintain balanced macronutrient intake',
                    'Eat a variety of whole foods',
                    'Practice portion control',
                    'Allow for occasional treats'
                ],
                'targets' => [
                    'Match calorie intake with expenditure',
                    'Maintain current fitness level',
                    'Focus on consistency and enjoyment'
                ]
            ];
            break;
            
        case 'endurance':
            $recommendations = [
                'activities' => [
                    ['type' => 'running', 'frequency' => '4-5 times per week', 'duration' => '30-90 minutes'],
                    ['type' => 'cross-training', 'frequency' => '2-3 times per week', 'duration' => '45-60 minutes']
                ],
                'nutrition' => [
                    'Focus on complex carbohydrates for sustained energy',
                    'Stay well-hydrated during long activities',
                    'Include electrolyte replacement for long sessions',
                    'Time carbohydrate intake around workouts'
                ],
                'targets' => [
                    'Gradually increase duration and intensity',
                    'Include both long slow distance and interval training',
                    'Focus on proper form and injury prevention'
                ]
            ];
            break;
    }
    
    return $recommendations;
}

/**
 * Handle goal update
 */
function handleUpdateGoal() {
    global $goalModel, $userId;
    
    $goalId = $_GET['id'] ?? null;
    if (!$goalId) {
        sendErrorResponse('Goal ID is required', 400);
    }
    
    // Verify goal belongs to user
    $goal = $goalModel->getUserGoals($userId);
    $userGoal = null;
    foreach ($goal as $g) {
        if ($g['goal_id'] == $goalId) {
            $userGoal = $g;
            break;
        }
    }
    
    if (!$userGoal) {
        sendErrorResponse('Goal not found', 404);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        sendErrorResponse('Invalid JSON input', 400);
    }
    
    $success = $goalModel->update((int) $goalId, $input);
    
    if ($success) {
        sendJsonResponse(['success' => true, 'message' => 'Goal updated successfully']);
    } else {
        sendErrorResponse('Failed to update goal', 500);
    }
}

/**
 * Handle goal deletion
 */
function handleDeleteGoal() {
    global $goalModel, $userId;
    
    $goalId = $_GET['id'] ?? null;
    if (!$goalId) {
        sendErrorResponse('Goal ID is required', 400);
    }
    
    // Verify goal belongs to user
    $goal = $goalModel->getUserGoals($userId);
    $userGoal = null;
    foreach ($goal as $g) {
        if ($g['goal_id'] == $goalId) {
            $userGoal = $g;
            break;
        }
    }
    
    if (!$userGoal) {
        sendErrorResponse('Goal not found', 404);
    }
    
    $success = $goalModel->deactivate((int) $goalId);
    
    if ($success) {
        sendJsonResponse(['success' => true, 'message' => 'Goal deactivated successfully']);
    } else {
        sendErrorResponse('Failed to deactivate goal', 500);
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
