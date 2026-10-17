import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  id?: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
  onClose: () => void;
}

export const ToastNotification = ({
  message,
  type = 'success',
  duration = 4000,
  onClose,
}: ToastProps) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onClose();
      }
    }, 25);

    return () => clearInterval(interval);
  }, [duration, onClose]);

  const config = {
    success: {
      border: 'border-success-border',
      icon: <CheckCircle2 className="w-5 h-5 text-success shrink-0" />,
      bar: 'bg-success',
    },
    info: {
      border: 'border-primary',
      icon: <Info className="w-5 h-5 text-primary shrink-0" />,
      bar: 'bg-primary',
    },
    warning: {
      border: 'border-warning-border',
      icon: <AlertCircle className="w-5 h-5 text-warning shrink-0" />,
      bar: 'bg-warning',
    },
    error: {
      border: 'border-danger-border',
      icon: <AlertCircle className="w-5 h-5 text-danger shrink-0" />,
      bar: 'bg-danger',
    },
  }[type];

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-50 flex flex-col min-w-[320px] max-w-md rounded-md shadow-elevated border bg-surface-elevated text-main transition-all duration-300 transform translate-y-0 opacity-100 ${config.border}`}
      style={{
        animation: 'toast-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      <div className="flex items-center gap-3 p-4 pr-3">
        {config.icon}
        <div className="flex-1 text-sm font-medium text-main leading-snug">
          {message}
        </div>
        <button
          onClick={onClose}
          className="text-muted hover:text-main p-1.5 rounded-sm transition-colors hover:bg-surface-subtle focus-halo cursor-pointer"
          aria-label="Fermer la notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Barre de progression fluide */}
      <div className="w-full bg-surface-subtle h-1 rounded-b-md overflow-hidden">
        <div
          className={`h-full ${config.bar} transition-all ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
