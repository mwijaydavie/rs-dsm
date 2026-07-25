-- ============================================================
-- ROAD ACCIDENT HOTSPOT SYSTEM - DATABASE MIGRATION V2
-- ============================================================
-- This migration runs on PostgreSQL with PostGIS (production)
-- For SQLite (development), use Django migrations instead.
--
-- IMPORTANT: All existing accident data is preserved.
-- Only ADD new tables and columns, never MODIFY or DROP.
-- ============================================================

-- 1. Create users table for role-based authentication
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'TANROADS_OFFICER', 'TRAFFIC_POLICE')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by INTEGER REFERENCES users(user_id),
    approved_at TIMESTAMP
);

-- 2. Add new columns to existing accidents table
ALTER TABLE accidents ADD COLUMN IF NOT EXISTS reporter_name VARCHAR(100) NOT NULL DEFAULT 'Unknown';
ALTER TABLE accidents ADD COLUMN IF NOT EXISTS reporter_phone VARCHAR(20) NOT NULL DEFAULT '0000000000';
ALTER TABLE accidents ADD COLUMN IF NOT EXISTS photo_path VARCHAR(255) NOT NULL DEFAULT '/uploads/no-photo.jpg';

-- 3. Create default admin account
-- Username: admin
-- Password: Admin@2025 (BCrypt hashed)
INSERT INTO users (username, password_hash, full_name, email, phone, role, status)
VALUES (
    'admin',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'System Administrator',
    'admin@rahmas.co.tz',
    '0700000000',
    'ADMIN',
    'APPROVED'
);

-- 4. Create sessions table (optional, if not using in-memory sessions)
CREATE TABLE IF NOT EXISTS sessions (
    session_id VARCHAR(255) PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    ip_address VARCHAR(45)
);

-- 5. Create login_attempts table for rate limiting
CREATE TABLE IF NOT EXISTS login_attempts (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50),
    ip_address VARCHAR(45),
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN
);

-- ============================================================
-- For SQLite/Django: The Python migration below handles
-- the same schema changes through Django's ORM
-- ============================================================