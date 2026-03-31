'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Plus, Key, Edit, Trash2, Loader2, Search, Mail, Filter, AlertTriangle, Save, X, ShieldAlert } from 'lucide-react';
import PermissionModal from './PermissionModal';
import Modal from './Modal';

interface Role {
  RoleID: number;
  RoleName: string;
  Description: string;
  UserCount: number;
}

const RolesRegistry: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // RBAC State
  const [myPermissions, setMyPermissions] = useState<any>(null);
  const [isPermsLoading, setIsPermsLoading] = useState(true);

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({ RoleName: '', Description: '' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRoles();
    fetchMyPermissions();
  }, []);

  const fetchMyPermissions = async () => {
    try {
      const res = await fetch('/api/rbac/permissions/me');
      if (res.ok) {
        const data = await res.json();
        // Look for 'Roles' module permissions
        const mod = data.find((p: any) => p.ModuleName === 'Roles');
        setMyPermissions(mod || { CanView: true, CanAdd: false, CanEdit: false, CanDelete: false });
      }
    } catch (error) {
      console.error('Error fetching my permissions for RolesRegistry:', error);
    } finally {
      setIsPermsLoading(false);
    }
  };

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/rbac/roles');
      const data = await res.json();
      setRoles(data);
    } catch (err) {
      console.error('Error fetching roles:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    if (!myPermissions?.CanAdd) return;
    setSelectedRole(null);
    setFormData({ RoleName: '', Description: '' });
    setError(null);
    setIsRoleModalOpen(true);
  };

  const handleOpenEdit = (role: Role) => {
    if (!myPermissions?.CanEdit) return;
    setSelectedRole(role);
    setFormData({ RoleName: role.RoleName, Description: role.Description || '' });
    setError(null);
    setIsRoleModalOpen(true);
  };

  const handleOpenDelete = (role: Role) => {
    if (!myPermissions?.CanDelete) return;
    setSelectedRole(role);
    setError(null);
    setIsDeleteModalOpen(true);
  };

  const handleSaveRole = async () => {
    if (!myPermissions?.CanAdd && !myPermissions?.CanEdit) return;
    if (!formData.RoleName.trim()) {
      setError('Role name is required.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const isEdit = !!selectedRole;
      const url = isEdit ? `/api/rbac/roles/${selectedRole.RoleID}` : '/api/rbac/roles';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsRoleModalOpen(false);
        fetchRoles();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save role.');
      }
    } catch (err) {
      console.error('Error saving role:', err);
      setError('Internal server error.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole || !myPermissions?.CanDelete) return;
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/rbac/roles/${selectedRole.RoleID}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setIsDeleteModalOpen(false);
        fetchRoles();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete role.');
      }
    } catch (err) {
      console.error('Error deleting role:', err);
      setError('Internal server error.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isPermsLoading && !myPermissions?.CanView) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <ShieldAlert className="w-16 h-16 mb-4 opacity-20" />
        <h3 className="text-xl font-bold">Access Denied</h3>
        <p className="text-sm">You do not have permission to view system roles.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">System Roles</h2>
          <p className="text-sm text-slate-500 font-medium">Define default permissions and access levels for each role.</p>
        </div>
        
        {!isPermsLoading && myPermissions?.CanAdd && (
          <button 
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 h-10 bg-vmed-blue-dark text-white rounded-xl text-sm font-bold hover:bg-vmed-blue-light transition-all shadow-lg shadow-blue-200"
          >
            <Plus className="w-4 h-4" /> Add Role
          </button>
        )}
      </div>

      <div className="glass-panel overflow-hidden rounded-2xl border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Users</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    Loading roles...
                  </td>
                </tr>
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium">
                    No roles found.
                  </td>
                </tr>
              ) : (
                roles.map((role: Role) => (
                  <tr key={role.RoleID} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                           <Shield className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-sm">{role.RoleName}</div>
                          <div className="text-[10px] text-blue-500 font-black uppercase tracking-wider">System Role</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-500 font-medium line-clamp-2 max-w-xs">{role.Description || 'No description provided.'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 w-fit">
                         <span className="text-xs font-bold">{role.UserCount}</span>
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Active Accounts</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        {!isPermsLoading && myPermissions?.CanEdit && (
                          <button 
                            onClick={() => {
                              setSelectedRole(role);
                              setIsPermissionModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg font-bold text-[10px] uppercase hover:bg-blue-600 hover:text-white transition-all border border-blue-100"
                            title="Manage Permissions"
                          >
                            <Key className="w-3 h-3" /> Permissions
                          </button>
                        )}
                        
                        {!isPermsLoading && myPermissions?.CanEdit && (
                          <button 
                            onClick={() => handleOpenEdit(role)}
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                            title="Edit Role"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        
                        {!isPermsLoading && myPermissions?.CanDelete && (
                          <button 
                            onClick={() => handleOpenDelete(role)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete Role"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        {!isPermsLoading && !myPermissions?.CanEdit && !myPermissions?.CanDelete && (
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No Actions</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Create/Edit Modal */}
      <Modal 
        isOpen={isRoleModalOpen} 
        onClose={() => setIsRoleModalOpen(false)} 
        title={selectedRole ? 'Edit Role' : 'Add New Role'}
        width="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Role Name</label>
            <input 
              value={formData.RoleName}
              onChange={(e) => setFormData({ ...formData, RoleName: e.target.value })}
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
              placeholder="e.g. Finance Officer"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Description</label>
            <textarea 
              value={formData.Description}
              onChange={(e) => setFormData({ ...formData, Description: e.target.value })}
              className="w-full h-24 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium resize-none"
              placeholder="Briefly describe the responsibilities of this role..."
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-bold">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <button 
              onClick={() => setIsRoleModalOpen(false)}
              className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveRole}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 bg-vmed-blue-dark text-white rounded-xl font-bold hover:bg-vmed-blue-light transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Saving...' : 'Save Role'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Role Delete Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        title="Confirm Deletion" 
        width="max-w-md"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h4 className="text-lg font-bold text-slate-800 mb-2">Delete Role?</h4>
          <p className="text-slate-500 text-sm">
            Are you sure you want to delete <span className="font-bold text-slate-700">{selectedRole?.RoleName}</span>? This action cannot be undone.
          </p>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold text-left flex items-center gap-2">
               <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-center gap-3">
          <button 
            onClick={() => setIsDeleteModalOpen(false)} 
            className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
          >
            No, Cancel
          </button>
          <button 
            onClick={handleDeleteRole} 
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Yes, Delete
          </button>
        </div>
      </Modal>

      {/* Permissions Modal */}
      {selectedRole && (
        <PermissionModal 
          isOpen={isPermissionModalOpen}
          onClose={() => setIsPermissionModalOpen(false)}
          targetId={selectedRole.RoleID}
          targetType="role"
          targetName={selectedRole.RoleName}
        />
      )}
    </div>
  );
};

export default RolesRegistry;
