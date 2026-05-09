<?php
/**
 * Activity Alarm Controller (R6)
 * Handles activity reminders and notifications
 */
namespace FitTrack\Controllers;

use FitTrack\Models\ActivityAlarm;
use FitTrack\Repositories\AlarmRepository;
use FitTrack\Middleware\AuthMiddleware;
use FitTrack\Utils\Response;

class AlarmController
{
    private AlarmRepository $alarmRepo;

    public function __construct()
    {
        $this->alarmRepo = new AlarmRepository();
    }

    /**
     * POST /api/alarms
     * Create a new alarm/reminder (R6)
     */
    public function create(): void
    {
        $user = AuthMiddleware::requireAuth();
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['title']) || empty($data['scheduled_time']) || empty($data['scheduled_days'])) {
            Response::error('Title, scheduled time, and days are required');
            return;
        }

        $alarm = new ActivityAlarm();
        $alarm->user_id = $user->id;
        $alarm->title = trim($data['title']);
        $alarm->description = $data['description'] ?? null;
        $alarm->alarm_type = $data['alarm_type'] ?? 'activity_reminder';
        $alarm->scheduled_time = $data['scheduled_time'];
        $alarm->scheduled_days = is_array($data['scheduled_days'])
            ? implode(',', $data['scheduled_days'])
            : $data['scheduled_days'];

        $this->alarmRepo->create($alarm);
        Response::created($alarm->toArray(), 'Reminder created');
    }

    /**
     * GET /api/alarms
     * Get all alarms for user
     */
    public function index(): void
    {
        $user = AuthMiddleware::requireAuth();
        $alarms = $this->alarmRepo->findByUser($user->id);

        // Check which alarms should trigger today
        $today = strtolower(date('l'));
        foreach ($alarms as $alarm) {
            $days = explode(',', $alarm->scheduled_days);
            $alarm->should_trigger_today = in_array($today, $days);
        }

        Response::success([
            'alarms' => array_map(fn($a) => $a->toArray(), $alarms),
            'today' => $today,
        ]);
    }

    /**
     * PUT /api/alarms/:id
     * Update an alarm
     */
    public function update(int $id): void
    {
        AuthMiddleware::requireAuth();
        $data = json_decode(file_get_contents('php://input'), true);

        $alarm = $this->alarmRepo->findById($id);
        if (!$alarm) {
            Response::notFound('Alarm not found');
            return;
        }

        if (isset($data['title'])) $alarm->title = trim($data['title']);
        if (isset($data['description'])) $alarm->description = $data['description'];
        if (isset($data['alarm_type'])) $alarm->alarm_type = $data['alarm_type'];
        if (isset($data['scheduled_time'])) $alarm->scheduled_time = $data['scheduled_time'];
        if (isset($data['scheduled_days'])) {
            $alarm->scheduled_days = is_array($data['scheduled_days'])
                ? implode(',', $data['scheduled_days'])
                : $data['scheduled_days'];
        }
        if (isset($data['is_active'])) $alarm->is_active = (bool)$data['is_active'];

        $this->alarmRepo->update($alarm);
        Response::success($alarm->toArray(), 'Reminder updated');
    }

    /**
     * DELETE /api/alarms/:id
     * Delete an alarm
     */
    public function delete(int $id): void
    {
        $user = AuthMiddleware::requireAuth();
        if ($this->alarmRepo->delete($id, $user->id)) {
            Response::success(null, 'Reminder deleted');
        } else {
            Response::notFound('Reminder not found');
        }
    }

    /**
     * GET /api/alarms/today
     * Get today's active alarms
     */
    public function today(): void
    {
        $user = AuthMiddleware::requireAuth();
        $alarms = $this->alarmRepo->findActiveByUser($user->id);
        $today = strtolower(date('l'));

        $todayAlarms = array_filter($alarms, function ($alarm) use ($today) {
            $days = explode(',', $alarm->scheduled_days);
            return in_array($today, $days);
        });

        // Sort by time
        usort($todayAlarms, fn($a, $b) => strcmp($a->scheduled_time, $b->scheduled_time));

        Response::success([
            'alarms' => array_map(fn($a) => $a->toArray(), $todayAlarms),
            'count' => count($todayAlarms),
        ]);
    }
}
