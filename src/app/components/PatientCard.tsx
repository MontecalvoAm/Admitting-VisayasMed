'use client';

import React from 'react';
import { User, Calendar, Tag, ChevronRight, MoreVertical } from 'lucide-react';
import Link from 'next/link';

interface PatientCardProps {
  patient: {
    Id: number;
    LastName: string;
    GivenName: string;
    MiddleName?: string;
    Sex: string;
    Age: number;
    ServiceCaseType: string;
    AdmittedAt: string;
    PatientID: number;
  };
}

const PatientCard: React.FC<PatientCardProps> = ({ patient }) => {
  const fullName = `${patient.LastName}, ${patient.GivenName} ${patient.MiddleName || ''}`.trim();
  const admittedDate = new Date(patient.AdmittedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all active:scale-[0.98] group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-vmed-blue-dark">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 leading-tight group-hover:text-vmed-blue-dark transition-colors">{fullName}</h3>
            <p className="text-xs text-slate-500 font-medium">PID: {patient.PatientID || 'N/A'}</p>
          </div>
        </div>
        <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Age / Sex</p>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <span>{patient.Age} yrs</span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span>{patient.Sex}</span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Case Type</p>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-vmed-blue-dark">
            <Tag className="w-3.5 h-3.5" />
            <span>{patient.ServiceCaseType}</span>
          </div>
        </div>
        <div className="space-y-1 col-span-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date Admitted</p>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{admittedDate}</span>
          </div>
        </div>
      </div>

      <Link 
        href={`/dashboard/patients/${patient.Id}`}
        className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold hover:bg-vmed-blue-dark hover:text-white transition-all"
      >
        View Full Details
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
};

export default PatientCard;
