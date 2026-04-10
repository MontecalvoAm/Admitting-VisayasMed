'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  RefreshCcw, 
  Activity,
  Calendar,
  Printer,
  LogIn,
  LogOut,
  PlusCircle,
  Edit,
  Trash2,
  Database,
  Info
} from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import PaginationWrapper from '@/app/components/PaginationWrapper';
// Remove date-fns import
// import { format } from 'date-fns';

interface AuditLog {
  LogID: number;
  UserID: number;
  UserName: string;
  Action: string;
  Resource: string;
  ResourceID: string;
  Details: string;
  IPAddress: string;
  UserAgent: string;
  CreatedAt: string;
}

export default function LogsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  
  const currentPage = Number(searchParams.get('page')) || 1;
  const itemsPerPage = Number(searchParams.get('limit')) || 5;
  const offset = (currentPage - 1) * itemsPerPage;

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [actionFilter, setActionFilter] = useState(searchParams.get('action') || '');
  const [resourceFilter, setResourceFilter] = useState(searchParams.get('resource') || '');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: offset.toString(),
        search,
        action: actionFilter,
        resource: resourceFilter
      });
      const res = await fetch(`/api/logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  }, [offset, itemsPerPage, search, actionFilter, resourceFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1'); // Reset to first page when filter changes
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.set('search', search);
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'LOGIN': return <LogIn className="w-4 h-4 text-emerald-500" />;
      case 'LOGOUT': return <LogOut className="w-4 h-4 text-rose-500" />;
      case 'CREATE': return <PlusCircle className="w-4 h-4 text-blue-500" />;
      case 'UPDATE': return <Edit className="w-4 h-4 text-amber-500" />;
      case 'DELETE': return <Trash2 className="w-4 h-4 text-red-500" />;
      case 'PRINT': return <Printer className="w-4 h-4 text-slate-500" />;
      default: return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2 uppercase">
            <Database className="w-7 h-7 text-vmed-blue" />
            Audit Logs
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Track all system activities and user operations
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => fetchLogs()}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-vmed-blue hover:border-vmed-blue/30 hover:shadow-sm transition-all"
            title="Refresh Logs"
          >
            <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="glass-panel border border-[var(--glass-border)] p-4 md:p-6 rounded-3xl bg-white/60 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by user or activity details..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/80 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-vmed-blue/20 focus:border-vmed-blue transition-all text-sm font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>

          <div className="flex flex-wrap gap-3">
            <select 
              className="px-4 py-3 rounded-2xl bg-white/80 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-vmed-blue/20 focus:border-vmed-blue transition-all text-sm font-bold min-w-[140px]"
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                updateFilters('action', e.target.value);
              }}
            >
              <option value="">All Actions</option>
              <option value="LOGIN">Logins</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="PRINT">Print</option>
            </select>

            <select 
              className="px-4 py-3 rounded-2xl bg-white/80 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-vmed-blue/20 focus:border-vmed-blue transition-all text-sm font-bold min-w-[140px]"
              value={resourceFilter}
              onChange={(e) => {
                setResourceFilter(e.target.value);
                updateFilters('resource', e.target.value);
              }}
            >
              <option value="">All Resources</option>
              <option value="Patient">Patient</option>
              <option value="User">User</option>
              <option value="Role">Role</option>
              <option value="Form">Form</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table Card */}
      <div className="glass-panel border border-[var(--glass-border)] rounded-3xl bg-white shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Action</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Details</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-4">
                      <div className="h-5 bg-slate-100 rounded-lg w-full"></div>
                    </td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Info className="w-10 h-10 opacity-20" />
                      <p className="font-bold text-sm">No logs found matching your filters.</p>
                      <button 
                        onClick={() => {
                          setSearch('');
                          setActionFilter('');
                          setResourceFilter('');
                          router.push(pathname); // Clears all params
                        }}
                        className="text-vmed-blue hover:underline text-xs"
                      >
                        Clear filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.LogID} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-bold text-slate-700">
                          {new Date(log.CreatedAt).toLocaleString('en-US', {
                            month: 'short',
                            day: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-[10px]">
                          {log.UserName ? log.UserName[0] : '?'}
                        </div>
                        <span className="text-xs font-black text-slate-600 uppercase tracking-tight truncate max-w-[120px]">
                          {log.UserName || 'System'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.Action)}
                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                          log.Action === 'LOGIN' ? 'text-emerald-600' : 
                          log.Action === 'DELETE' ? 'text-rose-600' :
                          log.Action === 'CREATE' ? 'text-blue-600' :
                          'text-slate-600'
                        }`}>
                          {log.Action}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-medium text-slate-600 max-w-sm">
                        {log.Details}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-[10px] font-bold text-slate-400 font-mono italic">
                        {log.IPAddress}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Wrapper */}
        <PaginationWrapper 
          currentPage={currentPage}
          totalPages={Math.ceil(total / itemsPerPage)}
          totalItems={total}
          itemsPerPage={itemsPerPage}
        />
      </div>
    </div>
  );
}
