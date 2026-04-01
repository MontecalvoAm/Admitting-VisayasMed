'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

const HeaderTitle = () => {
  const pathname = usePathname();

  const getTitle = (path: string) => {
    if (path === '/dashboard') return 'DASHBOARD';
    if (path.startsWith('/dashboard/patients')) return 'PATIENTS REGISTRY';
    if (path.startsWith('/dashboard/forms')) return 'MANAGE FORMS';
    if (path.startsWith('/dashboard/users')) return 'USERS & ROLES';
    if (path.startsWith('/dashboard/logs')) return 'AUDIT LOGS';
    return '';
  };

  const title = getTitle(pathname);

  if (!title) return null;

  return (
    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500">
      <div className="h-6 w-1 rounded-full bg-vmed-blue-dark shadow-sm shadow-blue-200"></div>
      <h2 className="text-lg font-black text-slate-800 tracking-wider uppercase">
        {title}
      </h2>
    </div>
  );
};

export default HeaderTitle;
