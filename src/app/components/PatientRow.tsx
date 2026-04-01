'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Clock, Calendar, Stethoscope, Activity, MapPin, User, ChevronUp } from 'lucide-react';
import PatientActions from './PatientActions';
import { useRouter } from 'next/navigation';

interface PatientRowProps {
  patient: any;
  index: number;
}

const PatientRow: React.FC<PatientRowProps> = ({ patient, index }) => {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  const hasHistory = (patient.AdmissionCount || 0) > 1;
  const isNew = !patient.IsViewed && (new Date().getTime() - new Date(patient.CreatedAt).getTime() < 24 * 60 * 60 * 1000);
  const isEven = index % 2 === 0;

  const toggleExpand = async () => {
    if (!hasHistory) return;

    if (!isExpanded && history.length === 0) {
      setIsLoadingHistory(true);
      try {
        const res = await fetch(`/api/patients/history?lastName=${encodeURIComponent(patient.LastName)}&givenName=${encodeURIComponent(patient.GivenName)}&middleName=${encodeURIComponent(patient.MiddleName || '')}&suffix=${encodeURIComponent(patient.Suffix || '')}`);
        if (res.ok) {
          const data = await res.json();
          // Filter out the current (latest) admission from history to avoid duplication
          setHistory(data.filter((h: any) => Number(h.Id) !== Number(patient.CurrentAdmissionID)));
        }
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      <tr 
        className={`hover:bg-slate-50/50 transition-colors ${hasHistory ? 'cursor-pointer' : ''} ${isExpanded ? 'bg-vmed-blue-light/5' : !isEven ? 'bg-slate-50/50' : 'bg-white'}`}
        onClick={toggleExpand}
      >
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            {hasHistory ? (
              isExpanded ? <ChevronDown className="w-4 h-4 text-vmed-blue-light" /> : <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-vmed-blue-light transition-colors" />
            ) : (
              <div className="w-4 h-4" /> // Spacer for non-history rows
            )}
            <div>
              <div className="flex items-center gap-2">
                <div className="font-bold text-slate-800">{patient.LastName}, {patient.GivenName}</div>
                {isNew && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-[9px] text-white font-black rounded-md shadow-sm border border-emerald-400/20 uppercase tracking-tighter animate-in fade-in zoom-in duration-500">
                    <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                    New
                  </span>
                )}
                {hasHistory && !isExpanded && (
                  <span className="px-1.5 py-0.5 bg-blue-50 text-[9px] text-vmed-blue-light font-bold rounded border border-blue-100 uppercase">
                    {patient.AdmissionCount} Admissions
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">
                {patient.CityAddress?.substring(0, 40)}{patient.CityAddress?.length > 40 ? '...' : ''}
              </div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 text-sm text-slate-600 font-semibold">
          {patient.Age} yrs / {patient.Sex}
        </td>
        <td className="px-6 py-4">
           <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
             ${patient.ServiceCaseType === 'Private' ? 'bg-blue-50 text-vmed-blue-light border border-blue-100' : 
               patient.ServiceCaseType === 'Charity' ? 'bg-emerald-50 text-vmed-green border border-emerald-100' : 
                   'bg-slate-50 text-vmed-grey border border-slate-100'}`}
           >
             {patient.ServiceCaseType || 'General'}
           </span>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {new Date(patient.CreatedAt).toLocaleDateString()}
          </div>
        </td>
        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
          <PatientActions 
            patient={patient} 
            onInteraction={() => router.refresh()}
          />
        </td>
      </tr>
      
      {isExpanded && (
        <tr className="bg-slate-50/40">
          <td colSpan={5} className="px-6 py-6 sm:px-12">
            <div className="relative pl-8 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-vmed-blue-light/50 before:to-transparent">
              <div className="flex items-center gap-3 -ml-[29px] bg-slate-50 relative z-10 w-fit pr-4">
                <div className="w-6 h-6 rounded-full bg-vmed-blue-light/10 flex items-center justify-center border-2 border-white shadow-sm ring-1 ring-vmed-blue-light/20">
                   <Clock className="w-3 h-3 text-vmed-blue-light" />
                </div>
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                   Previous Admissions
                </h4>
              </div>
              
              {isLoadingHistory ? (
                <div className="grid gap-4 py-2">
                   {[1, 2].map(i => (
                     <div key={i} className="h-20 bg-white/50 animate-pulse rounded-2xl border border-slate-100" />
                   ))}
                </div>
              ) : history.length === 0 ? (
                <div className="text-sm text-slate-400 italic py-4 pl-4 border border-dashed border-slate-200 rounded-2xl">
                   No previous admissions found for this patient.
                </div>
              ) : (
                <div className="grid gap-4">
                  {history.map((record, index) => (
                    <div 
                      key={record.Id} 
                      className="group relative bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-vmed-blue-light/30 transition-all duration-300"
                    >
                       {/* Timeline Marker (Circle on the line) */}
                       <div className="absolute -left-[29px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-vmed-blue-light shadow-sm z-10 group-hover:scale-110 transition-transform" />
                       
                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                         <div className="flex flex-wrap items-center gap-6">
                           <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                               <Calendar className="w-5 h-5 text-slate-400 group-hover:text-vmed-blue-light" />
                             </div>
                             <div className="flex flex-col">
                               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Admission Date</span>
                               <span className="text-sm text-slate-700 font-bold">
                                 {new Date(record.CreatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                               </span>
                             </div>
                           </div>

                           <div className="flex items-center gap-3 min-w-[140px]">
                             <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                               <Activity className="w-5 h-5 text-slate-400 group-hover:text-vmed-green" />
                             </div>
                             <div className="flex flex-col">
                               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Case Type</span>
                               <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md inline-block w-fit ${
                                 record.ServiceCaseType === 'Private' ? 'bg-blue-50 text-vmed-blue-light' : 
                                 record.ServiceCaseType === 'Charity' ? 'bg-emerald-50 text-vmed-green' : 'bg-slate-100 text-slate-600'
                               }`}>{record.ServiceCaseType || 'General'}</span>
                             </div>
                           </div>

                           <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-amber-50 transition-colors">
                               <Stethoscope className="w-5 h-5 text-slate-400 group-hover:text-amber-500" />
                             </div>
                             <div className="flex flex-col">
                               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Attending Doctor</span>
                               <span className="text-sm text-slate-700 font-bold">{record.AttendingPhysician || 'TBD'}</span>
                             </div>
                           </div>
                         </div>

                         <div className="flex items-center gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-slate-50">
                            <span className="text-[10px] text-slate-400 font-medium mr-2 hidden lg:inline">Actions:</span>
                            <PatientActions 
                              patient={record} 
                              isAdmission={true} 
                              onSuccess={() => {
                                // Instant removal for deletion
                                setHistory(prev => prev.filter(h => h.Id !== record.Id));
                              }}
                            />
                         </div>
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default PatientRow;
