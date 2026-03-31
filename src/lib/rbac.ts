import pool from './db';
import { RowDataPacket } from 'mysql2';

export interface ModulePermission {
  ModuleID: number;
  ModuleName: string;
  ModulePath: string;
  CanView: boolean;
  CanAdd: boolean;
  CanEdit: boolean;
  CanDelete: boolean;
}

export async function getEffectivePermissions(userId: number, roleId: number): Promise<ModulePermission[]> {
  try {
    // 1. Fetch all modules
    const [modules] = await pool.query<RowDataPacket[]>(
      'SELECT ModuleID, ModuleName, ModulePath FROM M_Modules WHERE IsDeleted = false ORDER BY SortOrder'
    );

    // 2. Fetch role defaults
    const [rolePerms] = await pool.query<RowDataPacket[]>(
      'SELECT ModuleID, CanView, CanAdd, CanEdit, CanDelete FROM M_RolePermissions WHERE RoleID = ? AND IsDeleted = false',
      [roleId]
    );

    // 3. Fetch user overrides
    const [userPerms] = await pool.query<RowDataPacket[]>(
      'SELECT ModuleID, CanView, CanAdd, CanEdit, CanDelete FROM M_UserPermissions WHERE UserID = ? AND IsDeleted = false',
      [userId]
    );

    // 4. Merge permissions
    // Logic: If user override exists for a module, use it. Otherwise, use role default.
    const effective: ModulePermission[] = modules.map(mod => {
      const uPerm = userPerms.find(p => p.ModuleID === mod.ModuleID);
      const rPerm = rolePerms.find(p => p.ModuleID === mod.ModuleID);

      return {
        ModuleID: mod.ModuleID,
        ModuleName: mod.ModuleName,
        ModulePath: mod.ModulePath,
        CanView: !!(uPerm ? uPerm.CanView : rPerm?.CanView),
        CanAdd: !!(uPerm ? uPerm.CanAdd : rPerm?.CanAdd),
        CanEdit: !!(uPerm ? uPerm.CanEdit : rPerm?.CanEdit),
        CanDelete: !!(uPerm ? uPerm.CanDelete : rPerm?.CanDelete),
      };
    });

    return effective;
  } catch (error) {
    console.error('Error calculating effective permissions:', error);
    return [];
  }
}

/**
 * Check if a user has permission for a specific module and action
 */
export async function hasPermission(
  userId: number, 
  roleId: number, 
  moduleName: string, 
  action: 'View' | 'Add' | 'Edit' | 'Delete'
): Promise<boolean> {
  const perms = await getEffectivePermissions(userId, roleId);
  const modPerm = perms.find(p => p.ModuleName.toLowerCase() === moduleName.toLowerCase());
  
  if (!modPerm) return false;
  
  switch (action) {
    case 'View': return modPerm.CanView;
    case 'Add': return modPerm.CanAdd;
    case 'Edit': return modPerm.CanEdit;
    case 'Delete': return modPerm.CanDelete;
    default: return false;
  }
}
