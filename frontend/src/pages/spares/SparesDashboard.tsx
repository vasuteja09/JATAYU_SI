import React, { useState, useEffect, useCallback } from 'react';
import { Package, AlertTriangle, CheckCircle2, RefreshCw, Search, Filter, X } from 'lucide-react';
import { api } from '../../services/api';
import { SparePart, SpareShortageAlert } from '../../types';
import { toast } from '../../components/ui/Toast';

const STATUS_BADGE: Record<string, string> = {
  AVAILABLE:        'bg-emerald-100 text-emerald-700 border-emerald-200',
  LOW_STOCK:        'bg-yellow-100 text-yellow-700 border-yellow-200',
  CRITICAL_SHORTAGE:'bg-rose-100 text-rose-700 border-rose-200',
};

const FILTERS = ['All', 'AVAILABLE', 'LOW_STOCK', 'CRITICAL_SHORTAGE'];

export const SparesDashboard: React.FC = () => {
  const [parts, setParts] = useState<SparePart[]>([]);
  const [shortages, setShortages] = useState<SpareShortageAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [reservingId, setReservingId] = useState<string | null>(null);
  const [stockUpdate, setStockUpdate] = useState<Record<string, number>>({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const [partsRes, shortagesRes] = await Promise.all([
        api.getSpares(),
        api.getSpareShortages(),
      ]);
      setParts(partsRes.inventory || []);
      setShortages(shortagesRes.alerts || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredParts = parts.filter(p => {
    const matchesFilter = filter === 'All' || p.status === filter;
    const matchesSearch = !search || p.part_name.toLowerCase().includes(search.toLowerCase()) || p.part_id.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleReserve = async (partId: string, aircraftId: string) => {
    setReservingId(partId);
    try {
      const res = await api.reserveSpare(partId, aircraftId, 1);
      if (res.success) {
        toast.success('Part Reserved', res.message);
        await fetchData();
      } else {
        toast.error('Reservation Failed', res.message);
      }
    } catch {
      toast.error('Error', 'Unable to reserve part. Please try again.');
    } finally {
      setReservingId(null);
    }
  };

  const handleStockUpdate = async (partId: string, adjustment: number) => {
    if (!adjustment) return;
    try {
      const res = await api.updateSpareStock(partId, adjustment, 'Manual stock update from Spares Portal');
      toast.success('Stock Updated', res.message);
      setStockUpdate(prev => ({ ...prev, [partId]: 0 }));
      await fetchData();
    } catch (err: any) {
      toast.error('Update Failed', err?.response?.data?.detail || 'Unable to update stock.');
    }
  };

  const kpis = [
    { label: 'Total Part Types',   value: parts.length,                                  color: 'text-aerospace-700', bg: 'bg-aerospace-50', border: 'border-aerospace-200' },
    { label: 'Available Units',    value: parts.reduce((s, p) => s + p.quantity, 0),      color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { label: 'Low Stock Items',    value: parts.filter(p => p.status === 'LOW_STOCK').length, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    { label: 'Critical Shortages', value: shortages.filter(s => s.shortage_level === 'CRITICAL').length, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
    { label: 'Reserved Parts',     value: parts.reduce((s, p) => s + p.reserved_quantity, 0), color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-white rounded-xl border border-slate-200 animate-pulse" />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <AlertTriangle className="w-8 h-8 text-orange-500 mx-auto mb-3" />
        <p className="text-sm text-slate-600 mb-4">Unable to load inventory data.</p>
        <button onClick={fetchData} className="bg-aerospace-900 text-white text-xs font-semibold px-4 py-2 rounded-lg">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-aerospace-900">Spare Parts Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">Inventory, shortages, and component availability</p>
          </div>
          <button onClick={fetchData} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-aerospace-900 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className={`bg-white rounded-xl border ${k.border} shadow-sm p-4`}>
            <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Shortage Alerts */}
      {shortages.length > 0 && (
        <div className="bg-white rounded-xl border border-rose-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-rose-500" aria-hidden="true" />
            <h2 className="text-sm font-bold text-aerospace-900">Parts Requiring Attention</h2>
            <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold border border-rose-200">
              {shortages.length} alert{shortages.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-3">
            {shortages.map((s) => (
              <div key={s.part_id} className="bg-red-50 border border-red-100 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">{s.part_name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${s.shortage_level === 'CRITICAL' ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                        {s.shortage_level}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Stock: <span className="font-semibold text-slate-700">{s.local_stock}</span> local · {s.depot_stock} depot
                      {s.affected_aircraft_id && <> · Affects: <span className="font-semibold font-mono">{s.affected_aircraft_id}</span></>}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{s.recommendation}</div>
                  </div>
                  <button
                    onClick={() => handleReserve(s.part_id, s.affected_aircraft_id || 'A101')}
                    disabled={reservingId === s.part_id || s.local_stock === 0}
                    className="flex-shrink-0 text-xs font-semibold bg-aerospace-900 hover:bg-aerospace-800 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Reserve Part
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-sm font-bold text-aerospace-900">Inventory</h2>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search parts..."
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-aerospace-600 w-40"
                aria-label="Search parts"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label="Clear search">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            {/* Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-aerospace-600"
              aria-label="Filter by status"
            >
              {FILTERS.map(f => <option key={f} value={f}>{f === 'All' ? 'All Items' : f.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Part ID', 'Name', 'Component', 'Available', 'Reserved', 'Min Stock', 'Location', 'Lead', 'Status', 'Adjust'].map(h => (
                  <th key={h} className="py-2.5 px-3 text-slate-500 font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredParts.length === 0 ? (
                <tr><td colSpan={10} className="py-8 text-center text-slate-400">No parts match your filters.</td></tr>
              ) : filteredParts.map((p) => (
                <tr key={p.part_id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">{p.part_id}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-800 max-w-[160px] truncate">{p.part_name}</td>
                  <td className="py-2.5 px-3 text-slate-500">{p.compatible_component_type}</td>
                  <td className="py-2.5 px-3 font-bold text-aerospace-900">{p.quantity}</td>
                  <td className="py-2.5 px-3 text-slate-500">{p.reserved_quantity}</td>
                  <td className="py-2.5 px-3 text-slate-500">{p.minimum_stock}</td>
                  <td className="py-2.5 px-3 text-slate-500 max-w-[120px] truncate">{p.storage_location}</td>
                  <td className="py-2.5 px-3 text-slate-500">{p.lead_time_days}d</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${STATUS_BADGE[p.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                      {p.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={stockUpdate[p.part_id] ?? 0}
                        onChange={(e) => setStockUpdate(prev => ({ ...prev, [p.part_id]: parseInt(e.target.value) || 0 }))}
                        className="w-14 text-xs border border-slate-200 rounded px-1.5 py-1 text-center focus:outline-none focus:ring-1 focus:ring-aerospace-600"
                        aria-label={`Stock adjustment for ${p.part_name}`}
                      />
                      <button
                        onClick={() => handleStockUpdate(p.part_id, stockUpdate[p.part_id] ?? 0)}
                        disabled={!stockUpdate[p.part_id]}
                        className="text-[10px] bg-aerospace-900 disabled:opacity-40 hover:bg-aerospace-800 text-white px-2 py-1 rounded transition-colors"
                        aria-label={`Apply stock adjustment for ${p.part_name}`}
                      >
                        Apply
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
