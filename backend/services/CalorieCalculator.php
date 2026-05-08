<?php
/**
 * Calorie Calculation Service
 * Implements Strategy pattern for different calorie calculation methods
 */

require_once __DIR__ . '/../models/User.php';

class CalorieCalculator {
    private $userModel;
    
    // MET (Metabolic Equivalent of Task) values for different activities
    private const MET_VALUES = [
        'running' => [
            'low' => 6.0,      // 5 mph (12 min/mile)
            'moderate' => 8.3, // 6 mph (10 min/mile)
            'high' => 9.8,     // 7 mph (8.5 min/mile)
            'very_high' => 11.0 // 8 mph (7.5 min/mile)
        ],
        'walking' => [
            'low' => 2.5,      // 2 mph (30 min/mile)
            'moderate' => 3.5, // 3 mph (20 min/mile)
            'high' => 4.3,     // 3.5 mph (17 min/mile)
            'very_high' => 5.0 // 4 mph (15 min/mile)
        ],
        'cycling' => [
            'low' => 4.0,      // <10 mph (leisure)
            'moderate' => 6.8, // 10-12 mph (light effort)
            'high' => 8.0,     // 12-14 mph (moderate effort)
            'very_high' => 10.0 // 14-16 mph (vigorous effort)
        ],
        'swimming' => [
            'low' => 6.0,      // leisurely
            'moderate' => 8.0, // moderate pace
            'high' => 10.0,    // vigorous pace
            'very_high' => 11.0 // competitive
        ],
        'gym' => [
            'low' => 3.5,      // light weight training
            'moderate' => 5.0, // moderate weight training
            'high' => 6.0,     // vigorous weight training
            'very_high' => 8.0 // circuit training
        ],
        'yoga' => [
            'low' => 2.5,      // Hatha yoga
            'moderate' => 3.0, // Power yoga
            'high' => 4.0,     // Vinyasa yoga
            'very_high' => 4.5 // Bikram yoga
        ],
        'sports' => [
            'low' => 4.0,      // casual sports
            'moderate' => 6.0, // recreational sports
            'high' => 8.0,     // competitive sports
            'very_high' => 10.0 // professional sports
        ],
        'other' => [
            'low' => 3.0,
            'moderate' => 5.0,
            'high' => 7.0,
            'very_high' => 9.0
        ]
    ];

    public function __construct() {
        $this->userModel = new User();
    }

    /**
     * Calculate calories burned for an activity
     * Uses MET formula: Calories = MET × Weight(kg) × Duration(hours)
     */
    public function calculateActivityCalories(int $userId, string $activityType, string $intensity, int $durationMinutes, ?float $distanceKm = null): int {
        $user = $this->userModel->findById($userId);
        if (!$user) {
            throw new Exception("User not found");
        }

        $weightKg = (float) $user['weight_kg'];
        $durationHours = $durationMinutes / 60;

        // Get MET value for this activity and intensity
        $metValue = $this->getMETValue($activityType, $intensity);
        
        // Base calorie calculation using MET
        $calories = round($metValue * $weightKg * $durationHours);

        // Distance-based adjustment for running/walking/cycling
        if ($distanceKm !== null && in_array($activityType, ['running', 'walking', 'cycling'])) {
            $calories = $this->adjustForDistance($calories, $activityType, $distanceKm, $durationMinutes);
        }

        return max(0, $calories);
    }

    /**
     * Get MET value for activity type and intensity
     */
    private function getMETValue(string $activityType, string $intensity): float {
        if (!isset(self::MET_VALUES[$activityType])) {
            $activityType = 'other';
        }
        
        if (!isset(self::MET_VALUES[$activityType][$intensity])) {
            $intensity = 'moderate';
        }

        return self::MET_VALUES[$activityType][$intensity];
    }

