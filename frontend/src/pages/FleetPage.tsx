import React, { useState, useEffect } from 'react';
import { Search, Filter, ArrowUpDown, ExternalLink, RefreshCw, Plane } from 'lucide-react';
import { api } from '../services/api';
import { Aircraft } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import { RiskBadge } from '../components/ui/RiskBadge';
import { DataProvenanceNote } from '../components/ui/DataProvenanceNote';
import { EmptyState } from '../components/ui/EmptyState';
import { ApiError } from '../components/ui/ApiError';

interface FleetPageProps {
  onSelectAircraft: (aircraftId: string) => void;
}

export const FleetPage: React.FC<FleetPageProps> = ({ onSelectAircraft }) => {
  const [aircraftList, setAircraftList] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState<'health_score' | 'latest_rul_hours' | 'total_flight_hours'>('health_score');
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    fetchFleet();
  }, [typeFilter, statusFilter, search]);

  const fetchFleet = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getFleet({
        aircraft_type: typeFilter || undefined,
        status: statusFilter || undefined,
        search: search || undefined
      });
      setAircraftList(res.aircraft);
    } catch {
      setError('Unable to load fleet data. Please ensure the backend service is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: 'health_score' | 'latest_rul_hours' | 'total_flight_hours') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedList = [...aircraftList].sort((a, b) => {
    let aVal = a[sortField] || 0;
    let bVal = b[sortField] || 0;
    if (aVal < bVal) return sortAsc ? -1 : 1;
    if (aVal > bVal) return sortAsc ? 1 : -1;
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-aerospace-900 tracking-tight">Fleet Asset Directory</h1>
          <p className="text-xs text-slate-500">
            Monitoring health, flight hours, predictive risk parameters, and subsystem status across {aircraftList.length > 0 ? aircraftList.length : 15} operational fleet airframes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchFleet}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Airframe (e.g. A101)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-md border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-aerospace-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-md border border-slate-300 text-xs text-slate-700 bg-white focus:outline-none"
          >
            <option value="">All Aircraft Types</option>
            <option value="Tactical Transport">Tactical Transport</option>
            <option value="Heavy Transport">Heavy Transport</option>
            <option value="Rotary Utility">Rotary Utility</option>
            <option value="Maritime Patrol">Maritime Patrol</option>
            <option value="Advanced Jet Trainer">Advanced Jet Trainer</option>
            <option value="Light Utility">Light Utility</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-md border border-slate-300 text-xs text-slate-700 bg-white focus:outline-none"
          >
            <option value="">All Operational Statuses</option>
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="MONITORING">MONITORING</option>
            <option value="MAINTENANCE_DUE">MAINTENANCE DUE</option>
            <option value="UNDER_MAINTENANCE">UNDER MAINTENANCE</option>
            <option value="AWAITING_PART">AWAITING PART</option>
            <option value="HIGH_RISK">HIGH RISK</option>
          </select>
        </div>
      </div>

      {/* Fleet Table */}
      <div className="aerospace-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Airframe ID</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Base Location</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('health_score')}>
                  <div className="flex items-center gap-1">
                    <span>Health Score</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3">Failure Risk</th>
                <th className="py-3 px-3">At-Risk Component</th>
                <th className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('latest_rul_hours')}>
                  <div className="flex items-center gap-1">
                    <span>Pred. RUL</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('total_flight_hours')}>
                  <div className="flex items-center gap-1">
                    <span>Flight Hours</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-aerospace-600" />
                      <span>Loading fleet telemetry records...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={10} className="py-4">
                    <ApiError message={error} onRetry={fetchFleet} />
                  </td>
                </tr>
              ) : sortedList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-4">
                    <EmptyState
                      icon={Plane}
                      title="No aircraft found"
                      description="No aircraft match the specified search or filter criteria."
                      action={
                        search || typeFilter || statusFilter
                          ? {
                              label: "Clear Filters",
                              onClick: () => {
                                setSearch('');
                                setTypeFilter('');
                                setStatusFilter('');
                              },
                            }
                          : undefined
                      }
                    />
                  </td>
                </tr>
              ) : (
                sortedList.map((ac) => (
                  <tr key={ac.aircraft_id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-aerospace-900">{ac.aircraft_id}</td>
                    <td className="py-3 px-3 text-slate-700 font-medium">{ac.aircraft_type}</td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">{ac.base_location.split('(')[0]}</td>
                    <td className="py-3 px-3">
                      <StatusBadge status={ac.current_status} />
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              ac.health_score < 65
                                ? 'bg-rose-500'
                                : ac.health_score < 80
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${ac.health_score}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-800 text-[11px]">{ac.health_score}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <RiskBadge level={ac.latest_risk_level} />
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {ac.latest_predicted_component || 'Nominal'}
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-700">
                      {ac.latest_rul_hours ? `${ac.latest_rul_hours} hrs` : '--'}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {ac.total_flight_hours} hrs
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onSelectAircraft(ac.aircraft_id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-aerospace-50 hover:bg-aerospace-100 text-aerospace-900 border border-aerospace-200 rounded font-semibold text-xs transition-colors"
                      >
                        <span>Inspect</span>
                        <ExternalLink className="w-3 h-3 text-aerospace-600" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DataProvenanceNote />
    </div>
  );
};
