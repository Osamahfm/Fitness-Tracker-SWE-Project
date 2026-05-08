<?php
/**
 * Read-only catalog of preset workouts for the library UI.
 */

require_once __DIR__ . '/../config/database.php';

class WorkoutCatalog {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function listAll(?string $category = null, ?string $search = null, ?string $difficulty = null): array {
        $sql = 'SELECT workout_id, category, name, slug, description, difficulty, duration_minutes, calories_estimate, exercises_json
                FROM workout_templates WHERE 1=1';
        $params = [];

        if ($category) {
            $sql .= ' AND category = :category';
            $params[':category'] = $category;
        }
        if ($difficulty) {
            $sql .= ' AND difficulty = :difficulty';
            $params[':difficulty'] = $difficulty;
        }
        if ($search) {
            $sql .= ' AND (name LIKE :q OR description LIKE :q2)';
            $qs = '%' . $search . '%';
            $params[':q'] = $qs;
            $params[':q2'] = $qs;
        }
        $sql .= ' ORDER BY category ASC, name ASC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        foreach ($rows as &$row) {
            if (!empty($row['exercises_json'])) {
                $decoded = json_decode($row['exercises_json'] ?? '[]', true);
                $row['exercises'] = is_array($decoded) ? $decoded : [];
            } else {
                $row['exercises'] = [];
            }
            unset($row['exercises_json']);
        }
        return $rows;
    }

    public function findById(int $workoutId): ?array {
        $sql = 'SELECT * FROM workout_templates WHERE workout_id = :id LIMIT 1';
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $workoutId]);
        $row = $stmt->fetch();
        if (!$row) {
            return null;
        }
        $row['exercises'] = json_decode($row['exercises_json'] ?? '[]', true) ?: [];
        unset($row['exercises_json']);
        return $row;
    }

    public function getCategories(): array {
        $stmt = $this->db->query('SELECT DISTINCT category FROM workout_templates ORDER BY category');
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }
}
