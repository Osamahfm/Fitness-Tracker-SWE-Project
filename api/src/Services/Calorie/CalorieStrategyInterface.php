<?php
/**
 * Strategy Pattern Interface for Calorie Calculation
 * Allows different calculation methods per activity type
 */
namespace FitTrack\Services\Calorie;

use FitTrack\Models\Activity;
use FitTrack\Models\User;

interface CalorieStrategyInterface
{
    /**
     * Calculate calories burned for an activity
     * @param Activity $activity The activity to calculate for
     * @param User $user The user performing the activity
     * @return int Calories burned (rounded)
     */
    public function calculateCalories(Activity $activity, User $user): int;

    /**
     * Get the strategy name/identifier
     */
    public function getName(): string;
}
