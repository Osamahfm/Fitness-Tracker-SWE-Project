<?php
/**
 * User Model
 * Represents a user entity with all profile attributes
 */
namespace FitTrack\Models;

class User
{
    public ?int $id = null;
    public string $full_name;
    public string $email;
    public ?string $password_hash = null;
    public ?int $age = null;
    public ?float $weight_kg = null;
    public ?float $height_cm = null;
    public ?string $gender = null;
    public string $activity_level = 'moderately_active';
    public string $fitness_goal = 'maintain_weight';
    public int $daily_calorie_target = 2000;
    public ?string $created_at = null;
    public ?string $updated_at = null;

    // Computed property: BMR (Basal Metabolic Rate) using Mifflin-St Jeor
    public function calculateBMR(): float
    {
        if (!$this->weight_kg || !$this->height_cm || !$this->age || !$this->gender) {
            return 0;
        }

        $bmr = (10 * $this->weight_kg) + (6.25 * $this->height_cm) - (5 * $this->age);
        $bmr += ($this->gender === 'male') ? 5 : -161;
        return $bmr;
    }

    // Computed property: TDEE (Total Daily Energy Expenditure)
    public function calculateTDEE(): float
    {
        $bmr = $this->calculateBMR();
        $multipliers = [
            'sedentary' => 1.2,
            'lightly_active' => 1.375,
            'moderately_active' => 1.55,
            'very_active' => 1.725,
            'extra_active' => 1.9
        ];
        return $bmr * ($multipliers[$this->activity_level] ?? 1.55);
    }

    public function toArray(bool $includeSensitive = false): array
    {
        $data = [
            'id' => $this->id,
            'full_name' => $this->full_name,
            'email' => $this->email,
            'age' => $this->age,
            'weight_kg' => $this->weight_kg,
            'height_cm' => $this->height_cm,
            'gender' => $this->gender,
            'activity_level' => $this->activity_level,
            'fitness_goal' => $this->fitness_goal,
            'daily_calorie_target' => $this->daily_calorie_target,
            'bmr' => round($this->calculateBMR(), 2),
            'tdee' => round($this->calculateTDEE(), 2),
            'created_at' => $this->created_at,
        ];

        if ($includeSensitive) {
            $data['updated_at'] = $this->updated_at;
        }

        return $data;
    }

    public static function fromArray(array $data): self
    {
        $user = new self();
        $user->id = $data['id'] ?? null;
        $user->full_name = $data['full_name'] ?? '';
        $user->email = $data['email'] ?? '';
        $user->password_hash = $data['password_hash'] ?? null;
        $user->age = $data['age'] ?? null;
        $user->weight_kg = isset($data['weight_kg']) ? (float)$data['weight_kg'] : null;
        $user->height_cm = isset($data['height_cm']) ? (float)$data['height_cm'] : null;
        $user->gender = $data['gender'] ?? null;
        $user->activity_level = $data['activity_level'] ?? 'moderately_active';
        $user->fitness_goal = $data['fitness_goal'] ?? 'maintain_weight';
        $user->daily_calorie_target = $data['daily_calorie_target'] ?? 2000;
        $user->created_at = $data['created_at'] ?? null;
        $user->updated_at = $data['updated_at'] ?? null;
        return $user;
    }
}
