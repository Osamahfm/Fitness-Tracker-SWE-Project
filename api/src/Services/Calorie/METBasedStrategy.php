<?php
/**
 * MET-Based Calorie Calculation Strategy
 * Uses Metabolic Equivalent of Task values
 * Formula: Calories = MET * Weight(kg) * Duration(hours) * intensity_multiplier
 */
namespace FitTrack\Services\Calorie;

use FitTrack\Models\Activity;
use FitTrack\Models\User;

class METBasedStrategy implements CalorieStrategyInterface
{
    private float $metValue;
    private string $activityName;

    // Intensity multipliers relative to base MET
    private const INTENSITY_MULTIPLIERS = [
        'low' => 0.75,
        'moderate' => 1.0,
        'high' => 1.25,
        'very_high' => 1.55,
    ];

    public function __construct(float $metValue, string $activityName = 'Unknown')
    {
        $this->metValue = $metValue;
        $this->activityName = $activityName;
    }

    public function calculateCalories(Activity $activity, User $user): int
    {
        $weightKg = $user->weight_kg ?? 70; // Default to 70kg if not set
        $durationHours = $activity->duration_minutes / 60;
        $intensityMult = self::INTENSITY_MULTIPLIERS[$activity->intensity] ?? 1.0;

        // Base formula: MET * weight * hours
        $calories = $this->metValue * $weightKg * $durationHours * $intensityMult;

        // Distance bonus: if distance is logged and activity is distance-based,
        // we validate calories against distance-based estimates
        if ($activity->distance_km && $activity->distance_km > 0) {
            $distanceCalories = $this->calculateDistanceBasedCalories($activity, $user);
            if ($distanceCalories > 0) {
                // Blend MET-based and distance-based (70% MET, 30% distance)
                $calories = ($calories * 0.7) + ($distanceCalories * 0.3);
            }
        }

        return (int) round(max(0, $calories));
    }

    private function calculateDistanceBasedCalories(Activity $activity, User $user): float
    {
        $weightKg = $user->weight_kg ?? 70;
        $distanceKm = $activity->distance_km ?? 0;

        // Calories per km based on activity and weight
        $calPerKm = match (strtolower($this->activityName)) {
            'running', 'jogging' => $weightKg * 1.036,
            'walking' => $weightKg * 0.67,
            'cycling' => $weightKg * 0.5,
            'swimming' => $weightKg * 1.8,
            'hiking' => $weightKg * 0.85,
            default => 0,
        };

        return $calPerKm * $distanceKm;
    }

    public function getName(): string
    {
        return "MET-Based ({$this->activityName})";
    }
}
