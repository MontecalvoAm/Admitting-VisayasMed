-- Add Archive Module if it doesn't exist
INSERT INTO M_Modules (ModuleName, ModulePath, Icon, SortOrder, CreatedBy)
SELECT 'Archive', '/dashboard/archive', 'Archive', 7, 'System'
WHERE NOT EXISTS (SELECT 1 FROM M_Modules WHERE ModuleName = 'Archive');

-- Get the ModuleID for Archive
SET @ArchiveModuleID = (SELECT ModuleID FROM M_Modules WHERE ModuleName = 'Archive');

-- Set permissions for Super Admin (RoleID 1)
INSERT INTO M_RolePermissions (RoleID, ModuleID, CanView, CanAdd, CanEdit, CanDelete, CreatedBy)
SELECT 1, @ArchiveModuleID, 1, 1, 1, 1, 'System'
WHERE NOT EXISTS (SELECT 1 FROM M_RolePermissions WHERE RoleID = 1 AND ModuleID = @ArchiveModuleID);

-- Set permissions for Admin (RoleID 2) - CanView, CanEdit(Restore), CanDelete(Permanent)
INSERT INTO M_RolePermissions (RoleID, ModuleID, CanView, CanAdd, CanEdit, CanDelete, CreatedBy)
SELECT 2, @ArchiveModuleID, 1, 0, 1, 1, 'System'
WHERE NOT EXISTS (SELECT 1 FROM M_RolePermissions WHERE RoleID = 2 AND ModuleID = @ArchiveModuleID);
