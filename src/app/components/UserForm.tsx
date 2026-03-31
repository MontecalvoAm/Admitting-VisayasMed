'use client';

import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Lock, Loader2, Info } from 'lucide-react';
import { InputField, SelectField } from './InputField';

interface UserFormProps {
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  isEdit?: boolean;
}

const UserForm: React.FC<UserFormProps> = ({ formData, onChange, isEdit = false }) => {
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setIsLoadingRoles(true);
    try {
      const res = await fetch('/api/rbac/roles');
      if (res.ok) {
        const data = await res.json();
        setRoles(data);
        
        // If it's a new user and no role is selected, select the first role as default or staff
        if (!isEdit && !formData.RoleID && data.length > 0) {
          const staffRole = data.find((r: any) => r.RoleName === 'Staff');
          const defaultRoleID = staffRole ? staffRole.RoleID : data[0].RoleID;
          
          // Manually trigger an onChange to set the default RoleID
          const event = {
            target: { 
              name: 'RoleID', 
              value: String(defaultRoleID) 
            }
          } as React.ChangeEvent<HTMLSelectElement>;
          onChange(event);
        }
      }
    } catch (err) {
      console.error('Error fetching roles for UserForm:', err);
    } finally {
      setIsLoadingRoles(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
          <Info className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-blue-900">
            {isEdit ? 'Update Account Information' : 'Create System Account'}
          </h4>
          <p className="text-xs text-blue-700 leading-relaxed font-medium">
            {isEdit 
              ? 'Modify the user details below. Changes to the system role will affect their default permissions immediately.'
              : 'Complete the fields to register a new user. Default access is determined by the selected System Role.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField 
          label="First Name" 
          name="FirstName" 
          value={formData.FirstName || ''} 
          onChange={onChange} 
          required 
          icon={User}
          className="bg-white"
        />
        <InputField 
          label="Last Name" 
          name="LastName" 
          value={formData.LastName || ''} 
          onChange={onChange} 
          required 
          icon={User}
          className="bg-white"
        />
      </div>

      <InputField 
        label="Email Address" 
        name="Email" 
        type="email" 
        value={formData.Email || ''} 
        onChange={onChange} 
        required 
        icon={Mail}
        className="bg-white"
      />

      {!isEdit && (
        <InputField 
          label="Password" 
          name="Password" 
          type="password" 
          value={formData.Password || ''} 
          onChange={onChange} 
          required 
          icon={Lock}
          className="bg-white"
        />
      )}

      {isLoadingRoles ? (
        <div className="h-[74px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
           <Loader2 className="w-4 h-4 animate-spin" /> Fetching Available Roles...
        </div>
      ) : (
        <SelectField
          label="System Role"
          name="RoleID"
          value={formData.RoleID ? String(formData.RoleID) : ''}
          onChange={onChange}
          required
          icon={Shield}
          options={roles.map(r => ({
            value: String(r.RoleID),
            label: r.RoleName
          }))}
          className="bg-white"
        />
      )}
    </div>
  );
};

export default UserForm;
