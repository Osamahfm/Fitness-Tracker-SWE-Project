<?php
/**
 * Daily wellness: steps, water, sleep, resting heart rate.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../services/AuthService.php';
require_once __DIR__ . '/../models/Wellness.php';

$authService = new AuthService();
$wellness = new Wellness();

$sessionId = $_COOKIE['session_id'] ?? '';
$ipAddress = $_SERVER['REMOTE_ADDR'] ?? '';
$user = $authService->validateSession($sessionId, $ipAddress);

if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

$userId = (int) $user['user_id'];

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $date = $_GET['date'] ?? date('Y-m-d');
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            throw new Exception('Invalid date');
        }
        $row = $wellness->getByDate($userId, $date);
        echo json_encode(['success' => true, 'data' => $row ?: [
            'steps' => 0,
            'water_ml' => 0,
            'sleep_hours' => null,
            'resting_heart_rate' => null,
            'log_date' => $date,
        ]]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            throw new Exception('Invalid JSON');
        }
        $date = $input['log_date'] ?? date('Y-m-d');
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            throw new Exception('Invalid log_date');
        }

        $ok = $wellness->upsert($userId, $date, $input);
        if (!$ok) {
            throw new Exception('Nothing to update');
        }
        echo json_encode(['success' => true, 'data' => $wellness->getByDate($userId, $date)]);
        exit;
    }

    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
