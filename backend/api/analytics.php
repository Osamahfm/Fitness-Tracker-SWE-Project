<?php
/**
 * Weight / BMI analytics helpers for charts.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../services/AuthService.php';
require_once __DIR__ . '/../models/BodyMetrics.php';
require_once __DIR__ . '/../models/User.php';

$authService = new AuthService();
$metrics = new BodyMetrics();
$userModel = new User();

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
        $days = isset($_GET['days']) ? min(365, max(7, (int) $_GET['days'])) : 90;
        $history = $metrics->getHistory($userId, $days);

        $profile = $userModel->findById($userId);
        $heightM = $profile ? ((float) $profile['height_cm']) / 100 : null;
        $bmiSeries = [];
        foreach ($history as $row) {
            $w = (float) $row['weight_kg'];
            $bmi = $heightM && $heightM > 0 ? round($w / ($heightM * $heightM), 1) : null;
            $bmiSeries[] = [
                'date' => $row['recorded_date'],
                'weight_kg' => $w,
                'bmi' => $bmi,
            ];
        }

        echo json_encode([
            'success' => true,
            'data' => [
                'weight_history' => $bmiSeries,
                'current_weight_kg' => $profile ? (float) $profile['weight_kg'] : null,
                'height_cm' => $profile ? (float) $profile['height_cm'] : null,
            ],
        ]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input || empty($input['weight_kg'])) {
            throw new Exception('weight_kg is required');
        }
        $date = $input['recorded_date'] ?? date('Y-m-d');
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            throw new Exception('Invalid recorded_date');
        }
        $w = (float) $input['weight_kg'];
        if ($w < 30 || $w > 300) {
            throw new Exception('Weight out of allowed range');
        }
        $notes = isset($input['notes']) ? substr(trim((string) $input['notes']), 0, 255) : null;

        $metrics->logWeight($userId, $date, $w, $notes);
        $userModel->update($userId, ['weight_kg' => $w]);

        echo json_encode(['success' => true, 'message' => 'Weight logged']);
        exit;
    }

    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
