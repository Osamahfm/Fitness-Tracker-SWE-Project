-- RBAC (Role-Based Access Control) Schema Additions
-- Add to existing fitness_tracker database

-- Add role column to users table
ALTER TABLE users ADD COLUMN role ENUM('customer', 'trainer', 'admin') NOT NULL DEFAULT 'customer' AFTER is_active;
ALTER TABLE users ADD INDEX idx_role (role);

-- Roles table for role definitions
CREATE TABLE roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name ENUM('customer', 'trainer', 'admin') UNIQUE NOT NULL,
    role_description VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permissions table for permission definitions
CREATE TABLE permissions (
    permission_id INT AUTO_INCREMENT PRIMARY KEY,
    permission_name VARCHAR(100) UNIQUE NOT NULL,
    permission_description VARCHAR(255) NOT NULL,
    resource_type VARCHAR(50) NOT NULL, -- 'activity', 'meal', 'goal', 'user', 'report', etc.
    action VARCHAR(50) NOT NULL, -- 'create', 'read', 'update', 'delete', 'manage'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role permissions junction table
CREATE TABLE role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(permission_id) ON DELETE CASCADE
);

-- Client assignments for trainers
CREATE TABLE trainer_clients (
    trainer_id INT NOT NULL,
    client_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (trainer_id, client_id),
    FOREIGN KEY (trainer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_trainer_clients (trainer_id, is_active),
    INDEX idx_client_trainers (client_id, is_active)
);

-- Trainer notes for clients
CREATE TABLE trainer_notes (
    note_id INT AUTO_INCREMENT PRIMARY KEY,
    trainer_id INT NOT NULL,
    client_id INT NOT NULL,
    note_title VARCHAR(200) NOT NULL,
    note_content TEXT NOT NULL,
    note_type ENUM('progress', 'recommendation', 'warning', 'general') DEFAULT 'general',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (trainer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_client_notes (client_id, created_at),
    INDEX idx_trainer_notes (trainer_id, created_at)
);

-- Workout plans created by trainers
CREATE TABLE workout_plans (
    plan_id INT AUTO_INCREMENT PRIMARY KEY,
    trainer_id INT NOT NULL,
    plan_name VARCHAR(200) NOT NULL,
    plan_description TEXT,
    difficulty_level ENUM('beginner', 'intermediate', 'advanced') NOT NULL,
    duration_weeks INT NOT NULL,
    sessions_per_week INT NOT NULL DEFAULT 3,
    is_public BOOLEAN DEFAULT FALSE, -- Can be shared with other trainers
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (trainer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_trainer_plans (trainer_id),
    INDEX idx_public_plans (is_public, created_at)
);

-- Workout plan assignments to clients
CREATE TABLE client_workout_plans (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    plan_id INT NOT NULL,
    assigned_by INT NOT NULL, -- Trainer who assigned it
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES workout_plans(plan_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_client_plans (client_id, is_active),
    INDEX idx_plan_assignments (plan_id)
);

-- Insert roles
INSERT INTO roles (role_name, role_description) VALUES
('customer', 'Regular fitness tracker user who can manage their own activities, meals, and goals'),
('trainer', 'Fitness professional who can manage assigned clients and create workout plans'),
('admin', 'System administrator with full access to all features and user management');

-- Insert permissions
INSERT INTO permissions (permission_name, permission_description, resource_type, action) VALUES
-- Customer permissions
('view_own_dashboard', 'View personal dashboard', 'dashboard', 'read'),
('manage_own_activities', 'Create, read, update, delete own activities', 'activity', 'manage'),
('manage_own_meals', 'Create, read, update, delete own meals', 'meal', 'manage'),
('manage_own_goals', 'Create, read, update, delete own goals', 'goal', 'manage'),
('view_own_reports', 'View personal progress reports', 'report', 'read'),

-- Trainer permissions
('view_client_list', 'View list of assigned clients', 'client', 'read'),
('manage_client_assignments', 'Assign and unassign clients', 'client', 'manage'),
('view_client_data', 'View client activities, meals, and goals', 'client_data', 'read'),
('create_workout_plans', 'Create workout plans for clients', 'workout_plan', 'create'),
('manage_workout_plans', 'Edit and delete workout plans', 'workout_plan', 'manage'),
('assign_workout_plans', 'Assign workout plans to clients', 'workout_plan', 'assign'),
('create_trainer_notes', 'Create notes for clients', 'trainer_note', 'create'),
('view_client_progress', 'View client progress reports', 'report', 'read'),

-- Admin permissions
('manage_all_users', 'Create, read, update, delete all users', 'user', 'manage'),
('manage_roles', 'Assign and change user roles', 'role', 'manage'),
('view_system_reports', 'View system-wide analytics and reports', 'system_report', 'read'),
('manage_system_settings', 'Configure system-wide settings', 'system', 'manage'),
('approve_trainers', 'Approve trainer applications', 'trainer', 'approve'),
('view_all_data', 'Access all user data for support purposes', 'all_data', 'read');

-- Assign permissions to roles
-- Customer permissions (role_id = 1)
INSERT INTO role_permissions (role_id, permission_id) 
SELECT 1, permission_id FROM permissions WHERE permission_name IN (
    'view_own_dashboard', 'manage_own_activities', 'manage_own_meals', 
    'manage_own_goals', 'view_own_reports'
);

-- Trainer permissions (role_id = 2)
INSERT INTO role_permissions (role_id, permission_id) 
SELECT 2, permission_id FROM permissions WHERE permission_name IN (
    'view_own_dashboard', 'manage_own_activities', 'manage_own_meals', 
    'manage_own_goals', 'view_own_reports', 'view_client_list', 
    'manage_client_assignments', 'view_client_data', 'create_workout_plans',
    'manage_workout_plans', 'assign_workout_plans', 'create_trainer_notes',
    'view_client_progress'
);

-- Admin permissions (role_id = 3) - All permissions
INSERT INTO role_permissions (role_id, permission_id) 
SELECT 3, permission_id FROM permissions;

-- Create default admin user (password: admin123)
INSERT INTO users (username, email, password_hash, first_name, last_name, date_of_birth, gender, height_cm, weight_kg, activity_level, role) VALUES
('admin', 'admin@fitnesstracker.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System', 'Administrator', '1990-01-01', 'other', 170.00, 70.00, 'moderate', 'admin');

-- Create sample trainer user (password: trainer123)
INSERT INTO users (username, email, password_hash, first_name, last_name, date_of_birth, gender, height_cm, weight_kg, activity_level, role) VALUES
('trainer1', 'trainer@fitnesstracker.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John', 'Trainer', '1985-05-15', 'male', 180.00, 85.00, 'very_active', 'trainer');

-- Create sample customer user (password: customer123)
INSERT INTO users (username, email, password_hash, first_name, last_name, date_of_birth, gender, height_cm, weight_kg, activity_level, role) VALUES
('customer1', 'customer@fitnesstracker.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jane', 'Customer', '1992-08-20', 'female', 165.00, 60.00, 'moderate', 'customer');

-- Assign trainer to customer (trainer1 assigned to customer1)
INSERT INTO trainer_clients (trainer_id, client_id) VALUES
(2, 3); -- trainer_id=2, client_id=3
