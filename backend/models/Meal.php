<?php
/**
 * Meal Model Class
 * Handles user meal logging and nutrition tracking
 */

require_once __DIR__ . '/../config/database.php';

class Meal {
    private $db;
    private $table = 'meals';

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Create a new meal
     */
    public function create(array $mealData): int {
        $query = "INSERT INTO {$this->table} 
                 (user_id, meal_type, meal_name, calories, protein_g, carbs_g, fat_g, fiber_g, meal_date) 
                 VALUES (:user_id, :meal_type, :meal_name, :calories, :protein_g, :carbs_g, :fat_g, :fiber_g, :meal_date)";

        $stmt = $this->db->prepare($query);
        
        $stmt->bindParam(':user_id', $mealData['user_id'], PDO::PARAM_INT);
        $stmt->bindParam(':meal_type', $mealData['meal_type']);
        $stmt->bindParam(':meal_name', $mealData['meal_name']);
        $stmt->bindParam(':calories', $mealData['calories'], PDO::PARAM_INT);
        $stmt->bindParam(':protein_g', $mealData['protein_g']);
        $stmt->bindParam(':carbs_g', $mealData['carbs_g']);
        $stmt->bindParam(':fat_g', $mealData['fat_g']);
        $stmt->bindParam(':fiber_g', $mealData['fiber_g']);
        $stmt->bindParam(':meal_date', $mealData['meal_date']);

        $stmt->execute();
        return $this->db->lastInsertId();
    }

    /**
     * Get meals for a user on a specific date
     */
    public function getMealsByDate(int $userId, string $date): array {
        $query = "SELECT * FROM {$this->table} 
                 WHERE user_id = :user_id AND meal_date = :date 
                 ORDER BY created_at ASC";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindParam(':date', $date);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Get meals for a user in a date range
     */
    public function getMealsByDateRange(int $userId, string $startDate, string $endDate): array {
        $query = "SELECT * FROM {$this->table} 
                 WHERE user_id = :user_id AND meal_date BETWEEN :start_date AND :end_date 
                 ORDER BY meal_date DESC, created_at DESC";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindParam(':start_date', $startDate);
        $stmt->bindParam(':end_date', $endDate);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Get meal statistics for a user on a specific date
     */
    public function getDailyStats(int $userId, string $date): array {
        $query = "SELECT 
                 COUNT(*) as total_meals,
                 SUM(calories) as total_calories_consumed,
                 SUM(protein_g) as total_protein,
                 SUM(carbs_g) as total_carbs,
                 SUM(fat_g) as total_fat,
                 SUM(fiber_g) as total_fiber
                 FROM {$this->table} 
                 WHERE user_id = :user_id AND meal_date = :date";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindParam(':date', $date);
        $stmt->execute();

        $stats = $stmt->fetch();
        
        // Convert null values to 0
        return [
            'total_meals' => (int) ($stats['total_meals'] ?? 0),
            'total_calories_consumed' => (int) ($stats['total_calories_consumed'] ?? 0),
            'total_protein' => (float) ($stats['total_protein'] ?? 0),
            'total_carbs' => (float) ($stats['total_carbs'] ?? 0),
            'total_fat' => (float) ($stats['total_fat'] ?? 0),
            'total_fiber' => (float) ($stats['total_fiber'] ?? 0)
        ];
    }

    /**
     * Get weekly meal summary
     */
    public function getWeeklyStats(int $userId): array {
        $query = "SELECT 
                 meal_date,
                 COUNT(*) as total_meals,
                 SUM(calories) as total_calories_consumed,
                 SUM(protein_g) as total_protein,
                 SUM(carbs_g) as total_carbs,
                 SUM(fat_g) as total_fat
                 FROM {$this->table} 
                 WHERE user_id = :user_id 
                 AND meal_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                 GROUP BY meal_date
                 ORDER BY meal_date";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Get meals grouped by type for a date
     */
    public function getMealsByType(int $userId, string $date): array {
        $query = "SELECT 
                 meal_type,
                 COUNT(*) as meal_count,
                 SUM(calories) as total_calories,
                 SUM(protein_g) as total_protein,
                 SUM(carbs_g) as total_carbs,
                 SUM(fat_g) as total_fat
                 FROM {$this->table} 
                 WHERE user_id = :user_id AND meal_date = :date
                 GROUP BY meal_type
                 ORDER BY meal_type";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindParam(':date', $date);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Update meal
     */
    public function update(int $mealId, array $mealData): bool {
        $fields = [];
        $params = [':meal_id' => $mealId];

        $allowedFields = ['meal_type', 'meal_name', 'calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'meal_date'];
        
        foreach ($mealData as $key => $value) {
            if (in_array($key, $allowedFields)) {
                $fields[] = "{$key} = :{$key}";
                $params[":{$key}"] = $value;
            }
        }

        if (empty($fields)) {
            return false;
        }

        $query = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE meal_id = :meal_id";
        $stmt = $this->db->prepare($query);

        foreach ($params as $param => $value) {
            $stmt->bindValue($param, $value);
        }

        return $stmt->execute();
    }

    /**
     * Delete meal
     */
    public function delete(int $mealId): bool {
        $query = "DELETE FROM {$this->table} WHERE meal_id = :meal_id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':meal_id', $mealId, PDO::PARAM_INT);
        return $stmt->execute();
    }

    /**
     * Get meal by ID
     */
    public function findById(int $mealId): ?array {
        $query = "SELECT * FROM {$this->table} WHERE meal_id = :meal_id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':meal_id', $mealId, PDO::PARAM_INT);
        $stmt->execute();

        $meal = $stmt->fetch();
        return $meal ?: null;
    }

    /**
     * Get most recent meals for user
     */
    public function getRecentMeals(int $userId, int $limit = 10): array {
        $query = "SELECT * FROM {$this->table} 
                 WHERE user_id = :user_id 
                 ORDER BY meal_date DESC, created_at DESC 
                 LIMIT :limit";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Get nutrition breakdown for a date range
     */
    public function getNutritionBreakdown(int $userId, string $startDate, string $endDate): array {
        $query = "SELECT 
                 SUM(calories) as total_calories,
                 SUM(protein_g) as total_protein,
                 SUM(carbs_g) as total_carbs,
                 SUM(fat_g) as total_fat,
                 SUM(fiber_g) as total_fiber,
                 COUNT(*) as total_meals
                 FROM {$this->table} 
                 WHERE user_id = :user_id 
                 AND meal_date BETWEEN :start_date AND :end_date";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindParam(':start_date', $startDate);
        $stmt->bindParam(':end_date', $endDate);
        $stmt->execute();

        $stats = $stmt->fetch();
        
        return [
            'total_calories' => (int) ($stats['total_calories'] ?? 0),
            'total_protein' => (float) ($stats['total_protein'] ?? 0),
            'total_carbs' => (float) ($stats['total_carbs'] ?? 0),
            'total_fat' => (float) ($stats['total_fat'] ?? 0),
            'total_fiber' => (float) ($stats['total_fiber'] ?? 0),
            'total_meals' => (int) ($stats['total_meals'] ?? 0)
        ];
    }
}
