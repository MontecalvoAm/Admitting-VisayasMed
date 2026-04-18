-- scripts/create_db_user.sql
-- Run this script as the root MySQL user to create a least-privileged account for the application.

-- 1. Create the user (Replace 'SecureAppPassword123!' with a strong password)
CREATE USER IF NOT EXISTS 'admitting_user'@'localhost' IDENTIFIED BY 'SecureAppPassword123!';

-- 2. Revoke all privileges by default
REVOKE ALL PRIVILEGES, GRANT OPTION FROM 'admitting_user'@'localhost';

-- 3. Grant ONLY Data Manipulation Language (DML) privileges on the specific database
GRANT SELECT, INSERT, UPDATE ON admitting_db.* TO 'admitting_user'@'localhost';

-- Note: We intentionally do NOT grant DELETE privileges unless the app strictly requires hard deletes. 
-- Assuming IsDeleted = true is used for soft deletes.
-- We also do NOT grant DROP, CREATE, ALTER to prevent structural damage.

FLUSH PRIVILEGES;
