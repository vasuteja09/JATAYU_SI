import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const DataProvenanceNote: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 border border-slate-200 px-2.5 py-1 rounded">
        <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
        <span>Demonstration prototype using public/synthetic aerospace telemetry. Operational military data is not used.</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 text-xs text-slate-600 flex items-start gap-3 my-4">
      <ShieldAlert className="w-4 h-4 text-aerospace-600 flex-shrink-0 mt-0.5" />
      <div>
        <span className="font-semibold text-aerospace-900 block mb-0.5">Prototype Data Provenance & Safety Notice</span>
        <p className="leading-relaxed">
          Prototype uses public/synthetic aerospace data for demonstration. Real operational defence aircraft data is not used.
          Decision-support recommendations are indicative and require verification by certified maintenance engineers.
        </p>
      </div>
    </div>
  );
};
