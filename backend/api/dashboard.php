<?php
/**
 * Dashboard API Endpoints
 * RESTful API for dashboard data and daily reports
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../services/AuthService.php';
require_once __DIR__ . '/../models/Activity.php';
require_once __DIR__ . '/../models/Meal.php';
require_once __DIR__ . '/../models/Goal.php';

$authService = new AuthService();
$activityModel = new Activity();
$mealModel = new Meal();
$goalModel = new Goal();

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
            handleDashboardRequest();
            break;
        default:
            sendErrorResponse('Method not allowed', 405);
    }
} catch (Exception $e) {
    sendErrorResponse($e->getMessage(), 400);
}

/**
 * Handle dashboard requests
 */
function handleDashboardRequest() {
    global $activityModel, $mealModel, $goalModel, $userId;
    
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $pathParts = explode('/', trim($path, '/'));
    $endpoint = end($pathParts);
    
    switch ($endpoint) {
        case 'today':
            handleTodaySummary();
            break;
        case 'weekly':
            handleWeeklySummary();
            break;
        case 'stats':
            handleUserStats();
            break;
        default:
            sendErrorResponse('Invalid endpoint', 404);
    }
}

/**
 * Handle today's summary
 */
function handleTodaySummary() {
    global $activityModel, $mealModel, $userId;
    
    $today = date('Y-m-d');
    
    // Get today's activity stats
    $activityStats = $activityModel->getDailyStats($userId, $today);
    
    // Get today's meal stats
    $mealStats = $mealModel->getDailyStats($userId, $today);
    
    // Calculate net calories
    $netCalories = $mealStats['total_calories_consumed'] - $activityStats['total_calories_burned'];
    
    // Get user's active goal
    $goalModel = new Goal();
    $activeGoal = $goalModel->getActiveGoal($userId);
    
    $dailyData = [
        'date' => $today,
        'total_calories_burned' => $activityStats['total_calories_burned'],
        'total_calories_consumed' => $mealStats['total_calories_consumed'],
        'net_calories' => $netCalories,
        'total_activities' => $activityStats['total_activities'],
        'total_duration_minutes' => $activityStats['total_duration'],
        'total_distance_km' => $activityStats['total_distance'],
        'total_meals' => $mealStats['total_meals'],
        'goal_target' => $activeGoal ? $activeGoal['daily_calorie_target'] : 2000,
        'goal_progress' => $activeGoal ? min(($activityStats['total_calories_burned'] / $activeGoal['daily_calorie_target']) * 100, 100) : 0,
        'nutrition_breakdown' => [
            'protein' => $mealStats['total_protein'],
            'carbs' => $mealStats['total_carbs'],
            'fat' => $mealStats['total_fat'],
            'fiber' => $mealStats['total_fiber']
        ]
    ];
    
    sendJsonResponse([
        'success' => true,
        'data' => $dailyData
    ]);
}

/**
 * Handle weekly summary
 */
function handleWeeklySummary() {
    global $activityModel, $mealModel, $userId;
    
    // Get weekly activity stats
    $weeklyActivities = $activityModel->getWeeklyStats($userId);
    
    // Get weekly meal stats
    $weeklyMeals = $mealModel->getWeeklyStats($userId);
    
    // Combine and format weekly data
    $weeklyData = [];
    $startDate = date('Y-m-d', strtotime('-6 days'));
    $endDate = date('Y-m-d');
    
    // Create array for each day of the week
    for ($date = $startDate; $date <= $endDate; $date = date('Y-m-d', strtotime($date . ' +1 day'))) {
        $dayData = [
            'date' => $date,
            'day_name' => date('D', strtotime($date)),
            'activities' => 0,
            'calories_burned' => 0,
            'duration' => 0,
            'distance' => 0,
            'meals' => 0,
            'calories_consumed' => 0
        ];
        
        // Find matching activity data
        foreach ($weeklyActivities as $activity) {
            if ($activity['activity_date'] === $date) {
                $dayData['activities'] = (int) $activity['total_activities'];
                $dayData['calories_burned'] = (int) $activity['total_calories_burned'];
                $dayData['duration'] = (int) $activity['total_duration'];
                $dayData['distance'] = (float) $activity['total_distance'];
                break;
            }
        }
        
        // Find matching meal data
        foreach ($weeklyMeals as $meal) {
            if ($meal['meal_date'] === $date) {
                $dayData['meals'] = (int) $meal['total_meals'];
                $dayData['calories_consumed'] = (int) $meal['total_calories_consumed'];
                break;
            }
        }
        
        $weeklyData[] = $dayData;
    }
    
    // Calculate weekly totals
    $weeklyTotals = [
        'total_activities' => array_sum(array_column($weeklyData, 'activities')),
        'total_calories_burned' => array_sum(array_column($weeklyData, 'calories_burned')),
        'total_duration' => array_sum(array_column($weeklyData, 'duration')),
        'total_distance' => array_sum(array_column($weeklyData, 'distance')),
        'total_meals' => array_sum(array_column($weeklyData, 'meals')),
        'total_calories_consumed' => array_sum(array_column($weeklyData, 'calories_consumed')),
        'avg_daily_calories_burned' => round(array_sum(array_column($weeklyData, 'calories_burned')) / 7),
        'avg_daily_calories_consumed' => round(array_sum(array_column($weeklyData, 'calories_consumed')) / 7)
    ];
    
    sendJsonResponse([
        'success' => true,
        'data' => [
            'daily_data' => $weeklyData,
            'totals' => $weeklyTotals
        ]
    ]);
}

