<?php
/**
 * User Model Class
 * Handles user-related database operations
 */

require_once __DIR__ . '/../config/database.php';

class User {
    private $db;
    private $table = 'users';

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Create a new user
     */
    public function create(array $userData): int {
        $query = "INSERT INTO {$this->table} 
                 (username, email, password_hash, first_name, last_name, date_of_birth, 
                  gender, height_cm, weight_kg, activity_level, role) 
                 VALUES (:username, :email, :password_hash, :first_name, :last_name, 
                  :date_of_birth, :gender, :height_cm, :weight_kg, :activity_level, :role)";

        $stmt = $this->db->prepare($query);
        
        $stmt->bindParam(':username', $userData['username']);
        $stmt->bindParam(':email', $userData['email']);
        $stmt->bindParam(':password_hash', $userData['password_hash']);
        $stmt->bindParam(':first_name', $userData['first_name']);
        $stmt->bindParam(':last_name', $userData['last_name']);
        $stmt->bindParam(':date_of_birth', $userData['date_of_birth']);
        $stmt->bindParam(':gender', $userData['gender']);
        $stmt->bindParam(':height_cm', $userData['height_cm']);
        $stmt->bindParam(':weight_kg', $userData['weight_kg']);
        $stmt->bindParam(':activity_level', $userData['activity_level']);
        $role = isset($userData['role']) ? $userData['role'] : 'customer';
        $stmt->bindParam(':role', $role);

        $stmt->execute();
        return $this->db->lastInsertId();
    }

    /**
     * Find user by email
     */
    public function findByEmail(string $email): ?array {
        $query = "SELECT * FROM {$this->table} WHERE email = :email AND is_active = TRUE";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();
        
        $user = $stmt->fetch();
        return $user ?: null;
    }

    /**
     * Find user by username
     */
    public function findByUsername(string $username): ?array {
        $query = "SELECT * FROM {$this->table} WHERE username = :username AND is_active = TRUE";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':username', $username);
        $stmt->execute();
        
        $user = $stmt->fetch();
        return $user ?: null;
    }

    /**
     * Find user by ID
     */
    public function findById(int $userId): ?array {
        $query = "SELECT * FROM {$this->table} WHERE user_id = :user_id AND is_active = TRUE";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();
        
        $user = $stmt->fetch();
        return $user ?: null;
    }

    /**
     * Update user profile
     */
    public function update(int $userId, array $userData): bool {
        $fields = [];
        $params = [':user_id' => $userId];

        foreach ($userData as $key => $value) {
            if (in_array($key, ['first_name', 'last_name', 'height_cm', 'weight_kg', 'activity_level'])) {
                $fields[] = "{$key} = :{$key}";
                $params[":{$key}"] = $value;
            }
        }

        if (empty($fields)) {
            return false;
        }

        $query = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE user_id = :user_id";
        $stmt = $this->db->prepare($query);

        foreach ($params as $param => $value) {
            $stmt->bindValue($param, $value);
        }

        return $stmt->execute();
    }

    /**
     * Update password hash (used by reset flow and admin tools).
     */
    public function updatePasswordHash(int $userId, string $passwordHash): bool {
        $query = "UPDATE {$this->table} SET password_hash = :password_hash WHERE user_id = :user_id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':password_hash', $passwordHash);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        return $stmt->execute();
    }

    /**
     * Check if email exists
     */
    public function emailExists(string $email): bool {
        return $this->findByEmail($email) !== null;
    }

    /**
     * Check if username exists
     */
    public function usernameExists(string $username): bool {
        return $this->findByUsername($username) !== null;
    }

    /**
     * Get user's BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
     */
    public function calculateBMR(int $userId): ?float {
        $user = $this->findById($userId);
        if (!$user) return null;

        $weight = (float) $user['weight_kg'];
        $height = (float) $user['height_cm'];
        $age = $this->calculateAge($user['date_of_birth']);
        
        if ($user['gender'] === 'male') {
            return 88.362 + (13.397 * $weight) + (4.799 * $height) - (5.677 * $age);
        } else {
            return 447.593 + (9.247 * $weight) + (3.098 * $height) - (4.330 * $age);
        }
    }

    /**
     * Get user's TDEE (Total Daily Energy Expenditure)
     */
    public function calculateTDEE(int $userId): ?float {
        $bmr = $this->calculateBMR($userId);
        if ($bmr === null) return null;

        $user = $this->findById($userId);
        if (!$user) return null;

        $activityMultipliers = [
            'sedentary' => 1.2,
            'light' => 1.375,
            'moderate' => 1.55,
            'active' => 1.725,
            'very_active' => 1.9
        ];

        return $bmr * ($activityMultipliers[$user['activity_level']] ?? 1.55);
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
     * Update user role
     */
    public function updateRole(int $userId, string $role): bool {
        $query = "UPDATE {$this->table} SET role = :role WHERE user_id = :user_id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':role', $role);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        return $stmt->execute();
    }

    /**
     * Get users by role
     */
    public function getUsersByRole(string $role): array {
        $query = "SELECT user_id, username, email, first_name, last_name, created_at 
                 FROM {$this->table} 
                 WHERE role = :role AND is_active = TRUE 
                 ORDER BY created_at DESC";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':role', $role);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Get all users (admin function)
     */
    public function getAllUsers(): array {
        $query = "SELECT user_id, username, email, first_name, last_name, role, 
                        is_active, created_at 
                 FROM {$this->table} 
                 ORDER BY created_at DESC";

        $stmt = $this->db->prepare($query);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Deactivate user (admin function)
     */
    public function deactivateUser(int $userId): bool {
        $query = "UPDATE {$this->table} SET is_active = FALSE WHERE user_id = :user_id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        return $stmt->execute();
    }

    /**
     * Activate user (admin function)
     */
    public function activateUser(int $userId): bool {
        $query = "UPDATE {$this->table} SET is_active = TRUE WHERE user_id = :user_id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        return $stmt->execute();
    }
}
