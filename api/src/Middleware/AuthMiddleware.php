<?php
/**
 * Authentication Middleware
 * Validates JWT token and sets current user
 */
namespace FitTrack\Middleware;

use FitTrack\Utils\JWT;
use FitTrack\Repositories\UserRepository;
use FitTrack\Utils\Response;

class AuthMiddleware
{
    private static ?\FitTrack\Models\User $currentUser = null;

    public static function authenticate(): bool
    {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? '';

        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            Response::unauthorized('Missing or invalid authorization token');
            return false;
        }

        $token = substr($authHeader, 7);
        $payload = JWT::validate($token);

        if (!$payload || !isset($payload['user_id'])) {
            Response::unauthorized('Invalid or expired token');
            return false;
        }

        $repo = new UserRepository();
        $user = $repo->findById((int)$payload['user_id']);

        if (!$user) {
            Response::unauthorized('User not found');
            return false;
        }

        self::$currentUser = $user;
        return true;
    }

    public static function getCurrentUser(): ?\FitTrack\Models\User
    {
        return self::$currentUser;
    }

    public static function requireAuth(): \FitTrack\Models\User
    {
        if (!self::authenticate()) {
            Response::unauthorized('Authentication required');
            exit;
        }
        return self::$currentUser;
    }
}
