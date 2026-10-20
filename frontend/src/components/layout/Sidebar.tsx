import React, { useEffect } from 'react';
import {
  LayoutDashboard,
  Plane,
  Activity,
  Cpu,
  CalendarClock,
  Boxes,
  FlaskConical,
  LineChart,
  Bell,
  Sliders,
  ChevronRight,
  X
} from 'lucide-react';

export type NavPage =
  | 'overview'
  | 'fleet'
  | 'aircraft'
  | 'predictions'
  | 'maintenance'
  | 'spares'
  | 'simulation'
  | 'models'
  | 'alerts'
  | 'settings';

interface SidebarProps {
  currentPage: NavPage;
  onSelectPage: (page: NavPage) => void;
  unreadAlertsCount?: number;
  /** Whether the mobile drawer is open */
  isOpen: boolean;
  /** Called to close the mobile drawer */
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  unreadAlertsCount = 0,
  isOpen,
  onClose,
}) => {
  const navItems: { id: NavPage; label: string; icon: React.FC<any>; badge?: number }[] = [
    { id: 'overview',    label: 'Overview',               icon: LayoutDashboard },
    { id: 'fleet',       label: 'Fleet Overview',          icon: Plane },
    { id: 'aircraft',    label: 'Aircraft Digital Twin',   icon: Activity },
    { id: 'predictions', label: 'Predictions Center',      icon: Cpu },
    { id: 'maintenance', label: 'Maintenance Planner',     icon: CalendarClock },
    { id: 'spares',      label: 'Logistics & Spares',      icon: Boxes },
    { id: 'simulation',  label: 'Simulation Lab',          icon: FlaskConical },
    { id: 'models',      label: 'Model Performance',       icon: LineChart },
    { id: 'alerts',      label: 'Alerts & Actions',        icon: Bell, badge: unreadAlertsCount },
    { id: 'settings',    label: 'Settings & Architecture', icon: Sliders },
  ];

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleNavClick = (page: NavPage) => {
    onSelectPage(page);
    onClose(); // Always close drawer after navigation on mobile
  };

  const navContent = (
    <nav aria-label="Command navigation">
      <div className="py-4 px-3 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Command Modules
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
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
                  <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                    isActive ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Technical Info */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 m-2 rounded-lg text-[11px] text-slate-500">
        <div className="font-semibold text-aerospace-900 mb-0.5">Decision-Support Core</div>
        <div className="flex justify-between items-center text-slate-400 font-mono text-[10px]">
          <span>OR-Tools CP-SAT</span>
          <span>XGBoost v3.2</span>
        </div>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          aria-hidden="true"
          onClick={onClose}
        />
      )}

      {/* Sidebar — fixed drawer on mobile, sticky sidebar on desktop */}
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
        {/* Mobile close button */}
        <div className="flex items-center justify-between px-4 pt-4 md:hidden">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Navigation</span>
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {navContent}
      </aside>
    </>
  );
};
