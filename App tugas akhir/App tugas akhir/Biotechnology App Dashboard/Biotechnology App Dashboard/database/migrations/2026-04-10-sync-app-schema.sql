-- Migration: sync schema to full mode without users table
-- Date: 2026-04-10
-- Run against database: biotech_dashboard

USE biotech_dashboard;

-- ========================================
-- 1) Ensure organization core tables exist
-- ========================================
CREATE TABLE IF NOT EXISTS organizations (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_organizations_name (name),
    INDEX idx_organizations_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS organization_admins (
    id VARCHAR(50) PRIMARY KEY,
    organization_id VARCHAR(50) NOT NULL,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_org_admins_org_id (organization_id),
    INDEX idx_org_admins_username (username),
    INDEX idx_org_admins_username_active (username, is_active),
    UNIQUE KEY unique_admin_username (username),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS organization_teams (
    id VARCHAR(50) PRIMARY KEY,
    organization_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_org_teams_org_id (organization_id),
    UNIQUE KEY unique_org_team (organization_id, name),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS organization_members (
    id VARCHAR(50) PRIMARY KEY,
    organization_id VARCHAR(50) NOT NULL,
    team_id VARCHAR(50) NOT NULL,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_org_members_org_id (organization_id),
    INDEX idx_org_members_team_id (team_id),
    INDEX idx_org_members_username (username),
    INDEX idx_org_members_username_active (username, is_active),
    UNIQUE KEY unique_member_username (username),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES organization_teams(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- 2) Remove users-related foreign keys if present
-- ========================================
SET @fk_analyses_users = (
  SELECT kcu.constraint_name
  FROM information_schema.key_column_usage kcu
  WHERE kcu.table_schema = DATABASE()
    AND kcu.table_name = 'analyses'
    AND kcu.referenced_table_name = 'users'
  LIMIT 1
);
SET @sql_drop_fk_analyses_users = IF(
  @fk_analyses_users IS NULL,
  'SELECT "skip drop analyses->users fk"',
  CONCAT('ALTER TABLE analyses DROP FOREIGN KEY `', @fk_analyses_users, '`')
);
PREPARE stmt_drop_fk_analyses_users FROM @sql_drop_fk_analyses_users;
EXECUTE stmt_drop_fk_analyses_users;
DEALLOCATE PREPARE stmt_drop_fk_analyses_users;

SET @fk_uploads_users = (
  SELECT kcu.constraint_name
  FROM information_schema.key_column_usage kcu
  WHERE kcu.table_schema = DATABASE()
    AND kcu.table_name = 'file_uploads'
    AND kcu.referenced_table_name = 'users'
  LIMIT 1
);
SET @sql_drop_fk_uploads_users = IF(
  @fk_uploads_users IS NULL,
  'SELECT "skip drop file_uploads->users fk"',
  CONCAT('ALTER TABLE file_uploads DROP FOREIGN KEY `', @fk_uploads_users, '`')
);
PREPARE stmt_drop_fk_uploads_users FROM @sql_drop_fk_uploads_users;
EXECUTE stmt_drop_fk_uploads_users;
DEALLOCATE PREPARE stmt_drop_fk_uploads_users;

-- ========================================
-- 3) Drop users-only tables (not used in active flow)
-- ========================================
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS user_settings;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ========================================
-- 4) Ensure analysis/media tables exist without users dependency
-- ========================================
CREATE TABLE IF NOT EXISTS antibiotics (
    antibiotic_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT DEFAULT NULL,
    category VARCHAR(100) DEFAULT NULL,
    standard_dosage VARCHAR(100) DEFAULT NULL,
    resistance_threshold DECIMAL(5,2) DEFAULT NULL,
    sensitive_threshold DECIMAL(5,2) DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_antibiotics_name (name),
    INDEX idx_antibiotics_category (category),
    INDEX idx_antibiotics_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS analyses (
    id VARCHAR(50) PRIMARY KEY,
    organization_id VARCHAR(50) DEFAULT NULL,
    team_id VARCHAR(50) DEFAULT NULL,
    member_id VARCHAR(50) DEFAULT NULL,
    report_group_id VARCHAR(100) DEFAULT NULL,
    report_display_id VARCHAR(100) DEFAULT NULL,
    report_name VARCHAR(200) DEFAULT NULL,
    tags TEXT DEFAULT NULL,
    sample_id VARCHAR(100) DEFAULT NULL,
    bacteria_name VARCHAR(200) DEFAULT NULL,
    specimen_type VARCHAR(100) DEFAULT NULL,
    test_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'processing', 'completed', 'failed', 'archived') DEFAULT 'pending',
    diameter DECIMAL(5,2) DEFAULT NULL,
    antibiotic_a VARCHAR(100) DEFAULT NULL,
    antibiotic_a_desc TEXT DEFAULT NULL,
    antibiotic_a_result ENUM('resistant', 'susceptible', 'intermediate', 'indeterminate') DEFAULT NULL,
    antibiotic_b VARCHAR(100) DEFAULT NULL,
    antibiotic_b_desc TEXT DEFAULT NULL,
    antibiotic_b_result ENUM('resistant', 'susceptible', 'intermediate', 'indeterminate') DEFAULT NULL,
    original_image LONGTEXT DEFAULT NULL,
    processed_image LONGTEXT DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    technician VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_analyses_org_id (organization_id),
    INDEX idx_analyses_team_id (team_id),
    INDEX idx_analyses_member_id (member_id),
    INDEX idx_analyses_report_group_id (report_group_id),
    INDEX idx_analyses_status (status),
    INDEX idx_analyses_created_at (created_at),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
    FOREIGN KEY (team_id) REFERENCES organization_teams(id) ON DELETE SET NULL,
    FOREIGN KEY (member_id) REFERENCES organization_members(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Keep existing databases compatible with the report create/edit flow.
SET @has_report_group_col = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'analyses' AND column_name = 'report_group_id'
);
SET @sql_add_report_group_col = IF(
  @has_report_group_col = 0,
  'ALTER TABLE analyses ADD COLUMN report_group_id VARCHAR(100) DEFAULT NULL AFTER member_id',
  'SELECT "skip add analyses.report_group_id"'
);
PREPARE stmt_add_report_group_col FROM @sql_add_report_group_col;
EXECUTE stmt_add_report_group_col;
DEALLOCATE PREPARE stmt_add_report_group_col;

SET @has_report_display_col = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'analyses' AND column_name = 'report_display_id'
);
SET @sql_add_report_display_col = IF(
  @has_report_display_col = 0,
  'ALTER TABLE analyses ADD COLUMN report_display_id VARCHAR(100) DEFAULT NULL AFTER report_group_id',
  'SELECT "skip add analyses.report_display_id"'
);
PREPARE stmt_add_report_display_col FROM @sql_add_report_display_col;
EXECUTE stmt_add_report_display_col;
DEALLOCATE PREPARE stmt_add_report_display_col;

SET @has_report_name_col = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'analyses' AND column_name = 'report_name'
);
SET @sql_add_report_name_col = IF(
  @has_report_name_col = 0,
  'ALTER TABLE analyses ADD COLUMN report_name VARCHAR(200) DEFAULT NULL AFTER report_display_id',
  'SELECT "skip add analyses.report_name"'
);
PREPARE stmt_add_report_name_col FROM @sql_add_report_name_col;
EXECUTE stmt_add_report_name_col;
DEALLOCATE PREPARE stmt_add_report_name_col;

SET @has_tags_col = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'analyses' AND column_name = 'tags'
);
SET @sql_add_tags_col = IF(
  @has_tags_col = 0,
  'ALTER TABLE analyses ADD COLUMN tags TEXT DEFAULT NULL AFTER report_name',
  'SELECT "skip add analyses.tags"'
);
PREPARE stmt_add_tags_col FROM @sql_add_tags_col;
EXECUTE stmt_add_tags_col;
DEALLOCATE PREPARE stmt_add_tags_col;

