-- Fitness Tracker Database Schema
-- MySQL 8.0+ compatible

-- Users table for authentication and profile management
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender ENUM('male', 'female', 'other') NOT NULL,
    height_cm DECIMAL(5,2) NOT NULL, -- Height in centimeters
    weight_kg DECIMAL(5,2) NOT NULL, -- Current weight in kilograms
    activity_level ENUM('sedentary', 'light', 'moderate', 'active', 'very_active') NOT NULL DEFAULT 'moderate',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email),
    INDEX idx_username (username)
);

-- Goals table for user fitness goals
CREATE TABLE goals (
    goal_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    goal_type ENUM('weight_loss', 'weight_gain', 'muscle_gain', 'endurance', 'maintenance') NOT NULL,
    target_weight_kg DECIMAL(5,2), -- Target weight if applicable
    target_date DATE, -- Target achievement date
    daily_calorie_target INT NOT NULL, -- Daily calorie target based on goal
    weekly_activity_minutes INT NOT NULL DEFAULT 150, -- WHO recommendation: 150 minutes moderate activity
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_goals (user_id, is_active)
);

-- Activities table for logged physical activities
CREATE TABLE activities (
    activity_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    activity_type ENUM('running', 'walking', 'cycling', 'swimming', 'gym', 'yoga', 'sports', 'other') NOT NULL,
    activity_name VARCHAR(100) NOT NULL, -- Custom name for the activity
    distance_km DECIMAL(6,3), -- Distance in kilometers
    duration_minutes INT NOT NULL, -- Duration in minutes
    calories_burned INT NOT NULL, -- Calculated calories burned
    intensity_level ENUM('low', 'moderate', 'high', 'very_high') NOT NULL DEFAULT 'moderate',
    activity_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT, -- Optional notes about the activity
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_activities (user_id, activity_date),
    INDEX idx_activity_date (activity_date)
);

-- Meals table for meal logging and nutrition tracking
CREATE TABLE meals (
    meal_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    meal_type ENUM('breakfast', 'lunch', 'dinner', 'snack') NOT NULL,
    meal_name VARCHAR(100) NOT NULL,
    calories INT NOT NULL,
    protein_g DECIMAL(6,2), -- Protein in grams
    carbs_g DECIMAL(6,2), -- Carbohydrates in grams
    fat_g DECIMAL(6,2), -- Fat in grams
    fiber_g DECIMAL(6,2), -- Fiber in grams
    meal_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_meals (user_id, meal_date),
    INDEX idx_meal_date (meal_date)
);

-- Meal recommendations table for system-generated meal suggestions
CREATE TABLE meal_recommendations (
    recommendation_id INT AUTO_INCREMENT PRIMARY KEY,
    meal_name VARCHAR(100) NOT NULL,
    meal_type ENUM('breakfast', 'lunch', 'dinner', 'snack') NOT NULL,
    calories INT NOT NULL,
    protein_g DECIMAL(6,2),
    carbs_g DECIMAL(6,2),
    fat_g DECIMAL(6,2),
    fiber_g DECIMAL(6,2),
    goal_type ENUM('weight_loss', 'weight_gain', 'muscle_gain', 'maintenance') NOT NULL,
    is_recommended BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_goal_recommendations (goal_type, is_recommended)
);

-- Activity reminders/alarms table
CREATE TABLE activity_reminders (
    reminder_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    reminder_name VARCHAR(100) NOT NULL,
    activity_type ENUM('running', 'walking', 'cycling', 'swimming', 'gym', 'yoga', 'sports', 'other') NOT NULL,
    reminder_time TIME NOT NULL, -- Time of day for the reminder
    days_of_week VARCHAR(13) NOT NULL, -- JSON string of days: ["Monday","Tuesday",...]
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_reminders (user_id, is_active)
);

-- User sessions for authentication management
CREATE TABLE user_sessions (
    session_id VARCHAR(128) PRIMARY KEY,
    user_id INT NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_sessions (user_id, is_active),
    INDEX idx_expires_at (expires_at)
);

