import React, { useEffect, useState } from 'react';
import {
  Plane,
  AlertTriangle,
  Clock,
  Boxes,
  TrendingUp,
  Activity,
  ArrowRight,
  ShieldCheck,
  Wrench
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import { api } from '../services/api';
import { StatusBadge } from '../components/ui/StatusBadge';
import { RiskBadge } from '../components/ui/RiskBadge';
import { DataProvenanceNote } from '../components/ui/DataProvenanceNote';
import { ApiError } from '../components/ui/ApiError';

interface OverviewPageProps {
  onSelectAircraft: (aircraftId: string) => void;
  onNavigatePage: (page: string) => void;
  onQuickSim: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onSelectAircraft,
  onNavigatePage,
  onQuickSim
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const summary = await api.getDashboardSummary();
      setData(summary);
    } catch {
      setError('Unable to load fleet readiness dashboard. Please ensure backend services are active.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-6">
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-200 rounded-lg" />
          <div className="h-64 bg-slate-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <ApiError
          title="Fleet Intelligence Offline"
          message={error || 'Unable to load dashboard data. Please verify backend connection.'}
          onRetry={loadData}
        />
      </div>
    );
  }

  const { kpis, availability_trend, health_distribution, top_risk_aircraft, maintenance_forecast } = data;

  const pieData = Object.entries(health_distribution).map(([name, value]) => ({
    name,
    value
  }));
  const PIE_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];

  return (
    <div className="space-y-6">
      {/* Top Banner / Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-aerospace-900 tracking-tight">Fleet Availability Intelligence</h1>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">Live Telemetry</span>
          </div>
          <p className="text-xs text-slate-500">
            Real-time health assessment, predictive fault early warning, and maintenance constraint optimization.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onQuickSim}
            className="flex items-center gap-2 bg-aerospace-900 text-white hover:bg-aerospace-800 px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Activity className="w-4 h-4 text-sky-400" />
            <span>Simulate Sensor Telemetry</span>
          </button>
          <button
            onClick={() => onNavigatePage('maintenance')}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-300 transition-all"
          >
            <Wrench className="w-4 h-4 text-slate-600" />
            <span>Optimize Queue</span>
          </button>
        </div>
      </div>

      {/* 6 Key Performance Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Availability */}
        <div className="aerospace-card p-4 border-l-4 border-l-emerald-500">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Fleet Availability</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-aerospace-900 font-mono">{kpis.availability_percentage}%</span>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center">
              <TrendingUp className="w-3 h-3" /> +2.4%
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Target baseline: 85%</div>
        </div>

        {/* Available Aircraft */}
        <div className="aerospace-card p-4 border-l-4 border-l-aerospace-600">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Available Fleet</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-aerospace-900 font-mono">{kpis.available_aircraft}</span>
            <span className="text-xs text-slate-400">/ {kpis.total_aircraft}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Airframes ready</div>
        </div>

        {/* High-Risk Aircraft */}
        <div className="aerospace-card p-4 border-l-4 border-l-rose-500">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">High-Risk Assets</div>
          <div className="text-2xl font-bold text-rose-600 font-mono">{kpis.high_risk_aircraft}</div>
          <div className="text-[10px] text-slate-400 mt-1">Urgent attention needed</div>
        </div>

        {/* Critical Alerts */}
        <div className="aerospace-card p-4 border-l-4 border-l-amber-500">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Critical Alerts</div>
          <div className="text-2xl font-bold text-amber-600 font-mono">{kpis.critical_alerts}</div>
          <div className="text-[10px] text-slate-400 mt-1">Telemetry anomalies</div>
        </div>

        {/* Predicted Maintenance */}
        <div className="aerospace-card p-4 border-l-4 border-l-blue-500">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Predicted Tasks</div>
          <div className="text-2xl font-bold text-blue-600 font-mono">{kpis.predicted_maintenance_count}</div>
          <div className="text-[10px] text-slate-400 mt-1">In next 72 hours</div>
        </div>

        {/* Spare Shortages */}
        <div className="aerospace-card p-4 border-l-4 border-l-orange-500">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Spare Shortages</div>
          <div className="text-2xl font-bold text-orange-600 font-mono">{kpis.spare_shortages_count}</div>
          <div className="text-[10px] text-slate-400 mt-1">Inter-depot transfer ready</div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Availability Trend Chart (2 columns) */}
        <div className="aerospace-card p-5 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-semibold text-aerospace-900">Fleet Availability Trajectory</h3>
              <p className="text-xs text-slate-500">14-day historical telemetry vs 85% operational readiness target</p>
            </div>
            <span className="text-xs font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Current: {kpis.availability_percentage}%
            </span>
          </div>

          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={availability_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis domain={[60, 100]} tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F2855', color: '#fff', borderRadius: '6px', fontSize: '11px', border: 'none' }}
                />
                <Line
                  type="monotone"
                  dataKey="availability"
                  name="Availability %"
                  stroke="#1D4ED8"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#1D4ED8' }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  name="Target (85%)"
                  stroke="#10B981"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Health Distribution Donut */}
        <div className="aerospace-card p-5">
          <h3 className="text-sm font-semibold text-aerospace-900 mb-1">Aircraft Health Distribution</h3>
          <p className="text-xs text-slate-500 mb-2">Fleet categorized by prototype health score</p>

          <div className="h-[180px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F2855', color: '#fff', borderRadius: '6px', fontSize: '11px', border: 'none' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs mt-2 pt-2 border-t border-slate-100">
            {pieData.map((item, i) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i] }} />
                <span className="text-slate-600 truncate text-[11px]">{item.name}:</span>
                <span className="font-semibold text-slate-800 font-mono text-[11px]">{String(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Risk Aircraft Table & Recommended Action Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Risk Table (2 cols) */}
        <div className="aerospace-card p-5 lg:col-span-2">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-sm font-semibold text-aerospace-900">Highest Risk Aircraft Under Watch</h3>
              <p className="text-xs text-slate-500">Prioritized by ML failure risk probability & remaining useful life</p>
            </div>
            <button
              onClick={() => onNavigatePage('fleet')}
              className="text-xs text-aerospace-700 hover:text-aerospace-900 font-semibold flex items-center gap-1"
            >
              <span>View All Fleet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Aircraft ID</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Health</th>
                  <th className="py-2.5 px-3">Risk Level</th>
                  <th className="py-2.5 px-3">Pred. RUL</th>
                  <th className="py-2.5 px-3">At-Risk Component</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {top_risk_aircraft.map((ac: any) => (
                  <tr key={ac.aircraft_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-aerospace-900">{ac.aircraft_id}</td>
                    <td className="py-2.5 px-3 text-slate-600">{ac.aircraft_type}</td>
                    <td className="py-2.5 px-3 font-mono font-medium">
                      <span className={`inline-block w-12 text-center py-0.5 rounded text-[11px] font-bold ${
                        ac.health_score < 65 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {ac.health_score}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <RiskBadge level={ac.latest_risk_level} />
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700 font-semibold">
                      {ac.latest_rul_hours} hrs
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-medium">
                      {ac.latest_predicted_component}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onSelectAircraft(ac.aircraft_id)}
                        className="bg-aerospace-50 hover:bg-aerospace-100 text-aerospace-800 font-semibold px-2.5 py-1 rounded border border-aerospace-200 transition-colors"
                      >
                        Inspect Twin
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Featured Recommendation Card (§57) */}
        <div className="aerospace-card p-5 border-t-4 border-t-aerospace-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                Priority Action Recommendation
              </span>
              <span className="text-xs font-mono font-bold text-slate-500">ID: A101 / A116</span>
            </div>

            <h4 className="text-sm font-bold text-aerospace-900 mb-2">
              Hydraulic Subsystem Predictive Alert
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Vibration harmonic amplitude rising (+48% deviation) while hydraulic pressure drops below 2600 psi.
            </p>

            <div className="space-y-2.5 bg-slate-50 p-3 rounded-lg border border-slate-200/70 text-xs mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Required Part:</span>
                <span className="font-semibold text-slate-800">Hydraulic Pump X-200</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Local Inventory:</span>
                <span className="font-bold text-rose-600">0 units (Base Alpha)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Central Depot B:</span>
                <span className="font-bold text-emerald-600">3 units available</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estimated Duration:</span>
                <span className="font-semibold text-slate-800">4 hours</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => onNavigatePage('maintenance')}
              className="w-full bg-aerospace-900 hover:bg-aerospace-800 text-white font-semibold py-2 rounded-lg text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              <Wrench className="w-3.5 h-3.5 text-sky-400" />
              <span>Optimize Schedule & Allocate Part</span>
            </button>
            <button
              onClick={() => onSelectAircraft('A101')}
              className="w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold py-1.5 rounded-lg text-xs border border-slate-300 transition-colors"
            >
              View A101 Telemetry Detail
            </button>
          </div>
        </div>
      </div>

      {/* Maintenance Forecast Row */}
      <div className="aerospace-card p-5">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-sm font-semibold text-aerospace-900">Upcoming 4-Week Maintenance Forecast</h3>
            <p className="text-xs text-slate-500">Planned scheduled inspections vs AI-predicted corrective interventions</p>
          </div>
        </div>
        <div className="h-[160px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={maintenance_forecast} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F2855', color: '#fff', borderRadius: '6px', fontSize: '11px', border: 'none' }}
              />
              <Bar dataKey="scheduled" name="Scheduled Routine" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="predicted_unplanned" name="AI-Predicted Maintenance" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <DataProvenanceNote />
    </div>
  );
};
