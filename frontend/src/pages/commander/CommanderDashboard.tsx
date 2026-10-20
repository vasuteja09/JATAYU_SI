import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plane, Activity, AlertTriangle, Wrench, Package, Clock,
  ChevronRight, Calendar, TrendingUp, RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';
import { MaintenanceTask, FleetSummary } from '../../types';
import { useAuth } from '../../context/AuthContext';

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-rose-100 text-rose-700 border-rose-200',
  HIGH:     'bg-orange-100 text-orange-700 border-orange-200',
  MEDIUM:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  LOW:      'bg-slate-100 text-slate-600 border-slate-200',
};

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE:         'bg-emerald-100 text-emerald-700',
  MONITORING:        'bg-blue-100 text-blue-700',
  MAINTENANCE_DUE:   'bg-yellow-100 text-yellow-700',
  UNDER_MAINTENANCE: 'bg-orange-100 text-orange-700',
  AWAITING_PART:     'bg-purple-100 text-purple-700',
  HIGH_RISK:         'bg-rose-100 text-rose-700',
};

export const CommanderDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { username } = useAuth();

  const [summary, setSummary] = useState<FleetSummary | null>(null);
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [shortages, setShortages] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const [fleetRes, taskRes, shortageRes] = await Promise.all([
        api.getFleetSummary(),
        api.getMaintenanceQueue(),
        api.getSpareShortages(),
      ]);
      setSummary(fleetRes);
      setTasks(taskRes.tasks || []);
      setShortages(shortageRes.total_shortages || 0);
      setLastRefresh(new Date());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const criticalTasks = tasks.filter(t => t.priority === 'CRITICAL' || t.priority === 'HIGH').slice(0, 8);
  const upcomingTasks = [...tasks].sort((a, b) => a.start_time_slot - b.start_time_slot).slice(0, 5);

  const kpis = summary ? [
    { label: 'Total Aircraft', value: summary.total_aircraft, icon: Plane, color: 'text-aerospace-700', bg: 'bg-aerospace-50', border: 'border-aerospace-200' },
    { label: 'Available', value: summary.available_aircraft, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { label: 'Under Maintenance', value: (summary.status_breakdown?.UNDER_MAINTENANCE || 0), icon: Wrench, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    { label: 'High Risk Aircraft', value: summary.high_risk_aircraft, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
    { label: 'Pending Tasks', value: tasks.length, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { label: 'Spare Shortages', value: shortages, icon: Package, color: shortages > 0 ? 'text-rose-600' : 'text-slate-500', bg: shortages > 0 ? 'bg-rose-50' : 'bg-slate-50', border: shortages > 0 ? 'border-rose-200' : 'border-slate-200' },
  ] : [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-white rounded-xl border border-slate-200 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-white rounded-xl border border-slate-200 animate-pulse" />)}
        </div>
        <div className="h-80 bg-white rounded-xl border border-slate-200 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <AlertTriangle className="w-8 h-8 text-orange-500 mx-auto mb-3" />
        <h2 className="text-sm font-bold text-slate-800 mb-1">Unable to load fleet data</h2>
        <p className="text-xs text-slate-500 mb-4">Please ensure the backend is running.</p>
        <button onClick={fetchData} className="bg-aerospace-900 text-white text-xs font-semibold px-4 py-2 rounded-lg">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-aerospace-900">Welcome, Commander</h1>
            <p className="text-xs text-slate-500 mt-0.5">Fleet Health & Maintenance Overview · {dateStr}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400">
              Last updated {lastRefresh.toLocaleTimeString()}
            </span>
            <button
              onClick={fetchData}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-aerospace-900 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
              aria-label="Refresh dashboard"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              Refresh
            </button>
          </div>
        </div>

        {/* Availability bar */}
        {summary && (
          <div className="mt-4 bg-slate-50 rounded-lg p-3 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-[11px] font-semibold text-slate-600">Fleet Availability</span>
                <span className="text-[11px] font-bold text-aerospace-900">{summary.availability_percentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-aerospace-600 h-2 rounded-full transition-all"
                  style={{ width: `${summary.availability_percentage}%` }}
                />
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-aerospace-900">{summary.available_aircraft}/{summary.total_aircraft}</div>
              <div className="text-[10px] text-slate-400">available</div>
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className={`bg-white rounded-xl border ${kpi.border} shadow-sm p-4 flex flex-col gap-2`}>
              <div className={`w-9 h-9 rounded-lg ${kpi.bg} border ${kpi.border} flex items-center justify-center`}>
                <Icon className={`w-4.5 h-4.5 ${kpi.color}`} aria-hidden="true" />
              </div>
              <div>
                <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value ?? '—'}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{kpi.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fleet Status Breakdown */}
      {summary?.status_breakdown && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-sm font-bold text-aerospace-900 mb-4">Fleet Status Breakdown</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {Object.entries(summary.status_breakdown).map(([status, count]) => (
              <div key={status} className={`rounded-lg p-3 text-center ${STATUS_COLORS[status] || 'bg-slate-50 text-slate-600'}`}>
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-[10px] font-semibold mt-0.5">{status.replace(/_/g, ' ')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Priority Queue */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-sm font-bold text-aerospace-900 mb-4">Priority Maintenance Queue</h2>
          {criticalTasks.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-400">No pending high-priority tasks.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['Aircraft', 'Component', 'Priority', 'RUL (h)', 'Status'].map(h => (
                      <th key={h} className="py-2 px-3 text-slate-500 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {criticalTasks.map((t) => (
                    <tr
                      key={t.task_id}
                      onClick={() => navigate(`/app/aircraft?id=${t.aircraft_id}`)}
                      title={`View Digital Twin for ${t.aircraft_id}`}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-aerospace-900">{t.aircraft_id}</td>
                      <td className="py-2.5 px-3 text-slate-700 font-medium max-w-[140px] truncate">{t.task_name}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${PRIORITY_COLORS[t.priority] || 'bg-slate-100 text-slate-600'}`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-rose-600 font-semibold">{t.rul_deadline_hours}h</td>
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] font-semibold text-slate-500">{t.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Schedule Preview */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-aerospace-900">Upcoming Schedule</h2>
            <Clock className="w-4 h-4 text-slate-400" aria-hidden="true" />
          </div>

          {upcomingTasks.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm text-slate-400">No scheduled tasks.</div>
          ) : (
            <div className="space-y-2 flex-1">
              {upcomingTasks.map((t) => (
                <div key={t.task_id} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs font-bold text-aerospace-900">{t.aircraft_id}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${PRIORITY_COLORS[t.priority] || ''}`}>{t.priority}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5 truncate">{t.task_name}</div>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono">
                    Slot {t.start_time_slot}h → {t.end_time_slot}h · {t.duration_hours}h
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => navigate('/app/schedule')}
            className="mt-4 w-full flex items-center justify-center gap-2 border border-aerospace-300 hover:bg-aerospace-50 text-aerospace-700 font-semibold px-4 py-2 rounded-lg text-xs transition-colors"
          >
            View Full Timetable
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};
