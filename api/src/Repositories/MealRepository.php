<?php
namespace FitTrack\Repositories;

use FitTrack\Config\Database;
use FitTrack\Models\Meal;
use PDO;

class MealRepository
{
    protected PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function create(Meal $meal): Meal
    {
        $stmt = $this->db->prepare("
            INSERT INTO meals (user_id, name, meal_type, calories, protein_g, carbs_g, fats_g, fiber_g, notes)
            VALUES (:uid, :name, :type, :cal, :prot, :carbs, :fats, :fiber, :notes)
        ");
        $stmt->execute([
            ':uid' => $meal->user_id,
            ':name' => $meal->name,
            ':type' => $meal->meal_type,
            ':cal' => $meal->calories,
            ':prot' => $meal->protein_g,
            ':carbs' => $meal->carbs_g,
            ':fats' => $meal->fats_g,
            ':fiber' => $meal->fiber_g,
            ':notes' => $meal->notes,
        ]);
        $meal->id = (int) $this->db->lastInsertId();
        return $meal;
    }

    public function findByUser(int $userId, ?string $date = null): array
    {
        $sql = "SELECT * FROM meals WHERE user_id = :uid";
        $params = [':uid' => $userId];

        if ($date) {
            $sql .= " AND DATE(consumed_at) = :date";
            $params[':date'] = $date;
        }
        $sql .= " ORDER BY consumed_at DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return array_map([Meal::class, 'fromArray'], $results);
    }

    public function getDailySummary(int $userId, string $date): array
    {
        $stmt = $this->db->prepare("
            SELECT
                COUNT(*) as total_meals,
                COALESCE(SUM(calories), 0) as total_calories,
                COALESCE(SUM(protein_g), 0) as total_protein,
                COALESCE(SUM(carbs_g), 0) as total_carbs,
                COALESCE(SUM(fats_g), 0) as total_fats,
                COALESCE(SUM(fiber_g), 0) as total_fiber
            FROM meals
            WHERE user_id = :uid AND DATE(consumed_at) = :date
        ");
        $stmt->execute([':uid' => $userId, ':date' => $date]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function delete(int $id, int $userId): bool
    {
        $stmt = $this->db->prepare("DELETE FROM meals WHERE id = :id AND user_id = :uid");
        return $stmt->execute([':id' => $id, ':uid' => $userId]);
    }

    public function getMealTypes(): array
    {
        return [
            ['value' => 'breakfast', 'label' => 'Breakfast', 'icon' => 'sunrise'],
            ['value' => 'lunch', 'label' => 'Lunch', 'icon' => 'sun'],
            ['value' => 'dinner', 'label' => 'Dinner', 'icon' => 'moon'],
            ['value' => 'snack', 'label' => 'Snack', 'icon' => 'cookie'],
            ['value' => 'pre_workout', 'label' => 'Pre-Workout', 'icon' => 'zap'],
            ['value' => 'post_workout', 'label' => 'Post-Workout', 'icon' => 'flame'],
        ];
    }
}
