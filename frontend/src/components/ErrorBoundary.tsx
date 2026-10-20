import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Optional label shown in the error card to identify which module failed */
  moduleName?: string;
  /** Optional callback to navigate away (e.g. back to overview) */
  onNavigateHome?: () => void;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

/**
 * React Error Boundary — catches render-time exceptions in child component trees.
 * Prevents a single crashed module from unmounting the entire application.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unknown error',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Log to console for debugging — does not expose to UI
    console.error(
      `[ErrorBoundary] ${this.props.moduleName ?? 'Module'} crashed:`,
      error,
      info.componentStack
    );
  }

  handleReload = (): void => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { moduleName = 'This module', onNavigateHome } = this.props;

    return (
      <div className="flex items-center justify-center min-h-[300px] p-6">
        <div className="max-w-md w-full bg-white border border-red-200 rounded-xl shadow-sm p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">
              {moduleName} encountered an error
            </h2>
            <p className="text-sm text-slate-500">
              Something went wrong while rendering this section. This does not affect other modules.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-4 py-2 bg-aerospace-900 text-white text-xs font-semibold rounded-lg hover:bg-aerospace-800 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>

            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Go to Overview
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
}
