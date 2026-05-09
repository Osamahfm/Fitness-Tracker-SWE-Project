<?php
/**
 * API Response Utility
 * Standardizes JSON responses across the API
 */
namespace FitTrack\Utils;

class Response
{
    public static function json(bool $success, $data = null, string $message = '', int $statusCode = 200): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        
        $response = [
            'success' => $success,
            'message' => $message,
            'data' => $data,
            'timestamp' => date('c')
        ];
        
        echo json_encode($response, JSON_PRETTY_PRINT);
        exit;
    }

    public static function success($data = null, string $message = 'Success'): void
    {
        self::json(true, $data, $message, 200);
    }

    public static function created($data = null, string $message = 'Created successfully'): void
    {
        self::json(true, $data, $message, 201);
    }

    public static function error(string $message = 'Error', int $statusCode = 400): void
    {
        self::json(false, null, $message, $statusCode);
    }

    public static function unauthorized(string $message = 'Unauthorized'): void
    {
        self::json(false, null, $message, 401);
    }

    public static function notFound(string $message = 'Resource not found'): void
    {
        self::json(false, null, $message, 404);
    }

    public static function serverError(string $message = 'Internal server error'): void
    {
        self::json(false, null, $message, 500);
    }
}
