'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, Mail, Shield, CheckCircle, XCircle, Key, Edit, Trash2, Loader2, Search, Filter, X, RefreshCcw, Eye } from 'lucide-react';
import Modal from './Modal';
import UserForm from './UserForm';
import PaginationWrapper from './PaginationWrapper';
import { useRouter, useSearchParams } from 'next/navigation';
import PermissionModal from './PermissionModal';
import AuditTrail from './AuditTrail';
import { useStatusModal } from './StatusModalContext';

import { UserData } from '@/lib/schemas';

interface UserRecord extends UserData {
  UserID: number;
  RoleName: string;
  IsDeleted: boolean;
  CreatedAt: string;
}

interface UserPermissions {
  CanView: boolean;
  CanAdd: boolean;
  CanEdit: boolean;
  CanDelete: boolean;
}

interface UsersRegistryProps {
  users: UserRecord[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
}

interface Role {
  RoleID: number;
  RoleName: string;
}

const UsersRegistry: React.FC<UsersRegistryProps> = ({ 
  users, 
  totalItems, 
  currentPage, 
  totalPages, 
  itemsPerPage 
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [roles, setRoles] = useState<Role[]>([]);
  
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [formData, setFormData] = useState<Partial<UserRecord>>({});
  const { showSuccess, showError, showConfirm, setLoading, hideModal } = useStatusModal();
  
  // RBAC State
  const [myPermissions, setMyPermissions] = useState<UserPermissions | null>(null);

  const hasActiveFilters = searchTerm || roleFilter || statusFilter;

  const fetchMyPermissions = useCallback(async () => {
    try {
      const res = await fetch('/api/rbac/permissions/me');
      if (res.ok) {
        const data = await res.json();
        const usersModule = data.find((p: { ModuleName: string }) => p.ModuleName === 'Users');
        setMyPermissions(usersModule || { CanView: true, CanAdd: false, CanEdit: false, CanDelete: false });
      }
    } catch (error) {
      console.error('Error fetching my permissions:', error);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch('/api/rbac/roles?limit=100');
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles || []);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  }, []);

  useEffect(() => {
    fetchMyPermissions();
    fetchRoles();
  }, [fetchMyPermissions, fetchRoles]);

  // Synchronize state with URL
  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
    setRoleFilter(searchParams.get('role') || '');
    setStatusFilter(searchParams.get('status') || '');
  }, [searchParams]);