SET @has_idx_analyses_report_group_id = (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'analyses' AND index_name = 'idx_analyses_report_group_id'
);
SET @sql_add_idx_analyses_report_group_id = IF(
  @has_idx_analyses_report_group_id = 0,
  'ALTER TABLE analyses ADD INDEX idx_analyses_report_group_id (report_group_id)',
  'SELECT "skip add idx_analyses_report_group_id"'
);
PREPARE stmt_add_idx_analyses_report_group_id FROM @sql_add_idx_analyses_report_group_id;
EXECUTE stmt_add_idx_analyses_report_group_id;
DEALLOCATE PREPARE stmt_add_idx_analyses_report_group_id;

CREATE TABLE IF NOT EXISTS results (
    result_id VARCHAR(50) PRIMARY KEY,
    analysis_id VARCHAR(50) NOT NULL,
    antibiotic_id VARCHAR(50) NOT NULL,
    measured_diameter DECIMAL(5,2) NOT NULL,
    interpretation ENUM('resistant', 'susceptible', 'intermediate', 'indeterminate') NOT NULL,
    confidence DECIMAL(5,2) DEFAULT NULL,
    zone_image LONGTEXT DEFAULT NULL,
    measured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT DEFAULT NULL,
    INDEX idx_results_analysis_id (analysis_id),
    INDEX idx_results_antibiotic_id (antibiotic_id),
    FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE,
    FOREIGN KEY (antibiotic_id) REFERENCES antibiotics(antibiotic_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS file_uploads (
    id VARCHAR(50) PRIMARY KEY,
    organization_id VARCHAR(50) DEFAULT NULL,
    member_id VARCHAR(50) DEFAULT NULL,
    analysis_id VARCHAR(50) DEFAULT NULL,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT DEFAULT NULL,
    mime_type VARCHAR(100) DEFAULT NULL,
    file_type VARCHAR(50) DEFAULT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_file_uploads_org_id (organization_id),
    INDEX idx_file_uploads_member_id (member_id),
    INDEX idx_file_uploads_analysis_id (analysis_id),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
    FOREIGN KEY (member_id) REFERENCES organization_members(id) ON DELETE SET NULL,
    FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS account_control_audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    actor_username VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type ENUM('admin', 'member', 'control') NOT NULL,
    target_id VARCHAR(50) DEFAULT NULL,
    target_username VARCHAR(100) DEFAULT NULL,
    organization_id VARCHAR(50) DEFAULT NULL,
    payload_json LONGTEXT DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_account_control_actor (actor_username),
    INDEX idx_account_control_target_type (target_type),
    INDEX idx_account_control_created_at (created_at),
    INDEX idx_account_control_org_id (organization_id),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  -- ========================================
  -- 4.5) Account control credentials (single row)
  -- ========================================
  CREATE TABLE IF NOT EXISTS account_control_credentials (
    id TINYINT UNSIGNED NOT NULL,
    username VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    token_secret VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- 5) Remove user_id columns if still present
-- ========================================
SET @has_analyses_user_col = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'analyses'
    AND column_name = 'user_id'
);
SET @sql_drop_analyses_user_col = IF(
  @has_analyses_user_col > 0,
  'ALTER TABLE analyses DROP COLUMN user_id',
  'SELECT "skip drop analyses.user_id"'
);
PREPARE stmt_drop_analyses_user_col FROM @sql_drop_analyses_user_col;
EXECUTE stmt_drop_analyses_user_col;
DEALLOCATE PREPARE stmt_drop_analyses_user_col;

SET @has_uploads_user_col = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'file_uploads'
    AND column_name = 'user_id'
);
SET @sql_drop_uploads_user_col = IF(
  @has_uploads_user_col > 0,
  'ALTER TABLE file_uploads DROP COLUMN user_id',
  'SELECT "skip drop file_uploads.user_id"'
);
PREPARE stmt_drop_uploads_user_col FROM @sql_drop_uploads_user_col;
EXECUTE stmt_drop_uploads_user_col;
DEALLOCATE PREPARE stmt_drop_uploads_user_col;

