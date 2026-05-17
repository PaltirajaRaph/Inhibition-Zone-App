-- Migration: store Account Control credentials in MySQL
-- Date: 2026-04-28
-- Run against database: biotech_dashboard

USE biotech_dashboard;

-- Control account credentials (single-row table; always id=1)
CREATE TABLE IF NOT EXISTS account_control_credentials (
    id TINYINT UNSIGNED NOT NULL,
    username VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    token_secret VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
