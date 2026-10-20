import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  Clock,
  Wrench,
  Boxes,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Cpu,
  BarChart2,
  Calendar
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
  Bar
} from 'recharts';

import { api } from '../services/api';
import { Aircraft, SensorReading, Component, Prediction } from '../types';
import { DigitalTwinSVG } from '../components/aircraft/DigitalTwinSVG';
import { StatusBadge } from '../components/ui/StatusBadge';
import { RiskBadge } from '../components/ui/RiskBadge';
import { DataProvenanceNote } from '../components/ui/DataProvenanceNote';
import { ApiError } from '../components/ui/ApiError';
import { toast } from '../components/ui/Toast';

interface AircraftDetailPageProps {
  aircraftId: string;
  onNavigatePage?: (page: string) => void;
}

export const AircraftDetailPage: React.FC<AircraftDetailPageProps> = ({
  aircraftId,
  onNavigatePage
}) => {
  const [aircraft, setAircraft] = useState<Aircraft | null>(null);
  const [sensors, setSensors] = useState<SensorReading[]>([]);
  const [maintRecords, setMaintRecords] = useState<any[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<string>('HYDRAULIC');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    loadAircraftData();
  }, [aircraftId]);

  const loadAircraftData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [acData, sensorData, maintData] = await Promise.all([
        api.getAircraftDetail(aircraftId),
        api.getAircraftSensors(aircraftId, 25),
        api.getAircraftMaintenance(aircraftId)
      ]);
      setAircraft(acData);
      setSensors(sensorData);
      setMaintRecords(maintData);
    } catch {
      setError(`Unable to load digital twin telemetry for airframe ${aircraftId}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleRunInference = async () => {
    try {
      setEvaluating(true);
      await api.runPrediction(aircraftId, selectedComponent);
      await loadAircraftData();
      toast.success('Inference Completed', `Telemetry evaluated for ${selectedComponent} on ${aircraftId}.`);
    } catch {
      toast.error('Inference Failed', 'Unable to complete ML prediction. Please try again.');
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-6">
        <div className="h-20 bg-slate-200 rounded-lg" />
        <div className="h-64 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-200 rounded-lg" />
          <div className="h-64 bg-slate-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !aircraft) {
    return (
      <div className="p-6">
        <ApiError
          title={`Airframe ${aircraftId} Telemetry Unavailable`}
          message={error || 'Unable to retrieve digital twin state.'}
          onRetry={loadAircraftData}
        />
      </div>
    );
  }

  const latestPred: any = (aircraft as any).latest_prediction;

  // Build component health map for SVG
  const healthMap: Record<string, any> = {};
  if (aircraft.components) {
    aircraft.components.forEach((c) => {
      healthMap[c.component_type] = {
        health: c.health_score,
        status: c.current_status,
        risk: c.component_type === latestPred?.component_type ? latestPred.risk_level : 'LOW'
      };
    });
  }

  const currentCompData = aircraft.components?.find(c => c.component_type === selectedComponent);

  // Parse SHAP factors
  const shapFactors = latestPred?.top_contributing_factors || [];

  return (
    <div className="space-y-6">
      {/* Airframe Identity Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold font-mono text-aerospace-900 tracking-tight">
              {aircraft.aircraft_id}
            </span>
            <span className="text-sm font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
              {aircraft.aircraft_type}
            </span>
            <StatusBadge status={aircraft.current_status} />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
            <span>Base: <strong className="text-slate-700">{aircraft.base_location}</strong></span>
            <span>Flight Hours: <strong className="text-slate-700 font-mono">{aircraft.total_flight_hours} hrs</strong></span>
            <span>Flight Cycles: <strong className="text-slate-700 font-mono">{aircraft.total_cycles}</strong></span>
            <span>Airframe Age: <strong className="text-slate-700 font-mono">{aircraft.age_years} yrs</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Prototype Health</div>
            <div className={`text-2xl font-bold font-mono ${aircraft.health_score < 65 ? 'text-rose-600' : aircraft.health_score < 80 ? 'text-amber-600' : 'text-emerald-600'
              }`}>
              {aircraft.health_score}%
            </div>
          </div>

          <button
            onClick={handleRunInference}
            disabled={evaluating}
            className="flex items-center gap-2 bg-aerospace-900 hover:bg-aerospace-800 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${evaluating ? 'animate-spin' : ''}`} />
            <span>{evaluating ? 'Computing Inference...' : 'Evaluate Telemetry'}</span>
          </button>
        </div>
      </div>

      {/* 2D Line-Art Aircraft Digital Twin Schematic */}
      <DigitalTwinSVG
        selectedComponent={selectedComponent}
        onSelectComponent={(c) => setSelectedComponent(c)}
        componentHealthMap={healthMap}
      />

      {/* Selected Component Status & AI Prediction Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selected Component Panel */}
        <div className="aerospace-card p-5">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                Selected Subsystem
              </span>
              <h3 className="text-base font-bold text-aerospace-900">
                {selectedComponent} System
              </h3>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {currentCompData?.health_score || 85}% Health
            </span>
          </div>

          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            {currentCompData?.component_name || `${selectedComponent} Primary Module`}
          </p>

          <div className="space-y-2.5 bg-slate-50 p-3 rounded-lg border border-slate-200/70 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Operating Hours:</span>
              <span className="font-mono font-semibold text-slate-800">{currentCompData?.total_operating_hours || 450} hrs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Previous Interventions:</span>
              <span className="font-mono font-semibold text-slate-800">{currentCompData?.previous_failures || 0} times</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">System Criticality:</span>
              <span className="font-semibold text-aerospace-800">{currentCompData?.criticality || 'HIGH'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Compatible Spare:</span>
              <span className="font-mono font-semibold text-slate-700">
                {currentCompData?.compatible_part_id || 'SP-HYD-01'}
              </span>
            </div>
          </div>

          {/* Action Recommendation */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="text-[11px] uppercase font-bold text-slate-500 mb-1">Recommended Action</div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium bg-amber-50/70 border border-amber-200 p-2.5 rounded-lg mb-3">
              {latestPred?.recommended_action || 'Routine health telemetry nominal. Standard turnaround inspection.'}
            </p>

            {onNavigatePage && (
              <button
                onClick={() => onNavigatePage('maintenance')}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Wrench className="w-3.5 h-3.5 text-sky-400" />
                <span>Plan Maintenance in Scheduler</span>
              </button>
            )}
          </div>
        </div>

        {/* AI Predictive Inference Diagnostics */}
        <div className="aerospace-card p-5">
          <div className="flex justify-between items-center mb-3">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                AI Diagnostics
              </span>
              <h3 className="text-base font-bold text-aerospace-900">
                Risk & RUL Inference
              </h3>
            </div>
            <span className="text-[10px] font-mono bg-aerospace-50 text-aerospace-800 font-semibold px-2 py-0.5 rounded border border-aerospace-200">
              {latestPred?.model_mode || 'ML_INFERENCE'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 block mb-1">Failure Risk Level</span>
              <RiskBadge level={latestPred?.risk_level} probability={latestPred?.maintenance_probability} />
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 block mb-1">Estimated RUL</span>
              <div className="text-base font-bold font-mono text-slate-800">
                {latestPred?.predicted_rul_hours || 115} hrs
              </div>
              <span className="text-[10px] text-slate-400">
                [{latestPred?.rul_lower_bound || 95}h – {latestPred?.rul_upper_bound || 135}h]
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4">
            <div className="flex justify-between">
              <span className="text-slate-500">Anomaly Indicator:</span>
              <span className={`font-semibold ${latestPred?.anomaly_detected ? 'text-rose-600' : 'text-emerald-600'}`}>
                {latestPred?.anomaly_detected ? `DETECTED (${latestPred.anomaly_severity})` : 'NOMINAL (Normal)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Isolation Score:</span>
              <span className="font-mono text-slate-700">{latestPred?.anomaly_score || -0.12}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Model Confidence:</span>
              <span className="font-mono text-slate-700">{Math.round((latestPred?.confidence || 0.88) * 100)}%</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 italic">
            * Estimated RUL represents prototype decision-support forecasting under model assumptions. Not a certified guarantee.
          </p>
        </div>

        {/* Explainability "Why?" Chart (SHAP Contributions) */}
        <div className="aerospace-card p-5">
          <div className="flex justify-between items-center mb-2">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                Explainable AI (XAI)
              </span>
              <h3 className="text-base font-bold text-aerospace-900">
                Top Contributing Factors
              </h3>
            </div>
            <Cpu className="w-4 h-4 text-aerospace-600" />
          </div>
          <p className="text-[11px] text-slate-500 mb-4">
            SHAP feature attribution explaining model output. Indicates influence, not physical causality.
          </p>

          <div className="space-y-3">
            {shapFactors.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4">No significant anomaly factors identified.</p>
            ) : (
              shapFactors.map((f: any, idx: number) => {
                const pct = Math.min(100, Math.round(f.impact * 200));
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700 truncate">{f.factor}</span>
                      <span className="font-mono font-bold text-aerospace-900">{f.impact}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-aerospace-600 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate">{f.description}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Sensor Trends Over Time */}
      <div className="aerospace-card p-5">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-semibold text-aerospace-900">Live Health Telemetry Stream</h3>
            <p className="text-xs text-slate-500">Historical sensor trends with prototype operational reference bands</p>
          </div>
          <span className="text-xs text-slate-500 font-mono">Last 25 operational intervals</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Temperature */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-600">Temperature (°C)</span>
              <span className="font-mono font-bold text-slate-800">
                {sensors.length > 0 ? sensors[sensors.length - 1].temperature : 80.0}°C
              </span>
            </div>
            <div className="h-[100px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sensors}>
                  <Line type="monotone" dataKey="temperature" stroke="#EF4444" strokeWidth={2} dot={false} />
                  <Tooltip contentStyle={{ fontSize: '10px' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">Ref. Band: 75°C - 88°C</span>
          </div>

          {/* Vibration */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-600">Vibration (mm/s)</span>
              <span className="font-mono font-bold text-slate-800">
                {sensors.length > 0 ? sensors[sensors.length - 1].vibration : 0.18}
              </span>
            </div>
            <div className="h-[100px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sensors}>
                  <Line type="monotone" dataKey="vibration" stroke="#F59E0B" strokeWidth={2} dot={false} />
                  <Tooltip contentStyle={{ fontSize: '10px' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">Ref. Band: 0.15 - 0.25 mm/s</span>
          </div>

          {/* Hydraulic Pressure */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-600">Hydraulic Pressure (psi)</span>
              <span className="font-mono font-bold text-slate-800">
                {sensors.length > 0 ? sensors[sensors.length - 1].hydraulic_pressure : 3000} psi
              </span>
            </div>
            <div className="h-[100px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sensors}>
                  <Line type="monotone" dataKey="hydraulic_pressure" stroke="#3B82F6" strokeWidth={2} dot={false} />
                  <Tooltip contentStyle={{ fontSize: '10px' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">Ref. Band: 2850 - 3050 psi</span>
          </div>

          {/* System Pressure */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-600">Line Pressure (psi)</span>
              <span className="font-mono font-bold text-slate-800">
                {sensors.length > 0 ? sensors[sensors.length - 1].pressure : 3000} psi
              </span>
            </div>
            <div className="h-[100px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sensors}>
                  <Line type="monotone" dataKey="pressure" stroke="#10B981" strokeWidth={2} dot={false} />
                  <Tooltip contentStyle={{ fontSize: '10px' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">Ref. Band: 2900 - 3100 psi</span>
          </div>
        </div>
      </div>

      {/* Maintenance History Timeline */}
      <div className="aerospace-card p-5">
        <h3 className="text-sm font-semibold text-aerospace-900 mb-1">Airframe Maintenance Log & Interventions</h3>
        <p className="text-xs text-slate-500 mb-4">Historical work orders and technical actions executed on {aircraft.aircraft_id}</p>

        {maintRecords.length === 0 ? (
          <p className="text-xs text-slate-400 py-3">No prior technical maintenance records logged for this airframe.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Fault Code</th>
                  <th className="py-2.5 px-3">Action Executed</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {maintRecords.map((m: any) => (
                  <tr key={m.maintenance_id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono font-bold text-slate-800">{m.maintenance_id}</td>
                    <td className="py-2 px-3 font-mono text-slate-600">{m.maintenance_date}</td>
                    <td className="py-2 px-3 font-medium text-slate-700">{m.maintenance_type}</td>
                    <td className="py-2 px-3 font-mono text-rose-600 font-semibold">{m.fault_code || '--'}</td>
                    <td className="py-2 px-3 text-slate-600 max-w-xs truncate">{m.action_taken}</td>
                    <td className="py-2 px-3 font-mono text-slate-700">{m.duration_hours}h</td>
                    <td className="py-2 px-3">
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DataProvenanceNote />
    </div>
  );
};
