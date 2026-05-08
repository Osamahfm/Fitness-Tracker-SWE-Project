-- Graduation project enhancements: wellness, workouts catalog, weight history,
-- achievements, password reset tokens. Run after schema.sql and rbac_schema.sql.

CREATE TABLE IF NOT EXISTS wellness_daily (
    wellness_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    log_date DATE NOT NULL,
    steps INT UNSIGNED DEFAULT 0,
    water_ml INT UNSIGNED DEFAULT 0,
    sleep_hours DECIMAL(4,2) DEFAULT NULL,
    resting_heart_rate SMALLINT UNSIGNED DEFAULT NULL,
    mood_score TINYINT UNSIGNED DEFAULT NULL COMMENT '1-5 optional',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_day (user_id, log_date),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_wellness_date (log_date)
);

CREATE TABLE IF NOT EXISTS body_metrics_log (
    metric_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    recorded_date DATE NOT NULL,
    weight_kg DECIMAL(5,2) NOT NULL,
    notes VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_metrics_user_date (user_id, recorded_date)
);

CREATE TABLE IF NOT EXISTS workout_templates (
    workout_id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(60) NOT NULL,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(80) NOT NULL UNIQUE,
    description TEXT,
    difficulty ENUM('beginner', 'intermediate', 'advanced') NOT NULL DEFAULT 'beginner',
    duration_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 30,
    calories_estimate SMALLINT UNSIGNED NOT NULL DEFAULT 200,
    exercises_json JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_workout_category (category),
    INDEX idx_workout_difficulty (difficulty)
);

CREATE TABLE IF NOT EXISTS user_achievements (
    user_achievement_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    achievement_key VARCHAR(80) NOT NULL,
    title VARCHAR(120) NOT NULL,
    description VARCHAR(255) DEFAULT NULL,
    icon VARCHAR(40) DEFAULT 'fa-medal',
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_achievement (user_id, achievement_key),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS password_resets (
    reset_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_reset_email (email),
    INDEX idx_reset_expires (expires_at)
);

INSERT IGNORE INTO workout_templates (category, name, slug, description, difficulty, duration_minutes, calories_estimate, exercises_json) VALUES
('Strength', 'Upper Body Power', 'upper-body-power', 'Compound lifts mixed with accessory work for chest, back, and arms.', 'intermediate', 45, 320, JSON_ARRAY(JSON_OBJECT('name','Bench press','sets',4,'reps','8-10'), JSON_OBJECT('name','Bent-over row','sets',4,'reps','8-10'), JSON_OBJECT('name','Overhead press','sets',3,'reps','8'))),
('Cardio', 'HIIT Sprint Intervals', 'hiit-sprints', 'Short high-intensity bursts with active recovery.', 'advanced', 25, 400, JSON_ARRAY(JSON_OBJECT('name','Warm-up jog','min',5), JSON_OBJECT('name','Sprint / walk intervals','rounds',8,'work_sec',30,'rest_sec',60))),
('Mobility', 'Morning Flow Yoga', 'morning-yoga', 'Joint-friendly flow to improve mobility and breathing.', 'beginner', 30, 120, JSON_ARRAY(JSON_OBJECT('name','Sun salutations','min',10), JSON_OBJECT('name','Hip openers','min',12), JSON_OBJECT('name','Cooldown','min',8))),
('Core', 'Steel Abs Circuit', 'steel-abs', 'Core endurance with minimal equipment.', 'intermediate', 20, 180, JSON_ARRAY(JSON_OBJECT('name','Plank variations','rounds',3,'sec',45), JSON_OBJECT('name','Dead bug','sets',3,'reps',12))),
('Endurance', 'Steady-State Run', 'steady-run', 'Zone 2 cardiovascular base building.', 'beginner', 40, 350, JSON_ARRAY(JSON_OBJECT('name','Easy pace run','min',35), JSON_OBJECT('name','Cooldown walk','min',5)));
