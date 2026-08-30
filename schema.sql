-- D1 SQL Schema for Classroom Management System

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY,
  profile_data TEXT NOT NULL, -- JSON string containing semesters, currentSemesterId, etc.
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_semesters (
  user_id TEXT NOT NULL,
  semester_id TEXT NOT NULL,
  semester_data TEXT NOT NULL, -- JSON string containing classrooms, attendance, behaviors, etc.
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, semester_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

