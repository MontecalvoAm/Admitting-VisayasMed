import React from 'react';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/rbac';

export default async function FormsLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  // Check module permission
  const canView = await hasPermission(session.userId, session.roleId, 'Forms', 'View');
  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-red-50/50 rounded-3xl border border-red-100 animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-red-100 animate-bounce">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-10a4 4 0 11-8 0 4 4 0 018 0zm-4-3v3M7 7h10" />
          </svg>
        </div>
        <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Access Denied</h1>
        <p className="mt-2 text-slate-500 font-medium max-w-md mx-auto">
          You do not have sufficient permissions to access the forms module. Please contact your system administrator.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