/**
 * Handle user statistics
 */
function handleUserStats() {
    global $activityModel, $mealModel, $userId;
    
    // Get user's overall stats
    $startDate = date('Y-m-d', strtotime('-30 days')); // Last 30 days
    $endDate = date('Y-m-d');
    
    // Get activities and meals for the period
    $activities = $activityModel->getActivitiesByDateRange($userId, $startDate, $endDate);
    $meals = $mealModel->getMealsByDateRange($userId, $startDate, $endDate);
    
    // Calculate totals
    $totalActivities = count($activities);
    $totalCaloriesBurned = array_sum(array_column($activities, 'calories_burned'));
    $totalDuration = array_sum(array_column($activities, 'duration_minutes'));
    $totalDistance = array_sum(array_column($activities, 'distance_km'));
    
    $totalMeals = count($meals);
    $totalCaloriesConsumed = array_sum(array_column($meals, 'calories'));
    
    // Get nutrition breakdown
    $nutritionBreakdown = $mealModel->getNutritionBreakdown($userId, $startDate, $endDate);
    
    // Calculate averages
    $days = 30;
    $avgDailyActivities = round($totalActivities / $days, 1);
    $avgDailyCaloriesBurned = round($totalCaloriesBurned / $days);
    $avgDailyDuration = round($totalDuration / $days);
    $avgDailyMeals = round($totalMeals / $days, 1);
    $avgDailyCaloriesConsumed = round($totalCaloriesConsumed / $days);
    
    // Get most recent activities and meals
    $recentActivities = $activityModel->getRecentActivities($userId, 5);
    $recentMeals = $mealModel->getRecentMeals($userId, 5);
    
    $statsData = [
        'period' => [
            'start_date' => $startDate,
            'end_date' => $endDate,
            'days' => $days
        ],
        'totals' => [
            'activities' => $totalActivities,
            'calories_burned' => $totalCaloriesBurned,
            'duration_minutes' => $totalDuration,
            'distance_km' => $totalDistance,
            'meals' => $totalMeals,
            'calories_consumed' => $totalCaloriesConsumed
        ],
        'averages' => [
            'daily_activities' => $avgDailyActivities,
            'daily_calories_burned' => $avgDailyCaloriesBurned,
            'daily_duration' => $avgDailyDuration,
            'daily_meals' => $avgDailyMeals,
            'daily_calories_consumed' => $avgDailyCaloriesConsumed
        ],
        'nutrition_breakdown' => $nutritionBreakdown,
        'recent_activities' => array_map(function($activity) {
            return [
                'id' => $activity['activity_id'],
                'type' => $activity['activity_type'],
                'name' => $activity['activity_name'],
                'duration' => $activity['duration_minutes'],
                'calories' => $activity['calories_burned'],
                'date' => $activity['activity_date']
            ];
        }, $recentActivities),
        'recent_meals' => array_map(function($meal) {
            return [
                'id' => $meal['meal_id'],
                'type' => $meal['meal_type'],
                'name' => $meal['meal_name'],
                'calories' => $meal['calories'],
                'date' => $meal['meal_date']
            ];
        }, $recentMeals)
    ];
    
    sendJsonResponse([
        'success' => true,
        'data' => $statsData
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
