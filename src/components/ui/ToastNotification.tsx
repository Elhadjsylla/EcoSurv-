import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  id?: string;
  message: string;
  type?: 'success' | 'info' | 'warning';
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
      bg: 'bg-slate-900 border-emerald-500/40 text-slate-100',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 animate-scale-in" />,
      bar: 'bg-emerald-400',
    },
    info: {
      bg: 'bg-slate-900 border-blue-500/40 text-slate-100',
      icon: <Info className="w-5 h-5 text-blue-400 shrink-0 animate-scale-in" />,
      bar: 'bg-blue-400',
    },
    warning: {
      bg: 'bg-slate-900 border-amber-500/40 text-slate-100',
      icon: <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 animate-scale-in" />,
      bar: 'bg-amber-400',
    },
  }[type];

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-50 flex flex-col min-w-[320px] max-w-md rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 ${config.bg}`}
      style={{
        animation: 'toast-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      <div className="flex items-center gap-3 p-4 pr-3">
        {config.icon}
        <div className="flex-1 text-sm font-medium text-slate-200 leading-snug">
          {message}
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors hover:bg-slate-800"
          aria-label="Fermer la notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Barre de progression fluide */}
      <div className="w-full bg-slate-800/80 h-1 rounded-b-xl overflow-hidden">
        <div
          className={`h-full ${config.bar} transition-all ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
