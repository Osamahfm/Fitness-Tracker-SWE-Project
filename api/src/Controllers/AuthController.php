<?php
/**
 * Authentication Controller
 * Handles user registration, login, and profile management
 */
namespace FitTrack\Controllers;

use FitTrack\Models\User;
use FitTrack\Repositories\UserRepository;
use FitTrack\Utils\JWT;
use FitTrack\Utils\Response;
use FitTrack\Middleware\AuthMiddleware;

class AuthController
{
    private UserRepository $userRepo;

    public function __construct()
    {
        $this->userRepo = new UserRepository();
    }

    /**
     * POST /api/auth/register
     * Register a new user account (R5)
     */
    public function register(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);

        // Validation (R10 - User Validation)
        $errors = $this->validateRegistration($data);
        if (!empty($errors)) {
            Response::error('Validation failed', 422);
            return;
        }

        // Check if email already exists
        if ($this->userRepo->findByEmail($data['email'])) {
            Response::error('Email already registered', 409);
            return;
        }

        // Create user
        $user = new User();
        $user->full_name = trim($data['full_name']);
        $user->email = strtolower(trim($data['email']));
        $user->password_hash = password_hash($data['password'], PASSWORD_BCRYPT);
        $user->age = $data['age'] ?? null;
        $user->weight_kg = $data['weight_kg'] ?? null;
        $user->height_cm = $data['height_cm'] ?? null;
        $user->gender = $data['gender'] ?? null;
        $user->activity_level = $data['activity_level'] ?? 'moderately_active';
        $user->fitness_goal = $data['fitness_goal'] ?? 'maintain_weight';

        // Auto-calculate daily calorie target based on TDEE and goal
        if ($user->weight_kg && $user->height_cm && $user->age && $user->gender) {
            $tdee = $user->calculateTDEE();
            $user->daily_calorie_target = match ($user->fitness_goal) {
                'lose_weight' => max(1200, (int)($tdee - 500)),
                'gain_muscle' => (int)($tdee + 300),
                'body_recomposition' => (int)$tdee,
                default => (int)$tdee,
            };
        }

        $this->userRepo->create($user);

        // Generate token
        $token = JWT::generate(['user_id' => $user->id, 'email' => $user->email]);

        Response::created([
            'user' => $user->toArray(),
            'token' => $token,
        ], 'Registration successful');
    }

    /**
     * POST /api/auth/login
     * Authenticate user and return JWT token (R10)
     */
    public function login(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['email']) || empty($data['password'])) {
            Response::error('Email and password are required');
            return;
        }

        $user = $this->userRepo->findByEmail(strtolower(trim($data['email'])));

        if (!$user || !password_verify($data['password'], $user->password_hash)) {
            Response::unauthorized('Invalid email or password');
            return;
        }

        $token = JWT::generate(['user_id' => $user->id, 'email' => $user->email]);

        Response::success([
            'user' => $user->toArray(),
            'token' => $token,
        ], 'Login successful');
    }

    /**
     * GET /api/auth/me
     * Get current authenticated user profile
     */
    public function me(): void
    {
        $user = AuthMiddleware::requireAuth();
        Response::success($user->toArray());
    }

    /**
     * PUT /api/auth/profile
     * Update user profile
     */
    public function updateProfile(): void
    {
        $user = AuthMiddleware::requireAuth();
        $data = json_decode(file_get_contents('php://input'), true);

        if (isset($data['full_name'])) $user->full_name = trim($data['full_name']);
        if (isset($data['age'])) $user->age = (int)$data['age'];
        if (isset($data['weight_kg'])) $user->weight_kg = (float)$data['weight_kg'];
        if (isset($data['height_cm'])) $user->height_cm = (float)$data['height_cm'];
        if (isset($data['gender'])) $user->gender = $data['gender'];
        if (isset($data['activity_level'])) $user->activity_level = $data['activity_level'];
        if (isset($data['fitness_goal'])) $user->fitness_goal = $data['fitness_goal'];

        // Recalculate calorie target
        if ($user->weight_kg && $user->height_cm && $user->age && $user->gender) {
            $tdee = $user->calculateTDEE();
            $user->daily_calorie_target = match ($user->fitness_goal) {
                'lose_weight' => max(1200, (int)($tdee - 500)),
                'gain_muscle' => (int)($tdee + 300),
                'body_recomposition' => (int)$tdee,
                default => (int)$tdee,
            };
        }

        $this->userRepo->update($user);
        Response::success($user->toArray(), 'Profile updated');
    }

    /**
     * POST /api/auth/password
     * Change password
     */
    public function changePassword(): void
    {
        $user = AuthMiddleware::requireAuth();
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['current_password']) || empty($data['new_password'])) {
            Response::error('Current password and new password are required');
            return;
        }

        if (!password_verify($data['current_password'], $user->password_hash)) {
            Response::error('Current password is incorrect');
            return;
        }

        if (strlen($data['new_password']) < 8) {
            Response::error('New password must be at least 8 characters');
            return;
        }

        $this->userRepo->updatePassword($user->id, password_hash($data['new_password'], PASSWORD_BCRYPT));
        Response::success(null, 'Password updated successfully');
    }

    private function validateRegistration(array $data): array
    {
        $errors = [];

        if (empty($data['full_name']) || strlen(trim($data['full_name'])) < 2) {
            $errors[] = 'Full name must be at least 2 characters';
        }

        if (empty($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'Valid email is required';
        }

        if (empty($data['password']) || strlen($data['password']) < 8) {
            $errors[] = 'Password must be at least 8 characters';
        }

        if (isset($data['age']) && ($data['age'] < 10 || $data['age'] > 120)) {
            $errors[] = 'Age must be between 10 and 120';
        }

        if (isset($data['weight_kg']) && ($data['weight_kg'] < 20 || $data['weight_kg'] > 500)) {
            $errors[] = 'Weight must be between 20kg and 500kg';
        }

        if (isset($data['height_cm']) && ($data['height_cm'] < 50 || $data['height_cm'] > 300)) {
            $errors[] = 'Height must be between 50cm and 300cm';
        }

        return $errors;
    }
}
