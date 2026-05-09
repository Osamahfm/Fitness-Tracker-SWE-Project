<?php
/**
 * Meal Recommendation Engine
 * Generates personalized meal suggestions based on user goals and caloric needs
 */
namespace FitTrack\Services;

use FitTrack\Models\User;
use FitTrack\Models\Meal;
use PDO;

class MealRecommendationEngine
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * Get meal recommendations based on user's fitness goal
     */
    public function getRecommendations(User $user, ?string $mealType = null): array
    {
        $sql = "SELECT * FROM meal_recommendations 
                WHERE goal_type = :goal AND is_active = TRUE";
        $params = [':goal' => $user->fitness_goal];

        if ($mealType) {
            $sql .= " AND meal_type = :type";
            $params[':type'] = $mealType;
        }

        $sql .= " ORDER BY meal_type, calories";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $recommendations = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Add personalized adjustments based on user's TDEE
        $tdee = $user->calculateTDEE();
        foreach ($recommendations as &$rec) {
            $rec = $this->personalizeRecommendation($rec, $tdee, $user);
        }

        return $recommendations;
    }

    /**
     * Generate smart meal plan for the day based on remaining calories
     */
    public function generateDailyMealPlan(User $user, int $caloriesBurned, int $caloriesConsumed): array
    {
        $tdee = $user->calculateTDEE();
        $remainingCalories = (int)($tdee + $caloriesBurned - $caloriesConsumed);
        $goal = $user->fitness_goal;

        // Adjust target based on goal
        $targetCalories = match ($goal) {
            'lose_weight' => max(1200, $remainingCalories - 500),
            'gain_muscle' => $remainingCalories + 300,
            'body_recomposition' => $remainingCalories,
            default => $remainingCalories,
        };

        $allRecommendations = $this->getRecommendations($user);
        $plan = [];
        $currentCalories = 0;

        $mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
        foreach ($mealTypes as $type) {
            $typeMeals = array_filter($allRecommendations, fn($r) => $r['meal_type'] === $type);
            if (empty($typeMeals)) continue;

            // Pick best match for remaining calories
            $bestMeal = null;
            $bestDiff = PHP_INT_MAX;
            $typeTarget = $this->getMealTypeCalorieTarget($type, $targetCalories);

            foreach ($typeMeals as $meal) {
                $diff = abs($meal['calories'] - $typeTarget);
                if ($diff < $bestDiff) {
                    $bestDiff = $diff;
                    $bestMeal = $meal;
                }
            }

            if ($bestMeal) {
                $plan[] = $bestMeal;
                $currentCalories += $bestMeal['calories'];
            }
        }

        return [
            'meals' => $plan,
            'total_plan_calories' => $currentCalories,
            'remaining_calories' => max(0, $targetCalories - $currentCalories),
            'target_calories' => $targetCalories,
            'goal_type' => $goal,
        ];
    }

    /**
     * Get macro breakdown recommendations based on goal
     */
    public function getMacroTargets(User $user): array
    {
        return match ($user->fitness_goal) {
            'lose_weight' => [
                'protein_pct' => 35, 'carbs_pct' => 30, 'fats_pct' => 35,
                'description' => 'Higher protein for muscle preservation during caloric deficit'
            ],
            'gain_muscle' => [
                'protein_pct' => 30, 'carbs_pct' => 45, 'fats_pct' => 25,
                'description' => 'Higher carbs for energy and glycogen replenishment'
            ],
            'body_recomposition' => [
                'protein_pct' => 40, 'carbs_pct' => 30, 'fats_pct' => 30,
                'description' => 'High protein for simultaneous muscle gain and fat loss'
            ],
            default => [
                'protein_pct' => 25, 'carbs_pct' => 45, 'fats_pct' => 30,
                'description' => 'Balanced macros for maintenance'
            ],
        };
    }

    private function personalizeRecommendation(array $rec, float $tdee, User $user): array
    {
        $multiplier = 1.0;
        if ($tdee > 2500) $multiplier = 1.2;
        elseif ($tdee < 1800) $multiplier = 0.9;

        if ($multiplier !== 1.0) {
            $rec['adjusted_calories'] = (int)round($rec['calories'] * $multiplier);
            $rec['adjusted_protein'] = round($rec['protein_g'] * $multiplier, 1);
            $rec['adjusted_carbs'] = round($rec['carbs_g'] * $multiplier, 1);
            $rec['adjusted_fats'] = round($rec['fats_g'] * $multiplier, 1);
        }

        return $rec;
    }

    private function getMealTypeCalorieTarget(string $mealType, int $dailyTarget): int
    {
        $distribution = [
            'breakfast' => 0.25,
            'lunch' => 0.30,
            'dinner' => 0.30,
            'snack' => 0.08,
            'pre_workout' => 0.05,
            'post_workout' => 0.10,
        ];
        return (int)round($dailyTarget * ($distribution[$mealType] ?? 0.25));
    }
}
