'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Loader2, Save, X, Check, AlertCircle, Info } from 'lucide-react';
import Modal from './Modal';
import Pagination from './Pagination';

interface Permission {
  ModuleID: number;
  ModuleName?: string;
  CanView: boolean;
  CanAdd: boolean;
  CanEdit: boolean;
  CanDelete: boolean;
}

interface Module {
  ModuleID: number;
  ModuleName: string;
}

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: number;
  targetType: 'role' | 'user';
  targetName: string;
  userRoleId?: number; // Added to fetch baseline role permissions for user overrides
}

const PermissionModal: React.FC<PermissionModalProps> = ({
  isOpen,
  onClose,
  targetId,
  targetType,
  targetName,
  userRoleId,
}) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
    }
  }, [isOpen, targetId, targetType, userRoleId]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch modules first
      const modulesRes = await fetch('/api/rbac/modules');
      const modulesData = await modulesRes.json();
      setModules(modulesData);

      // 2. Fetch target permissions (Role or User Overrides)
      const endpoint = targetType === 'role' 
        ? `/api/rbac/roles/${targetId}/permissions`
        : `/api/rbac/users/${targetId}/permissions`;
      
      const permRes = await fetch(endpoint);
      const permData = await permRes.json();
      
      // 3. For Users, also fetch the Role's default permissions for context
      let roleDefaults: any[] = [];
      if (targetType === 'user' && userRoleId) {
        const roleRes = await fetch(`/api/rbac/roles/${userRoleId}/permissions`);
        if (roleRes.ok) {
          roleDefaults = await roleRes.json();
        }
      }
      
      // 4. Initialize permissions for all modules
      const initialPerms = modulesData.map((mod: Module) => {
        const userOverride = permData.find((p: any) => p.ModuleID === mod.ModuleID);
        const roleDefault = roleDefaults.find((p: any) => p.ModuleID === mod.ModuleID);
        
        // If it's a user override modal, start with user's overrides if they exist,
        // otherwise fall back to the role defaults so the admin is starting 
        // with the user's current effective state.
        
        if (targetType === 'user') {
          // If the user has specific overrides in the DB, use them
          if (userOverride) {
            return {
              ModuleID: mod.ModuleID,
              ModuleName: mod.ModuleName,
              CanView: !!userOverride.CanView,
              CanAdd: !!userOverride.CanAdd,
              CanEdit: !!userOverride.CanEdit,
              CanDelete: !!userOverride.CanDelete,
            };
          }
          // Otherwise, show the role defaults as the baseline
          return {
            ModuleID: mod.ModuleID,
            ModuleName: mod.ModuleName,
            CanView: !!roleDefault?.CanView,
            CanAdd: !!roleDefault?.CanAdd,
            CanEdit: !!roleDefault?.CanEdit,
            CanDelete: !!roleDefault?.CanDelete,
          };
        }

        // For Roles, just use existing role permissions
        return {
          ModuleID: mod.ModuleID,
          ModuleName: mod.ModuleName,
          CanView: !!userOverride?.CanView,
          CanAdd: !!userOverride?.CanAdd,
          CanEdit: !!userOverride?.CanEdit,
          CanDelete: !!userOverride?.CanDelete,
        };
      });
      
      setPermissions(initialPerms);
    } catch (err) {
      console.error('Error fetching permission data:', err);
      setError('Failed to load permission data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (moduleId: number, field: keyof Permission) => {
    setPermissions(prev => prev.map(p => {
      if (p.ModuleID === moduleId) {
        return { ...p, [field]: !p[field] };
      }
      return p;
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const endpoint = targetType === 'role' 
        ? `/api/rbac/roles/${targetId}/permissions`
        : `/api/rbac/users/${targetId}/permissions`;
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(permissions),
      });

      if (res.ok) {
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save permissions.');
      }
    } catch (err) {
      console.error('Error saving permissions:', err);
      setError('Internal server error.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Manage Permissions: ${targetName}`}
      width="max-w-3xl"
    >
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p className="font-medium">Loading permissions...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-red-500">
            <AlertCircle className="w-12 h-12 mb-4" />
            <p className="font-bold">{error}</p>
          </div>
        ) : (
          <>
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-blue-900">
                  {targetType === 'user' ? 'Individual User Override' : 'Default Role Access'}
                </h4>
                <p className="text-xs text-blue-700 leading-relaxed font-medium">
                  {targetType === 'user' 
                    ? `Specify the permissions for this user. The checkboxes reflect their current effective access (including role defaults) if no overrides are set.`
                    : 'Setting these permissions will apply to all users assigned to this role by default.'}
                </p>
              </div>
            </div>

            <div className="overflow-hidden border border-slate-100 rounded-2xl">
              <table className="w-full text-left table-fixed">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Module Name</th>
                    <th className="w-24 px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">View</th>
                    <th className="w-24 px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Add</th>
                    <th className="w-24 px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Edit</th>
                    <th className="w-24 px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {permissions
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((perm) => (
                    <tr key={perm.ModuleID} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-700 text-sm">{perm.ModuleName}</span>
                      </td>
                      {(['CanView', 'CanAdd', 'CanEdit', 'CanDelete'] as const).map((field) => (
                        <td key={field} className="px-4 py-4">
                          <div className="flex justify-center items-center">
                            <button
                              onClick={() => handleToggle(perm.ModuleID, field)}
                              className={`w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center ${
                                perm[field] 
                                  ? 'bg-vmed-blue-dark border-vmed-blue-dark text-white ring-2 ring-blue-100 ring-offset-1' 
                                  : 'bg-white border-slate-200 text-transparent hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5 stroke-[4.5px]" />
                            </button>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {permissions.length > 0 && (
              <div className="border border-slate-100 rounded-2xl overflow-hidden">
                <Pagination 
                  currentPage={currentPage}
                  totalPages={Math.ceil(permissions.length / itemsPerPage)}
                  onPageChange={setCurrentPage}
                  onLimitChange={(limit) => {
                    setItemsPerPage(limit);
                    setCurrentPage(1);
                  }}
                  totalItems={permissions.length}
                  itemsPerPage={itemsPerPage}
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button 
                onClick={onClose} 
                className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button 
                onClick={handleSave} 
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-vmed-blue-dark text-white rounded-xl font-bold hover:bg-vmed-blue-light transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? 'Saving Changes...' : 'Save Permissions'}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default PermissionModal;
