CREATE DATABASE IF NOT EXISTS copa_bolao;

USE copa_bolao;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  profile_photo VARCHAR(500) NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  email_verified TINYINT(1) NOT NULL DEFAULT 0,
  blocked TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS matches (
  id CHAR(36) PRIMARY KEY,
  date DATE NOT NULL,
  time_brasilia TIME NOT NULL,
  starts_at_utc DATETIME NOT NULL,
  phase VARCHAR(80) NOT NULL,
  group_name VARCHAR(40) NULL,
  team_a VARCHAR(100) NOT NULL,
  team_b VARCHAR(100) NOT NULL,
  stadium VARCHAR(160) NULL,
  city VARCHAR(120) NULL,
  official_score_a INT NULL,
  official_score_b INT NULL,
  status ENUM('scheduled', 'closed', 'finished') NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_matches_starts_at (starts_at_utc),
  INDEX idx_matches_phase (phase),
  INDEX idx_matches_group (group_name)
);

CREATE TABLE IF NOT EXISTS predictions (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  match_id CHAR(36) NOT NULL,
  predicted_score_a INT NOT NULL,
  predicted_score_b INT NOT NULL,
  points INT NOT NULL DEFAULT 0,
  exact_hit TINYINT(1) NOT NULL DEFAULT 0,
  outcome_hit TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_prediction_user_match (user_id, match_id),
  CONSTRAINT fk_predictions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_predictions_match FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  match_id CHAR(36) NOT NULL,
  email_sent TINYINT(1) NOT NULL DEFAULT 0,
  sent_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_notification_user_match (user_id, match_id),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_match FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
);
