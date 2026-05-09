<?php
namespace FitTrack\Repositories;

use FitTrack\Config\Database;
use FitTrack\Models\Goal;
use PDO;

class GoalRepository
{
    protected PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function create(Goal $goal): Goal
    {
        $stmt = $this->db->prepare("
            INSERT INTO goals (user_id, title, description, goal_type, target_value, unit, start_date, end_date, reminders_enabled)
            VALUES (:uid, :title, :desc, :type, :target, :unit, :start, :end, :remind)
        ");
        $stmt->execute([
            ':uid' => $goal->user_id,
            ':title' => $goal->title,
            ':desc' => $goal->description,
            ':type' => $goal->goal_type,
            ':target' => $goal->target_value,
            ':unit' => $goal->unit,
            ':start' => $goal->start_date,
            ':end' => $goal->end_date,
            ':remind' => $goal->reminders_enabled ? 1 : 0,
        ]);
        $goal->id = (int) $this->db->lastInsertId();
        return $goal;
    }

    public function findByUser(int $userId, ?string $status = null): array
    {
        $sql = "SELECT * FROM goals WHERE user_id = :uid";
        $params = [':uid' => $userId];
        if ($status) {
            $sql .= " AND status = :status";
            $params[':status'] = $status;
        }
        $sql .= " ORDER BY created_at DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return array_map([Goal::class, 'fromArray'], $results);
    }

    public function findById(int $id): ?Goal
    {
        $stmt = $this->db->prepare("SELECT * FROM goals WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);
        return $data ? Goal::fromArray($data) : null;
    }

    public function updateProgress(int $goalId, float $newValue): bool
    {
        $stmt = $this->db->prepare("UPDATE goals SET current_value = :val WHERE id = :id");
        return $stmt->execute([':val' => $newValue, ':id' => $goalId]);
    }

    public function updateStatus(int $goalId, string $status): bool
    {
        $stmt = $this->db->prepare("UPDATE goals SET status = :status WHERE id = :id");
        return $stmt->execute([':status' => $status, ':id' => $goalId]);
    }

    public function delete(int $id, int $userId): bool
    {
        $stmt = $this->db->prepare("DELETE FROM goals WHERE id = :id AND user_id = :uid");
        return $stmt->execute([':id' => $id, ':uid' => $userId]);
    }
}
