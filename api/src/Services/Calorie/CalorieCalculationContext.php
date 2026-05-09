<?php
/**
 * Calorie Calculation Context
 * Uses Strategy Pattern to select the appropriate calculation method
 */
namespace FitTrack\Services\Calorie;

use FitTrack\Models\Activity;
use FitTrack\Models\User;

class CalorieCalculationContext
{
    private CalorieStrategyInterface $strategy;

    public function __construct(CalorieStrategyInterface $strategy)
    {
        $this->strategy = $strategy;
    }

    public function setStrategy(CalorieStrategyInterface $strategy): void
    {
        $this->strategy = $strategy;
    }

    public function calculate(Activity $activity, User $user): int
    {
        return $this->strategy->calculateCalories($activity, $user);
    }

    public function getStrategyName(): string
    {
        return $this->strategy->getName();
    }
}
