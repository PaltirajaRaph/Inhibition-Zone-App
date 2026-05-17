-- Migration: persist report metadata in analyses
-- Date: 2026-05-17
-- Run against database: biotech_dashboard

USE biotech_dashboard;

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

SELECT 'Report metadata columns are ready.' AS message;