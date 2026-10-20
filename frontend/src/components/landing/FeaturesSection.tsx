import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, AlertTriangle, TrendingUp, Clock, HelpCircle,
  CalendarClock, Package, BarChart3, ArrowRight
} from 'lucide-react';

const features = [
  {
    icon: Activity,
    title: 'Aircraft Health Monitoring',
    desc: 'Real-time telemetry aggregation and health score computations across engine, hydraulic, avionics, and fuel subsystems.',
    link: '/app/aircraft',
    linkLabel: 'View Digital Twin',
  },
  {
    icon: AlertTriangle,
    title: 'Anomaly Detection',
    desc: 'XGBoost anomaly scoring on streaming sensor telemetry flags subtle deviations before threshold breaches occur.',
    link: '/app/predictions',
    linkLabel: 'Explore Predictions',
  },
  {
    icon: TrendingUp,
    title: 'Failure-Risk Prediction',
    desc: 'Multi-factor failure probability modeling dynamically classifies risk severity into LOW, MEDIUM, HIGH, and CRITICAL bands.',
    link: '/app/predictions',
    linkLabel: 'Risk Analysis',
  },
  {
    icon: Clock,
    title: 'Remaining Useful Life Estimation',
    desc: 'Deterministic and ML-based RUL predictions with upper/lower confidence bounds to anticipate maintenance deadlines.',
    link: '/app/predictions',
    linkLabel: 'RUL Projections',
  },
  {
    icon: HelpCircle,
    title: 'Explainable AI',
    desc: 'SHAP feature attribution uncovers primary sensor contributors and operating cycle factors driving each prediction.',
    link: '/app/predictions',
    linkLabel: 'Inspect SHAP Factors',
  },
  {
    icon: CalendarClock,
    title: 'Maintenance Planning',
    desc: 'Google OR-Tools CP-SAT constraint solver optimizes maintenance slots, technician skills, and workshop bay availability.',
    link: '/app/schedule',
    linkLabel: 'Visual Timetable',
  },
  {
    icon: Package,
    title: 'Spare-Parts Coordination',
    desc: 'Direct supply chain integration checks local depot inventory, shortage alerts, and automated reservation workflows.',
    link: '/app/spares-portal',
    linkLabel: 'Spares Inventory',
  },
  {
    icon: BarChart3,
    title: 'Fleet Availability Analysis',
    desc: 'Real-time operational readiness analytics, downtime reduction tracking, and what-if availability scenario simulations.',
    link: '/app/overview',
    linkLabel: 'Fleet Dashboard',
  },
];

export const FeaturesSection: React.FC = () => (
  <section id="features" className="py-20 bg-slate-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-aerospace-900 mb-3">Platform Capabilities</h2>
        <p className="text-base text-slate-500 max-w-2xl mx-auto">
          Eight interconnected modules providing end-to-end intelligence from sensor ingestion to mission-ready aircraft availability.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-blue-700" aria-hidden="true" />
                </div>
                <h3 className="text-sm font-bold text-aerospace-900 mb-1.5">{f.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">{f.desc}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 mt-auto">
                <Link
                  to={f.link}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors"
                >
                  <span>{f.linkLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);
