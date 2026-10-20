import React from 'react';
import { Bell, Shield, Activity, User, RotateCcw, Menu, LogOut } from 'lucide-react';

interface HeaderProps {
  onNavigateAlerts?: () => void;
  onQuickSim?: () => void;
  onResetSim?: () => void;
  onToggleSidebar?: () => void;
  onLogout?: () => void;
  alertCount?: number;
  isSimRunning?: boolean;
  username?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigateAlerts,
  onQuickSim,
  onResetSim,
  onToggleSidebar,
  onLogout,
  alertCount = 0,
  isSimRunning = false,
  username = 'Demo User',
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between gap-3">
      {/* Left: Hamburger (mobile) + Brand */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger — hidden on md+ */}
        <button
          onClick={onToggleSidebar}
          aria-label="Open navigation menu"
          aria-expanded="false"
          className="md:hidden p-2 rounded-md text-slate-600 hover:text-aerospace-900 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg overflow-hidden flex items-center justify-center shadow-sm border border-aerospace-800 bg-aerospace-900 flex-shrink-0">
            <img src="/eagle.svg" alt="Jatayu Eagle" className="w-full h-full object-contain p-0.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base md:text-lg text-aerospace-900 tracking-tight">Jatayu</span>
              <span className="text-xs bg-aerospace-100 text-aerospace-800 font-semibold px-2 py-0.5 rounded border border-aerospace-200 hidden sm:inline">
                VIMAAN AI
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden lg:block">
              Predictive Maintenance &amp; Fleet Availability Intelligence Platform
            </p>
          </div>
        </div>
      </div>

      {/* Center: Provenance Badge (hidden on small screens) */}
      <div className="hidden xl:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full text-xs text-slate-600 font-medium flex-shrink-0">
        <Shield className="w-3.5 h-3.5 text-aerospace-600" aria-hidden="true" />
        <span>SIMULATION / SYNTHETIC DATASET</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1.5 md:gap-3">
        {/* Quick Simulation Trigger — hidden on very small screens */}
        {onQuickSim && (
          <button
            onClick={onQuickSim}
            aria-label={isSimRunning ? 'Simulation step in progress' : 'Advance simulation one step'}
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all border ${isSimRunning
              ? 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse'
              : 'bg-aerospace-900 text-white hover:bg-aerospace-800 border-aerospace-950'
              }`}
          >
            <Activity className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden md:inline">{isSimRunning ? 'Simulating...' : 'Live Simulation'}</span>
            <span className="md:hidden">{isSimRunning ? '...' : 'Sim'}</span>
          </button>
        )}

        {/* Reset Sim */}
        {onResetSim && (
          <button
            onClick={onResetSim}
            title="Reset Simulation to Initial State"
            aria-label="Reset simulation to initial state"
            className="hidden sm:flex p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
          </button>
        )}

        {/* Alerts Bell */}
        <button
          onClick={onNavigateAlerts}
          className="relative p-2 rounded-md text-slate-600 hover:text-aerospace-900 hover:bg-slate-100 transition-colors"
          title="View Alerts"
          aria-label={alertCount > 0 ? `View alerts — ${alertCount} unread` : 'View alerts'}
        >
          <Bell className="w-4 h-4" aria-hidden="true" />
          {alertCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center"
            >
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </button>

        {/* User Pill + Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 font-semibold text-xs flex-shrink-0">
            <User className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-600" aria-hidden="true" />
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold text-slate-800 capitalize">{username}</div>
            <div className="text-[10px] text-slate-500">Command Officer</div>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              title="Log out"
              aria-label="Log out"
              className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
