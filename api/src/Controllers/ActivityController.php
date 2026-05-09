<?php
/**
 * Activity Controller
 * Handles activity logging (R1) with calorie calculation (R4)
 */
namespace FitTrack\Controllers;

use FitTrack\Models\Activity;
use FitTrack\Repositories\ActivityRepository;
use FitTrack\Repositories\UserRepository;
use FitTrack\Services\Calorie\METBasedStrategy;
use FitTrack\Services\Calorie\CalorieCalculationContext;
use FitTrack\Middleware\AuthMiddleware;
use FitTrack\Utils\Response;

class ActivityController
{
    private ActivityRepository $activityRepo;
    private UserRepository $userRepo;

    public function __construct()
    {
        $this->activityRepo = new ActivityRepository();
        $this->userRepo = new UserRepository();
    }

    /**
     * POST /api/activities
     * Log a new activity (R1) with auto calorie calculation (R4)
     */
    public function create(): void
    {
        $user = AuthMiddleware::requireAuth();
        $data = json_decode(file_get_contents('php://input'), true);

        // Validate required fields
        if (empty($data['activity_type_id']) || empty($data['duration_minutes'])) {
            Response::error('Activity type and duration are required');
            return;
        }

        $activity = new Activity();
        $activity->user_id = $user->id;
        $activity->activity_type_id = (int)$data['activity_type_id'];
        $activity->duration_minutes = (int)$data['duration_minutes'];
        $activity->distance_km = isset($data['distance_km']) ? (float)$data['distance_km'] : null;
        $activity->intensity = $data['intensity'] ?? 'moderate';
        $activity->notes = $data['notes'] ?? null;

        // Get MET value from activity type
        $types = $this->activityRepo->getActivityTypes();
        $metValue = 5.0;
        $activityName = 'Unknown';
        foreach ($types as $type) {
            if ($type['id'] == $activity->activity_type_id) {
                $metValue = (float)$type['met_value'];
                $activityName = $type['name'];
                break;
            }
        }

        // Calculate calories using Strategy Pattern (R4)
        $strategy = new METBasedStrategy($metValue, $activityName);
        $context = new CalorieCalculationContext($strategy);
        $activity->calories_burned = $context->calculate($activity, $user);

        $this->activityRepo->create($activity);

        // Return the created activity with calorie info
        $created = $this->activityRepo->findById($activity->id);
        Response::created([
            'activity' => $created->toArray(),
            'calculation_method' => $context->getStrategyName(),
        ], 'Activity logged successfully');
    }

    /**
     * GET /api/activities
     * Get activities for the authenticated user
     */
    public function index(): void
    {
        $user = AuthMiddleware::requireAuth();
        $date = $_GET['date'] ?? null;
        $start = $_GET['start_date'] ?? null;
        $end = $_GET['end_date'] ?? null;

        $activities = $this->activityRepo->findByUser($user->id, $date, $start, $end);
        Response::success([
            'activities' => array_map(fn($a) => $a->toArray(), $activities),
            'count' => count($activities),
        ]);
    }

    /**
     * GET /api/activities/types
     * Get all available activity types
     */
    public function types(): void
    {
        AuthMiddleware::authenticate();
        $types = $this->activityRepo->getActivityTypes();

        // Group by category
        $grouped = [];
        foreach ($types as $type) {
            $cat = $type['category'];
            if (!isset($grouped[$cat])) $grouped[$cat] = [];
            $grouped[$cat][] = $type;
        }

        Response::success([
            'types' => $types,
            'grouped' => $grouped,
            'categories' => array_keys($grouped),
        ]);
    }

    /**
     * GET /api/activities/summary
     * Get daily/weekly activity summary
     */
    public function summary(): void
    {
        $user = AuthMiddleware::requireAuth();
        $date = $_GET['date'] ?? date('Y-m-d');
        $period = $_GET['period'] ?? 'daily';

        if ($period === 'weekly') {
            $data = $this->activityRepo->getWeeklySummary($user->id);
        } else {
            $data = $this->activityRepo->getDailySummary($user->id, $date);
        }

        Response::success([
            'period' => $period,
            'date' => $date,
            'summary' => $data,
        ]);
    }

    /**
     * DELETE /api/activities/:id
     * Delete an activity
     */
    public function delete(int $id): void
    {
        $user = AuthMiddleware::requireAuth();
        if ($this->activityRepo->delete($id, $user->id)) {
            Response::success(null, 'Activity deleted');
        } else {
            Response::notFound('Activity not found');
        }
    }
}
