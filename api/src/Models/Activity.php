<?php
namespace FitTrack\Models;

class Activity
{
    public ?int $id = null;
    public int $user_id;
    public int $activity_type_id;
    public int $duration_minutes;
    public ?float $distance_km = null;
    public string $intensity = 'moderate';
    public ?int $calories_burned = null;
    public ?string $notes = null;
    public ?string $logged_at = null;
    public ?string $created_at = null;
    public ?string $activity_name = null;
    public ?string $activity_category = null;
    public ?float $met_value = null;

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'activity_type_id' => $this->activity_type_id,
            'activity_name' => $this->activity_name,
            'activity_category' => $this->activity_category,
            'met_value' => $this->met_value,
            'duration_minutes' => $this->duration_minutes,
            'distance_km' => $this->distance_km,
            'intensity' => $this->intensity,
            'calories_burned' => $this->calories_burned,
            'notes' => $this->notes,
            'logged_at' => $this->logged_at,
            'created_at' => $this->created_at,
        ];
    }

    public static function fromArray(array $data): self
    {
        $a = new self();
        $a->id = $data['id'] ?? null;
        $a->user_id = $data['user_id'] ?? 0;
        $a->activity_type_id = $data['activity_type_id'] ?? 0;
        $a->duration_minutes = $data['duration_minutes'] ?? 0;
        $a->distance_km = isset($data['distance_km']) ? (float)$data['distance_km'] : null;
        $a->intensity = $data['intensity'] ?? 'moderate';
        $a->calories_burned = $data['calories_burned'] ?? null;
        $a->notes = $data['notes'] ?? null;
        $a->logged_at = $data['logged_at'] ?? null;
        $a->created_at = $data['created_at'] ?? null;
        $a->activity_name = $data['activity_name'] ?? null;
        $a->activity_category = $data['activity_category'] ?? null;
        $a->met_value = isset($data['met_value']) ? (float)$data['met_value'] : null;
        return $a;
    }
}
