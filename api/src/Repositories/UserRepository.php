<?php
/**
 * User Repository
 * Handles all database operations for User entity
 * Repository Pattern for clean data access
 */
namespace FitTrack\Repositories;

use FitTrack\Config\Database;
use FitTrack\Models\User;
use PDO;

class UserRepository
{
    protected PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function findByEmail(string $email): ?User
    {
        $stmt = $this->db->prepare("SELECT * FROM users WHERE email = :email LIMIT 1");
        $stmt->execute([':email' => $email]);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);
        return $data ? User::fromArray($data) : null;
    }

    public function findById(int $id): ?User
    {
        $stmt = $this->db->prepare("SELECT * FROM users WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);
        return $data ? User::fromArray($data) : null;
    }

    public function create(User $user): User
    {
        $stmt = $this->db->prepare("
            INSERT INTO users (full_name, email, password_hash, age, weight_kg, height_cm, gender, activity_level, fitness_goal, daily_calorie_target)
            VALUES (:name, :email, :pw, :age, :weight, :height, :gender, :activity, :goal, :target)
        ");
        $stmt->execute([
            ':name' => $user->full_name,
            ':email' => $user->email,
            ':pw' => $user->password_hash,
            ':age' => $user->age,
            ':weight' => $user->weight_kg,
            ':height' => $user->height_cm,
            ':gender' => $user->gender,
            ':activity' => $user->activity_level,
            ':goal' => $user->fitness_goal,
            ':target' => $user->daily_calorie_target,
        ]);
        $user->id = (int) $this->db->lastInsertId();
        return $user;
    }

    public function update(User $user): bool
    {
        $stmt = $this->db->prepare("
            UPDATE users SET
                full_name = :name, age = :age, weight_kg = :weight, height_cm = :height,
                gender = :gender, activity_level = :activity, fitness_goal = :goal,
                daily_calorie_target = :target
            WHERE id = :id
        ");
        return $stmt->execute([
            ':id' => $user->id,
            ':name' => $user->full_name,
            ':age' => $user->age,
            ':weight' => $user->weight_kg,
            ':height' => $user->height_cm,
            ':gender' => $user->gender,
            ':activity' => $user->activity_level,
            ':goal' => $user->fitness_goal,
            ':target' => $user->daily_calorie_target,
        ]);
    }

    public function updatePassword(int $userId, string $newHash): bool
    {
        $stmt = $this->db->prepare("UPDATE users SET password_hash = :pw WHERE id = :id");
        return $stmt->execute([':pw' => $newHash, ':id' => $userId]);
    }
}
