<?php
/**
 * Body weight history for progress charts.
 */

require_once __DIR__ . '/../config/database.php';

class BodyMetrics {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function logWeight(int $userId, string $date, float $weightKg, ?string $notes = null): bool {
        $sql = 'INSERT INTO body_metrics_log (user_id, recorded_date, weight_kg, notes) VALUES (:uid, :d, :w, :n)';
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':uid' => $userId,
            ':d' => $date,
            ':w' => $weightKg,
            ':n' => $notes,
        ]);
    }

    /**
     * @return array<int, array{recorded_date:string,weight_kg:float}>
     */
    public function getHistory(int $userId, int $days = 90): array {
        $since = date('Y-m-d', strtotime("-{$days} days"));
        $sql = 'SELECT recorded_date, weight_kg FROM body_metrics_log
                WHERE user_id = :uid AND recorded_date >= :since
                ORDER BY recorded_date ASC';
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':uid' => $userId, ':since' => $since]);
        return $stmt->fetchAll();
    }
}
