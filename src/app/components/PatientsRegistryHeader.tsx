'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Calendar, Loader2, X, ShieldAlert, RefreshCcw, Filter } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Modal from './Modal';
import PatientForm from './PatientForm';

import { AdmitData } from '@/lib/schemas';

interface PatientPermissions {
  CanView: boolean;
  CanAdd: boolean;
  CanEdit: boolean;
  CanDelete: boolean;
}

const PatientsRegistryHeader = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [dateFilter, setDateFilter] = useState(searchParams.get('date') || '');
  const [caseTypeFilter, setCaseTypeFilter] = useState(searchParams.get('caseType') || '');
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newPatient, setNewPatient] = useState<Partial<AdmitData>>({});

  // RBAC State
  const [permissions, setPermissions] = useState<PatientPermissions | null>(null);
  const [isLoadingPerms, setIsLoadingPerms] = useState(true);

  const hasActiveFilters = searchTerm || dateFilter || caseTypeFilter;

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const res = await fetch('/api/rbac/permissions/me');
      if (res.ok) {
        const data = await res.json();
        const mod = data.find((p: { ModuleName: string }) => p.ModuleName === 'Patients');
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
    setCaseTypeFilter(searchParams.get('caseType') || '');
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

  const handleCaseTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setCaseTypeFilter(val);
    const params = new URLSearchParams(searchParams.toString());
    if (val) params.set('caseType', val);
    else params.delete('caseType');
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handlePatientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewPatient((prev) => ({ ...prev, [name]: value }));
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">Patients Registry</h2>
          <p className="text-xs md:text-sm text-slate-500 font-medium tracking-tight">Manage and view all admitted patients information.</p>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            suppressHydrationWarning
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 h-11 md:h-10 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-vmed-blue-light' : ''}`} />
            <span className="inline">Refresh</span>
          </button>

          {!isLoadingPerms && permissions?.CanAdd && (
            <button
              onClick={() => {
                setNewPatient({});
                setIsAdmitModalOpen(true);
              }}
              suppressHydrationWarning
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 h-11 md:h-10 bg-vmed-blue-dark text-white rounded-xl text-sm font-bold hover:bg-vmed-blue-light transition-all shadow-lg shadow-blue-200 active:scale-95"
            >
              <Plus className="w-4 h-4" /> 
              <span className="whitespace-nowrap">Admit Patient</span>
            </button>
          )}

          {!isLoadingPerms && !permissions?.CanAdd && (
            <div className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 h-11 md:h-10 bg-slate-100 text-slate-400 rounded-xl text-sm font-bold cursor-not-allowed border border-slate-200">
              <ShieldAlert className="w-4 h-4" /> Restricted
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or physician..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            suppressHydrationWarning
            className="w-full pl-11 pr-11 py-2.5 md:py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
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

        <div className="flex flex-row items-center gap-2 md:gap-3">
          <div className="relative flex-1 md:min-w-[160px]">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={dateFilter}
              onChange={handleDateChange}
              suppressHydrationWarning
              className="w-full pl-11 pr-4 py-2.5 md:py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-600 font-medium"
            />
          </div>

          <div className="relative flex-1 md:min-w-[160px]">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={caseTypeFilter}
              onChange={handleCaseTypeChange}
              suppressHydrationWarning
              className="w-full pl-11 pr-10 py-2.5 md:py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-600 font-medium appearance-none"
            >
              <option value="">All Types</option>
              <option value="Private">Private</option>
              <option value="Charity">Charity</option>
              <option value="General">General</option>
              <option value="Package">Package</option>
              <option value="Project Case">Project Case</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearchTerm('');
                setDateFilter('');
                setCaseTypeFilter('');
                router.push('?');
              }}
              className="p-3 md:p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 border border-slate-200 rounded-xl transition-all hover:bg-red-50 group shadow-sm active:scale-95 animate-in fade-in zoom-in duration-200"
              title="Clear All Filters"
            >
              <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>
          )}
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
