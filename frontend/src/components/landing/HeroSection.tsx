import React from 'react';
import { ArrowRight, ChevronDown, Activity, BarChart3, Clock, Shield, Plane } from 'lucide-react';
import { CloudShader } from '../ui/cloud-shader';

const demoCards = [
  { label: 'Fleet Availability', value: '78.3%', color: 'text-aerospace-900', bar: 78, change: '+6.7% with CP-SAT' },
  { label: 'Top Anomaly Severity', value: 'HIGH (0.72)', color: 'text-orange-600', bar: 72, change: 'Aircraft A101 · Hydraulic' },
  { label: 'Estimated RUL', value: '47 hrs', color: 'text-blue-700', bar: 47, change: 'Urgency: Priority 1' },
  { label: 'Downtime Reduction', value: '18.5 hrs', color: 'text-emerald-600', bar: 88, change: '3 conflicts resolved' },
];

export const HeroSection: React.FC = () => {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="home" className="relative min-h-[90vh] flex items-center pt-20 pb-20 overflow-hidden bg-slate-50">
      {/* Aceternity UI Cloud Shader Background */}
      <CloudShader
        className="absolute inset-0 z-0"
        cloudColor="#FFFFFF"
        skyTopColor="#A8D5F5"
        skyBottomColor="#EAF6FF"
        speed={0.5}
        count={4}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div>
            <div className="inline-flex items-center gap-2 bg-white/85 border border-sky-300/80 backdrop-blur-xs rounded-full px-3.5 py-1 mb-6 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-xs font-bold text-aerospace-900 uppercase tracking-wider">
                JATAYU · MISSION READINESS INTELLIGENCE
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-aerospace-900 leading-tight tracking-tight mb-6">
              Predictive Intelligence.{' '}
              <br />
              <span className="text-blue-700">Mission Readiness.</span>
            </h1>

            <p className="text-base text-slate-700 leading-relaxed mb-8 max-w-xl font-normal">
              An AI-powered platform for aircraft health monitoring, predictive maintenance,
              and fleet availability optimization.
            </p>

            <div className="flex flex-col sm:flex-row gap-3.5">
              <button
                onClick={() => scrollToSection('department-access')}
                className="inline-flex items-center justify-center gap-2 bg-aerospace-900 hover:bg-aerospace-800 text-white font-semibold px-7 py-3 rounded-xl text-xs transition-all shadow-md hover:shadow-lg cursor-pointer hover:-translate-y-0.5"
                aria-label="Explore Fleet Readiness"
              >
                Explore Fleet Readiness
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="inline-flex items-center justify-center gap-2 border border-slate-300/90 bg-white/85 hover:bg-white text-slate-800 hover:text-aerospace-900 font-semibold px-7 py-3 rounded-xl text-xs transition-all backdrop-blur-xs shadow-2xs cursor-pointer hover:-translate-y-0.5"
                aria-label="Discover Predictive Maintenance"
              >
                Discover Predictive Maintenance
                <ChevronDown className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-5 font-medium">
              Multi-Role Platform · Commander · Spare Parts Department · Technicians
            </p>
          </div>

          {/* Right visual — Aerospace telemetry showcase */}
          <div className="relative lg:pl-6">
            <div className="relative bg-white/90 rounded-2xl border border-sky-200/90 p-6 shadow-xl backdrop-blur-md">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-aerospace-900 flex items-center justify-center shadow-xs">
                    <Plane className="w-4 h-4 text-sky-300" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-aerospace-900">Airframe A101 Digital Twin</div>
                    <div className="text-[11px] text-slate-500 font-medium">Telemetry: Hydraulic Subsystem</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full border border-orange-200">
                    ANOMALY FLAGGED
                  </span>
                  <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                    XGBoost + SHAP
                  </span>
                </div>
              </div>

              {/* Metric cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {demoCards.map((card) => (
                  <div key={card.label} className="bg-slate-50/90 rounded-xl border border-slate-200/80 p-3.5">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] font-medium text-slate-600">{card.label}</span>
                      <span className={`text-sm font-extrabold ${card.color}`}>{card.value}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mb-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${card.bar}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 block">{card.change}</span>
                  </div>
                ))}
              </div>

              {/* Mini chart & optimizer note */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
                    <span className="text-[11px] font-bold text-slate-700">7-Day Fleet Availability Trend</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-600 font-semibold">Current: 78.3%</span>
                </div>
                <div className="flex items-end justify-between gap-1.5 h-12 bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                  {[68, 70, 69, 74, 76, 75, 82].map((v, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-blue-300 hover:bg-blue-600 rounded-xs transition-colors"
                      style={{ height: `${(v / 85) * 100}%` }}
                      aria-hidden="true"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Floating optimization pill */}
            <div className="hidden sm:flex absolute -bottom-3 -left-3 bg-white/95 rounded-xl border border-slate-200 shadow-md p-3 items-center gap-2.5 backdrop-blur-xs">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100">
                <Activity className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-800">Schedule Optimized</div>
                <div className="text-[10px] text-slate-500">Google OR-Tools CP-SAT · In Queue</div>
              </div>
            </div>

            {/* Floating RUL badge */}
            <div className="hidden sm:flex absolute -top-3 -right-3 bg-white/95 rounded-xl border border-slate-200 shadow-md p-3 items-center gap-2.5 backdrop-blur-xs">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                <Clock className="w-4 h-4 text-blue-600" aria-hidden="true" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-aerospace-900">RUL: 47h Remaining</div>
                <div className="text-[10px] text-slate-500">Hydraulic Actuator · A101</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
