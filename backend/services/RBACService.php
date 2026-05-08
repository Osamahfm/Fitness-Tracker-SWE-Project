<?php
/**
 * Role-Based Access Control (RBAC) Service
 * Handles permissions, role checking, and access control
 */

require_once __DIR__ . '/../config/database.php';

class RBACService {
    private $db;
    private $userPermissions = [];
    private $userRole = null;
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Check if user has a specific permission
     */
    public function hasPermission(int $userId, string $permissionName): bool {
        // Get user's role and permissions (cached for the request)
        if ($this->userRole === null) {
            $this->loadUserRoleAndPermissions($userId);
        }
        
        return in_array($permissionName, $this->userPermissions);
    }

    /**
     * Check if user has a specific role
     */
    public function hasRole(int $userId, string $role): bool {
        if ($this->userRole === null) {
            $this->loadUserRoleAndPermissions($userId);
        }
        
        return $this->userRole === $role;
    }

    /**
     * Get user's role
     */
    public function getUserRole(int $userId): ?string {
        if ($this->userRole === null) {
            $this->loadUserRoleAndPermissions($userId);
        }
        
        return $this->userRole;
    }

    /**
     * Check if user can access a specific resource with a specific action
     */
    public function canAccess(int $userId, string $resource, string $action): bool {
        $permissionName = $this->buildPermissionName($resource, $action);
        return $this->hasPermission($userId, $permissionName);
    }

    /**
     * Check if user can access another user's data
     */
    public function canAccessUserData(int $userId, int $targetUserId, string $resource): bool {
        // Users can always access their own data
        if ($userId === $targetUserId) {
            return $this->canAccess($userId, 'own_' . $resource, 'read');
        }
        
        // Trainers can access assigned clients' data
        if ($this->hasRole($userId, 'trainer')) {
            return $this->isClientAssignedToTrainer($targetUserId, $userId) && 
                   $this->hasPermission($userId, 'view_client_data');
        }
        
        // Admins can access all data
        if ($this->hasRole($userId, 'admin')) {
            return $this->hasPermission($userId, 'view_all_data');
        }
        
        return false;
    }

