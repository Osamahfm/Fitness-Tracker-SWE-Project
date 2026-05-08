<?php
/**
 * Current user profile (read/update) — avoids admin-only users API.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../services/AuthService.php';
require_once __DIR__ . '/../helpers/ValidationHelper.php';
require_once __DIR__ . '/../models/User.php';

$authService = new AuthService();
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
        $fresh = $userModel->findById($userId);
        if ($fresh) {
            unset($fresh['password_hash']);
        }
        echo json_encode(['success' => true, 'user' => $fresh]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            throw new Exception('Invalid JSON');
        }
        $allowed = [];
        foreach (['first_name', 'last_name', 'height_cm', 'weight_kg', 'activity_level'] as $f) {
            if (isset($input[$f])) {
                $allowed[$f] = $input[$f];
            }
        }
        if (isset($allowed['first_name'])) {
            $allowed['first_name'] = ValidationHelper::sanitizeString((string) $allowed['first_name']);
        }
        if (isset($allowed['last_name'])) {
            $allowed['last_name'] = ValidationHelper::sanitizeString((string) $allowed['last_name']);
        }
        if (isset($allowed['activity_level']) && !ValidationHelper::isValidActivityLevel((string) $allowed['activity_level'])) {
            throw new Exception('Invalid activity level');
        }
        if (empty($allowed)) {
            throw new Exception('No valid fields to update');
        }

        $userModel->update($userId, $allowed);
        $fresh = $userModel->findById($userId);
        unset($fresh['password_hash']);
        echo json_encode(['success' => true, 'user' => $fresh]);
        exit;
    }

    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
