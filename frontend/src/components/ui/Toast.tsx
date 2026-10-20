import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, default 4000
}

// --- Global toast queue ---
type ToastListener = (toasts: ToastMessage[]) => void;
let _listeners: ToastListener[] = [];
let _toasts: ToastMessage[] = [];

function _notify() {
  _listeners.forEach(fn => fn([..._toasts]));
}

export const toast = {
  show(type: ToastType, title: string, message?: string, duration = 4000): void {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    _toasts = [..._toasts, { id, type, title, message, duration }];
    _notify();
  },
  success(title: string, message?: string): void { this.show('success', title, message); },
  error(title: string, message?: string): void { this.show('error', title, message, 6000); },
  warning(title: string, message?: string): void { this.show('warning', title, message, 5000); },
  info(title: string, message?: string): void { this.show('info', title, message); },
};

const ICONS: Record<ToastType, React.FC<{ className?: string }>> = {
  success: ({ className }) => <CheckCircle2 className={className} />,
  error: ({ className }) => <XCircle className={className} />,
  warning: ({ className }) => <AlertTriangle className={className} />,
  info: ({ className }) => <Info className={className} />,
};

const STYLES: Record<ToastType, { border: string; icon: string; bg: string }> = {
  success: { border: 'border-emerald-200', icon: 'text-emerald-600', bg: 'bg-emerald-50' },
  error:   { border: 'border-red-200',     icon: 'text-red-600',     bg: 'bg-red-50' },
  warning: { border: 'border-amber-200',   icon: 'text-amber-600',   bg: 'bg-amber-50' },
  info:    { border: 'border-sky-200',     icon: 'text-sky-600',     bg: 'bg-sky-50' },
};

function removeToast(id: string): void {
  _toasts = _toasts.filter(t => t.id !== id);
  _notify();
}

interface ToastItemProps {
  toast: ToastMessage;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast: t }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const showTimer = setTimeout(() => setVisible(true), 10);
    // Animate out then remove
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => removeToast(t.id), 300);
    }, t.duration ?? 4000);
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
  }, [t.id, t.duration]);

  const Icon = ICONS[t.type];
  const styles = STYLES[t.type];

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        flex items-start gap-3 p-3.5 bg-white rounded-xl border shadow-lg
        transition-all duration-300 ease-out min-w-[280px] max-w-sm
        ${styles.border}
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${styles.bg}`}>
        <Icon className={`w-4 h-4 ${styles.icon}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-900">{t.title}</p>
        {t.message && <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{t.message}</p>}
      </div>
      <button
        onClick={() => removeToast(t.id)}
        aria-label="Dismiss notification"
        className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0 mt-0.5"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

/**
 * ToastContainer — place once at the root of the app.
 * Toasts are triggered globally via the `toast` object.
 *
 * Usage:
 *   import { toast } from './components/ui/Toast';
 *   toast.success('Spare reserved successfully.');
 *   toast.error('Failed to load fleet data.');
 */
export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const handleUpdate = useCallback((updated: ToastMessage[]) => {
    setToasts(updated);
  }, []);

  useEffect(() => {
    _listeners.push(handleUpdate);
    return () => {
      _listeners = _listeners.filter(fn => fn !== handleUpdate);
    };
  }, [handleUpdate]);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  );
};
