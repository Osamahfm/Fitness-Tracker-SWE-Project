<?php
namespace FitTrack\Models;

class Meal
{
    public ?int $id = null;
    public int $user_id;
    public string $name;
    public string $meal_type;
    public int $calories;
    public float $protein_g = 0;
    public float $carbs_g = 0;
    public float $fats_g = 0;
    public float $fiber_g = 0;
    public ?string $notes = null;
    public ?string $consumed_at = null;
    public ?string $created_at = null;

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'name' => $this->name,
            'meal_type' => $this->meal_type,
            'calories' => $this->calories,
            'protein_g' => $this->protein_g,
            'carbs_g' => $this->carbs_g,
            'fats_g' => $this->fats_g,
            'fiber_g' => $this->fiber_g,
            'notes' => $this->notes,
            'consumed_at' => $this->consumed_at,
            'created_at' => $this->created_at,
        ];
    }

    public static function fromArray(array $data): self
    {
        $m = new self();
        $m->id = $data['id'] ?? null;
        $m->user_id = $data['user_id'] ?? 0;
        $m->name = $data['name'] ?? '';
        $m->meal_type = $data['meal_type'] ?? 'snack';
        $m->calories = $data['calories'] ?? 0;
        $m->protein_g = isset($data['protein_g']) ? (float)$data['protein_g'] : 0;
        $m->carbs_g = isset($data['carbs_g']) ? (float)$data['carbs_g'] : 0;
        $m->fats_g = isset($data['fats_g']) ? (float)$data['fats_g'] : 0;
        $m->fiber_g = isset($data['fiber_g']) ? (float)$data['fiber_g'] : 0;
        $m->notes = $data['notes'] ?? null;
        $m->consumed_at = $data['consumed_at'] ?? null;
        $m->created_at = $data['created_at'] ?? null;
        return $m;
    }
}
