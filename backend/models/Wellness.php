<?php
/**
 * Daily wellness metrics (steps, water, sleep, heart rate).
 */

require_once __DIR__ . '/../config/database.php';

class Wellness {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function getByDate(int $userId, string $date): ?array {
        $sql = 'SELECT * FROM wellness_daily WHERE user_id = :uid AND log_date = :d LIMIT 1';
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':uid' => $userId, ':d' => $date]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /**
     * Insert or update using MySQL UPSERT (requires uq_user_day unique key).
     */
    public function upsert(int $userId, string $date, array $data): bool {
        $steps = isset($data['steps']) ? (int) $data['steps'] : 0;
        $water = isset($data['water_ml']) ? (int) $data['water_ml'] : 0;
        $sleep = isset($data['sleep_hours']) && $data['sleep_hours'] !== '' ? (float) $data['sleep_hours'] : null;
        $hr = isset($data['resting_heart_rate']) && $data['resting_heart_rate'] !== ''
            ? (int) $data['resting_heart_rate'] : null;

        $sql = 'INSERT INTO wellness_daily (user_id, log_date, steps, water_ml, sleep_hours, resting_heart_rate)
                VALUES (:user_id, :log_date, :steps, :water_ml, :sleep_hours, :resting_heart_rate)
                ON DUPLICATE KEY UPDATE
                    steps = VALUES(steps),
                    water_ml = VALUES(water_ml),
                    sleep_hours = VALUES(sleep_hours),
                    resting_heart_rate = VALUES(resting_heart_rate)';

        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':user_id' => $userId,
            ':log_date' => $date,
            ':steps' => $steps,
            ':water_ml' => $water,
            ':sleep_hours' => $sleep,
            ':resting_heart_rate' => $hr,
        ]);
    }
}
