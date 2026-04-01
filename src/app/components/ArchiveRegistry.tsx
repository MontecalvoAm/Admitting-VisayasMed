'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { 
  Search, 
  RefreshCw, 
  Trash2, 
  User, 
  Users as PatientsIcon,
  AlertTriangle,
  Loader2,
  MoreVertical,
  Calendar,
  Mail,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import Pagination from './Pagination';
import { useStatusModal } from './StatusModalContext';

interface ArchiveRegistryProps {
  initialType: 'users' | 'patients';
}

const ArchiveRegistry: React.FC<ArchiveRegistryProps> = ({ initialType }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'patients'>(initialType);
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  const { showSuccess, showError, showConfirm, setLoading, hideModal } = useStatusModal();

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchData = async (type: 'users' | 'patients', page: number, limit: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/archive?type=${type}&page=${page}&limit=${limit}`);
      if (res.ok) {
        const result = await res.json();
        setData(result.data);
        setTotalItems(result.totalItems);
        setTotalPages(result.totalPages);
      } else {
        showError('Fetch Error', `Failed to fetch archived ${type}`);
      }
    } catch (error) {
      console.error('Error fetching archive:', error);
      showError('Connection Error', 'Internal server error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeTab, currentPage, itemsPerPage);
  }, [activeTab, currentPage, itemsPerPage]);

  const handleRestore = async (id: string | number, name: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/archive/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: activeTab, id }),
      });

      if (res.ok) {
        setData(data.filter(item => (activeTab === 'users' ? item.UserID : item.Id).toString() !== id.toString()));
        hideModal();
        setTimeout(() => {
          showSuccess('Record Restored', `${activeTab === 'users' ? 'User' : 'Patient'} "${name}" has been successfully restored to the active registry.`);
        }, 300);
      } else {
        const error = await res.json();
        showError('Restoration Failed', error.error || 'Failed to restore record');
      }
    } catch (error) {
      showError('Network Error', 'A connection error occurred while trying to restore the record.');
    } finally {
      setLoading(false);
    }
  };

  const handlePermanentDelete = async (id: string | number, name: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/archive/permanent', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: activeTab, id }),
      });

      if (res.ok) {
        setData(data.filter(item => (activeTab === 'users' ? item.UserID : item.Id).toString() !== id.toString()));
        hideModal();
        setTimeout(() => {
          showSuccess('Record Purged', `The ${activeTab === 'users' ? 'User' : 'Patient'} "${name}" has been permanently removed from the system.`);
        }, 300);
      } else {
        const error = await res.json();
        showError('Action Failed', error.error || 'Failed to delete record');
      }
    } catch (error) {
      showError('Network Error', 'A connection error occurred while trying to purge the record.');
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter(item => {
    const search = searchQuery.toLowerCase();
    if (activeTab === 'users') {
      return (
        (item.FirstName?.toLowerCase().includes(search) ?? false) ||
        (item.LastName?.toLowerCase().includes(search) ?? false) ||
        (item.Email?.toLowerCase().includes(search) ?? false)
      );
    } else {
      return (
        (item.GivenName?.toLowerCase().includes(search) ?? false) ||
        (item.LastName?.toLowerCase().includes(search) ?? false)
      );
    }
  });

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">System Archive</h1>
          <p className="text-sm font-medium text-slate-500">Manage soft-deleted records and data restoration</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group min-w-[300px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder={`Search deleted ${activeTab}...`}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all font-medium text-sm shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100/50 rounded-2xl w-fit border border-slate-200">
        <button 
          onClick={() => {
            setActiveTab('users');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'users' 
              ? 'bg-white text-blue-600 shadow-sm border border-slate-100' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
          }`}
        >
          <User className="w-4 h-4" />
          Deleted Users
        </button>
        <button 
          onClick={() => {
            setActiveTab('patients');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'patients' 
              ? 'bg-white text-blue-600 shadow-sm border border-slate-100' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
          }`}
        >
          <PatientsIcon className="w-4 h-4" />
          Deleted Patients
        </button>
      </div>

      {/* Content Table */}
      <div className="glass-panel border rounded-3xl overflow-hidden shadow-sm bg-white/40 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-wider">{activeTab === 'users' ? 'User Info' : 'Patient Name'}</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-wider">Deleted Date</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading archive data...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-500 font-medium italic">
                    <div className="flex flex-col items-center gap-2 opacity-40">
                      <ShieldAlert className="w-12 h-12 mb-2" />
                      <p>No deleted records found in this category.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => {
                  const id = activeTab === 'users' ? item.UserID : item.Id;
                  const name = activeTab === 'users' 
                    ? `${item.FirstName} ${item.LastName}` 
                    : `${item.LastName}, ${item.GivenName}`;
                  
                  return (
                    <tr key={`${activeTab}-${id || index}`} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                            {activeTab === 'users' ? <User className="w-5 h-5" /> : <PatientsIcon className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{name}</p>
                            <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                              {activeTab === 'users' ? (
                                <><Mail className="w-3 h-3" /> {item.Email}</>
                              ) : (
                                <><Calendar className="w-3 h-3" /> Born: {item.Birthday ? new Date(item.Birthday).toLocaleDateString() : 'N/A'}</>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600 font-semibold">
                          <ShieldAlert className="w-4 h-4 text-orange-400" />
                          {item.DeletedAt ? (
                            <>
                              {new Date(item.DeletedAt).toLocaleDateString()} at {new Date(item.DeletedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </>
                          ) : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => showConfirm(
                              'Restore Record',
                              `Are you sure you want to restore ${name} to the active registry?`,
                              () => handleRestore(id, name),
                              'Restore Now'
                            )}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Restore Record"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Restore
                          </button>
                          <button 
                            onClick={() => showConfirm(
                              'Permanent Purge',
                              `Are you absolutely sure you want to permanently delete ${name}? This action cannot be undone.`,
                              () => handlePermanentDelete(id, name),
                              'Purge Forever'
                            )}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete Permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Purge
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onLimitChange={(limit) => {
            setItemsPerPage(limit);
            setCurrentPage(1);
          }}
        />
      </div>

    </div>
  );
};

export default ArchiveRegistry;
