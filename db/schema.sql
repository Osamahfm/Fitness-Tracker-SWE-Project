-- =============================================
-- FitTrack Pro - Database Schema
-- MySQL 8.x
-- =============================================

CREATE DATABASE IF NOT EXISTS fittrack_pro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fittrack_pro;

-- =============================================
-- 1. USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    age             TINYINT UNSIGNED DEFAULT NULL,
    weight_kg       DECIMAL(5,2) DEFAULT NULL,
    height_cm       DECIMAL(5,2) DEFAULT NULL,
    gender          ENUM('male', 'female', 'other') DEFAULT NULL,
    activity_level  ENUM('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active') DEFAULT 'moderately_active',
    fitness_goal    ENUM('lose_weight', 'maintain_weight', 'gain_muscle', 'body_recomposition') DEFAULT 'maintain_weight',
    daily_calorie_target INT UNSIGNED DEFAULT 2000,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_goal (fitness_goal)
) ENGINE=InnoDB;

-- =============================================
-- 2. ACTIVITY TYPES (MET Values Reference)
-- =============================================
CREATE TABLE IF NOT EXISTS activity_types (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(50) NOT NULL,
    category    ENUM('cardio', 'strength', 'flexibility', 'sports', 'daily') NOT NULL,
    met_value   DECIMAL(4,2) NOT NULL,
    icon        VARCHAR(50) DEFAULT 'activity',
    description TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_met (met_value)
) ENGINE=InnoDB;

-- =============================================
-- 3. ACTIVITIES (User Logged Activities)
-- =============================================
CREATE TABLE IF NOT EXISTS activities (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT UNSIGNED NOT NULL,
    activity_type_id BIGINT UNSIGNED NOT NULL,
    duration_minutes INT UNSIGNED NOT NULL,
    distance_km     DECIMAL(6,2) DEFAULT NULL,
    intensity       ENUM('low', 'moderate', 'high', 'very_high') DEFAULT 'moderate',
    calories_burned INT UNSIGNED DEFAULT NULL,
    notes           TEXT,
    logged_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_type_id) REFERENCES activity_types(id),
    INDEX idx_user_date (user_id, logged_at),
    INDEX idx_activity_type (activity_type_id)
) ENGINE=InnoDB;

-- =============================================
-- 4. MEALS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS meals (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT UNSIGNED NOT NULL,
    name            VARCHAR(150) NOT NULL,
    meal_type       ENUM('breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout') NOT NULL,
    calories        INT UNSIGNED NOT NULL,
    protein_g       DECIMAL(6,2) DEFAULT 0,
    carbs_g         DECIMAL(6,2) DEFAULT 0,
    fats_g          DECIMAL(6,2) DEFAULT 0,
    fiber_g         DECIMAL(6,2) DEFAULT 0,
    notes           TEXT,
    consumed_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_meal_date (user_id, consumed_at),
    INDEX idx_meal_type (meal_type)
) ENGINE=InnoDB;

-- =============================================
-- 5. MEAL RECOMMENDATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS meal_recommendations (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    goal_type       ENUM('lose_weight', 'maintain_weight', 'gain_muscle', 'body_recomposition') NOT NULL,
    meal_type       ENUM('breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout') NOT NULL,
    name            VARCHAR(150) NOT NULL,
    description     TEXT,
    calories        INT UNSIGNED NOT NULL,
    protein_g       DECIMAL(6,2) DEFAULT 0,
    carbs_g         DECIMAL(6,2) DEFAULT 0,
    fats_g          DECIMAL(6,2) DEFAULT 0,
    recipe          TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_goal_meal (goal_type, meal_type),
    INDEX idx_active (is_active)
) ENGINE=InnoDB;

