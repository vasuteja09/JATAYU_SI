import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AccessDenied: React.FC = () => {
  const { role } = useAuth();

  const dashboardPath =
    role === 'commander' ? '/app/commander' :
    role === 'spares'    ? '/app/spares-portal' :
    role === 'technician'? '/app/technicians' :
    '/app/overview';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <ShieldX className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h1>
        <p className="text-sm text-slate-500 mb-6">
          You do not have permission to access this section.
          Your role (<span className="font-semibold text-slate-700">{role}</span>) does not have the required access.
        </p>
        <Link
          to={dashboardPath}
          className="inline-flex items-center gap-2 bg-aerospace-900 hover:bg-aerospace-800 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to My Dashboard
        </Link>
      </div>
    </div>
  );
};
