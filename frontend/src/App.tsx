import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ui/ProtectedRoute';
import { AccessDenied } from './components/ui/AccessDenied';
import { AppLayout } from './components/layout/AppLayout';

// Public pages
import { LandingPage } from './pages/LandingPage';
import { DepartmentLoginPage } from './pages/DepartmentLoginPage';

// Department Dashboards & New Timetable
import { CommanderDashboard } from './pages/commander/CommanderDashboard';
import { SparesDashboard } from './pages/spares/SparesDashboard';
import { TechnicianDashboard } from './pages/technician/TechnicianDashboard';
import { MaintenanceTimetablePage } from './pages/schedule/MaintenanceTimetablePage';

// Existing Preserved Application Modules
import { OverviewPage } from './pages/OverviewPage';
import { FleetPage } from './pages/FleetPage';
import { AircraftDetailPage } from './pages/AircraftDetailPage';
import { PredictionsPage } from './pages/PredictionsPage';
import { MaintenancePlannerPage } from './pages/MaintenancePlannerPage';
import { LogisticsPage } from './pages/LogisticsPage';
import { SimulationLabPage } from './pages/SimulationLabPage';
import { ModelPerformancePage } from './pages/ModelPerformancePage';
import { AlertsPage } from './pages/AlertsPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { api } from './services/api';
import { toast } from './components/ui/Toast';

// ─── Dynamic page title manager ──────────────────────────────────────────────
const ROUTE_TITLES: Record<string, string> = {
  '/':                   'JATAYU — Intelligent Maintenance. Optimized Fleet Availability.',
  '/app/commander':      'Commander Fleet Dashboard | JATAYU',
  '/app/spares-portal':  'Spare Parts Inventory & Logistics | JATAYU',
  '/app/technicians':    'Technician Maintenance Workspace | JATAYU',
  '/app/schedule':       'Visual Maintenance Timetable | JATAYU',
  '/app/overview':       'Fleet Availability Overview | JATAYU',
  '/app/fleet':          'Fleet Overview | JATAYU',
  '/app/aircraft':       'Aircraft Digital Twin | JATAYU',
  '/app/predictions':    'Prognostics & Predictions Center | JATAYU',
  '/app/maintenance':    'Maintenance Planner | JATAYU',
  '/app/spares':         'Logistics & Spares | JATAYU',
  '/app/simulation':     'Simulation Lab | JATAYU',
  '/app/models':         'Model Performance | JATAYU',
  '/app/alerts':         'Alerts & Actions | JATAYU',
  '/app/settings':       'System Architecture & Settings | JATAYU',
};

const TitleWatcher: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith('/login')) {
      document.title = 'Department Portal Login | JATAYU';
    } else {
      document.title = ROUTE_TITLES[location.pathname] ?? 'JATAYU';
    }
  }, [location.pathname]);

  return null;
};

// ─── Redirect root /app to the authenticated user's department dashboard ──────
const AppIndexRedirect: React.FC = () => {
  const { role } = useAuth();

  switch (role) {
    case 'commander':
      return <Navigate to="/app/commander" replace />;
    case 'spares':
      return <Navigate to="/app/spares-portal" replace />;
    case 'technician':
      return <Navigate to="/app/technicians" replace />;
    default:
      return <Navigate to="/app/overview" replace />;
  }
};

// ─── Aircraft Detail Page wrapper handling query params ──────────────────────
const AircraftDetailPageWrapper: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const aircraftId = searchParams.get('id') || 'A101';

  return (
    <AircraftDetailPage
      aircraftId={aircraftId}
      onNavigatePage={(page) => navigate(`/app/${page}`)}
    />
  );
};

// ─── Overview Page wrapper ───────────────────────────────────────────────────
const OverviewPageWrapper: React.FC = () => {
  const navigate = useNavigate();

  const handleQuickSimulationStep = async () => {
    try {
      await api.stepSimulation('A101');
      toast.success('Simulation Stepped', 'Sensor degradation telemetry updated for A101.');
    } catch {
      toast.error('Simulation step failed', 'Unable to advance simulation. Is the backend running?');
    }
  };

  return (
    <OverviewPage
      onSelectAircraft={(id) => navigate(`/app/aircraft?id=${id}`)}
      onNavigatePage={(page) => navigate(`/app/${page}`)}
      onQuickSim={handleQuickSimulationStep}
    />
  );
};

// ─── Main App Component ──────────────────────────────────────────────────────
export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <TitleWatcher />
        <Routes>
          {/* Public Landing & Login */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login/:department" element={<DepartmentLoginPage />} />
          <Route path="/login" element={<Navigate to="/login/commander" replace />} />
          <Route path="/access-denied" element={<AccessDenied />} />

          {/* Authenticated Department & System Routes */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AppIndexRedirect />} />

            {/* Department-Specific Dashboards */}
            <Route
              path="commander"
              element={
                <ProtectedRoute allowedRoles={['commander', 'demo']}>
                  <CommanderDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="spares-portal"
              element={
                <ProtectedRoute allowedRoles={['spares', 'demo']}>
                  <SparesDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="technicians"
              element={
                <ProtectedRoute allowedRoles={['technician', 'demo']}>
                  <TechnicianDashboard />
                </ProtectedRoute>
              }
            />

            {/* Visual Maintenance Timetable */}
            <Route
              path="schedule"
              element={
                <MaintenanceTimetablePage
                  onSelectAircraft={(id) => {
                    window.location.href = `/app/aircraft?id=${id}`;
                  }}
                />
              }
            />

            {/* Preserved Core Applications */}
            <Route path="overview" element={<OverviewPageWrapper />} />
            <Route
              path="fleet"
              element={
                <FleetPage
                  onSelectAircraft={(id) => {
                    window.location.href = `/app/aircraft?id=${id}`;
                  }}
                />
              }
            />
            <Route path="aircraft" element={<AircraftDetailPageWrapper />} />
            <Route
              path="predictions"
              element={
                <PredictionsPage
                  onSelectAircraft={(id) => {
                    window.location.href = `/app/aircraft?id=${id}`;
                  }}
                />
              }
            />
            <Route path="maintenance" element={<MaintenancePlannerPage />} />
            <Route path="spares" element={<LogisticsPage />} />
            <Route path="simulation" element={<SimulationLabPage />} />
            <Route path="models" element={<ModelPerformancePage />} />
            <Route
              path="alerts"
              element={
                <AlertsPage
                  onSelectAircraft={(id) => {
                    window.location.href = `/app/aircraft?id=${id}`;
                  }}
                />
              }
            />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* 404 Catch-All */}
          <Route
            path="*"
            element={
              <NotFoundPage
                onNavigateHome={() => {
                  window.location.href = '/';
                }}
              />
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
