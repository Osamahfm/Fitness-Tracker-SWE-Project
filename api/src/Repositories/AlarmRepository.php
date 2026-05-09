<?php
namespace FitTrack\Repositories;

use FitTrack\Config\Database;
use FitTrack\Models\ActivityAlarm;
use PDO;

class AlarmRepository
{
    protected PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function create(ActivityAlarm $alarm): ActivityAlarm
    {
        $stmt = $this->db->prepare("
            INSERT INTO activity_alarms (user_id, title, description, alarm_type, scheduled_time, scheduled_days)
            VALUES (:uid, :title, :desc, :type, :time, :days)
        ");
        $stmt->execute([
            ':uid' => $alarm->user_id,
            ':title' => $alarm->title,
            ':desc' => $alarm->description,
            ':type' => $alarm->alarm_type,
            ':time' => $alarm->scheduled_time,
            ':days' => $alarm->scheduled_days,
        ]);
        $alarm->id = (int) $this->db->lastInsertId();
        return $alarm;
    }

    public function findByUser(int $userId): array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM activity_alarms WHERE user_id = :uid ORDER BY scheduled_time
        ");
        $stmt->execute([':uid' => $userId]);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return array_map([ActivityAlarm::class, 'fromArray'], $results);
    }

    public function findActiveByUser(int $userId): array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM activity_alarms WHERE user_id = :uid AND is_active = TRUE ORDER BY scheduled_time
        ");
        $stmt->execute([':uid' => $userId]);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return array_map([ActivityAlarm::class, 'fromArray'], $results);
    }

    public function findById(int $id): ?ActivityAlarm
    {
        $stmt = $this->db->prepare("SELECT * FROM activity_alarms WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);
        return $data ? ActivityAlarm::fromArray($data) : null;
    }

    public function update(ActivityAlarm $alarm): bool
    {
        $stmt = $this->db->prepare("
            UPDATE activity_alarms SET
                title = :title, description = :desc, alarm_type = :type,
                scheduled_time = :time, scheduled_days = :days, is_active = :active
            WHERE id = :id
        ");
        return $stmt->execute([
            ':id' => $alarm->id,
            ':title' => $alarm->title,
            ':desc' => $alarm->description,
            ':type' => $alarm->alarm_type,
            ':time' => $alarm->scheduled_time,
            ':days' => $alarm->scheduled_days,
            ':active' => $alarm->is_active ? 1 : 0,
        ]);
    }

    public function delete(int $id, int $userId): bool
    {
        $stmt = $this->db->prepare("DELETE FROM activity_alarms WHERE id = :id AND user_id = :uid");
        return $stmt->execute([':id' => $id, ':uid' => $userId]);
    }
}