-- ========================================
-- 6) Create/refresh views
-- ========================================
DROP VIEW IF EXISTS v_org_account_summary;
DROP VIEW IF EXISTS v_recent_analyses;

CREATE VIEW v_org_account_summary AS
SELECT
    o.id AS organization_id,
    o.name AS organization_name,
    SUM(CASE WHEN a.id IS NOT NULL AND a.is_active = TRUE THEN 1 ELSE 0 END) AS active_admins,
    SUM(CASE WHEN m.id IS NOT NULL AND m.is_active = TRUE THEN 1 ELSE 0 END) AS active_members,
    COUNT(DISTINCT t.id) AS total_teams
FROM organizations o
LEFT JOIN organization_admins a ON a.organization_id = o.id
LEFT JOIN organization_teams t ON t.organization_id = o.id
LEFT JOIN organization_members m ON m.organization_id = o.id
GROUP BY o.id, o.name;

CREATE VIEW v_recent_analyses AS
SELECT
    a.id,
    a.organization_id,
    o.name AS organization_name,
    a.member_id,
    m.username AS member_username,
    a.bacteria_name,
    a.antibiotic_a,
    a.antibiotic_a_result,
    a.antibiotic_b,
    a.antibiotic_b_result,
    a.status,
    a.created_at
FROM analyses a
LEFT JOIN organizations o ON a.organization_id = o.id
LEFT JOIN organization_members m ON a.member_id = m.id
ORDER BY a.created_at DESC;