    /**
     * Get all permissions for a role
     */
    public function getRolePermissions(string $role): array {
        $query = "SELECT p.permission_name 
                 FROM role_permissions rp
                 JOIN permissions p ON rp.permission_id = p.permission_id
                 JOIN roles r ON rp.role_id = r.role_id
                 WHERE r.role_name = :role";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':role', $role);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    /**
     * Get all users with a specific role
     */
    public function getUsersByRole(string $role): array {
        $query = "SELECT user_id, username, email, first_name, last_name 
                 FROM users 
                 WHERE role = :role AND is_active = TRUE 
                 ORDER BY created_at DESC";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':role', $role);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Get clients assigned to a trainer
     */
    public function getTrainerClients(int $trainerId): array {
        $query = "SELECT u.user_id, u.username, u.email, u.first_name, u.last_name, 
                        tc.assigned_at, u.created_at
                 FROM trainer_clients tc
                 JOIN users u ON tc.client_id = u.user_id
                 WHERE tc.trainer_id = :trainer_id AND tc.is_active = TRUE AND u.is_active = TRUE
                 ORDER BY tc.assigned_at DESC";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':trainer_id', $trainerId, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Get trainer for a client
     */
    public function getClientTrainer(int $clientId): ?array {
        $query = "SELECT u.user_id, u.username, u.email, u.first_name, u.last_name
                 FROM trainer_clients tc
                 JOIN users u ON tc.trainer_id = u.user_id
                 WHERE tc.client_id = :client_id AND tc.is_active = TRUE AND u.is_active = TRUE
                 LIMIT 1";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':client_id', $clientId, PDO::PARAM_INT);
        $stmt->execute();

        $trainer = $stmt->fetch();
        return $trainer ?: null;
    }

    /**
     * Assign client to trainer
     */
    public function assignClientToTrainer(int $trainerId, int $clientId): bool {
        // Check if trainer exists and has trainer role
        if (!$this->hasRole($trainerId, 'trainer')) {
            return false;
        }

        // Check if client exists and has customer role
        if (!$this->hasRole($clientId, 'customer')) {
            return false;
        }

        // Remove any existing assignments
        $this->removeClientFromTrainer($clientId);

        // Create new assignment
        $query = "INSERT INTO trainer_clients (trainer_id, client_id) 
                 VALUES (:trainer_id, :client_id)";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':trainer_id', $trainerId, PDO::PARAM_INT);
        $stmt->bindParam(':client_id', $clientId, PDO::PARAM_INT);

        return $stmt->execute();
    }

    /**
     * Remove client from trainer
     */
    public function removeClientFromTrainer(int $clientId): bool {
        $query = "UPDATE trainer_clients 
                 SET is_active = FALSE 
                 WHERE client_id = :client_id AND is_active = TRUE";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':client_id', $clientId, PDO::PARAM_INT);

        return $stmt->execute();
    }

    /**
     * Change user role (admin only)
     */
    public function changeUserRole(int $userId, string $newRole): bool {
        $query = "UPDATE users SET role = :role WHERE user_id = :user_id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':role', $newRole);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);

        return $stmt->execute();
    }

    /**
     * Get accessible navigation items for user role
     */
    public function getNavigationForRole(string $role): array {
        $navigation = [
            'customer' => [
                ['name' => 'Dashboard', 'href' => '#dashboard', 'icon' => 'fas fa-home'],
                ['name' => 'Activities', 'href' => '#activities', 'icon' => 'fas fa-running'],
                ['name' => 'Meals', 'href' => '#meals', 'icon' => 'fas fa-utensils'],
                ['name' => 'Goals', 'href' => '#goals', 'icon' => 'fas fa-bullseye'],
                ['name' => 'Reports', 'href' => '#reports', 'icon' => 'fas fa-chart-line']
            ],
            'trainer' => [
                ['name' => 'Dashboard', 'href' => '#dashboard', 'icon' => 'fas fa-home'],
                ['name' => 'My Clients', 'href' => '#clients', 'icon' => 'fas fa-users'],
                ['name' => 'Workout Plans', 'href' => '#workout-plans', 'icon' => 'fas fa-dumbbell'],
                ['name' => 'Client Progress', 'href' => '#progress', 'icon' => 'fas fa-chart-line'],
                ['name' => 'Activities', 'href' => '#activities', 'icon' => 'fas fa-running'],
                ['name' => 'Meals', 'href' => '#meals', 'icon' => 'fas fa-utensils'],
                ['name' => 'Goals', 'href' => '#goals', 'icon' => 'fas fa-bullseye']
            ],
            'admin' => [
                ['name' => 'Dashboard', 'href' => '#dashboard', 'icon' => 'fas fa-home'],
                ['name' => 'User Management', 'href' => '#users', 'icon' => 'fas fa-users-cog'],
                ['name' => 'Role Management', 'href' => '#roles', 'icon' => 'fas fa-user-shield'],
                ['name' => 'Trainer Assignments', 'href' => '#assignments', 'icon' => 'fas fa-user-check'],
                ['name' => 'System Reports', 'href' => '#system-reports', 'icon' => 'fas fa-chart-bar'],
                ['name' => 'Activities', 'href' => '#activities', 'icon' => 'fas fa-running'],
                ['name' => 'Meals', 'href' => '#meals', 'icon' => 'fas fa-utensils'],
                ['name' => 'Goals', 'href' => '#goals', 'icon' => 'fas fa-bullseye']
            ]
        ];

        return $navigation[$role] ?? $navigation['customer'];
    }

    /**
     * Load user role and permissions (cached for request)
     */
    private function loadUserRoleAndPermissions(int $userId): void {
        $query = "SELECT u.role, p.permission_name
                 FROM users u
                 LEFT JOIN role_permissions rp ON (
                     SELECT role_id FROM roles WHERE role_name = u.role LIMIT 1
                 ) = rp.role_id
                 LEFT JOIN permissions p ON rp.permission_id = p.permission_id
                 WHERE u.user_id = :user_id AND u.is_active = TRUE";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();

        $results = $stmt->fetchAll();
        
        if (!empty($results)) {
            $this->userRole = $results[0]['role'];
            $this->userPermissions = array_column($results, 'permission_name');
        } else {
            $this->userRole = null;
            $this->userPermissions = [];
        }
    }

    /**
     * Check if client is assigned to trainer
     */
    private function isClientAssignedToTrainer(int $clientId, int $trainerId): bool {
        $query = "SELECT COUNT(*) as count 
                 FROM trainer_clients 
                 WHERE trainer_id = :trainer_id AND client_id = :client_id AND is_active = TRUE";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':trainer_id', $trainerId, PDO::PARAM_INT);
        $stmt->bindParam(':client_id', $clientId, PDO::PARAM_INT);
        $stmt->execute();

        $result = $stmt->fetch();
        return $result['count'] > 0;
    }

    /**
     * Build permission name from resource and action
     */
    private function buildPermissionName(string $resource, string $action): string {
        return $action . '_' . $resource;
    }
}
