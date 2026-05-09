<?php
/**
 * Dashboard Controller (R7)
 * Generates daily reports and dashboard data
 */
namespace FitTrack\Controllers;

use FitTrack\Repositories\ActivityRepository;
use FitTrack\Repositories\MealRepository;
use FitTrack\Repositories\GoalRepository;
use FitTrack\Repositories\DailyReportRepository;
use FitTrack\Repositories\AlarmRepository;
use FitTrack\Services\MealRecommendationEngine;
use FitTrack\Config\Database;
use FitTrack\Middleware\AuthMiddleware;
use FitTrack\Utils\Response;

class DashboardController
{
    private ActivityRepository $activityRepo;
    private MealRepository $mealRepo;
    private GoalRepository $goalRepo;
    private DailyReportRepository $reportRepo;
    private AlarmRepository $alarmRepo;
    private MealRecommendationEngine $mealEngine;

    public function __construct()
    {
        $this->activityRepo = new ActivityRepository();
        $this->mealRepo = new MealRepository();
        $this->goalRepo = new GoalRepository();
        $this->reportRepo = new DailyReportRepository();
        $this->alarmRepo = new AlarmRepository();
        $this->mealEngine = new MealRecommendationEngine(Database::getConnection());
    }

    /**
     * GET /api/dashboard
     * Main dashboard data (R7 - Daily Reports)
     */
    public function index(): void
    {
        $user = AuthMiddleware::requireAuth();
        $date = $_GET['date'] ?? date('Y-m-d');

        // Get daily report
        $report = $this->reportRepo->generateReport($user->id, $date);

        // Get recent activities
        $activities = $this->activityRepo->findByUser($user->id, $date);

        // Get meals
        $meals = $this->mealRepo->findByUser($user->id, $date);

        // Get active goals
        $goals = $this->goalRepo->findByUser($user->id, 'active');

        // Get today's alarms
        $alarms = $this->alarmRepo->findActiveByUser($user->id);
        $today = strtolower(date('l'));
        $todayAlarms = array_filter($alarms, fn($a) => in_array($today, explode(',', $a->scheduled_days)));

        // Get meal recommendations
        $recommendations = $this->mealEngine->getRecommendations($user);

        // User stats
        $weeklySummary = $this->activityRepo->getWeeklySummary($user->id);

        Response::success([
            'date' => $date,
            'user' => [
                'name' => $user->full_name,
                'goal' => $user->fitness_goal,
                'daily_target' => $user->daily_calorie_target,
                'tdee' => round($user->calculateTDEE(), 0),
                'bmr' => round($user->calculateBMR(), 0),
            ],
            'daily_report' => $report,
            'activities' => array_map(fn($a) => $a->toArray(), $activities),
            'meals' => array_map(fn($m) => $m->toArray(), $meals),
            'goals' => array_map(fn($g) => $g->toArray(), $goals),
            'today_alarms' => array_map(fn($a) => $a->toArray(), $todayAlarms),
            'recommendations' => array_slice($recommendations, 0, 4),
            'weekly_activity' => $weeklySummary,
        ]);
    }

    /**
     * GET /api/dashboard/weekly
     * Weekly overview
     */
    public function weekly(): void
    {
        $user = AuthMiddleware::requireAuth();
        $weeklyData = $this->activityRepo->getWeeklySummary($user->id);

        // Calculate week totals
        $totals = [
            'total_activities' => 0,
            'total_duration' => 0,
            'total_calories' => 0,
            'active_days' => count($weeklyData),
        ];

        foreach ($weeklyData as $day) {
            $totals['total_activities'] += $day['activities'] ?? 0;
            $totals['total_duration'] += $day['duration'] ?? 0;
            $totals['total_calories'] += $day['calories'] ?? 0;
        }

        Response::success([
            'daily_breakdown' => $weeklyData,
            'week_totals' => $totals,
            'user_goal' => $user->fitness_goal,
        ]);
    }

    /**
     * GET /api/dashboard/stats
     * Overall statistics
     */
    public function stats(): void
    {
        $user = AuthMiddleware::requireAuth();

        // All-time stats
        $stmt = Database::getConnection()->prepare("
            SELECT
                COUNT(*) as total_activities,
                COALESCE(SUM(duration_minutes), 0) as total_duration,
                COALESCE(SUM(distance_km), 0) as total_distance,
                COALESCE(SUM(calories_burned), 0) as total_calories_burned
            FROM activities WHERE user_id = :uid
        ");
        $stmt->execute([':uid' => $user->id]);
        $activityStats = $stmt->fetch(\PDO::FETCH_ASSOC);

        $stmt2 = Database::getConnection()->prepare("
            SELECT
                COUNT(*) as total_meals,
                COALESCE(SUM(calories), 0) as total_calories_consumed
            FROM meals WHERE user_id = :uid
        ");
        $stmt2->execute([':uid' => $user->id]);
        $mealStats = $stmt2->fetch(\PDO::FETCH_ASSOC);

        $stmt3 = Database::getConnection()->prepare("
            SELECT COUNT(*) as total_goals,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_goals
            FROM goals WHERE user_id = :uid
        ");
        $stmt3->execute([':uid' => $user->id]);
        $goalStats = $stmt3->fetch(\PDO::FETCH_ASSOC);

        Response::success([
            'activities' => $activityStats,
            'meals' => $mealStats,
            'goals' => $goalStats,
            'net_calories' => (int)$mealStats['total_calories_consumed'] - (int)$activityStats['total_calories_burned'],
        ]);
    }
}
