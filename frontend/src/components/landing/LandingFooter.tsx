import React from 'react';
import { useNavigate } from 'react-router-dom';

export const LandingFooter: React.FC = () => {
  const navigate = useNavigate();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-aerospace-900 text-white font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden border border-white/20">
                <img src="/eagle.svg" alt="JATAYU" className="w-6 h-6 object-contain p-0.5" />
              </div>
              <div>
                <span className="text-sm font-bold tracking-tight text-white">JATAYU</span>
                <div className="text-[10px] text-slate-400 font-medium">Jatayu AI</div>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
              Intelligent Maintenance. Optimized Fleet Availability. JATAYU unifies aircraft sensor telemetry,
              XGBoost predictive diagnostics, and constraint-based maintenance scheduling.
            </p>
            <p className="text-[11px] text-slate-400 mt-4 leading-relaxed max-w-sm border-t border-white/10 pt-4">
              Prototype for predictive maintenance and fleet-availability decision support.
              Public and synthetic aerospace demonstration data may be used. Not for live mission deployment.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">Platform Navigation</h3>
            <ul className="space-y-2.5">
              {[
                { label: 'Home', action: () => scrollTo('home') },
                { label: 'How It Works', action: () => scrollTo('how-it-works') },
                { label: 'Platform Features', action: () => scrollTo('features') },
                { label: 'Department Access', action: () => scrollTo('department-access') },
                { label: 'Maintenance Timetable', action: () => navigate('/app/schedule') },
              ].map((item) => (
                <li key={item.label}>
                  <button
                    onClick={item.action}
                    className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Department logins */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">Department Portals</h3>
            <ul className="space-y-2.5">
              {[
                { label: 'Commander Portal', route: '/login/commander' },
                { label: 'Spare Parts Department', route: '/login/spares' },
                { label: 'Technician Portal', route: '/login/technicians' },
              ].map((item) => (
                <li key={item.label}>
                  <button
                    onClick={() => navigate(item.route)}
                    className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-[11px] text-slate-400">
            © 2026 Team TrackForce — Jatayu AI. Intelligent Maintenance &amp; Fleet Availability.
          </p>
          <p className="text-[11px] text-slate-400">
            Powered by Google OR-Tools CP-SAT · XGBoost · SHAP · FastAPI · React &amp; Tailwind CSS
          </p>
        </div>
      </div>
    </footer>
  );
};
