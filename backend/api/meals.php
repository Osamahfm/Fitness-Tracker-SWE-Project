<?php
/**
 * Meals API Endpoints
 * RESTful API for meal logging and nutrition tracking
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
require_once __DIR__ . '/../models/Meal.php';

$authService = new AuthService();
$mealModel = new Meal();

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
            handleCreateMeal();
            break;
        case 'GET':
            handleGetMeals();
            break;
        case 'PUT':
            handleUpdateMeal();
            break;
        case 'DELETE':
            handleDeleteMeal();
            break;
        default:
            sendErrorResponse('Method not allowed', 405);
    }
} catch (Exception $e) {
    sendErrorResponse($e->getMessage(), 400);
}

/**
 * Handle meal creation
 */
function handleCreateMeal() {
    global $mealModel, $userId;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendErrorResponse('Invalid JSON input', 400);
    }
    
    // Validate required fields
    $requiredFields = ['meal_type', 'meal_name', 'calories', 'meal_date'];
    foreach ($requiredFields as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            sendErrorResponse("Field '{$field}' is required", 400);
        }
    }
    
    // Validate meal type
    $validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    if (!in_array($input['meal_type'], $validMealTypes)) {
        sendErrorResponse('Invalid meal type', 400);
    }
    
    // Prepare meal data
    $mealData = [
        'user_id' => $userId,
        'meal_type' => $input['meal_type'],
        'meal_name' => $input['meal_name'],
        'calories' => (int) $input['calories'],
        'protein_g' => isset($input['protein_g']) ? floatval($input['protein_g']) : null,
        'carbs_g' => isset($input['carbs_g']) ? floatval($input['carbs_g']) : null,
        'fat_g' => isset($input['fat_g']) ? floatval($input['fat_g']) : null,
        'fiber_g' => isset($input['fiber_g']) ? floatval($input['fiber_g']) : null,
        'meal_date' => $input['meal_date']
    ];
    
    // Create meal
    $mealId = $mealModel->create($mealData);
    
    sendJsonResponse([
        'success' => true,
        'meal_id' => $mealId,
        'message' => 'Meal logged successfully'
    ], 201);
}

/**
 * Handle getting meals
 */
function handleGetMeals() {
    global $mealModel, $userId;
    
    $date = $_GET['date'] ?? date('Y-m-d');
    $startDate = $_GET['start_date'] ?? null;
    $endDate = $_GET['end_date'] ?? null;
    $mealType = $_GET['meal_type'] ?? null;
    
    if ($startDate && $endDate) {
        $meals = $mealModel->getMealsByDateRange($userId, $startDate, $endDate);
    } else {
        $meals = $mealModel->getMealsByDate($userId, $date);
    }
    
    // Filter by meal type if specified
    if ($mealType) {
        $meals = array_filter($meals, function($meal) use ($mealType) {
            return $meal['meal_type'] === $mealType;
        });
    }
    
    // Format meals for frontend
    $formattedMeals = array_map(function($meal) {
        return [
            'id' => $meal['meal_id'],
            'type' => $meal['meal_type'],
            'name' => $meal['meal_name'],
            'calories' => $meal['calories'],
            'protein' => $meal['protein_g'],
            'carbs' => $meal['carbs_g'],
            'fat' => $meal['fat_g'],
            'fiber' => $meal['fiber_g'],
            'date' => $meal['meal_date'],
            'created_at' => $meal['created_at']
        ];
    }, $meals);
    
    sendJsonResponse([
        'success' => true,
        'meals' => array_values($formattedMeals), // Re-index array after filtering
        'total' => count($formattedMeals)
    ]);
}

/**
 * Handle meal update
 */
function handleUpdateMeal() {
    global $mealModel, $userId;
    
    $mealId = $_GET['id'] ?? null;
    if (!$mealId) {
        sendErrorResponse('Meal ID is required', 400);
    }
    
    // Verify meal belongs to user
    $meal = $mealModel->findById((int) $mealId);
    if (!$meal || $meal['user_id'] != $userId) {
        sendErrorResponse('Meal not found', 404);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        sendErrorResponse('Invalid JSON input', 400);
    }
    
    $success = $mealModel->update((int) $mealId, $input);
    
    if ($success) {
        sendJsonResponse(['success' => true, 'message' => 'Meal updated successfully']);
    } else {
        sendErrorResponse('Failed to update meal', 500);
    }
}

/**
 * Handle meal deletion
 */
function handleDeleteMeal() {
    global $mealModel, $userId;
    
    $mealId = $_GET['id'] ?? null;
    if (!$mealId) {
        sendErrorResponse('Meal ID is required', 400);
    }
    
    // Verify meal belongs to user
    $meal = $mealModel->findById((int) $mealId);
    if (!$meal || $meal['user_id'] != $userId) {
        sendErrorResponse('Meal not found', 404);
    }
    
    $success = $mealModel->delete((int) $mealId);
    
    if ($success) {
        sendJsonResponse(['success' => true, 'message' => 'Meal deleted successfully']);
    } else {
        sendErrorResponse('Failed to delete meal', 500);
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
