'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, Settings, Mail, Shield, CheckCircle, XCircle, Key, Edit, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import UserForm from './UserForm';
import PaginationWrapper from './PaginationWrapper';
import { useRouter } from 'next/navigation';
import PermissionModal from './PermissionModal';

interface UsersRegistryProps {
  users: any[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
}

const UsersRegistry: React.FC<UsersRegistryProps> = ({ 
  users, 
  totalItems, 
  currentPage, 
  totalPages, 
  itemsPerPage 
}) => {
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  
  // RBAC State
  const [myPermissions, setMyPermissions] = useState<any>(null);
  const [isPermsLoading, setIsPermsLoading] = useState(true);

  useEffect(() => {
    fetchMyPermissions();
  }, []);

  const fetchMyPermissions = async () => {
    try {
      const res = await fetch('/api/rbac/permissions/me');
      if (res.ok) {
        const data = await res.json();
        const usersModule = data.find((p: any) => p.ModuleName === 'Users');
        setMyPermissions(usersModule || { CanView: true, CanAdd: false, CanEdit: false, CanDelete: false });
      }
    } catch (error) {
      console.error('Error fetching my permissions:', error);
    } finally {
      setIsPermsLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
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
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add user');
      }
    } catch (error) {
      console.error('Error adding user:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditUser = async () => {
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
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/users/${selectedUser.UserID}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setIsDeleteModalOpen(false);
        router.refresh();
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const openPermissionModal = (user: any) => {
    setSelectedUser(user);
    setIsPermissionModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">System Users</h2>
          <p className="text-sm text-slate-500 font-medium">Manage access controls and user permissions.</p>
        </div>
        
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
                users.map((user: any) => (
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
                              setFormData({ ...user });
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
                              setIsDeleteModalOpen(true);
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

      {/* Delete User Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion" width="max-w-md">
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h4 className="text-lg font-bold text-slate-800 mb-2">Delete User?</h4>
          <p className="text-slate-500 text-sm">
            Are you sure you want to delete <span className="font-bold text-slate-700">{selectedUser?.FirstName} {selectedUser?.LastName}</span>? This will disable their access to the system.
          </p>
        </div>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={() => setIsDeleteModalOpen(false)} className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors">No, Cancel</button>
          <button onClick={handleDeleteUser} disabled={isSaving} className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200 disabled:opacity-50">
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            Yes, Delete
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
