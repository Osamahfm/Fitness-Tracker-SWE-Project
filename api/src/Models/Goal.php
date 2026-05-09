<?php
namespace FitTrack\Models;

class Goal
{
    public ?int $id = null;
    public int $user_id;
    public string $title;
    public ?string $description = null;
    public string $goal_type;
    public float $target_value;
    public float $current_value = 0;
    public string $unit;
    public string $start_date;
    public string $end_date;
    public string $status = 'active';
    public bool $reminders_enabled = true;
    public ?string $created_at = null;
    public ?string $updated_at = null;

    public function getProgressPercentage(): float
    {
        if ($this->target_value <= 0) return 0;
        $pct = ($this->current_value / $this->target_value) * 100;
        return min(100, max(0, $pct));
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'title' => $this->title,
            'description' => $this->description,
            'goal_type' => $this->goal_type,
            'target_value' => $this->target_value,
            'current_value' => $this->current_value,
            'unit' => $this->unit,
            'start_date' => $this->start_date,
            'end_date' => $this->end_date,
            'status' => $this->status,
            'reminders_enabled' => $this->reminders_enabled,
            'progress_percentage' => round($this->getProgressPercentage(), 1),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    public static function fromArray(array $data): self
    {
        $g = new self();
        $g->id = $data['id'] ?? null;
        $g->user_id = $data['user_id'] ?? 0;
        $g->title = $data['title'] ?? '';
        $g->description = $data['description'] ?? null;
        $g->goal_type = $data['goal_type'] ?? 'custom';
        $g->target_value = isset($data['target_value']) ? (float)$data['target_value'] : 0;
        $g->current_value = isset($data['current_value']) ? (float)$data['current_value'] : 0;
        $g->unit = $data['unit'] ?? '';
        $g->start_date = $data['start_date'] ?? '';
        $g->end_date = $data['end_date'] ?? '';
        $g->status = $data['status'] ?? 'active';
        $g->reminders_enabled = isset($data['reminders_enabled']) ? (bool)$data['reminders_enabled'] : true;
        $g->created_at = $data['created_at'] ?? null;
        $g->updated_at = $data['updated_at'] ?? null;
        return $g;
    }
}
