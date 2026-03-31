'use client';

import React, { useState, useEffect } from 'react';
import { Search, Download, Plus, Calendar, Loader2, X, ShieldAlert } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Modal from './Modal';
import PatientForm from './PatientForm';

const PatientsRegistryHeader = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [dateFilter, setDateFilter] = useState(searchParams.get('date') || '');
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newPatient, setNewPatient] = useState<any>({});
  
  // RBAC State
  const [permissions, setPermissions] = useState<any>(null);
  const [isLoadingPerms, setIsLoadingPerms] = useState(true);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const res = await fetch('/api/rbac/permissions/me');
      if (res.ok) {
        const data = await res.json();
        const mod = data.find((p: any) => p.ModuleName === 'Patients');
        setPermissions(mod || { CanView: true, CanAdd: false, CanEdit: false, CanDelete: false });
      }
    } catch (err) {
      console.error('Error fetching permissions:', err);
    } finally {
      setIsLoadingPerms(false);
    }
  };

  // Synchronize state with URL when back/forward navigation occurs
  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
    setDateFilter(searchParams.get('date') || '');
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

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDateFilter(val);
    const params = new URLSearchParams(searchParams.toString());
    if (val) params.set('date', val);
    else params.delete('date');
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const handlePatientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewPatient((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSavePatient = async () => {
    if (!permissions?.CanAdd) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPatient),
      });
      if (res.ok) {
        setIsAdmitModalOpen(false);
        setNewPatient({});
        router.refresh();
      } else {
        const errorData = await res.json();
        alert(`Failed to admit patient: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error admitting patient:', error);
      alert('An error occurred while admitting the patient.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Patients Registry</h2>
          <p className="text-sm text-slate-500 font-medium">Manage and view all admitted patients information.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 h-10 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm">
            <Download className="w-4 h-4" /> Export
          </button>
          
          {!isLoadingPerms && permissions?.CanAdd && (
            <button 
              onClick={() => {
                setNewPatient({});
                setIsAdmitModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 h-10 bg-vmed-blue-dark text-white rounded-xl text-sm font-bold hover:bg-vmed-blue-light transition-all shadow-lg shadow-blue-200"
            >
              <Plus className="w-4 h-4" /> Admit Patient
            </button>
          )}
          
          {!isLoadingPerms && !permissions?.CanAdd && (
            <div className="flex items-center gap-2 px-4 h-10 bg-slate-100 text-slate-400 rounded-xl text-sm font-bold cursor-not-allowed border border-slate-200">
               <ShieldAlert className="w-4 h-4" /> Restricted
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name or physician..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-11 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-slate-500 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2 min-w-[200px]">
          <div className="relative flex-1">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input 
              type="date" 
              value={dateFilter}
              onChange={handleDateChange}
              className="w-full pl-11 pr-11 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-600 font-medium"
            />
            {dateFilter && (
              <button 
                onClick={() => {
                  setDateFilter('');
                  const params = new URLSearchParams(searchParams.toString());
                  params.delete('date');
                  params.set('page', '1');
                  router.push(`?${params.toString()}`);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-slate-500 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button 
            onClick={() => {
              setSearchTerm('');
              setDateFilter('');
              router.push('?');
            }}
            className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 border border-slate-200 rounded-xl transition-all hover:bg-red-50 group shadow-sm active:scale-95"
            title="Clear All Filters"
          >
            <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* Admit Patient Modal */}
      <Modal 
        isOpen={isAdmitModalOpen} 
        onClose={() => setIsAdmitModalOpen(false)} 
        title="Admit New Patient"
      >
        <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
           <p className="text-sm text-vmed-blue-dark font-medium">Enter patient details below to create a new admission record. For existing patients, please ensure biographical details match to link records.</p>
        </div>
        <PatientForm formData={newPatient} onChange={handlePatientChange} />
        <div className="mt-8 flex justify-end gap-3">
          <button 
            onClick={() => setIsAdmitModalOpen(false)}
            className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSavePatient}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-vmed-blue-dark text-white rounded-xl font-bold hover:bg-vmed-blue-light transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Admit Patient
          </button>
        </div>
      </Modal>
    </>
  );
};

export default PatientsRegistryHeader;