-- =============================================
-- 6. GOALS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS goals (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT UNSIGNED NOT NULL,
    title           VARCHAR(150) NOT NULL,
    description     TEXT,
    goal_type       ENUM('weekly_distance', 'weekly_duration', 'weekly_calories', 'weight_target', 'daily_steps', 'custom') NOT NULL,
    target_value    DECIMAL(10,2) NOT NULL,
    current_value   DECIMAL(10,2) DEFAULT 0,
    unit            VARCHAR(20) NOT NULL,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    status          ENUM('active', 'completed', 'paused', 'abandoned') DEFAULT 'active',
    reminders_enabled BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_goals (user_id, status),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB;

-- =============================================
-- 7. ACTIVITY ALARMS / REMINDERS
-- =============================================
CREATE TABLE IF NOT EXISTS activity_alarms (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT UNSIGNED NOT NULL,
    title           VARCHAR(100) NOT NULL,
    description     TEXT,
    alarm_type      ENUM('activity_reminder', 'goal_reminder', 'meal_reminder', 'custom') NOT NULL,
    scheduled_time  TIME NOT NULL,
    scheduled_days  SET('monday','tuesday','wednesday','thursday','friday','saturday','sunday') NOT NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    last_triggered  TIMESTAMP NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_alarms (user_id, is_active),
    INDEX idx_alarm_type (alarm_type)
) ENGINE=InnoDB;

-- =============================================
-- 8. DAILY REPORTS (Cached summaries)
-- =============================================
CREATE TABLE IF NOT EXISTS daily_reports (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id             BIGINT UNSIGNED NOT NULL,
    report_date         DATE NOT NULL,
    total_activities    INT UNSIGNED DEFAULT 0,
    total_duration_min  INT UNSIGNED DEFAULT 0,
    total_distance_km   DECIMAL(8,2) DEFAULT 0,
    total_calories_burned INT UNSIGNED DEFAULT 0,
    total_meals_logged  INT UNSIGNED DEFAULT 0,
    total_calories_consumed INT UNSIGNED DEFAULT 0,
    net_calories        INT SIGNED DEFAULT 0,
    protein_g           DECIMAL(7,2) DEFAULT 0,
    carbs_g             DECIMAL(7,2) DEFAULT 0,
    fats_g              DECIMAL(7,2) DEFAULT 0,
    goals_progress      JSON DEFAULT NULL,
    summary_text        TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_date (user_id, report_date),
    INDEX idx_report_date (report_date)
) ENGINE=InnoDB;

-- =============================================
-- 9. USER SESSIONS (JWT Tracking)
-- =============================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT UNSIGNED NOT NULL,
    token_hash      VARCHAR(255) NOT NULL,
    device_info     VARCHAR(255) DEFAULT NULL,
    ip_address      VARCHAR(45) DEFAULT NULL,
    expires_at      TIMESTAMP NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token_hash),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB;

-- =============================================
-- SEED DATA: Activity Types with MET Values
-- =============================================
INSERT IGNORE INTO activity_types (name, category, met_value, icon, description) VALUES
-- Cardio
('Running', 'cardio', 9.80, 'running', 'Running at moderate pace'),
('Jogging', 'cardio', 7.00, 'running', 'Light jogging'),
('Walking', 'cardio', 3.50, 'walking', 'Brisk walking'),
('Cycling', 'cardio', 7.50, 'cycling', 'Cycling at moderate pace'),
('Swimming', 'cardio', 8.00, 'waves', 'Swimming laps'),
('Jump Rope', 'cardio', 11.00, 'zap', 'Jumping rope'),
('Elliptical', 'cardio', 5.50, 'activity', 'Elliptical machine'),
('Rowing', 'cardio', 7.00, 'anchor', 'Rowing machine'),
('HIIT', 'cardio', 11.00, 'flame', 'High-intensity interval training'),
('Stair Climbing', 'cardio', 8.00, 'arrow-up', 'Climbing stairs'),
-- Strength
('Weight Lifting', 'strength', 6.00, 'dumbbell', 'Resistance weight training'),
('Bodyweight Training', 'strength', 4.00, 'user', 'Calisthenics and bodyweight exercises'),
('CrossFit', 'strength', 8.00, 'zap', 'CrossFit-style workouts'),
('Powerlifting', 'strength', 6.00, 'gauge', 'Heavy compound lifts'),
-- Flexibility
('Yoga', 'flexibility', 2.50, 'heart', 'Yoga practice'),
('Pilates', 'flexibility', 3.00, 'activity', 'Pilates exercises'),
('Stretching', 'flexibility', 2.30, 'move', 'Static and dynamic stretching'),
-- Sports
('Basketball', 'sports', 6.50, 'circle', 'Playing basketball'),
('Soccer', 'sports', 7.00, 'circle', 'Playing soccer/football'),
('Tennis', 'sports', 7.30, 'circle', 'Playing tennis'),
('Volleyball', 'sports', 4.00, 'circle', 'Playing volleyball'),
('Boxing', 'sports', 9.00, 'shield', 'Boxing/sparring'),
('Martial Arts', 'sports', 7.00, 'shield', 'Martial arts training'),
-- Daily
('Hiking', 'daily', 6.00, 'mountain', 'Hiking on trails'),
('Gardening', 'daily', 4.00, 'flower', 'Gardening and yard work'),
('House Cleaning', 'daily', 3.50, 'home', 'General house cleaning'),
('Dancing', 'daily', 5.00, 'music', 'Recreational dancing');

