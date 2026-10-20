import React from 'react';
import { Sliders, ShieldCheck, ShieldAlert, Cpu, Database, CheckCircle2, ArrowRight } from 'lucide-react';
import { DataProvenanceNote } from '../components/ui/DataProvenanceNote';

export const SettingsPage: React.FC = () => {
  const steps = [
    { title: 'Telemetry Ingestion', desc: 'Continuous simulated streams of temperature, vibration, hydraulic & electrical signals.' },
    { title: 'Feature Engineering', desc: 'Rolling window averages, rate of change, baseline deviations & trend slopes.' },
    { title: 'Anomaly Isolation', desc: 'Isolation Forest flags multivariable telemetry distribution shifts without labels.' },
    { title: 'Failure Risk Probability', desc: 'XGBoost Classifier predicts probability of maintenance required in next 20h.' },
    { title: 'RUL Regression', desc: 'XGBoost Regressor estimates operational remaining flight hours before servicing.' },
    { title: 'Explainability (SHAP)', desc: 'Identifies top contributing factors behind every alert to build user trust.' },
    { title: 'Resource Optimizer', desc: 'Google OR-Tools CP-SAT balances technician skills, workshop bays & lead times.' },
    { title: 'Fleet Availability Impact', desc: 'Quantifies reduced downtime and increased airframe sortie readiness.' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-aerospace-900 tracking-tight">System Architecture & Platform Settings</h1>
        <p className="text-xs text-slate-500">
          Configuration parameters, end-to-end prognostic architecture, and operational integrity guidelines.
        </p>
      </div>

      {/* 20-Second Architecture Flow Visualizer (§98) */}
      <div className="aerospace-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <Cpu className="w-4 h-4 text-aerospace-700" />
          <h3 className="text-sm font-bold text-aerospace-900">
            End-to-End Decision-Support Pipeline Architecture
          </h3>
        </div>
        <p className="text-xs text-slate-500 mb-6">
          How Jatayu AI connects raw health-monitoring signals to optimized fleet availability in under 8 steps:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {steps.map((st, idx) => (
            <div key={idx} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 relative">
              <div className="w-5 h-5 rounded-full bg-aerospace-900 text-white font-mono text-[10px] font-bold flex items-center justify-center mb-2">
                {idx + 1}
              </div>
              <h4 className="text-xs font-bold text-slate-900 mb-1">{st.title}</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">{st.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Configuration Knobs */}
      <div className="aerospace-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sliders className="w-4 h-4 text-aerospace-700" />
          <h3 className="text-sm font-bold text-aerospace-900">Configurable Backend Parameters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-semibold text-slate-700 block">Prediction Horizon</span>
            <div className="text-base font-bold font-mono text-aerospace-900">20 Flight Hours</div>
            <p className="text-[11px] text-slate-500">Configured in app/config.py (PREDICTION_HORIZON_HOURS)</p>
          </div>

          <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-semibold text-slate-700 block">Risk Thresholds</span>
            <div className="text-base font-bold font-mono text-aerospace-900">Low &lt;25% | Med &lt;55% | High &gt;80%</div>
            <p className="text-[11px] text-slate-500">Configurable backend thresholds for alert escalation</p>
          </div>

          <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-semibold text-slate-700 block">Optimization Objective</span>
            <div className="text-base font-bold font-mono text-aerospace-900">Minimize Downtime & Makespan</div>
            <p className="text-[11px] text-slate-500">Solved via Google OR-Tools CP-SAT Solver</p>
          </div>
        </div>
      </div>

      {/* Honest Limitations & Transparency (§70) */}
      <div className="aerospace-card p-5 border-l-4 border-l-aerospace-800">
        <div className="flex items-center gap-2 mb-2">
          <ShieldAlert className="w-4 h-4 text-aerospace-700" />
          <h3 className="text-sm font-bold text-aerospace-900">Official Limitations & Safety Boundary Statement</h3>
        </div>
        <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
          <p>
            1. <strong>Synthetic / Benchmark Data:</strong> This platform is a demonstration prototype developed by Team TrackForce. It uses synthetic telemetry modeled after open aerospace prognostics datasets (such as NASA C-MAPSS). Real classified or operational military aircraft telemetry is not used.
          </p>
          <p>
            2. <strong>Decision Support Only:</strong> AI predictions and automated maintenance schedules serve exclusively as decision support for maintenance planners. Final maintenance sign-offs, parts replacement, and flight releases must adhere to authorized military technical manuals and human engineering review.
          </p>
          <p>
            3. <strong>Strict Maintenance Scope:</strong> This prototype is strictly focused on transportation, logistics, predictive asset health, and fleet availability. It does not implement weapon targeting, combat navigation, or offensive tactical capabilities.
          </p>
        </div>
      </div>

      <DataProvenanceNote />
    </div>
  );
};
