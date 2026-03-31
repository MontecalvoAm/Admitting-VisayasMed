-- Create M_AuditLogs table for centralized tracking
CREATE TABLE IF NOT EXISTS M_AuditLogs (
    LogID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT,
    UserName VARCHAR(150),
    Action VARCHAR(100) NOT NULL, -- LOGIN, LOGOUT, CREATE, UPDATE, DELETE, PRINT, etc.
    Resource VARCHAR(100), -- Patient, User, Role, Form, etc.
    ResourceID VARCHAR(100), -- ID of the affected record
    Details TEXT, -- Short description or JSON string of changes
    IPAddress VARCHAR(45),
    UserAgent TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES M_Users(UserID) ON DELETE SET NULL
);

-- Indexing for faster lookups
CREATE INDEX idx_audit_created_at ON M_AuditLogs(CreatedAt);
CREATE INDEX idx_audit_action ON M_AuditLogs(Action);
CREATE INDEX idx_audit_resource ON M_AuditLogs(Resource);
CREATE INDEX idx_audit_user_id ON M_AuditLogs(UserID);

-- Add 'Logs' module to RBAC
INSERT INTO M_Modules (ModuleName, ModulePath, SortOrder, CreatedBy)
SELECT 'Logs', '/dashboard/logs', 10, 'System'
WHERE NOT EXISTS (SELECT 1 FROM M_Modules WHERE ModuleName = 'Logs');

-- Grant 'View' permission for 'Logs' to Super Admin role
-- Assumes Super Admin RoleID is 1 (based on create_auth_tables.sql seeding)
INSERT INTO M_RolePermissions (RoleID, ModuleID, CanView, CanAdd, CanEdit, CanDelete, CreatedBy)
SELECT 1, ModuleID, 1, 0, 0, 0, 'System'
FROM M_Modules
WHERE ModuleName = 'Logs'
AND NOT EXISTS (
    SELECT 1 FROM M_RolePermissions rp 
    JOIN M_Modules m ON rp.ModuleID = m.ModuleID 
    WHERE rp.RoleID = 1 AND m.ModuleName = 'Logs'
);