-- =============================================
-- SEED DATA: Meal Recommendations
-- =============================================
INSERT IGNORE INTO meal_recommendations (goal_type, meal_type, name, description, calories, protein_g, carbs_g, fats_g, recipe) VALUES
-- Lose Weight
('lose_weight', 'breakfast', 'Greek Yogurt Parfait', 'High protein, low calorie breakfast', 280, 20.00, 35.00, 6.00, '1 cup Greek yogurt, 1/2 cup mixed berries, 1 tbsp honey, 2 tbsp granola'),
('lose_weight', 'lunch', 'Grilled Chicken Salad', 'Lean protein with fresh vegetables', 350, 35.00, 15.00, 12.00, '150g grilled chicken breast, mixed greens, cherry tomatoes, cucumber, light vinaigrette'),
('lose_weight', 'dinner', 'Baked Salmon with Vegetables', 'Omega-3 rich dinner', 420, 30.00, 20.00, 22.00, '150g salmon fillet, steamed broccoli, asparagus, lemon herb seasoning'),
('lose_weight', 'snack', 'Apple with Almond Butter', 'Balanced snack', 180, 5.00, 20.00, 10.00, '1 medium apple, 1 tbsp almond butter'),
-- Maintain Weight
('maintain_weight', 'breakfast', 'Oatmeal with Banana', 'Balanced carb-protein breakfast', 380, 12.00, 60.00, 10.00, '1/2 cup oats, 1 sliced banana, 1 tbsp peanut butter, cinnamon'),
('maintain_weight', 'lunch', 'Turkey Wrap', 'Balanced macro lunch', 450, 28.00, 45.00, 16.00, 'Whole wheat tortilla, 100g turkey slices, lettuce, tomato, mustard, hummus'),
('maintain_weight', 'dinner', 'Lean Beef Stir-Fry', 'Protein-rich dinner', 520, 35.00, 50.00, 18.00, '150g lean beef, brown rice, mixed vegetables, soy sauce, ginger'),
('maintain_weight', 'snack', 'Protein Smoothie', 'Post-workout recovery', 250, 25.00, 30.00, 4.00, '1 scoop protein powder, 1 cup almond milk, 1/2 banana, ice'),
-- Gain Muscle
('gain_muscle', 'breakfast', 'Protein Pancakes', 'High protein breakfast', 550, 35.00, 60.00, 18.00, 'Protein pancake mix, 2 eggs, maple syrup, fresh berries'),
('gain_muscle', 'lunch', 'Chicken Rice Bowl', 'High calorie muscle meal', 650, 45.00, 70.00, 20.00, '200g chicken breast, 1.5 cups rice, black beans, avocado, salsa'),
('gain_muscle', 'dinner', 'Pasta with Meat Sauce', 'Carb-heavy dinner for recovery', 700, 40.00, 85.00, 22.00, 'Whole wheat pasta, 150g ground turkey, marinara sauce, parmesan cheese'),
('gain_muscle', 'post_workout', 'Chocolate Protein Shake', 'Anabolic window nutrition', 320, 30.00, 35.00, 8.00, 'Protein powder, chocolate milk, 1 tbsp peanut butter, banana'),
-- Body Recomposition
('body_recomposition', 'breakfast', 'Egg White Scramble', 'High protein, moderate fat', 320, 28.00, 12.00, 18.00, '4 egg whites, 1 whole egg, spinach, mushrooms, whole grain toast'),
('body_recomposition', 'lunch', 'Tuna Quinoa Bowl', 'Complete protein source', 480, 35.00, 45.00, 16.00, '150g tuna, 1 cup quinoa, edamame, seaweed, sesame dressing'),
('body_recomposition', 'dinner', 'Chicken Breast with Sweet Potato', 'Lean dinner option', 520, 40.00, 55.00, 12.00, '200g chicken breast, 200g sweet potato, green beans, olive oil'),
('body_recomposition', 'pre_workout', 'Rice Cakes with Turkey', 'Quick energy before training', 220, 15.00, 25.00, 6.00, '2 rice cakes, 60g sliced turkey, mustard');
