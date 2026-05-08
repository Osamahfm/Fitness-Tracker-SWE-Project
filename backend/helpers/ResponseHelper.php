<?php
/**
 * Response Helper
 * Provides consistent API response formatting
 */

class ResponseHelper {
    
    /**
     * Send success response
     */
    public static function success(array $data = [], string $message = 'Success', int $statusCode = 200): void {
        self::send([
            'success' => true,
            'message' => $message,
            'data' => $data,
            'timestamp' => date('Y-m-d H:i:s')
        ], $statusCode);
    }

    /**
     * Send error response
     */
    public static function error(string $message = 'Error', int $statusCode = 400, array $errors = null): void {
        $response = [
            'success' => false,
            'message' => $message,
            'timestamp' => date('Y-m-d H:i:s')
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        self::send($response, $statusCode);
    }

    /**
     * Send validation error response
     */
    public static function validationError(array $errors, string $message = 'Validation failed'): void {
        self::error($message, 422, $errors);
    }

    /**
     * Send rate limit error response
     */
    public static function rateLimitExceeded(int $retryAfter = 60): void {
        http_response_code(429);
        header("Retry-After: $retryAfter");
        self::send([
            'success' => false,
            'message' => 'Rate limit exceeded',
            'retry_after' => $retryAfter,
            'timestamp' => date('Y-m-d H:i:s')
        ], 429);
    }

    /**
     * Send unauthorized response
     */
    public static function unauthorized(string $message = 'Unauthorized'): void {
        self::error($message, 401);
    }

    /**
     * Send forbidden response
     */
    public static function forbidden(string $message = 'Forbidden'): void {
        self::error($message, 403);
    }

    /**
     * Send not found response
     */
    public static function notFound(string $message = 'Not found'): void {
        self::error($message, 404);
    }

    /**
     * Send server error response
     */
    public static function serverError(string $message = 'Internal server error'): void {
        self::error($message, 500);
    }

    /**
     * Send generic JSON response
     */
    private static function send(array $response, int $statusCode): void {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($response, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }
}
