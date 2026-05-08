<?php
/**
 * Validation Helper Class
 * Provides input validation and sanitization utilities
 */

class ValidationHelper {
    
    /**
     * Validate email format
     */
    public static function isValidEmail(string $email): bool {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    /**
     * Validate password strength
     * At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
     */
    public static function isValidPassword(string $password): bool {
        $pattern = '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/';
        return preg_match($pattern, $password) === 1;
    }

    /**
     * Validate username format
     * 3-20 characters, alphanumeric and underscore only
     */
    public static function isValidUsername(string $username): bool {
        $pattern = '/^[a-zA-Z0-9_]{3,20}$/';
        return preg_match($pattern, $username) === 1;
    }

    /**
     * Validate date format (YYYY-MM-DD)
     */
    public static function isValidDate(string $date): bool {
        $pattern = '/^\d{4}-\d{2}-\d{2}$/';
        if (!preg_match($pattern, $date)) {
            return false;
        }
        
        $timestamp = strtotime($date);
        return $timestamp && date('Y-m-d', $timestamp) === $date;
    }

    /**
     * Validate positive integer
     */
    public static function isValidPositiveInt(mixed $value): bool {
        return filter_var($value, FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]) !== false;
    }

    /**
     * Validate positive float
     */
    public static function isValidPositiveFloat(mixed $value): bool {
        return filter_var($value, FILTER_VALIDATE_FLOAT) !== false && $value > 0;
    }

    /**
     * Validate gender
     */
    public static function isValidGender(string $gender): bool {
        $valid = ['male', 'female', 'other'];
        return in_array(strtolower($gender), $valid);
    }

    /**
     * Validate activity level
     */
    public static function isValidActivityLevel(string $level): bool {
        $valid = ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'];
        return in_array(strtolower($level), $valid);
    }

    /**
     * Sanitize string input
     */
    public static function sanitizeString(string $input): string {
        return trim(htmlspecialchars($input, ENT_QUOTES, 'UTF-8'));
    }

    /**
     * Sanitize email
     */
    public static function sanitizeEmail(string $email): string {
        return strtolower(filter_var($email, FILTER_SANITIZE_EMAIL));
    }

    /**
     * Validate required fields
     */
    public static function validateRequired(array $data, array $required): array {
        $errors = [];
        foreach ($required as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                $errors[$field] = ucfirst(str_replace('_', ' ', $field)) . ' is required';
            }
        }
        return $errors;
    }

    /**
     * Validate registration data
     */
    public static function validateRegistrationData(array $data): array {
        $errors = [];
        $required = ['email', 'username', 'password', 'first_name', 'last_name', 'gender', 'height_cm', 'weight_kg', 'activity_level'];
        
        // Check required fields
        $errors = array_merge($errors, self::validateRequired($data, $required));

        // Validate email
        if (isset($data['email']) && !self::isValidEmail($data['email'])) {
            $errors['email'] = 'Invalid email format';
        }

        // Validate password
        if (isset($data['password']) && !self::isValidPassword($data['password'])) {
            $errors['password'] = 'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
        }

        // Validate username
        if (isset($data['username']) && !self::isValidUsername($data['username'])) {
            $errors['username'] = 'Username must be 3-20 characters, alphanumeric and underscore only';
        }

        // Validate gender
        if (isset($data['gender']) && !self::isValidGender($data['gender'])) {
            $errors['gender'] = 'Invalid gender value';
        }

        // Validate heights and weight
        if (isset($data['height_cm']) && !self::isValidPositiveFloat($data['height_cm'])) {
            $errors['height_cm'] = 'Height must be a positive number';
        }

        if (isset($data['weight_kg']) && !self::isValidPositiveFloat($data['weight_kg'])) {
            $errors['weight_kg'] = 'Weight must be a positive number';
        }

        // Validate activity level
        if (isset($data['activity_level']) && !self::isValidActivityLevel($data['activity_level'])) {
            $errors['activity_level'] = 'Invalid activity level';
        }

        return $errors;
    }

    /**
     * Validate login data
     */
    public static function validateLoginData(array $data): array {
        $errors = [];
        $required = ['email', 'password'];
        
        $errors = array_merge($errors, self::validateRequired($data, $required));

        if (isset($data['email']) && !self::isValidEmail($data['email'])) {
            $errors['email'] = 'Invalid email format';
        }

        return $errors;
    }
}
