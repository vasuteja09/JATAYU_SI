import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStyle = () => {
    switch (status) {
      case 'AVAILABLE':
        return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'AVAILABLE' };
      case 'MONITORING':
        return { bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500', label: 'MONITORING' };
      case 'MAINTENANCE_DUE':
        return { bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', label: 'MAINTENANCE DUE' };
      case 'UNDER_MAINTENANCE':
        return { bg: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500', label: 'UNDER MAINTENANCE' };
      case 'AWAITING_PART':
        return { bg: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500', label: 'AWAITING PART' };
      case 'HIGH_RISK':
        return { bg: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500', label: 'HIGH RISK' };
      default:
        return { bg: 'bg-slate-50 text-slate-700 border-slate-200', dot: 'bg-slate-500', label: status };
    }
  };

  const style = getStyle();

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${style.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot} animate-pulse`} />
      {style.label}
    </span>
  );
};
