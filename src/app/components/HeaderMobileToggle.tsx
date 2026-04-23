'use client';

import React from 'react';
import { Menu } from 'lucide-react';
import { useSidebar } from './SidebarContext';

const HeaderMobileToggle = () => {
  const { toggleMobileSidebar } = useSidebar();

  return (
    <button 
      onClick={toggleMobileSidebar}
      className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl text-slate-500 hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-slate-100"
      title="Toggle Menu"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
};

export default HeaderMobileToggle;
