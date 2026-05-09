<?php
/**
 * FitTrack Pro - API Entry Point
 * RESTful API Router
 */

require_once __DIR__ . '/../vendor/autoload.php';

use FitTrack\Utils\Response;

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Parse request
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = str_replace('/api', '', $uri);
$path = trim($uri, '/');
$parts = explode('/', $path);

// Remove 'public' or 'index.php' from path if present
if ($parts[0] === 'public') array_shift($parts);
if ($parts[0] === 'index.php') array_shift($parts);

$resource = $parts[0] ?? '';
$action = $parts[1] ?? 'index';
$id = is_numeric($action) ? (int)$action : null;
$subAction = $parts[2] ?? null;

// Request body
$body = json_decode(file_get_contents('php://input'), true) ?? [];

// Route mapping
$routes = [
    // Auth
    'auth' => ['controller' => 'FitTrack\Controllers\AuthController', 'routes' => [
        'POST register' => 'register',
        'POST login' => 'login',
        'GET me' => 'me',
        'PUT profile' => 'updateProfile',
        'POST password' => 'changePassword',
    ]],
    // Activities (R1, R4)
    'activities' => ['controller' => 'FitTrack\Controllers\ActivityController', 'routes' => [
        'GET index' => 'index',
        'POST index' => 'create',
        'GET types' => 'types',
        'GET summary' => 'summary',
    ], 'resource_routes' => [
        'DELETE' => 'delete',
    ]],
    // Meals (R3)
    'meals' => ['controller' => 'FitTrack\Controllers\MealController', 'routes' => [
        'GET index' => 'index',
        'POST index' => 'create',
        'GET types' => 'types',
        'GET recommendations' => 'recommendations',
        'GET meal-plan' => 'mealPlan',
    ], 'resource_routes' => [
        'DELETE' => 'delete',
    ]],
    // Goals (R2)
    'goals' => ['controller' => 'FitTrack\Controllers\GoalController', 'routes' => [
        'GET index' => 'index',
        'POST index' => 'create',
        'GET recommendations' => 'recommendations',
    ], 'resource_routes' => [
        'PUT progress' => 'updateProgress',
        'PUT status' => 'updateStatus',
        'DELETE' => 'delete',
    ]],
    // Alarms (R6)
    'alarms' => ['controller' => 'FitTrack\Controllers\AlarmController', 'routes' => [
        'GET index' => 'index',
        'POST index' => 'create',
        'GET today' => 'today',
    ], 'resource_routes' => [
        'PUT' => 'update',
        'DELETE' => 'delete',
    ]],
    // Dashboard (R7)
    'dashboard' => ['controller' => 'FitTrack\Controllers\DashboardController', 'routes' => [
        'GET index' => 'index',
        'GET weekly' => 'weekly',
        'GET stats' => 'stats',
    ]],
];

try {
    // Resolve route
    if (!isset($routes[$resource])) {
        Response::notFound("Resource '{$resource}' not found");
        exit;
    }

    $routeConfig = $routes[$resource];
    $controllerClass = $routeConfig['controller'];
    $controller = new $controllerClass();

    // Check for sub-action routes first
    $methodAction = $method . ' ' . $action;

    // Handle resource ID routes (e.g., /activities/123)
    if ($id && isset($routeConfig['resource_routes'])) {
        $subMethod = $method;
        if ($subAction && isset($routeConfig['resource_routes'][$method . ' ' . $subAction])) {
            $handlerMethod = $routeConfig['resource_routes'][$method . ' ' . $subAction];
            $controller->$handlerMethod($id);
            exit;
        }
        if (isset($routeConfig['resource_routes'][$subMethod])) {
            $handlerMethod = $routeConfig['resource_routes'][$subMethod];
            $controller->$handlerMethod($id);
            exit;
        }
    }

    // Handle named routes
    if (isset($routeConfig['routes'][$methodAction])) {
        $handlerMethod = $routeConfig['routes'][$methodAction];
        $controller->$handlerMethod();
        exit;
    }

    // Default resource route
    if ($id && isset($routeConfig['resource_routes'][$method])) {
        $handlerMethod = $routeConfig['resource_routes'][$method];
        $controller->$handlerMethod($id);
        exit;
    }

    Response::notFound("Route {$method} /{$resource}/{$action} not found");

} catch (\Exception $e) {
    Response::serverError($e->getMessage());
}
