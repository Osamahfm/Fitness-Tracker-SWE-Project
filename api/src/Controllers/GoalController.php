<?php
/**
 * Goal Controller (R2)
 * Handles goal tracking and recommendations
 */
namespace FitTrack\Controllers;

use FitTrack\Models\Goal;
use FitTrack\Repositories\GoalRepository;
use FitTrack\Repositories\ActivityRepository;
use FitTrack\Middleware\AuthMiddleware;
use FitTrack\Utils\Response;

class GoalController
{
    private GoalRepository $goalRepo;
    private ActivityRepository $activityRepo;

    public function __construct()
    {
        $this->goalRepo = new GoalRepository();
        $this->activityRepo = new ActivityRepository();
    }

    /**
     * POST /api/goals
     * Create a new fitness goal (R2)
     */
    public function create(): void
    {
        $user = AuthMiddleware::requireAuth();
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['title']) || empty($data['goal_type']) || !isset($data['target_value']) || empty($data['unit'])) {
            Response::error('Title, goal type, target value, and unit are required');
            return;
        }

        $goal = new Goal();
        $goal->user_id = $user->id;
        $goal->title = trim($data['title']);
        $goal->description = $data['description'] ?? null;
        $goal->goal_type = $data['goal_type'];
        $goal->target_value = (float)$data['target_value'];
        $goal->unit = $data['unit'];
        $goal->start_date = $data['start_date'] ?? date('Y-m-d');
        $goal->end_date = $data['end_date'] ?? date('Y-m-d', strtotime('+30 days'));
        $goal->reminders_enabled = $data['reminders_enabled'] ?? true;

        $this->goalRepo->create($goal);
        Response::created($goal->toArray(), 'Goal created');
    }

    /**
     * GET /api/goals
     * Get all goals for user
     */
    public function index(): void
    {
        $user = AuthMiddleware::requireAuth();
        $status = $_GET['status'] ?? null;
        $goals = $this->goalRepo->findByUser($user->id, $status);

        Response::success([
            'goals' => array_map(fn($g) => $g->toArray(), $goals),
            'active_count' => count(array_filter($goals, fn($g) => $g->status === 'active')),
        ]);
    }

    /**
     * PUT /api/goals/:id/progress
     * Update goal progress
     */
    public function updateProgress(int $id): void
    {
        $user = AuthMiddleware::requireAuth();
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['current_value'])) {
            Response::error('Current value is required');
            return;
        }

        $goal = $this->goalRepo->findById($id);
        if (!$goal || $goal->user_id !== $user->id) {
            Response::notFound('Goal not found');
            return;
        }

        $this->goalRepo->updateProgress($id, (float)$data['current_value']);

        // Auto-complete if target reached
        if ((float)$data['current_value'] >= $goal->target_value) {
            $this->goalRepo->updateStatus($id, 'completed');
            Response::success(null, 'Goal completed! Congratulations!');
            return;
        }

        Response::success(null, 'Progress updated');
    }

    /**
     * PUT /api/goals/:id/status
     * Update goal status
     */
    public function updateStatus(int $id): void
    {
        $user = AuthMiddleware::requireAuth();
        $data = json_decode(file_get_contents('php://input'), true);

        $goal = $this->goalRepo->findById($id);
        if (!$goal || $goal->user_id !== $user->id) {
            Response::notFound('Goal not found');
            return;
        }

        $this->goalRepo->updateStatus($id, $data['status'] ?? 'paused');
        Response::success(null, 'Goal status updated');
    }

    /**
     * DELETE /api/goals/:id
     * Delete a goal
     */
    public function delete(int $id): void
    {
        $user = AuthMiddleware::requireAuth();
        if ($this->goalRepo->delete($id, $user->id)) {
            Response::success(null, 'Goal deleted');
        } else {
            Response::notFound('Goal not found');
        }
    }

    /**
     * GET /api/goals/recommendations
     * Get system-generated goal recommendations (R2)
     */
    public function recommendations(): void
    {
        $user = AuthMiddleware::requireAuth();

        // Analyze user's activity patterns to recommend goals
        $weeklyData = $this->activityRepo->getWeeklySummary($user->id);
        $recommendations = [];

        $avgDuration = 0;
        $avgCalories = 0;
        $avgDistance = 0;
        $dayCount = count($weeklyData);

        if ($dayCount > 0) {
            foreach ($weeklyData as $day) {
                $avgDuration += $day['duration'] ?? 0;
                $avgCalories += $day['calories'] ?? 0;
            }
            $avgDuration = round($avgDuration / $dayCount);
            $avgCalories = round($avgCalories / $dayCount);
        }

        $fitnessGoal = $user->fitness_goal;

        // Generate contextual recommendations
        if ($avgDuration < 30) {
            $recommendations[] = [
                'type' => 'weekly_duration',
                'title' => 'Build Consistency',
                'description' => 'You average ' . $avgDuration . ' min/day. Aim for 150 min/week.',
                'target_value' => 150,
                'unit' => 'minutes',
                'suggested_duration_days' => 7,
                'category' => 'consistency',
            ];
        }

        if ($fitnessGoal === 'lose_weight') {
            $recommendations[] = [
                'type' => 'weekly_calories',
                'title' => 'Burn 2000 Calories This Week',
                'description' => 'Create a caloric deficit through activity.',
                'target_value' => 2000,
                'unit' => 'kcal',
                'suggested_duration_days' => 7,
                'category' => 'weight_loss',
            ];
        } elseif ($fitnessGoal === 'gain_muscle') {
            $recommendations[] = [
                'type' => 'weekly_duration',
                'title' => 'Strength Training 4x This Week',
                'description' => 'Focus on resistance training for hypertrophy.',
                'target_value' => 240,
                'unit' => 'minutes',
                'suggested_duration_days' => 7,
                'category' => 'muscle_gain',
            ];
        }

        // Distance goal for runners/cyclists
        $recommendations[] = [
            'type' => 'weekly_distance',
            'title' => 'Cover 15km This Week',
            'description' => 'Build endurance with consistent distance goals.',
            'target_value' => 15,
            'unit' => 'km',
            'suggested_duration_days' => 7,
            'category' => 'endurance',
        ];

        Response::success([
            'recommendations' => $recommendations,
            'user_patterns' => [
                'avg_daily_duration' => $avgDuration,
                'avg_daily_calories' => $avgCalories,
                'active_days' => $dayCount,
            ],
            'user_goal' => $fitnessGoal,
        ]);
    }
}
