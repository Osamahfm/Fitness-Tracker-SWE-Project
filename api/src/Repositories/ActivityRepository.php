<?php
namespace FitTrack\Repositories;

use FitTrack\Config\Database;
use FitTrack\Models\Activity;
use PDO;

class ActivityRepository
{
    protected PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function create(Activity $activity): Activity
    {
        $stmt = $this->db->prepare("
            INSERT INTO activities (user_id, activity_type_id, duration_minutes, distance_km, intensity, calories_burned, notes)
            VALUES (:uid, :type, :dur, :dist, :intensity, :cal, :notes)
        ");
        $stmt->execute([
            ':uid' => $activity->user_id,
            ':type' => $activity->activity_type_id,
            ':dur' => $activity->duration_minutes,
            ':dist' => $activity->distance_km,
            ':intensity' => $activity->intensity,
            ':cal' => $activity->calories_burned,
            ':notes' => $activity->notes,
        ]);
        $activity->id = (int) $this->db->lastInsertId();
        return $activity;
    }

    public function findById(int $id): ?Activity
    {
        $stmt = $this->db->prepare("
            SELECT a.*, at.name as activity_name, at.category as activity_category, at.met_value
            FROM activities a
            JOIN activity_types at ON a.activity_type_id = at.id
            WHERE a.id = :id
        ");
        $stmt->execute([':id' => $id]);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);
        return $data ? Activity::fromArray($data) : null;
    }

    public function findByUser(int $userId, ?string $date = null, ?string $startDate = null, ?string $endDate = null): array
    {
        $sql = "SELECT a.*, at.name as activity_name, at.category as activity_category, at.met_value
                FROM activities a
                JOIN activity_types at ON a.activity_type_id = at.id
                WHERE a.user_id = :uid";
        $params = [':uid' => $userId];

        if ($date) {
            $sql .= " AND DATE(a.logged_at) = :date";
            $params[':date'] = $date;
        }
        if ($startDate) {
            $sql .= " AND DATE(a.logged_at) >= :start";
            $params[':start'] = $startDate;
        }
        if ($endDate) {
            $sql .= " AND DATE(a.logged_at) <= :end";
            $params[':end'] = $endDate;
        }

        $sql .= " ORDER BY a.logged_at DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return array_map([Activity::class, 'fromArray'], $results);
    }

    public function getDailySummary(int $userId, string $date): array
    {
        $stmt = $this->db->prepare("
            SELECT
                COUNT(*) as total_activities,
                COALESCE(SUM(duration_minutes), 0) as total_duration,
                COALESCE(SUM(distance_km), 0) as total_distance,
                COALESCE(SUM(calories_burned), 0) as total_calories
            FROM activities
            WHERE user_id = :uid AND DATE(logged_at) = :date
        ");
        $stmt->execute([':uid' => $userId, ':date' => $date]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getWeeklySummary(int $userId): array
    {
        $stmt = $this->db->prepare("
            SELECT
                DATE(logged_at) as day,
                COUNT(*) as activities,
                SUM(duration_minutes) as duration,
                SUM(calories_burned) as calories
            FROM activities
            WHERE user_id = :uid AND logged_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(logged_at)
            ORDER BY day DESC
        ");
        $stmt->execute([':uid' => $userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function delete(int $id, int $userId): bool
    {
        $stmt = $this->db->prepare("DELETE FROM activities WHERE id = :id AND user_id = :uid");
        return $stmt->execute([':id' => $id, ':uid' => $userId]);
    }

    public function getActivityTypes(): array
    {
        $stmt = $this->db->query("SELECT * FROM activity_types ORDER BY category, name");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
