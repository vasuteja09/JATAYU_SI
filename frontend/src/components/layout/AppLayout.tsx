import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { RoleAwareSidebar } from './RoleAwareSidebar';
import { ErrorBoundary } from '../ErrorBoundary';
import { ToastContainer } from '../ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { MaintenanceCopilotModal } from '../copilot/MaintenanceCopilotModal';
import { Bot } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { username, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [unreadAlerts, setUnreadAlerts] = useState<number>(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);

  // Fetch unread alerts count
  const fetchAlertCount = useCallback(async () => {
    try {
      const res = await api.getAlerts(undefined, true);
      setUnreadAlerts(res.total);
    } catch {
      // Backend may be starting or offline — ignore silently
    }
  }, []);

  useEffect(() => {
    fetchAlertCount();
  }, [location.pathname, fetchAlertCount]);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const handleNavigateAlerts = () => {
    navigate('/app/alerts');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-slate-800">
      {/* Top Header */}
      <Header
        onNavigateAlerts={handleNavigateAlerts}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        onLogout={handleLogout}
        alertCount={unreadAlerts}
        username={username || 'Authenticated User'}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Role-Aware Sidebar */}
        <RoleAwareSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          unreadAlertsCount={unreadAlerts}
        />

        {/* Main Content Area */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 focus:outline-none"
        >
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {/* Floating Grounded Maintenance Copilot Trigger */}
      <button
        onClick={() => setIsCopilotOpen(true)}
        aria-label="Open JATAYU Grounded Maintenance Copilot"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-aerospace-900 hover:bg-aerospace-800 text-white font-semibold px-4 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all cursor-pointer text-xs border border-aerospace-700"
      >
        <Bot className="w-4 h-4 text-sky-300" />
        <span>Maintenance Copilot</span>
      </button>

      {/* Copilot Modal */}
      <MaintenanceCopilotModal
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />

      <ToastContainer />
    </div>
  );
};

