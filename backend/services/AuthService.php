<?php
/**
 * Authentication Service
 * Handles user registration, login, and session management
 */

require_once __DIR__ . '/../config/Config.php';
require_once __DIR__ . '/../helpers/ValidationHelper.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../models/UserSession.php';
require_once __DIR__ . '/../models/PasswordReset.php';
require_once __DIR__ . '/RBACService.php';

class AuthService {
    private $userModel;
    private $sessionModel;
    private $rbacService;
    private $currentUser;
    
    public function __construct() {
        $this->userModel = new User();
        $this->sessionModel = new UserSession();
        $this->rbacService = new RBACService();
        $this->currentUser = null;
    }

    /**
     * Register a new user
     */
    public function register(array $userData): array {
        // Validate required fields
        $this->validateRegistrationData($userData);

        // Check if user already exists
        if ($this->userModel->emailExists($userData['email'])) {
            throw new Exception("Email already registered");
        }

        if ($this->userModel->usernameExists($userData['username'])) {
            throw new Exception("Username already taken");
        }

        // Hash password
        $userData['password_hash'] = password_hash($userData['password'], PASSWORD_DEFAULT);
        unset($userData['password']);

        // Create user
        $userId = $this->userModel->create($userData);

        // Create initial goal for the user
        $this->createDefaultGoal($userId);

        return [
            'success' => true,
            'user_id' => $userId,
            'message' => 'Registration successful'
        ];
    }

    /**
     * User login
     */
    public function login(string $email, string $password, string $ipAddress, string $userAgent): array {
        // Find user by email
        $user = $this->userModel->findByEmail($email);
        if (!$user) {
            throw new Exception("Invalid email or password");
        }

        // Verify password
        if (!password_verify($password, $user['password_hash'])) {
            throw new Exception("Invalid email or password");
        }

        // Create session
        $sessionId = $this->sessionModel->create($user['user_id'], $ipAddress, $userAgent);

        return [
            'success' => true,
            'user_id' => $user['user_id'],
            'session_id' => $sessionId,
            'user' => $this->sanitizeUserData($user)
        ];
    }

    /**
     * User logout
     */
    public function logout(string $sessionId): bool {
        return $this->sessionModel->invalidate($sessionId);
    }

    /**
     * Validate user session
     */
    public function validateSession(string $sessionId, string $ipAddress): ?array {
        $session = $this->sessionModel->findValid($sessionId, $ipAddress);
        if (!$session) {
            return null;
        }

        $user = $this->userModel->findById($session['user_id']);
        if (!$user) {
            return null;
        }

        return $this->sanitizeUserData($user);
    }

    /**
     * Change password
     */
    public function changePassword(int $userId, string $currentPassword, string $newPassword): bool {
        $user = $this->userModel->findById($userId);
        if (!$user) {
            throw new Exception("User not found");
        }

        // Verify current password
        if (!password_verify($currentPassword, $user['password_hash'])) {
            throw new Exception("Current password is incorrect");
        }

        // Update password
        $newPasswordHash = password_hash($newPassword, PASSWORD_DEFAULT);
        $this->userModel->update($userId, ['password_hash' => $newPasswordHash]);

        // Invalidate all sessions except current one
        $this->sessionModel->invalidateAllExcept($userId, $this->getCurrentSessionId());

        return true;
    }

