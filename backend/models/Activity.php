<?php
/**
 * Activity Model Class
 * Handles user activity logging and tracking
 */

require_once __DIR__ . '/../config/database.php';

class Activity {
    private $db;
    private $table = 'activities';

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Create a new activity
     */
    public function create(array $activityData): int {
        $query = "INSERT INTO {$this->table} 
                 (user_id, activity_type, activity_name, distance_km, duration_minutes, 
                  calories_burned, intensity_level, activity_date, notes) 
                 VALUES (:user_id, :activity_type, :activity_name, :distance_km, :duration_minutes, 
                  :calories_burned, :intensity_level, :activity_date, :notes)";

        $stmt = $this->db->prepare($query);
        
        $stmt->bindParam(':user_id', $activityData['user_id'], PDO::PARAM_INT);
        $stmt->bindParam(':activity_type', $activityData['activity_type']);
        $stmt->bindParam(':activity_name', $activityData['activity_name']);
        $stmt->bindParam(':distance_km', $activityData['distance_km']);
        $stmt->bindParam(':duration_minutes', $activityData['duration_minutes'], PDO::PARAM_INT);
        $stmt->bindParam(':calories_burned', $activityData['calories_burned'], PDO::PARAM_INT);
        $stmt->bindParam(':intensity_level', $activityData['intensity_level']);
        $stmt->bindParam(':activity_date', $activityData['activity_date']);
        $stmt->bindParam(':notes', $activityData['notes']);

        $stmt->execute();
        return $this->db->lastInsertId();
    }

    /**
     * Get activities for a user on a specific date
     */
    public function getActivitiesByDate(int $userId, string $date): array {
        $query = "SELECT * FROM {$this->table} 
                 WHERE user_id = :user_id AND activity_date = :date 
                 ORDER BY created_at DESC";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindParam(':date', $date);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Get activities for a user in a date range
     */
    public function getActivitiesByDateRange(int $userId, string $startDate, string $endDate): array {
        $query = "SELECT * FROM {$this->table} 
                 WHERE user_id = :user_id AND activity_date BETWEEN :start_date AND :end_date 
                 ORDER BY activity_date DESC, created_at DESC";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindParam(':start_date', $startDate);
        $stmt->bindParam(':end_date', $endDate);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Get activity statistics for a user on a specific date
     */
    public function getDailyStats(int $userId, string $date): array {
        $query = "SELECT 
                 COUNT(*) as total_activities,
                 SUM(duration_minutes) as total_duration,
                 SUM(calories_burned) as total_calories_burned,
                 SUM(distance_km) as total_distance,
                 AVG(intensity_level) as avg_intensity
                 FROM {$this->table} 
                 WHERE user_id = :user_id AND activity_date = :date";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindParam(':date', $date);
        $stmt->execute();

        $stats = $stmt->fetch();
        
        // Convert null values to 0
        return [
            'total_activities' => (int) ($stats['total_activities'] ?? 0),
            'total_duration' => (int) ($stats['total_duration'] ?? 0),
            'total_calories_burned' => (int) ($stats['total_calories_burned'] ?? 0),
            'total_distance' => (float) ($stats['total_distance'] ?? 0),
            'avg_intensity' => $stats['avg_intensity'] ?? 'moderate'
        ];
    }

    /**
     * Get weekly activity summary
     */
    public function getWeeklyStats(int $userId): array {
        $query = "SELECT 
                 activity_date,
                 COUNT(*) as total_activities,
                 SUM(duration_minutes) as total_duration,
                 SUM(calories_burned) as total_calories_burned,
                 SUM(distance_km) as total_distance
                 FROM {$this->table} 
                 WHERE user_id = :user_id 
                 AND activity_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                 GROUP BY activity_date
                 ORDER BY activity_date";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Update activity
     */
    public function update(int $activityId, array $activityData): bool {
        $fields = [];
        $params = [':activity_id' => $activityId];

        $allowedFields = ['activity_type', 'activity_name', 'distance_km', 'duration_minutes', 
                         'calories_burned', 'intensity_level', 'activity_date', 'notes'];
        
        foreach ($activityData as $key => $value) {
            if (in_array($key, $allowedFields)) {
                $fields[] = "{$key} = :{$key}";
                $params[":{$key}"] = $value;
            }
        }

        if (empty($fields)) {
            return false;
        }

        $query = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE activity_id = :activity_id";
        $stmt = $this->db->prepare($query);

        foreach ($params as $param => $value) {
            $stmt->bindValue($param, $value);
        }

        return $stmt->execute();
    }

    /**
     * Delete activity
     */
    public function delete(int $activityId): bool {
        $query = "DELETE FROM {$this->table} WHERE activity_id = :activity_id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':activity_id', $activityId, PDO::PARAM_INT);
        return $stmt->execute();
    }

    /**
     * Get activity by ID
     */
    public function findById(int $activityId): ?array {
        $query = "SELECT * FROM {$this->table} WHERE activity_id = :activity_id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':activity_id', $activityId, PDO::PARAM_INT);
        $stmt->execute();

        $activity = $stmt->fetch();
        return $activity ?: null;
    }

    /**
     * Get most recent activities for user
     */
    public function getRecentActivities(int $userId, int $limit = 10): array {
        $query = "SELECT * FROM {$this->table} 
                 WHERE user_id = :user_id 
                 ORDER BY activity_date DESC, created_at DESC 
                 LIMIT :limit";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }
}