-- Daily summaries for performance optimization (pre-calculated data)
CREATE TABLE daily_summaries (
    summary_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    summary_date DATE NOT NULL,
    total_calories_burned INT DEFAULT 0,
    total_calories_consumed INT DEFAULT 0,
    total_activities INT DEFAULT 0,
    total_duration_minutes INT DEFAULT 0,
    total_distance_km DECIMAL(6,3) DEFAULT 0,
    net_calories INT DEFAULT 0, -- calories_consumed - calories_burned
    goal_met BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_date (user_id, summary_date),
    INDEX idx_summary_date (summary_date)
);

-- Insert sample meal recommendations
INSERT INTO meal_recommendations (meal_name, meal_type, calories, protein_g, carbs_g, fat_g, fiber_g, goal_type) VALUES
('Oatmeal with Berries', 'breakfast', 350, 12, 65, 8, 10, 'weight_loss'),
('Greek Yogurt Parfait', 'breakfast', 280, 20, 35, 6, 3, 'maintenance'),
('Protein Pancakes', 'breakfast', 420, 35, 45, 12, 5, 'muscle_gain'),
('Grilled Chicken Salad', 'lunch', 380, 42, 25, 15, 8, 'weight_loss'),
('Quinoa Buddha Bowl', 'lunch', 450, 18, 58, 18, 12, 'maintenance'),
('Salmon with Sweet Potato', 'lunch', 520, 38, 42, 22, 6, 'muscle_gain'),
('Turkey Chili', 'dinner', 420, 35, 35, 18, 10, 'weight_loss'),
('Lean Beef Stir-fry', 'dinner', 480, 42, 38, 20, 8, 'maintenance'),
('Salmon with Vegetables', 'dinner', 550, 45, 35, 25, 7, 'muscle_gain'),
('Protein Shake', 'snack', 180, 25, 8, 4, 1, 'muscle_gain'),
('Apple with Almond Butter', 'snack', 200, 6, 22, 12, 4, 'weight_loss'),
('Mixed Nuts and Fruit', 'snack', 280, 8, 32, 16, 5, 'maintenance');

-- Create triggers for automatic daily summary updates
DELIMITER //

CREATE TRIGGER after_activity_insert 
AFTER INSERT ON activities
FOR EACH ROW
BEGIN
    INSERT INTO daily_summaries (user_id, summary_date, total_calories_burned, total_activities, total_duration_minutes, total_distance_km)
    VALUES (NEW.user_id, NEW.activity_date, NEW.calories_burned, 1, NEW.duration_minutes, COALESCE(NEW.distance_km, 0))
    ON DUPLICATE KEY UPDATE
        total_calories_burned = total_calories_burned + NEW.calories_burned,
        total_activities = total_activities + 1,
        total_duration_minutes = total_duration_minutes + NEW.duration_minutes,
        total_distance_km = total_distance_km + COALESCE(NEW.distance_km, 0);
END//

CREATE TRIGGER after_meal_insert 
AFTER INSERT ON meals
FOR EACH ROW
BEGIN
    INSERT INTO daily_summaries (user_id, summary_date, total_calories_consumed)
    VALUES (NEW.user_id, NEW.meal_date, NEW.calories)
    ON DUPLICATE KEY UPDATE
        total_calories_consumed = total_calories_consumed + NEW.calories;
END//

DELIMITER ;

-- Create view for daily reports (optimized for performance)
CREATE VIEW daily_reports AS
SELECT 
    u.user_id,
    u.username,
    ds.summary_date,
    ds.total_calories_burned,
    ds.total_calories_consumed,
    ds.net_calories,
    ds.total_activities,
    ds.total_duration_minutes,
    ds.total_distance_km,
    g.daily_calorie_target as target_calories,
    CASE 
        WHEN ds.total_calories_burned >= g.daily_calorie_target * 0.9 THEN TRUE 
        ELSE FALSE 
    END as goal_met,
    u.weight_kg,
    u.height_cm
FROM users u
LEFT JOIN daily_summaries ds ON u.user_id = ds.user_id
LEFT JOIN goals g ON u.user_id = g.user_id AND g.is_active = TRUE
WHERE u.is_active = TRUE;
