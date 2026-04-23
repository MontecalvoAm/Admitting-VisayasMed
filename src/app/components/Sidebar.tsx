'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Settings,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Loader2,
  Database,
  Archive,
  X
} from 'lucide-react';
import { useSidebar } from './SidebarContext';

interface SidebarProps {
  userName: string;
  email: string;
  userId: number;
  roleId: number;
}

const Sidebar: React.FC<SidebarProps> = ({ userName, email, userId, roleId }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [permissions, setPermissions] = useState<{ ModuleName: string; CanView: boolean }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const { isMobileOpen, setIsMobileOpen } = useSidebar();

  useEffect(() => {
    fetchPermissions();
  }, [userId, roleId]);

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname, setIsMobileOpen]);

  const fetchPermissions = async () => {
    try {
      const res = await fetch('/api/rbac/permissions/me');
      if (res.ok) {
        const data = await res.json();
        setPermissions(data);
      }
    } catch (error) {
      console.error('Error fetching sidebar permissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, moduleName: 'Dashboard' },
    { name: 'Patients', href: '/dashboard/patients', icon: Users, moduleName: 'Patients' },
    { name: 'Forms', href: '/dashboard/forms', icon: ClipboardList, moduleName: 'Forms' },
    { name: 'Users', href: '/dashboard/users', icon: Settings, moduleName: 'Users' },
    { name: 'Logs', href: '/dashboard/logs', icon: Database, moduleName: 'Logs' },
    { name: 'Archive', href: '/dashboard/archive', icon: Archive, moduleName: 'Archive' },
  ];

  // Filter items based on CanView permission
  const filteredNavItems = navItems.filter(item => {
    const perm = permissions.find(p => p.ModuleName === item.moduleName);
    return perm ? perm.CanView : false;
  });

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="sidebar-backdrop lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside 
        className={`fixed left-0 top-0 h-screen transition-all duration-300 ease-[var(--sidebar-transition)] z-50 glass-panel border-r flex flex-col`}
        style={{ width: isCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)' }}
        data-collapsed={isCollapsed ? "true" : "false"}
        data-mobile-open={isMobileOpen ? "true" : "false"}
      >
        {/* Brand Header */}
        <div className="h-[var(--header-height)] flex items-center px-4 border-b border-[var(--glass-border)] relative">
          <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${isCollapsed && !isMobileOpen ? 'mx-auto justify-center' : 'px-2'}`}>
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/Visayas%20Medical.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
                <h1 className="text-sm font-black text-slate-800 leading-tight tracking-tight uppercase">Visayasmed</h1>
              </div>
            )}
          </div>

          {/* Mobile Close Button */}
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="absolute right-4 p-1.5 rounded-lg hover:bg-slate-100/80 text-slate-500 transition-colors lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Vertical Chevron Toggle - Desktop Only */}
        <button 
          onClick={toggleSidebar}
          className={`
            absolute -right-5 top-1/2 -translate-y-1/2 z-[60]
            w-10 h-10 rounded-full border border-[var(--glass-border)]
            bg-white shadow-lg flex items-center justify-center
            text-slate-500 hover:text-blue-600 hover:scale-110 
            transition-all duration-300 hidden lg:flex
          `}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
        </button>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
            </div>
          ) : filteredNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? 'bg-blue-50 text-blue-600 border border-blue-100 shadow-sm' 
                    : 'text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm'}
                `}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-blue-600' : 'group-hover:text-slate-800'}`} />
                {(!isCollapsed || isMobileOpen) && (
                  <span className="font-semibold text-sm whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Simplified User Footer */}
        <div className="p-4 border-t border-[var(--glass-border)] bg-[var(--glass-bg)]/50 backdrop-blur-md">
          <div className="flex items-center gap-3 px-2 py-1 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs flex-shrink-0">
              {userName[0]}
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="text-sm font-bold text-slate-800 truncate leading-tight uppercase tracking-tight">{userName}</p>
                <p className="text-[10px] font-medium text-slate-400 truncate tracking-tight">{email}</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
