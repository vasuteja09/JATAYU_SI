import React, { useState, useEffect } from 'react';
import { Boxes, AlertTriangle, ArrowRight, CheckCircle2, RefreshCw, Truck } from 'lucide-react';
import { api } from '../services/api';
import { SparePart, SpareShortageAlert } from '../types';
import { DataProvenanceNote } from '../components/ui/DataProvenanceNote';
import { ApiError } from '../components/ui/ApiError';
import { EmptyState } from '../components/ui/EmptyState';
import { toast } from '../components/ui/Toast';

export const LogisticsPage: React.FC = () => {
  const [spares, setSpares] = useState<SparePart[]>([]);
  const [shortages, setShortages] = useState<SpareShortageAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [reservingPartId, setReservingPartId] = useState<string | null>(null);

  useEffect(() => {
    fetchLogisticsData();
  }, []);

  const fetchLogisticsData = async () => {
    try {
      setLoading(true);
      setFetchError(false);
      const [sparesRes, shortagesRes] = await Promise.all([
        api.getSpares(),
        api.getSpareShortages()
      ]);
      setSpares(sparesRes.inventory);
      setShortages(shortagesRes.alerts);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = async (partId: string, aircraftId = 'A101') => {
    try {
      setReservingPartId(partId);
      const res: any = await api.reserveSpare(partId, aircraftId, 1);
      toast.success('Spare reserved', res.message || 'Spare transaction executed successfully.');
      await fetchLogisticsData();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Unknown error';
      toast.error('Reservation failed', `Unable to allocate spare part: ${msg}`);
    } finally {
      setReservingPartId(null);
    }
  };

  const totalParts = spares.length;
  const lowStockCount = spares.filter(s => s.status === 'LOW_STOCK').length;
  const criticalCount = spares.filter(s => s.status === 'CRITICAL_SHORTAGE').length;
  const totalAvailable = spares.reduce((acc, s) => acc + s.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-aerospace-900 tracking-tight">Logistics & Spare Parts Intelligence</h1>
          <p className="text-xs text-slate-500">
            Automated depot stock monitoring, predictive shortages early warning, and inter-base logistics routing.
          </p>
        </div>
        <button
          onClick={fetchLogisticsData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Stock</span>
        </button>
      </div>


      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="aerospace-card p-4 border-l-4 border-l-aerospace-600">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Part SKUs</span>
          <div className="text-2xl font-bold text-aerospace-900 font-mono mt-1">{totalParts} SKUs</div>
          <span className="text-[10px] text-slate-400">{totalAvailable} units across all bases</span>
        </div>

        <div className="aerospace-card p-4 border-l-4 border-l-rose-500">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Critical Depleted</span>
          <div className="text-2xl font-bold text-rose-600 font-mono mt-1">{criticalCount} Items</div>
          <span className="text-[10px] text-slate-400">Stock = 0 units</span>
        </div>

        <div className="aerospace-card p-4 border-l-4 border-l-amber-500">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Low Stock Threshold</span>
          <div className="text-2xl font-bold text-amber-600 font-mono mt-1">{lowStockCount} Items</div>
          <span className="text-[10px] text-slate-400">Below minimum buffer</span>
        </div>

        <div className="aerospace-card p-4 border-l-4 border-l-emerald-500">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Inter-Depot Transfers</span>
          <div className="text-2xl font-bold text-emerald-600 font-mono mt-1">Ready</div>
          <span className="text-[10px] text-slate-400">Central Depot B connected</span>
        </div>
      </div>

      {/* Shortage Alerts & Transfer Actions (§22, §38) */}
      <div className="aerospace-card p-5">
        <h3 className="text-sm font-semibold text-aerospace-900 mb-1">
          Predictive Logistics Alerts & Inter-Depot Recommendations
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Identifies aircraft scheduled for maintenance lacking local spares and provides automatic transfer routing.
        </p>

        <div className="space-y-3">
          {shortages.map((s, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                s.shortage_level === 'CRITICAL'
                  ? 'bg-rose-50/60 border-rose-200'
                  : 'bg-amber-50/60 border-amber-200'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    s.shortage_level === 'CRITICAL' ? 'bg-rose-200 text-rose-800' : 'bg-amber-200 text-amber-800'
                  }`}>
                    {s.shortage_level} SHORTAGE
                  </span>
                  <span className="text-sm font-bold text-slate-900">{s.part_name}</span>
                  <span className="text-xs font-mono text-slate-500">({s.part_id})</span>
                </div>
                <p className="text-xs text-slate-700 font-medium">{s.recommendation}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>Local Stock: <strong className="text-rose-600">{s.local_stock}</strong></span>
                  <span>Alternative Stock: <strong className="text-emerald-700">{s.depot_stock}</strong> ({s.alternative_location})</span>
                  <span>Lead Time: <strong className="text-slate-700">{s.lead_time_days} days</strong></span>
                </div>
              </div>

              <button
                onClick={() => handleReserve(s.part_id, 'A101')}
                disabled={reservingPartId === s.part_id}
                className="flex items-center gap-1.5 px-4 py-2 bg-aerospace-900 hover:bg-aerospace-800 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm self-start md:self-center whitespace-nowrap"
              >
                <Truck className="w-3.5 h-3.5 text-sky-400" />
                <span>{reservingPartId === s.part_id ? 'Transferring...' : 'Initiate Transfer & Reserve'}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Complete Spares Inventory Table */}
      <div className="aerospace-card overflow-hidden p-5">
        <h3 className="text-sm font-semibold text-aerospace-900 mb-3">Inventory Master List</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Part ID</th>
                <th className="py-2.5 px-3">Component / Part Description</th>
                <th className="py-2.5 px-3">System</th>
                <th className="py-2.5 px-3">Available</th>
                <th className="py-2.5 px-3">Reserved</th>
                <th className="py-2.5 px-3">Depot Location</th>
                <th className="py-2.5 px-3">Lead Time</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {spares.map((p) => (
                <tr key={p.part_id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-aerospace-900">{p.part_id}</td>
                  <td className="py-3 px-3 font-medium text-slate-800">{p.part_name}</td>
                  <td className="py-3 px-3 text-slate-600">{p.compatible_component_type}</td>
                  <td className="py-3 px-3 font-mono font-bold">
                    <span className={p.quantity === 0 ? 'text-rose-600' : 'text-slate-800'}>
                      {p.quantity} units
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600">{p.reserved_quantity} units</td>
                  <td className="py-3 px-3 text-slate-600">{p.storage_location}</td>
                  <td className="py-3 px-3 font-mono text-slate-700">{p.lead_time_days} days</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      p.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' :
                      p.status === 'LOW_STOCK' ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {p.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleReserve(p.part_id, 'A101')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs transition-colors"
                    >
                      Reserve 1
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DataProvenanceNote />
    </div>
  );
};
