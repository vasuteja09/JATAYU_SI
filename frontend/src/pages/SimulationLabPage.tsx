import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Activity,
  Boxes,
  Wrench
} from 'lucide-react';
import { api } from '../services/api';
import { SimulationStepResult } from '../types';
import { RiskBadge } from '../components/ui/RiskBadge';
import { DataProvenanceNote } from '../components/ui/DataProvenanceNote';
import { toast } from '../components/ui/Toast';

export const SimulationLabPage: React.FC = () => {
  const [activeScenario, setActiveScenario] = useState<string>('SENSOR_DEGRADATION');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [stepData, setStepData] = useState<SimulationStepResult | null>(null);
  const [loading, setLoading] = useState(false);

  // What-If Sliders
  const [technicianCapacity, setTechnicianCapacity] = useState<number>(100);
  const [workshopCapacity, setWorkshopCapacity] = useState<number>(100);
  const [degradationRate, setDegradationRate] = useState<number>(1.0);

  const scenarios = [
    {
      id: 'HEALTHY',
      name: 'Scenario A: Nominal Healthy Fleet',
      desc: 'Stable telemetry across fleet; minimal anomaly scores and high operational availability.'
    },
    {
      id: 'SENSOR_DEGRADATION',
      name: 'Scenario B: Progressive Sensor Degradation (A101)',
      desc: 'Vibration & temperature deteriorate step-by-step to demonstrate predictive fault detection.'
    },
    {
      id: 'SPARE_SHORTAGE',
      name: 'Scenario C: Logistics Spare Shortage',
      desc: 'Simulates local inventory depletion and generates inter-depot transfer recommendation.'
    },
    {
      id: 'BOTTLENECK',
      name: 'Scenario D: Resource / Workshop Bottleneck',
      desc: 'Simulates technician conflicts and runs CP-SAT optimizer to minimize downtime.'
    },
    {
      id: 'POST_MAINTENANCE',
      name: 'Scenario E: Post-Maintenance Fleet Recovery',
      desc: 'Simulates completed work orders, recovering airframe health score and returning assets to service.'
    }
  ];

  const handleStart = async (scenId = activeScenario) => {
    setActiveScenario(scenId);
    setIsRunning(true);
    try {
      await api.startSimulation(scenId, 'A101');
      toast.info('Simulation Initialized', `Scenario: ${scenId}`);
    } catch {
      toast.error('Simulation Failed', 'Could not start simulation scenario.');
    }
  };

  const handleStep = async () => {
    setLoading(true);
    try {
      const res = await api.stepSimulation('A101');
      setStepData(res);
      setCurrentStep(res.step);
    } catch {
      toast.error('Simulation Step Error', 'Failed to advance simulation step.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      setIsRunning(false);
      setCurrentStep(0);
      setStepData(null);
      await api.resetSimulation('A101');
      toast.success('Simulation Reset', 'Telemetry returned to baseline status.');
    } catch {
      toast.error('Reset Failed', 'Could not reset simulation state.');
    }
  };

  // Compute what-if projected availability impact
  const calculatedProjectedAvailability = Math.round(
    Math.min(95, Math.max(60, 78 + (technicianCapacity / 100 * 5) + (workshopCapacity / 100 * 4) - (degradationRate * 3)))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-aerospace-900 tracking-tight">Prognostic Simulation Lab & What-If Studio</h1>
            <span className="text-xs bg-purple-100 text-purple-800 font-semibold px-2 py-0.5 rounded border border-purple-200">
              Interactive Testbench
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Simulate incoming aircraft telemetry streams, verify anomaly detection thresholds, and evaluate availability scenarios.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleStep}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-aerospace-900 hover:bg-aerospace-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <FastForward className="w-3.5 h-3.5 text-sky-400" />
            <span>Advance Step ({currentStep})</span>
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Baseline</span>
          </button>
        </div>
      </div>

      {/* Preset Scenarios Carousel/Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {scenarios.map((scen) => {
          const isActive = activeScenario === scen.id;
          return (
            <div
              key={scen.id}
              onClick={() => handleStart(scen.id)}
              className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                isActive
                  ? 'bg-aerospace-900 text-white border-aerospace-900 shadow-sm ring-2 ring-aerospace-500/20'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className={`text-[10px] font-mono font-bold block mb-1 ${isActive ? 'text-sky-300' : 'text-slate-400'}`}>
                {scen.id}
              </span>
              <h4 className="text-xs font-bold mb-1 line-clamp-1">{scen.name}</h4>
              <p className={`text-[11px] leading-snug line-clamp-2 ${isActive ? 'text-slate-200' : 'text-slate-500'}`}>
                {scen.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Live Simulation Step Progression Panel */}
      <div className="aerospace-card p-5">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-semibold text-aerospace-900">
              Live Degradation Progression Tracker — Airframe A101
            </h3>
            <p className="text-xs text-slate-500">
              Timeline transitions demonstrating predictive alert escalation before catastrophic failure.
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            Step {currentStep} of 8
          </span>
        </div>

        {/* 4-Stage Progressive Timeline (§26) */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[
            { id: 'HEALTHY', label: '1. Nominal Flight', color: 'bg-emerald-500', text: 'text-emerald-700' },
            { id: 'MONITORING', label: '2. Subtle Drift', color: 'bg-blue-500', text: 'text-blue-700' },
            { id: 'WARNING', label: '3. Anomaly Detected', color: 'bg-amber-500', text: 'text-amber-700' },
            { id: 'HIGH_RISK', label: '4. Critical Overhaul', color: 'bg-rose-500', text: 'text-rose-700' },
          ].map((stage, idx) => {
            const isPassed = stepData
              ? (stage.id === 'HEALTHY') ||
                (stage.id === 'MONITORING' && stepData.step >= 3) ||
                (stage.id === 'WARNING' && stepData.step >= 5) ||
                (stage.id === 'HIGH_RISK' && stepData.step >= 7)
              : idx === 0;

            return (
              <div
                key={stage.id}
                className={`p-3 rounded-lg border text-center transition-all ${
                  isPassed
                    ? 'bg-slate-50 border-slate-300 shadow-sm'
                    : 'bg-slate-50/40 border-slate-200 opacity-50'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${isPassed ? stage.color : 'bg-slate-300'}`} />
                  <span className="text-xs font-bold text-slate-800">{stage.label}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {stage.id === 'HEALTHY' && 'Stable Base'}
                  {stage.id === 'MONITORING' && 'Vib +0.08 mm/s'}
                  {stage.id === 'WARNING' && 'Hyd -300 psi'}
                  {stage.id === 'HIGH_RISK' && 'RUL < 18h'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Live Values Dashboard */}
        {stepData ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block">Temperature:</span>
              <span className="text-base font-bold font-mono text-slate-900">{stepData.sensor_updates.temperature}°C</span>
            </div>
            <div>
              <span className="text-slate-500 block">Vibration Amplitude:</span>
              <span className="text-base font-bold font-mono text-amber-600">{stepData.sensor_updates.vibration} mm/s</span>
            </div>
            <div>
              <span className="text-slate-500 block">Hydraulic Pressure:</span>
              <span className="text-base font-bold font-mono text-blue-600">{stepData.sensor_updates.hydraulic_pressure} psi</span>
            </div>
            <div>
              <span className="text-slate-500 block">Failure Probability:</span>
              <span className="text-base font-bold font-mono text-rose-600">
                {Math.round(stepData.maintenance_probability * 100)}% ({stepData.risk_level})
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Anomaly Status:</span>
              <span className="font-semibold text-slate-800">{stepData.anomaly_status}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Estimated RUL:</span>
              <span className="font-bold font-mono text-slate-900">{stepData.estimated_rul} flight hours</span>
            </div>
            <div>
              <span className="text-slate-500 block">Health Score:</span>
              <span className="font-bold font-mono text-slate-900">{stepData.health_score}%</span>
            </div>
            <div>
              <span className="text-slate-500 block">Stage:</span>
              <span className="font-semibold text-aerospace-900 font-mono">{stepData.timeline_stage}</span>
            </div>

            {stepData.alert_generated && (
              <div className="col-span-2 md:col-span-4 mt-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>Alert Triggered: {stepData.alert_generated}</span>
              </div>
            )}

            {stepData.spare_requirement && (
              <div className="col-span-2 md:col-span-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 font-medium flex items-center gap-2">
                <Boxes className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Logistics Action: {stepData.spare_requirement}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="py-6 text-center text-slate-400 text-xs bg-slate-50 rounded-lg border border-dashed border-slate-300">
            Click "Advance Step" above to inject progressive degradation telemetry on Aircraft A101.
          </div>
        )}
      </div>

      {/* What-If Simulation Laboratory (§25) */}
      <div className="aerospace-card p-5">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-semibold text-aerospace-900">What-If Fleet Availability Simulator</h3>
            <p className="text-xs text-slate-500">
              Dynamically manipulate resource and logistical parameters to project impact on fleet readiness.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">Dynamic CP-SAT Model</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Technician Availability */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-700">Technician Availability</span>
              <span className="font-mono font-bold text-aerospace-900">{technicianCapacity}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="150"
              value={technicianCapacity}
              onChange={(e) => setTechnicianCapacity(Number(e.target.value))}
              className="w-full accent-aerospace-900 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400">Scales active maintenance staff count</span>
          </div>

          {/* Workshop Bay Capacity */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-700">Workshop Bay Capacity</span>
              <span className="font-mono font-bold text-aerospace-900">{workshopCapacity}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="150"
              value={workshopCapacity}
              onChange={(e) => setWorkshopCapacity(Number(e.target.value))}
              className="w-full accent-aerospace-900 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400">Scales simultaneous hangar throughput</span>
          </div>

          {/* Fleet Degradation Multiplier */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-700">Wear & Degradation Rate</span>
              <span className="font-mono font-bold text-aerospace-900">{degradationRate}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={degradationRate}
              onChange={(e) => setDegradationRate(Number(e.target.value))}
              className="w-full accent-aerospace-900 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400">Simulates high-tempo operational strain</span>
          </div>
        </div>

        {/* Projected Availability Output Banner */}
        <div className="p-4 bg-aerospace-50/60 rounded-lg border border-aerospace-200 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Projected Fleet Availability</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold font-mono text-aerospace-900">{calculatedProjectedAvailability}%</span>
              <span className="text-xs text-slate-500">from 78% baseline</span>
            </div>
          </div>
          <div className="text-right text-xs text-slate-600">
            <div>Expected Turnaround: <strong>3.2 days</strong></div>
            <div>Avoided Sortie Delays: <strong>~14 sorties/mo</strong></div>
          </div>
        </div>
      </div>

      <DataProvenanceNote />
    </div>
  );
};
