import React from 'react';
import {
  Cpu, AlertTriangle, Wrench, Package, CalendarCheck, PlayCircle, TrendingUp, ArrowDown
} from 'lucide-react';

const steps = [
  {
    icon: Cpu,
    title: 'Aircraft Health Data',
    desc: 'Sensor telemetry collected from engine, hydraulic, avionics, and fuel systems.',
    color: 'bg-blue-50 text-blue-600 border-blue-200',
  },
  {
    icon: AlertTriangle,
    title: 'AI-Based Risk Detection',
    desc: 'XGBoost anomaly detection identifies unusual patterns and computes failure probability.',
    color: 'bg-orange-50 text-orange-600 border-orange-200',
  },
  {
    icon: TrendingUp,
    title: 'Maintenance Prediction',
    desc: 'Remaining Useful Life estimation with confidence bounds per component type.',
    color: 'bg-purple-50 text-purple-600 border-purple-200',
  },
  {
    icon: Package,
    title: 'Resource & Spare Check',
    desc: 'Inventory status verified, shortages flagged, inter-depot transfers initiated.',
    color: 'bg-cyan-50 text-cyan-600 border-cyan-200',
  },
  {
    icon: CalendarCheck,
    title: 'Optimized Schedule',
    desc: 'OR-Tools CP-SAT constraint solver minimizes downtime across technicians and workshops.',
    color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  },
  {
    icon: PlayCircle,
    title: 'Maintenance Execution',
    desc: 'Technicians assigned tasks; progress tracked; spare status monitored.',
    color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  },
  {
    icon: TrendingUp,
    title: 'Fleet Availability Insights',
    desc: 'Availability percentages, downtime reduction, and schedule compliance reported.',
    color: 'bg-aerospace-50 text-aerospace-600 border-aerospace-200',
  },
];

export const HowItWorksSection: React.FC = () => (
  <section id="how-it-works" className="py-20 bg-white">
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-14">
        <h2 className="text-3xl font-bold text-aerospace-900 mb-3">How It Works</h2>
        <p className="text-base text-slate-500 max-w-xl mx-auto">
          From raw sensor data to an optimized maintenance schedule — in one unified workflow.
        </p>
      </div>

      <div className="flex flex-col items-center gap-0">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <React.Fragment key={step.title}>
              <div className="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-start gap-4 hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 ${step.color}`}>
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold text-slate-400 font-mono">STEP {index + 1}</span>
                  </div>
                  <h3 className="text-sm font-bold text-aerospace-900">{step.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{step.desc}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="flex items-center justify-center h-6" aria-hidden="true">
                  <ArrowDown className="w-4 h-4 text-slate-300" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  </section>
);
