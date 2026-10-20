import React from 'react';
import { Plane, ArrowLeft, Home } from 'lucide-react';

interface NotFoundPageProps {
  onNavigateHome?: () => void;
}

/**
 * 404 Not Found page — shown when navigating to an unknown route.
 * Matches the existing aerospace navy/slate visual identity.
 */
export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigateHome }) => {
  return (
    <div className="flex items-center justify-center min-h-[70vh] p-6">
      <div className="text-center max-w-md space-y-6">
        {/* Visual */}
        <div className="relative mx-auto w-24 h-24">
          <div className="w-24 h-24 bg-aerospace-50 rounded-full flex items-center justify-center border border-aerospace-100">
            <img src="/eagle.svg" alt="" aria-hidden="true" className="w-12 h-12 opacity-40" />
          </div>
          <div className="absolute -top-1 -right-1 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center border-2 border-white">
            <span className="text-xs font-bold text-slate-500">?</span>
          </div>
        </div>

        {/* Code & Message */}
        <div>
          <div className="text-6xl font-black text-slate-200 tracking-tight select-none" aria-hidden="true">
            404
          </div>
          <h1 className="text-lg font-bold text-aerospace-900 -mt-2">
            Route Not Found
          </h1>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            The page or module you're looking for doesn't exist in the Jatayu command dashboard.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-aerospace-900 text-white text-sm font-semibold rounded-lg hover:bg-aerospace-800 transition-colors shadow-sm"
            >
              <Home className="w-4 h-4" />
              Back to Overview
            </button>
          )}
        </div>

        <p className="text-[11px] text-slate-400">
          Jatayu AI · Team TrackForce · Ministry of Defence
        </p>
      </div>
    </div>
  );
};
