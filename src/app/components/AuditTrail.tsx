'use client';

import React, { useState, useEffect } from 'react';
import { Clock, User, ShieldCheck, Loader2 } from 'lucide-react';

interface AuditTrailProps {
  resource: string;
  id: string | number;
}

interface AuditLog {
  Action: string;
  UserName: string;
  CreatedAt: string;
  Details: string;
}

const AuditTrail: React.FC<AuditTrailProps> = ({ resource, id }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/logs/${resource}/${id}`);
        if (res.ok) {
          const data = await res.json();
          setLogs(data);
        }
      } catch (error) {
        console.error(`Error fetching audit logs for ${resource}#${id}:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchLogs();
  }, [resource, id]);

  if (isLoading) {
    return (
      <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
      </div>
    );
  }

  // Find record origin (CREATE) and last activity
  const createLog = logs.find(l => l.Action === 'CREATE') || logs[0];
  const lastLog = logs[logs.length - 1];

  if (!id) return null;

  if (logs.length === 0 && !isLoading) {
    return (
      <div className="mt-12 pt-8 border-t border-slate-100 no-print animate-in fade-in duration-700">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-slate-300" />
          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Record Audit Trail</h4>
        </div>
        <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl p-6 text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">No system activity recorded for this {resource.toLowerCase()}.</p>
          <p className="text-[10px] text-slate-400 mt-1">This record was likely created before the audit system was implemented.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12 pt-8 border-t border-slate-100 no-print animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-2 mb-6">
        <ShieldCheck className="w-5 h-5 text-vmed-blue-light opacity-60" />
        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Record Audit Trail</h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Creation Info */}
        <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 transition-all hover:bg-slate-50">
          <div className="flex items-center gap-3">
             <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center border border-slate-100">
                <User className="w-4 h-4 text-slate-400" />
             </div>
             <div>
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-tight">Record Origin</span>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-700">{createLog?.UserName || 'System'}</span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {createLog ? new Date(createLog.CreatedAt).toLocaleString('en-US', { 
                      month: 'short', day: 'numeric', year: 'numeric', 
                      hour: '2-digit', minute: '2-digit' 
                    }) : 'Unknown Date'}
                  </span>
                </div>
             </div>
          </div>
        </div>

        {/* Last Activity Info */}
        <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 transition-all hover:bg-slate-50">
          <div className="flex items-center gap-3">
             <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center border border-slate-100">
                <Clock className="w-4 h-4 text-slate-400" />
             </div>
             <div>
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-tight">Latest Activity</span>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-700">{lastLog?.UserName || 'System'}</span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {lastLog ? new Date(lastLog.CreatedAt).toLocaleString('en-US', { 
                      month: 'short', day: 'numeric', year: 'numeric', 
                      hour: '2-digit', minute: '2-digit' 
                    }) : 'Unknown Date'}
                  </span>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1.5 px-3 py-1.5 bg-blue-50/50 rounded-lg w-fit border border-blue-100/30">
        <span className="text-[9px] font-bold text-vmed-blue-light uppercase">Latest Action:</span>
        <span className="text-[9px] font-black text-vmed-blue-dark uppercase tracking-tight">
          {lastLog?.Action} - {lastLog?.Details.substring(0, 50)}{lastLog?.Details.length > 50 ? '...' : ''}
        </span>
      </div>
    </div>
  );
};

export default AuditTrail;
