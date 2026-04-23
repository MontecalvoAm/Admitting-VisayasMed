import React from 'react';
import Sidebar from '@/app/components/Sidebar';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { LogOut, Bell } from 'lucide-react';
import HeaderTitle from '@/app/components/HeaderTitle';
import HeaderMobileToggle from '@/app/components/HeaderMobileToggle';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-slate-900 font-sans relative overflow-x-hidden">
      {/* Global Watermark */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-[0.08] select-none overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src="/Visayas%20Medical.png" 
          alt="Watermark" 
          className="w-[600px] h-auto object-contain grayscale"
        />
      </div>
      {/* Sidebar - Collapsible component */}
      <Sidebar 
        userName={`${session.firstName} ${session.lastName}`} 
        email={session.email} 
        userId={session.userId}
        roleId={session.roleId}
      />
      
      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-[var(--sidebar-transition)]">
        
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-30 h-[var(--header-height)] min-h-[64px] glass-panel border-b border-[var(--glass-border)] px-4 md:px-8 flex items-center justify-between backdrop-blur-xl bg-white/80">
          <div className="flex items-center gap-4 md:gap-6 h-full">
            <HeaderMobileToggle />
            
            {/* Brand visible only when sidebar is collapsed */}
            <div className="header-brand flex items-center gap-2 mr-4 animate-in fade-in slide-in-from-left-4 duration-500">
              <span className="text-sm font-black text-vmed-blue-dark tracking-tight uppercase">Visayasmed Hospital</span>
            </div>

            {/* Current Page Title */}
            <div className="hidden lg:block">
              <HeaderTitle />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 h-full">
            <button className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl text-slate-500 hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-slate-100">
              <Bell className="w-5 h-5" />
            </button>
            <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1"></div>
            
            <form action="/api/auth/logout" method="POST" className="flex items-center">
              <button 
                type="submit" 
                className="flex items-center gap-2 px-4 h-10 rounded-xl text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all font-bold text-sm border border-transparent hover:border-red-100"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </form>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 p-4 md:px-8 md:py-6 animate-in fade-in duration-500">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