  // Debounce search
  useEffect(() => {
    const currentSearch = searchParams.get('search') || '';
    if (searchTerm === currentSearch) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchTerm) params.set('search', searchTerm);
      else params.delete('search');
      params.set('page', '1');
      router.push(`?${params.toString()}`);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, router, searchParams]);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setRoleFilter(val);
    const params = new URLSearchParams(searchParams.toString());
    if (val) params.set('role', val);
    else params.delete('role');
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setStatusFilter(val);
    const params = new URLSearchParams(searchParams.toString());
    if (val) params.set('status', val);
    else params.delete('status');
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: Partial<UserRecord>) => ({ ...prev, [name]: value }));
  };

  const handleAddUser = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setFormData({});
        router.refresh();
        showSuccess('User Created', `User account for ${formData.FirstName} ${formData.LastName} has been successfully created.`);
      } else {
        const err = await res.json();
        showError('Registration Failed', err.error || 'Failed to add user account.');
      }
    } catch (error) {
      showError('System Error', 'An unexpected error occurred while adding the user.');
      console.error('Error adding user:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/users/${selectedUser.UserID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        setFormData({});
        router.refresh();
        showSuccess('User Updated', `Account information for ${formData.FirstName} ${formData.LastName} has been updated.`);
      } else {
        const err = await res.json();
        showError('Update Failed', err.error || 'Failed to update user account.');
      }
    } catch (error) {
      showError('System Error', 'An unexpected error occurred while updating the user.');
      console.error('Error updating user:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    showConfirm(
      'Confirm Deletion',
      `Are you sure you want to delete ${selectedUser.FirstName} ${selectedUser.LastName}? This will disable their access to the system immediately.`,
      async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/users/${selectedUser.UserID}`, {
            method: 'DELETE',
          });
          if (res.ok) {
            router.refresh();
            hideModal();
            setTimeout(() => {
              showSuccess('User Deleted', 'The user account has been successfully removed from the system registry.');
            }, 300);
          } else {
            showError('Deletion Failed', 'Failed to delete user account.');
          }
        } catch (error) {
          console.error('Error deleting user:', error);
          showError('System Error', 'An error occurred while deleting the user account.');
        } finally {
          setLoading(false);
        }
      },
      'Yes, Delete User'
    );
  };

  const openPermissionModal = (user: UserRecord) => {
    setSelectedUser(user);
    setIsPermissionModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">System Users</h2>
          <p className="text-sm text-slate-500 font-medium">Manage access controls and user permissions.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleRefresh}
            className={`p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-vmed-blue hover:border-vmed-blue/30 hover:shadow-sm transition-all ${isRefreshing ? 'bg-slate-50' : ''}`}
            title="Refresh Users"
          >
            <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {myPermissions?.CanAdd && (
            <button 
              onClick={() => {
                setFormData({});
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 h-10 bg-vmed-blue-dark text-white rounded-xl text-sm font-bold hover:bg-vmed-blue-light transition-all shadow-lg shadow-blue-200"
            >
              <UserPlus className="w-4 h-4" /> Add User
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-11 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[160px]">
            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={roleFilter}
              onChange={handleRoleChange}
              className="w-full pl-11 pr-10 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-600 font-medium appearance-none"
            >
              <option value="">All Roles</option>
              {roles.map(role => (
                <option key={role.RoleID} value={role.RoleID}>{role.RoleName}</option>
              ))}
            </select>
          </div>

          <div className="relative min-w-[160px]">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={handleStatusChange}
              className="w-full pl-11 pr-10 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-600 font-medium appearance-none"
            >
              <option value="">Status: All</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button 
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('');
                setStatusFilter('');
                const params = new URLSearchParams(searchParams.toString());
                params.delete('search');
                params.delete('role');
                params.delete('status');
                params.set('page', '1');
                router.push(`?${params.toString()}`);
              }}
              className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 border border-slate-200 rounded-xl transition-all hover:bg-red-50 group shadow-sm active:scale-95 animate-in fade-in zoom-in duration-200"
              title="Clear All Filters"
            >
              <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>
      </div>

      <div className="glass-panel overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium">
                    No user accounts found.
                  </td>
                </tr>
              ) : (
                users.map((user: UserRecord) => (
                  <tr key={user.UserID} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                           <span className="font-bold text-xs uppercase">{user.FirstName[0]}{user.LastName[0]}</span>
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-sm">{user.FirstName} {user.LastName}</div>
                          <div className="text-xs text-slate-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {user.Email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         <Shield className="w-3.5 h-3.5 text-vmed-blue-light" />
                         <span className="text-sm font-bold text-slate-700">{user.RoleName || 'Staff'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {!user.IsDeleted ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-vmed-green uppercase border border-emerald-100">
                          <CheckCircle className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-vmed-grey uppercase border border-slate-200">
                          <XCircle className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => {
                            setSelectedUser(user);
                            setIsViewModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {myPermissions?.CanEdit && (
                          <button 
                            onClick={() => openPermissionModal(user)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Edit Permissions Overrides"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                        )}
                        {myPermissions?.CanEdit && (
                          <button 
                            onClick={() => {
                              setSelectedUser(user);
                              setFormData({ ...user, Password: '' });
                              setIsEditModalOpen(true);
                            }}
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {myPermissions?.CanDelete && (
                          <button 
                            onClick={() => {
                              setSelectedUser(user);
                              handleDeleteUser();
                            }}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {!myPermissions?.CanEdit && !myPermissions?.CanDelete && (
                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No Actions</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <PaginationWrapper 
          currentPage={currentPage} 
          totalPages={totalPages} 
          totalItems={totalItems} 
          itemsPerPage={itemsPerPage} 
        />
      </div>

      {/* View User Modal */}
      <Modal 
        isOpen={isViewModalOpen} 
        onClose={() => setIsViewModalOpen(false)} 
        title="User Details"
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          <UserForm formData={selectedUser || {}} isReadOnly={true} />
          <AuditTrail resource="User" id={selectedUser?.UserID} />
        </div>
        <div className="mt-8 flex justify-end">
          <button 
            onClick={() => setIsViewModalOpen(false)} 
            className="px-6 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </Modal>

      {/* Add User Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New User">
        <UserForm formData={formData} onChange={handleFormChange} />
        <div className="mt-8 flex justify-end gap-3">
          <button onClick={() => setIsAddModalOpen(false)} className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={handleAddUser} disabled={isSaving} className="flex items-center gap-2 px-6 py-2 bg-vmed-blue-dark text-white rounded-xl font-bold hover:bg-vmed-blue-light transition-all shadow-lg shadow-blue-200 disabled:opacity-50">
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save User
          </button>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit User Information">
        <UserForm formData={formData} onChange={handleFormChange} isEdit={true} />
        <div className="mt-8 flex justify-end gap-3">
          <button onClick={() => setIsEditModalOpen(false)} className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={handleEditUser} disabled={isSaving} className="flex items-center gap-2 px-6 py-2 bg-vmed-blue-dark text-white rounded-xl font-bold hover:bg-vmed-blue-light transition-all shadow-lg shadow-blue-200 disabled:opacity-50">
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </Modal>

      {/* Permission Overrides Modal */}
      {selectedUser && (
        <PermissionModal 
          isOpen={isPermissionModalOpen}
          onClose={() => setIsPermissionModalOpen(false)}
          targetId={selectedUser.UserID}
          targetType="user"
          targetName={`${selectedUser.FirstName} ${selectedUser.LastName}`}
          userRoleId={selectedUser.RoleID}
        />
      )}
    </div>
  );
};

export default UsersRegistry;
