<?php
namespace FitTrack\Models;

class ActivityAlarm
{
    public ?int $id = null;
    public int $user_id;
    public string $title;
    public ?string $description = null;
    public string $alarm_type = 'activity_reminder';
    public string $scheduled_time;
    public string $scheduled_days = 'monday,tuesday,wednesday,thursday,friday';
    public bool $is_active = true;
    public ?string $last_triggered = null;
    public ?string $created_at = null;
    public ?string $updated_at = null;

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'title' => $this->title,
            'description' => $this->description,
            'alarm_type' => $this->alarm_type,
            'scheduled_time' => $this->scheduled_time,
            'scheduled_days' => $this->scheduled_days,
            'is_active' => $this->is_active,
            'last_triggered' => $this->last_triggered,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    public static function fromArray(array $data): self
    {
        $a = new self();
        $a->id = $data['id'] ?? null;
        $a->user_id = $data['user_id'] ?? 0;
        $a->title = $data['title'] ?? '';
        $a->description = $data['description'] ?? null;
        $a->alarm_type = $data['alarm_type'] ?? 'activity_reminder';
        $a->scheduled_time = $data['scheduled_time'] ?? '08:00:00';
        $a->scheduled_days = $data['scheduled_days'] ?? 'monday,tuesday,wednesday,thursday,friday';
        $a->is_active = isset($data['is_active']) ? (bool)$data['is_active'] : true;
        $a->last_triggered = $data['last_triggered'] ?? null;
        $a->created_at = $data['created_at'] ?? null;
        $a->updated_at = $data['updated_at'] ?? null;
        return $a;
    }
}
