<?php
namespace FitTrack\Repositories;

use FitTrack\Config\Database;
use PDO;

class DailyReportRepository
{
    protected PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function getOrCreate(int $userId, string $date): array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM daily_reports WHERE user_id = :uid AND report_date = :date
        ");
        $stmt->execute([':uid' => $userId, ':date' => $date]);
        $report = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($report) {
            return $report;
        }

        // Generate fresh report
        return $this->generateReport($userId, $date);
    }

    public function generateReport(int $userId, string $date): array
    {
        // Get activity summary
        $actStmt = $this->db->prepare("
            SELECT
                COUNT(*) as total_activities,
                COALESCE(SUM(duration_minutes), 0) as total_duration_min,
                COALESCE(SUM(distance_km), 0) as total_distance_km,
                COALESCE(SUM(calories_burned), 0) as total_calories_burned
            FROM activities WHERE user_id = :uid AND DATE(logged_at) = :date
        ");
        $actStmt->execute([':uid' => $userId, ':date' => $date]);
        $activity = $actStmt->fetch(PDO::FETCH_ASSOC);

        // Get meal summary
        $mealStmt = $this->db->prepare("
            SELECT
                COUNT(*) as total_meals_logged,
                COALESCE(SUM(calories), 0) as total_calories_consumed,
                COALESCE(SUM(protein_g), 0) as protein_g,
                COALESCE(SUM(carbs_g), 0) as carbs_g,
                COALESCE(SUM(fats_g), 0) as fats_g
            FROM meals WHERE user_id = :uid AND DATE(consumed_at) = :date
        ");
        $mealStmt->execute([':uid' => $userId, ':date' => $date]);
        $meals = $mealStmt->fetch(PDO::FETCH_ASSOC);

        $caloriesBurned = (int)$activity['total_calories_burned'];
        $caloriesConsumed = (int)$meals['total_calories_consumed'];
        $netCalories = $caloriesConsumed - $caloriesBurned;

        // Get goal progress
        $goalStmt = $this->db->prepare("
            SELECT g.*, 
                CASE g.goal_type
                    WHEN 'weekly_distance' THEN (SELECT COALESCE(SUM(distance_km), 0) FROM activities WHERE user_id = :uid AND logged_at >= g.start_date)
                    WHEN 'weekly_duration' THEN (SELECT COALESCE(SUM(duration_minutes), 0) FROM activities WHERE user_id = :uid AND logged_at >= g.start_date)
                    WHEN 'weekly_calories' THEN (SELECT COALESCE(SUM(calories_burned), 0) FROM activities WHERE user_id = :uid AND logged_at >= g.start_date)
                    ELSE g.current_value
                END as computed_current
            FROM goals g
            WHERE g.user_id = :uid AND g.status = 'active' AND :date BETWEEN g.start_date AND g.end_date
        ");
        $goalStmt->execute([':uid' => $userId, ':date' => $date]);
        $goals = $goalStmt->fetchAll(PDO::FETCH_ASSOC);

        $goalsProgress = [];
        foreach ($goals as $goal) {
            $current = (float)($goal['computed_current'] ?? $goal['current_value']);
            $target = (float)$goal['target_value'];
            $pct = $target > 0 ? round(($current / $target) * 100, 1) : 0;
            $goalsProgress[] = [
                'goal_id' => $goal['id'],
                'title' => $goal['title'],
                'goal_type' => $goal['goal_type'],
                'current' => $current,
                'target' => $target,
                'unit' => $goal['unit'],
                'percentage' => min(100, $pct),
            ];
        }

        // Generate summary text
        $summaryText = $this->generateSummaryText($activity, $meals, $netCalories);

        // Upsert report
        $this->db->prepare("
            INSERT INTO daily_reports
                (user_id, report_date, total_activities, total_duration_min, total_distance_km,
                 total_calories_burned, total_meals_logged, total_calories_consumed, net_calories,
                 protein_g, carbs_g, fats_g, goals_progress, summary_text)
            VALUES
                (:uid, :date, :ta, :td, :tdis, :tcb, :tml, :tcc, :nc, :prot, :carbs, :fats, :goals, :summary)
            ON DUPLICATE KEY UPDATE
                total_activities = VALUES(total_activities),
                total_duration_min = VALUES(total_duration_min),
                total_distance_km = VALUES(total_distance_km),
                total_calories_burned = VALUES(total_calories_burned),
                total_meals_logged = VALUES(total_meals_logged),
                total_calories_consumed = VALUES(total_calories_consumed),
                net_calories = VALUES(net_calories),
                protein_g = VALUES(protein_g),
                carbs_g = VALUES(carbs_g),
                fats_g = VALUES(fats_g),
                goals_progress = VALUES(goals_progress),
                summary_text = VALUES(summary_text),
                updated_at = NOW()
        ")->execute([
            ':uid' => $userId,
            ':date' => $date,
            ':ta' => (int)$activity['total_activities'],
            ':td' => (int)$activity['total_duration_min'],
            ':tdis' => (float)$activity['total_distance_km'],
            ':tcb' => $caloriesBurned,
            ':tml' => (int)$meals['total_meals_logged'],
            ':tcc' => $caloriesConsumed,
            ':nc' => $netCalories,
            ':prot' => (float)$meals['protein_g'],
            ':carbs' => (float)$meals['carbs_g'],
            ':fats' => (float)$meals['fats_g'],
            ':goals' => json_encode($goalsProgress),
            ':summary' => $summaryText,
        ]);

        return [
            'date' => $date,
            'activities' => [
                'total_count' => (int)$activity['total_activities'],
                'total_duration_min' => (int)$activity['total_duration_min'],
                'total_distance_km' => round((float)$activity['total_distance_km'], 2),
                'total_calories_burned' => $caloriesBurned,
            ],
            'meals' => [
                'total_count' => (int)$meals['total_meals_logged'],
                'total_calories_consumed' => $caloriesConsumed,
                'protein_g' => round((float)$meals['protein_g'], 1),
                'carbs_g' => round((float)$meals['carbs_g'], 1),
                'fats_g' => round((float)$meals['fats_g'], 1),
            ],
            'net_calories' => $netCalories,
            'goals_progress' => $goalsProgress,
            'summary_text' => $summaryText,
        ];
    }

    private function generateSummaryText(array $activity, array $meals, int $netCalories): string
    {
        $parts = [];
        $actCount = (int)$activity['total_activities'];
        $calBurned = (int)$activity['total_calories_burned'];
        $calConsumed = (int)$meals['total_calories_consumed'];

        if ($actCount === 0) {
            $parts[] = "No activities logged today.";
        } else {
            $parts[] = "You completed {$actCount} activity" . ($actCount > 1 ? "ies" : "y") . " and burned {$calBurned} calories.";
        }

        if ($calConsumed === 0) {
            $parts[] = "No meals logged today.";
        } else {
            $parts[] = "You consumed {$calConsumed} calories from your meals.";
        }

        if ($netCalories > 0) {
            $parts[] = "You are in a caloric surplus of {$netCalories} kcal.";
        } elseif ($netCalories < 0) {
            $surplus = abs($netCalories);
            $parts[] = "You are in a caloric deficit of {$surplus} kcal.";
        } else {
            $parts[] = "Your calories are perfectly balanced today.";
        }

        return implode(" ", $parts);
    }
}
