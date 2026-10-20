import React, { useState, useEffect } from 'react';
import { Cpu, AlertTriangle, Clock, ShieldAlert, CheckCircle2, ChevronRight, RefreshCw, BarChart2, Wrench } from 'lucide-react';
import { api } from '../services/api';
import { Prediction } from '../types';
import { RiskBadge } from '../components/ui/RiskBadge';
import { DataProvenanceNote } from '../components/ui/DataProvenanceNote';
import { EmptyState } from '../components/ui/EmptyState';
import { ApiError } from '../components/ui/ApiError';
import { toast } from '../components/ui/Toast';

interface PredictionsPageProps {
  onSelectAircraft: (aircraftId: string) => void;
}

export const PredictionsPage: React.FC<PredictionsPageProps> = ({ onSelectAircraft }) => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [riskFilter, setRiskFilter] = useState('');
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(null);
  const [requestingTask, setRequestingTask] = useState(false);

  useEffect(() => {
    fetchPredictions();
  }, [riskFilter]);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getPredictions(riskFilter || undefined);
      setPredictions(res.predictions);
      if (res.predictions.length > 0 && !selectedPrediction) {
        setSelectedPrediction(res.predictions[0]);
      }
    } catch {
      setError('Unable to fetch ML predictions. Please verify backend service.');
    } finally {
      setLoading(false);
    }
  };

  const anomaliesCount = predictions.filter(p => p.anomaly_detected).length;
  const criticalCount = predictions.filter(p => p.risk_level === 'CRITICAL').length;
  const highRiskCount = predictions.filter(p => p.risk_level === 'HIGH').length;
  const lowRulCount = predictions.filter(p => p.predicted_rul_hours < 30).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-aerospace-900 tracking-tight">AI Prognostics & Prediction Center</h1>
          <p className="text-xs text-slate-500">
            Multi-model prognostic intelligence: Isolation Forest anomaly isolation, XGBoost failure-risk probability, and RUL regression.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700 bg-white focus:outline-none"
          >
            <option value="">All Risk Levels</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
          <button
            onClick={fetchPredictions}
            className="p-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
            title="Refresh Predictions"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="aerospace-card p-4 border-l-4 border-l-rose-500">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Critical Failure Risks</span>
          <div className="text-2xl font-bold text-rose-600 font-mono mt-1">{criticalCount}</div>
          <span className="text-[10px] text-slate-400">Immediate servicing required</span>
        </div>

        <div className="aerospace-card p-4 border-l-4 border-l-orange-500">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">High Risk Assets</span>
          <div className="text-2xl font-bold text-orange-600 font-mono mt-1">{highRiskCount}</div>
          <span className="text-[10px] text-slate-400">Probability &gt; 55%</span>
        </div>

        <div className="aerospace-card p-4 border-l-4 border-l-amber-500">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Sensor Anomalies</span>
          <div className="text-2xl font-bold text-amber-600 font-mono mt-1">{anomaliesCount}</div>
          <span className="text-[10px] text-slate-400">Flagged by Isolation Forest</span>
        </div>

        <div className="aerospace-card p-4 border-l-4 border-l-blue-500">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Low RUL (&lt;30h)</span>
          <div className="text-2xl font-bold text-blue-600 font-mono mt-1">{lowRulCount}</div>
          <span className="text-[10px] text-slate-400">Flight hour deadline active</span>
        </div>
      </div>

      {/* Predictions Table & Selected Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table (2 cols) */}
        <div className="aerospace-card p-5 lg:col-span-2 overflow-hidden">
          <h3 className="text-sm font-semibold text-aerospace-900 mb-3">Airframe Diagnostic Log</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Airframe</th>
                  <th className="py-2.5 px-3">Subsystem</th>
                  <th className="py-2.5 px-3">Risk Level</th>
                  <th className="py-2.5 px-3">Failure Prob</th>
                  <th className="py-2.5 px-3">Est. RUL</th>
                  <th className="py-2.5 px-3">Confidence</th>
                  <th className="py-2.5 px-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-aerospace-600" />
                        <span>Running ML prognostic queries...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="py-4">
                      <ApiError message={error} onRetry={fetchPredictions} />
                    </td>
                  </tr>
                ) : predictions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-4">
                      <EmptyState
                        icon={Cpu}
                        title="No active predictions"
                        description="No predictions match the selected filter criteria."
                        action={riskFilter ? { label: "Clear Risk Filter", onClick: () => setRiskFilter('') } : undefined}
                      />
                    </td>
                  </tr>
                ) : (
                  predictions.map((p) => {
                    const isSelected = selectedPrediction?.prediction_id === p.prediction_id;
                    return (
                      <tr
                        key={p.prediction_id}
                        onClick={() => setSelectedPrediction(p)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-aerospace-50/80 font-medium' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono font-bold text-aerospace-900">{p.aircraft_id}</td>
                        <td className="py-2.5 px-3 text-slate-700">{p.component_type}</td>
                        <td className="py-2.5 px-3">
                          <RiskBadge level={p.risk_level} />
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">
                          {Math.round(p.maintenance_probability * 100)}%
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">
                          {p.predicted_rul_hours} hrs
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {Math.round(p.confidence * 100)}%
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <ChevronRight className="w-4 h-4 text-slate-400 inline" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Prediction Detail View */}
        <div className="aerospace-card p-5">
          {selectedPrediction ? (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Prediction Inspection</span>
                  <h3 className="text-base font-bold text-aerospace-900">
                    {selectedPrediction.aircraft_id} — {selectedPrediction.component_type}
                  </h3>
                </div>
                <RiskBadge level={selectedPrediction.risk_level} />
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Anomaly Detection:</span>
                  <span className={`font-semibold ${selectedPrediction.anomaly_detected ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {selectedPrediction.anomaly_detected ? `DETECTED (${selectedPrediction.anomaly_severity})` : 'NOMINAL'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Failure Probability:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {Math.round(selectedPrediction.maintenance_probability * 100)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Estimated RUL:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedPrediction.predicted_rul_hours} flight hours
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Confidence Bounds:</span>
                  <span className="font-mono text-slate-600">
                    [{selectedPrediction.rul_lower_bound}h – {selectedPrediction.rul_upper_bound}h]
                  </span>
                </div>
              </div>

              {/* Explainability Section */}
              <div>
                <h4 className="text-xs font-bold text-aerospace-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5 text-aerospace-600" />
                  <span>Contributing Factors (SHAP)</span>
                </h4>
                <div className="space-y-2.5">
                  {selectedPrediction.top_contributing_factors.map((f, i) => (
                    <div key={i} className="text-xs bg-slate-50 p-2.5 rounded border border-slate-200/70">
                      <div className="flex justify-between font-semibold text-slate-800 mb-0.5">
                        <span>{f.factor}</span>
                        <span className="font-mono text-aerospace-700">{f.impact}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">{f.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendation Action */}
              <div className="pt-2">
                <span className="text-[11px] uppercase font-bold text-slate-400 block mb-1">Recommended Action</span>
                <p className="text-xs bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-amber-900 font-medium">
                  {selectedPrediction.recommended_action}
                </p>

                <button
                  onClick={() => onSelectAircraft(selectedPrediction.aircraft_id)}
                  className="w-full mt-3 bg-aerospace-900 hover:bg-aerospace-800 text-white font-semibold py-2 rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
                >
                  Open {selectedPrediction.aircraft_id} Digital Twin
                </button>

                <button
                  onClick={async () => {
                    try {
                      setRequestingTask(true);
                      const res = await api.requestInspection(
                        selectedPrediction.aircraft_id,
                        selectedPrediction.component_type,
                        `Predictive Servicing: ${selectedPrediction.component_type} on ${selectedPrediction.aircraft_id}`,
                        selectedPrediction.recommended_action
                      );
                      toast.success(
                        'Inspection Requested',
                        res.message || `Task ${res.task_id} successfully queued for scheduling.`
                      );
                    } catch (err: any) {
                      const msg = err?.response?.data?.detail || err?.message || 'Failed to request inspection.';
                      toast.error('Request Denied / Duplicate', msg);
                    } finally {
                      setRequestingTask(false);
                    }
                  }}
                  disabled={requestingTask}
                  className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2 rounded-lg text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Wrench className={`w-3.5 h-3.5 ${requestingTask ? 'animate-spin' : ''}`} />
                  {requestingTask ? 'Submitting Inspection Request...' : 'Request Maintenance Inspection'}
                </button>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              Select a prediction row to view detailed SHAP factor attributions.
            </div>
          )}
        </div>
      </div>

      <DataProvenanceNote />
    </div>
  );
};
