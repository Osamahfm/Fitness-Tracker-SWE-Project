<?php
/**
 * Meal Controller (R3)
 * Handles meal logging and recommendations
 */
namespace FitTrack\Controllers;

use FitTrack\Models\Meal;
use FitTrack\Repositories\MealRepository;
use FitTrack\Services\MealRecommendationEngine;
use FitTrack\Config\Database;
use FitTrack\Middleware\AuthMiddleware;
use FitTrack\Utils\Response;

class MealController
{
    private MealRepository $mealRepo;
    private MealRecommendationEngine $recommendationEngine;

    public function __construct()
    {
        $this->mealRepo = new MealRepository();
        $this->recommendationEngine = new MealRecommendationEngine(Database::getConnection());
    }

    /**
     * POST /api/meals
     * Log a meal
     */
    public function create(): void
    {
        $user = AuthMiddleware::requireAuth();
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['name']) || empty($data['meal_type']) || !isset($data['calories'])) {
            Response::error('Meal name, type, and calories are required');
            return;
        }

        $meal = new Meal();
        $meal->user_id = $user->id;
        $meal->name = trim($data['name']);
        $meal->meal_type = $data['meal_type'];
        $meal->calories = (int)$data['calories'];
        $meal->protein_g = isset($data['protein_g']) ? (float)$data['protein_g'] : 0;
        $meal->carbs_g = isset($data['carbs_g']) ? (float)$data['carbs_g'] : 0;
        $meal->fats_g = isset($data['fats_g']) ? (float)$data['fats_g'] : 0;
        $meal->fiber_g = isset($data['fiber_g']) ? (float)$data['fiber_g'] : 0;
        $meal->notes = $data['notes'] ?? null;

        $this->mealRepo->create($meal);
        Response::created($meal->toArray(), 'Meal logged');
    }

    /**
     * GET /api/meals
     * Get meals for the authenticated user
     */
    public function index(): void
    {
        $user = AuthMiddleware::requireAuth();
        $date = $_GET['date'] ?? date('Y-m-d');
        $meals = $this->mealRepo->findByUser($user->id, $date);
        $summary = $this->mealRepo->getDailySummary($user->id, $date);

        Response::success([
            'meals' => array_map(fn($m) => $m->toArray(), $meals),
            'daily_summary' => $summary,
            'date' => $date,
        ]);
    }

    /**
     * DELETE /api/meals/:id
     * Delete a meal
     */
    public function delete(int $id): void
    {
        $user = AuthMiddleware::requireAuth();
        if ($this->mealRepo->delete($id, $user->id)) {
            Response::success(null, 'Meal deleted');
        } else {
            Response::notFound('Meal not found');
        }
    }

    /**
     * GET /api/meals/recommendations
     * Get meal recommendations based on goal (R3)
     */
    public function recommendations(): void
    {
        $user = AuthMiddleware::requireAuth();
        $mealType = $_GET['type'] ?? null;

        $recommendations = $this->recommendationEngine->getRecommendations($user, $mealType);
        $macroTargets = $this->recommendationEngine->getMacroTargets($user);

        Response::success([
            'recommendations' => $recommendations,
            'macro_targets' => $macroTargets,
            'user_goal' => $user->fitness_goal,
            'tdee' => round($user->calculateTDEE(), 0),
        ]);
    }

    /**
     * GET /api/meals/meal-plan
     * Generate a daily meal plan (R3)
     */
    public function mealPlan(): void
    {
        $user = AuthMiddleware::requireAuth();
        $caloriesBurned = (int)($_GET['calories_burned'] ?? 0);
        $caloriesConsumed = (int)($_GET['calories_consumed'] ?? 0);

        $plan = $this->recommendationEngine->generateDailyMealPlan($user, $caloriesBurned, $caloriesConsumed);

        Response::success([
            'meal_plan' => $plan,
            'macro_targets' => $this->recommendationEngine->getMacroTargets($user),
        ]);
    }

    /**
     * GET /api/meals/types
     * Get meal type options
     */
    public function types(): void
    {
        AuthMiddleware::authenticate();
        Response::success([
            'types' => $this->mealRepo->getMealTypes(),
        ]);
    }
}
