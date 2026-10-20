import React from 'react';

interface RiskBadgeProps {
  level?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
  probability?: number;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level = 'LOW', probability }) => {
  const getStyle = () => {
    switch (level) {
      case 'CRITICAL':
        return { bg: 'bg-red-50 text-red-700 border-red-200', text: 'CRITICAL RISK', dot: 'bg-red-600' };
      case 'HIGH':
        return { bg: 'bg-orange-50 text-orange-700 border-orange-200', text: 'HIGH RISK', dot: 'bg-orange-500' };
      case 'MEDIUM':
        return { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'MEDIUM RISK', dot: 'bg-amber-500' };
      case 'LOW':
      default:
        return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'LOW RISK', dot: 'bg-emerald-500' };
    }
  };

  const style = getStyle();

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold border ${style.bg}`}>
      <span className={`w-2 h-2 rounded-full ${style.dot}`} />
      <span>{style.text}</span>
      {probability !== undefined && (
        <span className="opacity-75 font-mono ml-0.5">({Math.round(probability * 100)}%)</span>
      )}
    </span>
  );
};