    /**
     * Request password reset — stores hashed token; returns plaintext token for demo when APP_DEBUG is true.
     *
     * @return array{success:bool, message:string, demo_token?:string}
     */
    public function requestPasswordReset(string $email): array {
        $email = strtolower(trim($email));
        $user = $this->userModel->findByEmail($email);

        if (!$user) {
            return [
                'success' => true,
                'message' => 'If an account exists for this email, reset instructions have been recorded.',
            ];
        }

        $plaintext = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $plaintext);
        $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));

        $resetModel = new PasswordReset();
        $resetModel->createToken($email, $tokenHash, $expiresAt);

        $out = [
            'success' => true,
            'message' => 'If an account exists for this email, you can complete the reset with your token.',
        ];

        if (Config::getBoolean('APP_DEBUG', false)) {
            $out['demo_token'] = $plaintext;
        }
        return $out;
    }

    /**
     * Complete password reset with a one-time token.
     */
    public function resetPasswordWithToken(string $token, string $newPassword): array {
        if (strlen($newPassword) < 8) {
            throw new Exception('Password must be at least 8 characters');
        }

        $resetModel = new PasswordReset();
        $email = $resetModel->consumeValidToken($token);
        if (!$email) {
            return ['success' => false, 'message' => 'Invalid or expired reset token'];
        }

        $user = $this->userModel->findByEmail($email);
        if (!$user) {
            return ['success' => false, 'message' => 'User not found'];
        }

        if (!ValidationHelper::isValidPassword($newPassword)) {
            throw new Exception('Password must include uppercase, lowercase, number, and special character');
        }

        $hash = password_hash($newPassword, PASSWORD_DEFAULT);
        $this->userModel->updatePasswordHash((int) $user['user_id'], $hash);
        $this->sessionModel->invalidateAllForUser((int) $user['user_id']);

        return ['success' => true, 'message' => 'Password updated successfully'];
    }

    /**
     * Validate registration data
     */
    private function validateRegistrationData(array $userData): void {
        $requiredFields = ['username', 'email', 'password', 'first_name', 'last_name', 
                          'date_of_birth', 'gender', 'height_cm', 'weight_kg', 'activity_level'];

        foreach ($requiredFields as $field) {
            if (empty($userData[$field])) {
                throw new Exception("Field '{$field}' is required");
            }
        }

        // Validate email format
        if (!filter_var($userData['email'], FILTER_VALIDATE_EMAIL)) {
            throw new Exception("Invalid email format");
        }

        // Validate password strength
        if (strlen($userData['password']) < 8) {
            throw new Exception("Password must be at least 8 characters long");
        }

        // Validate age (must be at least 13)
        $age = $this->calculateAge($userData['date_of_birth']);
        if ($age < 13) {
            throw new Exception("User must be at least 13 years old");
        }

        // Validate height and weight ranges
        if ($userData['height_cm'] < 100 || $userData['height_cm'] > 250) {
            throw new Exception("Height must be between 100cm and 250cm");
        }

        if ($userData['weight_kg'] < 30 || $userData['weight_kg'] > 300) {
            throw new Exception("Weight must be between 30kg and 300kg");
        }

        // Validate gender
        if (!in_array($userData['gender'], ['male', 'female', 'other'])) {
            throw new Exception("Invalid gender value");
        }

        // Validate activity level
        if (!in_array($userData['activity_level'], ['sedentary', 'light', 'moderate', 'active', 'very_active'])) {
            throw new Exception("Invalid activity level");
        }

        // Validate role if provided
        if (isset($userData['role'])) {
            if (!in_array($userData['role'], ['customer', 'trainer', 'admin'])) {
                throw new Exception("Invalid role value");
            }
            // For now, only allow customer registration (admin accounts created separately)
            if ($userData['role'] !== 'customer') {
                throw new Exception("Role must be 'customer' for registration");
            }
        }
    }

    /**
     * Create default goal for new user
     */
    public function createDefaultGoal(int $userId): void {
        $goalModel = new Goal();
        $calorieCalculator = new CalorieCalculator();
        
        $defaultGoal = [
            'user_id' => $userId,
            'goal_type' => 'maintenance',
            'daily_calorie_target' => $calorieCalculator->calculateDailyCalorieTarget($userId, 'maintenance'),
            'weekly_activity_minutes' => 150
        ];

        $goalModel->create($defaultGoal);
    }

    /**
     * Calculate age from date of birth
     */
    private function calculateAge(string $dateOfBirth): int {
        $dob = new DateTime($dateOfBirth);
        $today = new DateTime();
        return $today->diff($dob)->y;
    }

    /**
     * Sanitize user data for output
     */
    private function sanitizeUserData(array $user): array {
        unset($user['password_hash']);
        return $user;
    }

    /**
     * Get current session ID (would be from session management)
     */
    private function getCurrentSessionId(): string {
        // This would typically come from session management
        return '';
    }

    /**
     * Check if user has permission (RBAC wrapper)
     */
    public function hasPermission(int $userId, string $permission): bool {
        return $this->rbacService->hasPermission($userId, $permission);
    }

    /**
     * Get user role
     */
    public function getUserRole(int $userId): ?string {
        return $this->rbacService->getUserRole($userId);
    }

    /**
     * Check if user can access another user's data
     */
    public function canAccessUserData(int $userId, int $targetUserId, string $resource): bool {
        return $this->rbacService->canAccessUserData($userId, $targetUserId, $resource);
    }

    /**
     * Get navigation items for user role
     */
    public function getNavigationForRole(string $role): array {
        return $this->rbacService->getNavigationForRole($role);
    }
}