    /**
     * Adjust calories based on distance for cardio activities
     */
    private function adjustForDistance(int $baseCalories, string $activityType, float $distanceKm, int $durationMinutes): int {
        $pace = $durationMinutes / $distanceKm; // minutes per km
        
        switch ($activityType) {
            case 'running':
                // Running typically burns ~1 calorie per kg per km
                $user = $this->userModel->findById($this->getCurrentUserId());
                $distanceCalories = round($user['weight_kg'] * $distanceKm);
                return max($baseCalories, $distanceCalories);
                
            case 'walking':
                // Walking burns ~0.5 calories per kg per km
                $user = $this->userModel->findById($this->getCurrentUserId());
                $distanceCalories = round($user['weight_kg'] * $distanceKm * 0.5);
                return max($baseCalories, $distanceCalories);
                
            case 'cycling':
                // Cycling adjustment based on speed
                $speedKmh = ($distanceKm / $durationMinutes) * 60;
                if ($speedKmh > 20) {
                    return round($baseCalories * 1.2); // Fast cycling bonus
                }
                break;
        }
        
        return $baseCalories;
    }

    /**
     * Calculate daily calorie target based on user goals
     */
    public function calculateDailyCalorieTarget(int $userId, string $goalType): int {
        $tdee = $this->userModel->calculateTDEE($userId);
        if ($tdee === null) {
            throw new Exception("Cannot calculate TDEE for user");
        }

        switch ($goalType) {
            case 'weight_loss':
                // 500 calorie deficit for ~1 lb per week loss
                return round($tdee - 500);
                
            case 'weight_gain':
                // 500 calorie surplus for ~1 lb per week gain
                return round($tdee + 500);
                
            case 'muscle_gain':
                // 300 calorie surplus with emphasis on protein
                return round($tdee + 300);
                
            case 'maintenance':
            default:
                return round($tdee);
        }
    }

    /**
     * Calculate macronutrient distribution based on goals
     */
    public function calculateMacroDistribution(int $userId, string $goalType, int $dailyCalories): array {
        $user = $this->userModel->findById($userId);
        $weightKg = (float) $user['weight_kg'];

        switch ($goalType) {
            case 'weight_loss':
                return [
                    'protein' => round($weightKg * 2.2), // High protein for satiety
                    'carbs' => round(($dailyCalories * 0.4) / 4),
                    'fat' => round(($dailyCalories * 0.3) / 9)
                ];
                
            case 'muscle_gain':
                return [
                    'protein' => round($weightKg * 2.5), // Very high protein
                    'carbs' => round(($dailyCalories * 0.5) / 4),
                    'fat' => round(($dailyCalories * 0.25) / 9)
                ];
                
            case 'maintenance':
            default:
                return [
                    'protein' => round($weightKg * 1.8),
                    'carbs' => round(($dailyCalories * 0.45) / 4),
                    'fat' => round(($dailyCalories * 0.3) / 9)
                ];
        }
    }

    /**
     * Estimate calories needed for goal achievement
     */
    public function estimateGoalTimeline(int $userId, string $goalType, ?float $targetWeight = null): array {
        $user = $this->userModel->findById($userId);
        $currentWeight = (float) $user['weight_kg'];
        
        if ($targetWeight === null) {
            return ['weeks' => 0, 'rate' => 0];
        }

        $weightDiff = abs($targetWeight - $currentWeight);
        
        switch ($goalType) {
            case 'weight_loss':
                // Safe weight loss: 0.5-1 kg per week
                $weeklyLoss = 0.75;
                $weeks = ceil($weightDiff / $weeklyLoss);
                return ['weeks' => $weeks, 'rate' => $weeklyLoss];
                
            case 'weight_gain':
                // Healthy weight gain: 0.25-0.5 kg per week
                $weeklyGain = 0.35;
                $weeks = ceil($weightDiff / $weeklyGain);
                return ['weeks' => $weeks, 'rate' => $weeklyGain];
                
            case 'muscle_gain':
                // Muscle gain: 0.1-0.25 kg per week (slower)
                $weeklyGain = 0.15;
                $weeks = ceil($weightDiff / $weeklyGain);
                return ['weeks' => $weeks, 'rate' => $weeklyGain];
                
            default:
                return ['weeks' => 0, 'rate' => 0];
        }
    }

    /**
     * Get current user ID (would be from session in real implementation)
     */
    private function getCurrentUserId(): int {
        // This would typically come from session management
        return 1; // Placeholder
    }
}
