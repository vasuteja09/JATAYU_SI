import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Package, Wrench, ChevronRight, CheckCircle2 } from 'lucide-react';

const departments = [
  {
    id: 'commander',
    title: 'Commander Portal',
    description:
      'Monitor fleet availability, review AI-generated maintenance priorities, inspect maintenance schedules, and track execution progress.',
    icon: Shield,
    color: 'blue',
    accentBg: 'bg-blue-50',
    accentBorder: 'border-blue-200',
    accentIcon: 'text-blue-600',
    btnClass: 'bg-aerospace-900 hover:bg-aerospace-800 text-white',
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
    capabilities: ['Fleet Health Overview', 'Maintenance Schedule Review', 'Availability & Risk Monitoring'],
    route: '/login/commander',
    btnLabel: 'Login as Commander',
  },
  {
    id: 'spares',
    title: 'Spare Parts Department',
    description:
      'Monitor inventory, identify shortages, reserve components, and coordinate spare availability for planned maintenance activities.',
    icon: Package,
    color: 'cyan',
    accentBg: 'bg-cyan-50',
    accentBorder: 'border-cyan-200',
    accentIcon: 'text-cyan-600',
    btnClass: 'bg-cyan-700 hover:bg-cyan-800 text-white',
    badgeClass: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    capabilities: ['Inventory Management', 'Spare Shortage Alerts', 'Part Reservation & Transfer'],
    route: '/login/spares',
    btnLabel: 'Login to Spare Parts',
  },
  {
    id: 'technicians',
    title: 'Technician Portal',
    description:
      'View assigned maintenance tasks, inspect work requirements, update task progress, and record completed maintenance activities.',
    icon: Wrench,
    color: 'indigo',
    accentBg: 'bg-indigo-50',
    accentBorder: 'border-indigo-200',
    accentIcon: 'text-indigo-600',
    btnClass: 'bg-indigo-700 hover:bg-indigo-800 text-white',
    badgeClass: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    capabilities: ['Assigned Maintenance Tasks', 'Work Schedule', 'Maintenance Progress'],
    route: '/login/technicians',
    btnLabel: 'Login as Technician',
  },
];

export const DepartmentCards: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section id="department-access" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-aerospace-900 mb-3">Access Your Department Portal</h2>
          <p className="text-base text-slate-500 max-w-2xl mx-auto">
            Choose your department to access the tools and information relevant to your responsibilities.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {departments.map((dept) => {
            const Icon = dept.icon;
            return (
              <div
                key={dept.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group"
              >
                {/* Top accent stripe */}
                <div className={`h-1 ${dept.accentBg} ${dept.accentBorder}`} />

                <div className="p-6 flex flex-col flex-1">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl ${dept.accentBg} border ${dept.accentBorder} flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${dept.accentIcon}`} aria-hidden="true" />
                  </div>

                  <h3 className="text-lg font-bold text-aerospace-900 mb-2">{dept.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-5">{dept.description}</p>

                  {/* Capabilities */}
                  <ul className="space-y-2 mb-6 flex-1">
                    {dept.capabilities.map((cap) => (
                      <li key={cap} className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${dept.accentIcon}`} aria-hidden="true" />
                        <span>{cap}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Button */}
                  <button
                    onClick={() => navigate(dept.route)}
                    className={`w-full flex items-center justify-center gap-2 ${dept.btnClass} font-semibold px-4 py-2.5 rounded-lg text-sm transition-all`}
                    id={`dept-login-${dept.id}`}
                    aria-label={dept.btnLabel}
                  >
                    {dept.btnLabel}
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Demo user note */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400">
            Demo access: use <code className="bg-slate-100 px-1 rounded">demo</code> / <code className="bg-slate-100 px-1 rounded">demo</code> for full-access preview
          </p>
        </div>
      </div>
    </section>
  );
};
