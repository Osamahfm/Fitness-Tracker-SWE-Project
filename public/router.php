<?php
/**
 * Router for PHP built-in server (php -S localhost:8000 -t public public/router.php).
 * Apache/Nginx should keep using .htaccess / vhost rules instead.
 */
declare(strict_types=1);

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
$uri = '/' . ltrim($uri, '/');

$staticPath = __DIR__ . $uri;
if ($uri !== '/' && is_file($staticPath)) {
    return false;
}

$apiMap = [
    '/api/auth' => __DIR__ . '/api/auth.php',
    '/api/activities' => __DIR__ . '/api/activities.php',
    '/api/meals' => __DIR__ . '/api/meals.php',
    '/api/goals' => __DIR__ . '/api/goals.php',
    '/api/dashboard' => __DIR__ . '/api/dashboard.php',
    '/api/trainers' => __DIR__ . '/api/trainers.php',
    '/api/users' => __DIR__ . '/api/users.php',
    '/api/wellness' => __DIR__ . '/api/wellness.php',
    '/api/workouts' => __DIR__ . '/api/workouts.php',
    '/api/analytics' => __DIR__ . '/api/analytics.php',
    '/api/profile' => __DIR__ . '/api/profile.php',
];

foreach ($apiMap as $prefix => $file) {
    if (str_starts_with($uri, $prefix)) {
        require $file;
        return true;
    }
}

if ($uri === '/' || !pathinfo($uri, PATHINFO_EXTENSION)) {
    header('Content-Type: text/html; charset=utf-8');
    readfile(__DIR__ . '/index.html');
    return true;
}

http_response_code(404);
header('Content-Type: text/plain');
echo 'Not Found';
return true;