-- ========================================
-- 7) Seed antibiotics
-- ========================================
INSERT INTO antibiotics (antibiotic_id, name, description, category, resistance_threshold, sensitive_threshold)
VALUES
('AB001', 'Amoxicillin', 'Beta-lactam antibiotic used to treat bacterial infections', 'Beta-lactam', 13.00, 18.00),
('AB002', 'Ampicillin', 'Broad-spectrum penicillin antibiotic', 'Beta-lactam', 13.00, 17.00),
('AB003', 'Penicillin G', 'Natural penicillin for gram-positive bacteria', 'Beta-lactam', 14.00, 18.00),
('AB004', 'Cephalexin', 'First-generation cephalosporin', 'Cephalosporin', 14.00, 18.00),
('AB005', 'Ceftriaxone', 'Third-generation cephalosporin', 'Cephalosporin', 13.00, 21.00),
('AB006', 'Cefixime', 'Third-generation oral cephalosporin', 'Cephalosporin', 15.00, 19.00),
('AB007', 'Gentamicin', 'Aminoglycoside antibiotic', 'Aminoglycoside', 12.00, 15.00),
('AB008', 'Amikacin', 'Semi-synthetic aminoglycoside', 'Aminoglycoside', 14.00, 17.00),
('AB009', 'Streptomycin', 'First aminoglycoside discovered', 'Aminoglycoside', 11.00, 15.00),
('AB010', 'Ciprofloxacin', 'Second-generation fluoroquinolone', 'Fluoroquinolone', 15.00, 21.00),
('AB011', 'Levofloxacin', 'Third-generation fluoroquinolone', 'Fluoroquinolone', 13.00, 17.00),
('AB012', 'Norfloxacin', 'First-generation fluoroquinolone', 'Fluoroquinolone', 12.00, 17.00),
('AB013', 'Erythromycin', 'Macrolide antibiotic', 'Macrolide', 13.00, 23.00),
('AB014', 'Azithromycin', 'Azalide subclass of macrolide', 'Macrolide', 13.00, 18.00),
('AB015', 'Clarithromycin', 'Semi-synthetic macrolide', 'Macrolide', 13.00, 18.00),
('AB016', 'Tetracycline', 'Broad-spectrum polyketide antibiotic', 'Tetracycline', 14.00, 19.00),
('AB017', 'Doxycycline', 'Semi-synthetic tetracycline', 'Tetracycline', 12.00, 16.00),
('AB018', 'Vancomycin', 'Glycopeptide antibiotic for MRSA', 'Glycopeptide', 14.00, 17.00),
('AB019', 'Clindamycin', 'Lincosamide antibiotic', 'Lincosamide', 14.00, 21.00),
('AB020', 'Trimethoprim-Sulfamethoxazole', 'Combination antibiotic (Co-trimoxazole)', 'Sulfonamide', 10.00, 16.00),
('AB021', 'Chloramphenicol', 'Broad-spectrum antibiotic', 'Amphenicol', 12.00, 18.00),
('AB022', 'Metronidazole', 'Nitroimidazole antibiotic for anaerobes', 'Nitroimidazole', 12.00, 16.00),
('AB023', 'Nitrofurantoin', 'Antibiotic for urinary tract infections', 'Nitrofuran', 14.00, 17.00),
('AB024', 'Rifampicin', 'Antibiotic for tuberculosis', 'Rifamycin', 16.00, 20.00),
('AB025', 'Linezolid', 'Oxazolidinone antibiotic', 'Oxazolidinone', 20.00, 23.00)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    category = VALUES(category),
    resistance_threshold = VALUES(resistance_threshold),
    sensitive_threshold = VALUES(sensitive_threshold),
    is_active = TRUE,
    updated_at = CURRENT_TIMESTAMP;
