<?php
/**
 * Workout template library (categories, difficulty, search).
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../services/AuthService.php';
require_once __DIR__ . '/../models/WorkoutCatalog.php';

$authService = new AuthService();
$catalog = new WorkoutCatalog();

$sessionId = $_COOKIE['session_id'] ?? '';
$ipAddress = $_SERVER['REMOTE_ADDR'] ?? '';
$user = $authService->validateSession($sessionId, $ipAddress);

if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        exit;
    }

    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $pathParts = explode('/', trim($path, '/'));
    $endpoint = end($pathParts);

    if (is_numeric($endpoint)) {
        $w = $catalog->findById((int) $endpoint);
        if (!$w) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Workout not found']);
            exit;
        }
        echo json_encode(['success' => true, 'workout' => $w]);
        exit;
    }

    $category = $_GET['category'] ?? null;
    $search = $_GET['search'] ?? null;
    $difficulty = $_GET['difficulty'] ?? null;
    $list = $catalog->listAll($category, $search, $difficulty);
    $categories = $catalog->getCategories();

    echo json_encode([
        'success' => true,
        'workouts' => $list,
        'categories' => $categories,
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
