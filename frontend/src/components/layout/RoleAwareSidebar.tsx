import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Plane, Activity, Cpu, CalendarClock, Boxes,
  FlaskConical, LineChart, Bell, Sliders, ChevronRight, X,
  Shield, Package, Wrench, LogOut, Calendar
} from 'lucide-react';
import { useAuth, UserRole } from '../../context/AuthContext';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.FC<any>;
  path: string;
  badge?: number;
}

const COMMANDER_NAV: SidebarItem[] = [
  { id: 'commander',    label: 'Overview',               icon: Shield,          path: '/app/commander' },
  { id: 'fleet',        label: 'Fleet Overview',          icon: Plane,           path: '/app/fleet' },
  { id: 'aircraft',     label: 'Aircraft Health',         icon: Activity,        path: '/app/aircraft' },
  { id: 'predictions',  label: 'AI Predictions',          icon: Cpu,             path: '/app/predictions' },
  { id: 'maintenance',  label: 'Maintenance Priorities',  icon: CalendarClock,   path: '/app/maintenance' },
  { id: 'schedule',     label: 'Maintenance Timetable',   icon: Calendar,        path: '/app/schedule' },
  { id: 'alerts',       label: 'Alerts & Actions',        icon: Bell,            path: '/app/alerts' },
];

const SPARES_NAV: SidebarItem[] = [
  { id: 'spares-portal',label: 'Inventory Overview',     icon: Package,         path: '/app/spares-portal' },
  { id: 'maintenance',  label: 'Related Maintenance',    icon: CalendarClock,   path: '/app/maintenance' },
];

const TECHNICIAN_NAV: SidebarItem[] = [
  { id: 'technicians',  label: 'My Dashboard',           icon: Wrench,          path: '/app/technicians' },
  { id: 'schedule',     label: 'My Timetable',           icon: Calendar,        path: '/app/schedule' },
];

const DEMO_NAV: SidebarItem[] = [
  { id: 'overview',     label: 'Overview',               icon: LayoutDashboard, path: '/app/overview' },
  { id: 'fleet',        label: 'Fleet Overview',         icon: Plane,           path: '/app/fleet' },
  { id: 'aircraft',     label: 'Aircraft Digital Twin',  icon: Activity,        path: '/app/aircraft' },
  { id: 'predictions',  label: 'Predictions Center',     icon: Cpu,             path: '/app/predictions' },
  { id: 'maintenance',  label: 'Maintenance Planner',    icon: CalendarClock,   path: '/app/maintenance' },
  { id: 'schedule',     label: 'Maintenance Timetable',  icon: Calendar,        path: '/app/schedule' },
  { id: 'spares',       label: 'Logistics & Spares',     icon: Boxes,           path: '/app/spares' },
  { id: 'simulation',   label: 'Simulation Lab',         icon: FlaskConical,    path: '/app/simulation' },
  { id: 'models',       label: 'Model Performance',      icon: LineChart,       path: '/app/models' },
  { id: 'alerts',       label: 'Alerts & Actions',       icon: Bell,            path: '/app/alerts' },
  { id: 'settings',     label: 'Settings',               icon: Sliders,         path: '/app/settings' },
];

function getNavItems(role: UserRole): SidebarItem[] {
  switch (role) {
    case 'commander': return COMMANDER_NAV;
    case 'spares':    return SPARES_NAV;
    case 'technician':return TECHNICIAN_NAV;
    default:          return DEMO_NAV;
  }
}

interface RoleAwareSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  unreadAlertsCount?: number;
}

export const RoleAwareSidebar: React.FC<RoleAwareSidebarProps> = ({ isOpen, onClose, unreadAlertsCount = 0 }) => {
  const { role, logout, username } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = getNavItems(role).map(item =>
    item.id === 'alerts' ? { ...item, badge: unreadAlertsCount } : item
  );

  // Close drawer on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  const navContent = (
    <nav aria-label="Department navigation" className="flex flex-col h-full">
      <div className="py-4 px-3 space-y-1 flex-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {role === 'commander' ? 'Command Modules' :
           role === 'spares'    ? 'Spare Parts Modules' :
           role === 'technician'? 'Technician Workspace' :
           'Command Modules'}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path ||
            (item.path !== '/app/overview' && location.pathname.startsWith(item.path + '/'));

          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.path)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`${item.label}${item.badge ? ` (${item.badge} unread)` : ''}`}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                isActive
                  ? 'bg-aerospace-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-aerospace-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} aria-hidden="true" />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${isActive ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700'}`}>
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* User info + logout */}
      <div className="p-3 border-t border-slate-100">
        <div className="bg-slate-50 rounded-lg p-3 mb-2">
          <div className="text-[11px] font-semibold text-aerospace-900 truncate">{username}</div>
          <div className="text-[10px] text-slate-400 capitalize">{role === 'demo' ? 'Full Demo Access' : role + ' role'}</div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" aria-hidden="true" onClick={onClose} />
      )}

      <aside
        className={`
          bg-white border-r border-slate-200 flex flex-col justify-between
          h-[calc(100vh-4rem)] overflow-y-auto
          transition-transform duration-300 ease-in-out
          fixed top-16 left-0 z-40 w-64
          md:sticky md:top-16 md:z-auto md:translate-x-0 md:flex-shrink-0 self-start
          ${isOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'}
        `}
        aria-label="Sidebar navigation"
      >
        <div className="flex items-center justify-between px-4 pt-4 md:hidden">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Navigation</span>
          <button onClick={onClose} aria-label="Close navigation" className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        {navContent}
      </aside>
    </>
  );
};
