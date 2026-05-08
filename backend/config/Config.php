<?php
/**
 * Environment Configuration Loader
 * Loads environment variables from .env file
 */

class Config {
    private static $loaded = false;
    private static $values = [];

    /**
     * Load environment variables from .env file
     */
    public static function load(string $envFile = '.env'): void {
        if (self::$loaded) {
            return;
        }

        if (!file_exists($envFile)) {
            throw new Exception(".env file not found at: $envFile");
        }

        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        
        foreach ($lines as $line) {
            // Skip comments
            if (strpos(trim($line), '#') === 0) {
                continue;
            }

            // Parse key=value
            if (strpos($line, '=') === false) {
                continue;
            }

            [$key, $value] = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);

            // Remove quotes if present
            if ((strlen($value) > 1) && 
                (($value[0] === '"' && $value[-1] === '"') || 
                 ($value[0] === "'" && $value[-1] === "'"))) {
                $value = substr($value, 1, -1);
            }

            self::$values[$key] = $value;
            putenv("$key=$value");
        }

        self::$loaded = true;
    }

    /**
     * Get configuration value
     */
    public static function get(string $key, mixed $default = null): mixed {
        return self::$values[$key] ?? $default;
    }

    /**
     * Get configuration value as boolean
     */
    public static function getBoolean(string $key, bool $default = false): bool {
        $value = self::get($key, $default);
        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }

    /**
     * Get configuration value as integer
     */
    public static function getInt(string $key, int $default = 0): int {
        $value = self::get($key, $default);
        return (int) $value;
    }

    /**
     * Set configuration value
     */
    public static function set(string $key, mixed $value): void {
        self::$values[$key] = $value;
    }

    /**
     * Check if key exists
     */
    public static function has(string $key): bool {
        return isset(self::$values[$key]);
    }

    /**
     * Get all values
     */
    public static function all(): array {
        return self::$values;
    }
}

// Automatically load .env file if it exists
$envFile = __DIR__ . '/../../.env';
if (file_exists($envFile)) {
    Config::load($envFile);
}
