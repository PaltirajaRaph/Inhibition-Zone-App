-- Migration: enforce global username uniqueness for admin/member accounts
-- Run against database: biotech_dashboard

USE biotech_dashboard;

-- 1) Audit duplicates inside each table (case-insensitive)
SELECT LOWER(username) AS username_key, COUNT(*) AS total
FROM organization_admins
GROUP BY LOWER(username)
HAVING COUNT(*) > 1;

SELECT LOWER(username) AS username_key, COUNT(*) AS total
FROM organization_members
GROUP BY LOWER(username)
HAVING COUNT(*) > 1;

-- 2) Audit duplicates across admin/member tables (case-insensitive)
SELECT username_key, COUNT(*) AS total
FROM (
  SELECT LOWER(username) AS username_key FROM organization_admins
  UNION ALL
  SELECT LOWER(username) AS username_key FROM organization_members
) account_usernames
GROUP BY username_key
HAVING COUNT(*) > 1;

-- If queries above return rows, fix duplicates first before applying unique constraints.

-- 3) Remove old per-organization unique indexes if they exist
SET @drop_admin_idx = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'organization_admins'
        AND index_name = 'unique_org_admin'
    ),
    'ALTER TABLE organization_admins DROP INDEX unique_org_admin',
    'SELECT "skip drop unique_org_admin"'
  )
);
PREPARE stmt_drop_admin FROM @drop_admin_idx;
EXECUTE stmt_drop_admin;
DEALLOCATE PREPARE stmt_drop_admin;

SET @drop_member_idx = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'organization_members'
        AND index_name = 'unique_org_member'
    ),
    'ALTER TABLE organization_members DROP INDEX unique_org_member',
    'SELECT "skip drop unique_org_member"'
  )
);
PREPARE stmt_drop_member FROM @drop_member_idx;
EXECUTE stmt_drop_member;
DEALLOCATE PREPARE stmt_drop_member;

-- 4) Add global unique username constraints if not yet present
SET @add_admin_unique = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'organization_admins'
        AND index_name = 'unique_admin_username'
    ),
    'SELECT "skip add unique_admin_username"',
    'ALTER TABLE organization_admins ADD UNIQUE KEY unique_admin_username (username)'
  )
);
PREPARE stmt_add_admin_unique FROM @add_admin_unique;
EXECUTE stmt_add_admin_unique;
DEALLOCATE PREPARE stmt_add_admin_unique;

SET @add_member_unique = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'organization_members'
        AND index_name = 'unique_member_username'
    ),
    'SELECT "skip add unique_member_username"',
    'ALTER TABLE organization_members ADD UNIQUE KEY unique_member_username (username)'
  )
);
PREPARE stmt_add_member_unique FROM @add_member_unique;
EXECUTE stmt_add_member_unique;
DEALLOCATE PREPARE stmt_add_member_unique;
