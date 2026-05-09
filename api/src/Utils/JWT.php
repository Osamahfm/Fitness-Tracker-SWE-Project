<?php
/**
 * JWT Token Handler
 * Manages creation and validation of JSON Web Tokens
 */
namespace FitTrack\Utils;

class JWT
{
    private static string $secret = 'FitTrackPro_SecretKey_2024_SuperSecure';
    private static string $algo = 'HS256';
    private static int $expiry = 86400; // 24 hours

    public static function generate(array $payload): string
    {
        $header = json_encode(['typ' => 'JWT', 'alg' => self::$algo]);
        $time = time();
        $payload['iat'] = $time;
        $payload['exp'] = $time + self::$expiry;
        $payload['iss'] = 'fittrack-pro';

        $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(json_encode($payload)));

        $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, self::$secret, true);
        $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        return $base64Header . "." . $base64Payload . "." . $base64Signature;
    }

    public static function validate(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return null;

        $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])), true);
        if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) {
            return null;
        }

        $signature = hash_hmac('sha256', $parts[0] . "." . $parts[1], self::$secret, true);
        $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        if (!hash_equals($base64Signature, $parts[2])) {
            return null;
        }

        return $payload;
    }

    public static function decode(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return null;
        return json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])), true);
    }
}
