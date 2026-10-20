import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

interface ApiErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

/**
 * Reusable API error display shown when a data-fetch fails.
 * Prevents blank screens — always provides context and a retry option.
 */
export const ApiError: React.FC<ApiErrorProps> = ({
  title = 'Unable to load data',
  message = 'An error occurred while communicating with the backend. Please try again.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-3">
        <WifiOff className="w-5 h-5 text-red-400" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-xs leading-relaxed mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      )}
    </div>
  );
};
