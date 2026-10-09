-- =====================================================================
-- Skillora: AI-Powered Personalized Learning Assistant Database Schema
-- Target Database: MySQL 8.0+ / MariaDB 10.5+
-- =====================================================================

CREATE DATABASE IF NOT EXISTS skillora_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE skillora_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    role ENUM('student', 'educator', 'admin') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email)
) ENGINE=InnoDB;

-- 2. Student Profiles Table
CREATE TABLE IF NOT EXISTS student_profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    learning_goals JSON NOT NULL COMMENT 'Array of student goal strings',
    experience_level ENUM('beginner', 'intermediate', 'advanced') NOT NULL DEFAULT 'beginner',
    preferred_daily_hours DECIMAL(3,1) NOT NULL DEFAULT 1.5,
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    initial_assessment_completed BOOLEAN NOT NULL DEFAULT FALSE,
    estimated_knowledge_level VARCHAR(50) NOT NULL DEFAULT 'Novice',
    overall_mastery_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    current_streak_days INT NOT NULL DEFAULT 0,
    total_study_minutes INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_profile_level (experience_level)
) ENGINE=InnoDB;

-- 3. Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    icon_name VARCHAR(50) DEFAULT 'BookOpen',
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_subject_code (code)
) ENGINE=InnoDB;

-- 4. Topics Table
CREATE TABLE IF NOT EXISTS topics (
    id VARCHAR(36) PRIMARY KEY,
    subject_id VARCHAR(36) NOT NULL,
    title VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL,
    difficulty_level ENUM('easy', 'medium', 'hard') NOT NULL DEFAULT 'medium',
    order_index INT DEFAULT 0,
    estimated_minutes INT DEFAULT 45,
    prerequisites JSON NULL COMMENT 'Array of topic IDs',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    UNIQUE KEY uk_subject_slug (subject_id, slug),
    INDEX idx_topic_subject (subject_id)
) ENGINE=InnoDB;

-- 5. Assessment & Practice Questions Table
CREATE TABLE IF NOT EXISTS assessment_questions (
    id VARCHAR(36) PRIMARY KEY,
    subject_id VARCHAR(36) NOT NULL,
    topic_id VARCHAR(36) NOT NULL,
    difficulty ENUM('easy', 'medium', 'hard') NOT NULL,
    question_type ENUM('multiple_choice', 'code_output', 'true_false') NOT NULL DEFAULT 'multiple_choice',
    question_text TEXT NOT NULL,
    code_snippet TEXT NULL,
    options JSON NOT NULL COMMENT 'Array of strings or objects',
    correct_option_index INT NOT NULL,
    explanation TEXT NOT NULL,
    hint TEXT NOT NULL,
    is_initial_assessment BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
    INDEX idx_question_lookup (topic_id, difficulty, is_initial_assessment)
) ENGINE=InnoDB;

-- 6. Assessment Attempts Table
CREATE TABLE IF NOT EXISTS assessment_attempts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    assessment_type ENUM('initial_diagnostic', 'topic_quiz', 'adaptive_practice') NOT NULL,
    subject_id VARCHAR(36) NULL,
    total_questions INT NOT NULL,
    correct_count INT NOT NULL,
    score_percentage DECIMAL(5,2) NOT NULL,
    duration_seconds INT NOT NULL,
    calculated_level VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_attempt_user (user_id, assessment_type)
) ENGINE=InnoDB;

-- 7. Student Topic-Wise Performance Table
CREATE TABLE IF NOT EXISTS student_performance (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    topic_id VARCHAR(36) NOT NULL,
    subject_id VARCHAR(36) NOT NULL,
    total_attempts INT NOT NULL DEFAULT 0,
    correct_attempts INT NOT NULL DEFAULT 0,
    accuracy_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    mastery_score DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Bayesian Knowledge Tracing Score 0-100',
    status ENUM('mastered', 'proficient', 'developing', 'needs_revision') NOT NULL DEFAULT 'developing',
    last_practiced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_topic_perf (user_id, topic_id),
    INDEX idx_perf_status (user_id, status)
) ENGINE=InnoDB;

-- 8. Learning Materials Table
CREATE TABLE IF NOT EXISTS learning_materials (
    id VARCHAR(36) PRIMARY KEY,
    topic_id VARCHAR(36) NOT NULL,
    subject_id VARCHAR(36) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content_markdown LONGTEXT NOT NULL,
    summary TEXT NOT NULL,
    key_takeaways JSON NOT NULL,
    interactive_example JSON NULL,
    reading_time_minutes INT NOT NULL DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    INDEX idx_material_topic (topic_id)
) ENGINE=InnoDB;

-- 9. Quiz Attempts and Answers Table
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    topic_id VARCHAR(36) NOT NULL,
    score_percentage DECIMAL(5,2) NOT NULL,
    duration_seconds INT NOT NULL,
    ai_feedback TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
    INDEX idx_quiz_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS quiz_answers (
    id VARCHAR(36) PRIMARY KEY,
    quiz_attempt_id VARCHAR(36) NOT NULL,
    question_id VARCHAR(36) NOT NULL,
    selected_option_index INT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INT DEFAULT 0,
    FOREIGN KEY (quiz_attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES assessment_questions(id) ON DELETE CASCADE,
    INDEX idx_quiz_answer_attempt (quiz_attempt_id)
) ENGINE=InnoDB;

-- 10. Study Timetables Table
CREATE TABLE IF NOT EXISTS study_timetables (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    subject_id VARCHAR(36) NOT NULL,
    topic_id VARCHAR(36) NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 45,
    activity_type ENUM('concept_study', 'practice_drill', 'revision', 'quiz_evaluation') NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    scheduled_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
    INDEX idx_timetable_user_date (user_id, day_of_week)
) ENGINE=InnoDB;

-- 11. Recommendations and Learning History Table
CREATE TABLE IF NOT EXISTS recommendations (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    topic_id VARCHAR(36) NOT NULL,
    recommendation_type ENUM('urgent_revision', 'next_progression', 'reinforcement_drill', 'advanced_challenge') NOT NULL,
    reason TEXT NOT NULL,
    priority INT DEFAULT 1,
    is_dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
    INDEX idx_recom_user (user_id, priority)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS learning_history (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    activity_title VARCHAR(200) NOT NULL,
    activity_type ENUM('assessment', 'practice', 'reading', 'ai_tutor_session', 'timetable_completed') NOT NULL,
    details JSON NULL,
    points_earned INT DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_history_user (user_id, created_at)
) ENGINE=InnoDB;
