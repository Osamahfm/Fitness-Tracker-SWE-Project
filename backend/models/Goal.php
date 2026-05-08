<?php
/**
 * Goal Model Class
 * Handles user fitness goals
 */

require_once __DIR__ . '/../config/database.php';

class Goal {
    private $db;
    private $table = 'goals';

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Create a new goal
     */
    public function create(array $goalData): int {
        $query = "INSERT INTO {$this->table} 
                 (user_id, goal_type, target_weight_kg, target_date, daily_calorie_target, weekly_activity_minutes) 
                 VALUES (:user_id, :goal_type, :target_weight_kg, :target_date, :daily_calorie_target, :weekly_activity_minutes)";

        $stmt = $this->db->prepare($query);
        
        $stmt->bindParam(':user_id', $goalData['user_id'], PDO::PARAM_INT);
        $stmt->bindParam(':goal_type', $goalData['goal_type']);
        $stmt->bindParam(':target_weight_kg', $goalData['target_weight_kg']);
        $stmt->bindParam(':target_date', $goalData['target_date']);
        $stmt->bindParam(':daily_calorie_target', $goalData['daily_calorie_target'], PDO::PARAM_INT);
        $stmt->bindParam(':weekly_activity_minutes', $goalData['weekly_activity_minutes'], PDO::PARAM_INT);

        $stmt->execute();
        return $this->db->lastInsertId();
    }

    /**
     * Get active goal for user
     */
    public function getActiveGoal(int $userId): ?array {
        $query = "SELECT * FROM {$this->table} 
                 WHERE user_id = :user_id AND is_active = TRUE 
                 ORDER BY created_at DESC LIMIT 1";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();

        $goal = $stmt->fetch();
        return $goal ?: null;
    }

    /**
     * Update goal
     */
    public function update(int $goalId, array $goalData): bool {
        $fields = [];
        $params = [':goal_id' => $goalId];

        $allowedFields = ['goal_type', 'target_weight_kg', 'target_date', 'daily_calorie_target', 'weekly_activity_minutes'];
        
        foreach ($goalData as $key => $value) {
            if (in_array($key, $allowedFields)) {
                $fields[] = "{$key} = :{$key}";
                $params[":{$key}"] = $value;
            }
        }

        if (empty($fields)) {
            return false;
        }

        $query = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE goal_id = :goal_id";
        $stmt = $this->db->prepare($query);

        foreach ($params as $param => $value) {
            $stmt->bindValue($param, $value);
        }

        return $stmt->execute();
    }

    /**
     * Deactivate goal
     */
    public function deactivate(int $goalId): bool {
        $query = "UPDATE {$this->table} SET is_active = FALSE WHERE goal_id = :goal_id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':goal_id', $goalId, PDO::PARAM_INT);
        return $stmt->execute();
    }

    /**
     * Get all goals for user
     */
    public function getUserGoals(int $userId): array {
        $query = "SELECT * FROM {$this->table} 
                 WHERE user_id = :user_id 
                 ORDER BY created_at DESC";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }
}
