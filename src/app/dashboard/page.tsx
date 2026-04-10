import React from 'react';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { 
  Users, 
  UserRound, 
  Calendar, 
  Clock,
  ArrowRight,
  Plus,
  Download
} from 'lucide-react';
import Link from 'next/link';
import DashboardClient from '@/app/components/DashboardClient';

interface RecentAdmission {
  Id: number;
  PatientID: number;
  LastName: string;
  GivenName: string;
  ServiceCaseType?: string;
  Age?: number;
  IsViewed?: boolean;
  CreatedAt: string;
}

async function getStats() {
  // Total unique patients
  const [patientCount] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM M_Patients WHERE IsDeleted = 0');
  
  // Total admissions TODAY
  const [todayCount] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM M_Admissions WHERE DATE(AdmittedAt) = CURDATE() AND IsDeleted = 0');
  
  // Total system users
  const [userCount] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM M_Users WHERE IsDeleted = 0');
  
  // Recent admissions with full details (alias AdmissionID as Id and AdmittedAt as CreatedAt for UI compatibility)
  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT p.*, a.*, a.AdmissionID as Id, a.AdmittedAt as CreatedAt
    FROM M_Admissions a
    JOIN M_Patients p ON a.PatientID = p.PatientID
    WHERE a.IsDeleted = 0 
    ORDER BY a.AdmittedAt DESC 
    LIMIT 5
  `);
  
  // Clean serialization for RowDataPacket
  const recentAdmissions = JSON.parse(JSON.stringify(rows));
  
  return {
    totalPatients: patientCount[0].count,
    todayAdmissions: todayCount[0].count,
    totalUsers: userCount[0].count,
    recentAdmissions
  };
}

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const { totalPatients, todayAdmissions, totalUsers, recentAdmissions } = await getStats();

  const stats = [
    { 
      label: 'Total Patients', 
      value: totalPatients, 
      icon: Users, 
      color: 'text-vmed-blue-dark', 
      bg: 'bg-blue-50',
      trend: 'Lifetime'
    },
    { 
      label: 'Admissions Today', 
      value: todayAdmissions, 
      icon: Calendar, 
      color: 'text-vmed-green', 
      bg: 'bg-emerald-50',
      trend: '+ Live'
    },
    { 
      label: 'System Users', 
      value: totalUsers, 
      icon: UserRound, 
      color: 'text-purple-600', 
      bg: 'bg-purple-50',
      trend: 'Active Accounts'
    },
  ];

  return (
    <div className="space-y-6 relative z-10">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Welcome back, <span className="text-vmed-blue-dark">{session.firstName}</span>!
          </h2>
          <p className="text-sm text-slate-500 font-medium">Here&apos;s what&apos;s happening at Visayas Medical Center today.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="glass-panel px-4 h-10 rounded-xl border border-slate-100/50 hidden md:flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-vmed-blue-dark">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Current Session</div>
              <div className="text-sm font-bold text-slate-700 leading-none">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="glass-panel p-6 rounded-3xl group shadow-sm hover:shadow-md transition-all border border-slate-100/50 overflow-hidden relative">
            {/* Background Decorative Element */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full ${stat.bg} opacity-20 blur-2xl group-hover:scale-150 transition-transform duration-500`}></div>
            
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color} shadow-inner group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.trend}</span>
              </div>
            </div>
            
            <div className="relative z-10">
              <div className="text-3xl font-black text-slate-800 mb-1 flex items-baseline gap-2">
                {stat.value}
              </div>
              <div className="text-sm font-bold text-slate-500">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>


      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        {/* Recent Admissions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" /> Recent Admissions
            </h3>
            <Link href="/dashboard/patients" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
              View All <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="glass-panel rounded-3xl overflow-hidden border border-slate-100/50">
            <div className="divide-y divide-slate-50">
              {recentAdmissions.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-medium">No recent activity</div>
              ) : (
                recentAdmissions.map((record: RecentAdmission) => {
                  const isNew = !record.IsViewed && (new Date().getTime() - new Date(record.CreatedAt).getTime() < 24 * 60 * 60 * 1000);
                  return (
                    <div key={record.Id} className="p-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-xs shadow-inner uppercase">
                          {record.LastName[0]}{record.GivenName[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <div className="text-sm font-bold text-slate-800">{record.LastName}, {record.GivenName}</div>
                            {isNew && (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-[9px] text-white font-black rounded-md shadow-sm border border-emerald-400/20 uppercase tracking-tighter animate-in fade-in zoom-in duration-500">
                                <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                                New
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{record.ServiceCaseType || 'General'} • {record.Age} YRS</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-500">{new Date(record.CreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          <div className="text-[10px] font-semibold text-slate-400 uppercase">{new Date(record.CreatedAt).toLocaleDateString()}</div>
                        </div>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <DashboardClient patient={record as any} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions / System Status */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-3">
            {[
              { label: 'Register Patient', desc: 'Add new admission record', icon: Plus, link: '/dashboard/patients' },
              { label: 'Staff Management', desc: 'Update duty schedules', icon: UserRound, link: '/dashboard/users' },
              { label: 'System Reports', desc: 'Download monthly analytics', icon: Download, link: '/dashboard/logs' },
            ].map((action, i) => (
              <Link 
                key={i} 
                href={action.link}
                className="glass-panel p-4 rounded-2xl hover:border-blue-200 hover:bg-white transition-all border border-slate-100/50 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors flex items-center justify-center shadow-inner">
                    <action.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">{action.label}</div>
                    <div className="text-xs text-slate-400 font-medium">{action.desc}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// No extra path functions needed as we use Lucide icons
