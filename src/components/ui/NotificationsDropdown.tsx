import React, { useRef, useEffect } from 'react';
import { useNotificationsStore, NotificationItem } from '../../store/useNotificationsStore';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Info,
  CheckCheck,
  ChevronRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

function formatNotificationDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24 && d.getDate() === now.getDate()) {
      return `Aujourd'hui à ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    }
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${day}/${month} à ${hours}:${minutes}`;
  } catch {
    return dateStr;
  }
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifications = useNotificationsStore((s) => s.notifications);
  const isLoading = useNotificationsStore((s) => s.isLoading);
  const error = useNotificationsStore((s) => s.error);
  const markAsRead = useNotificationsStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationsStore((s) => s.markAllAsRead);
  const unreadCount = useNotificationsStore((s) => s.unreadCount());

  // Click outside and escape handling
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'paiement_confirme':
      case 'paiement':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'echeance_retard':
      case 'alerte':
        return <AlertTriangle className="h-4 w-4 text-danger" />;
      case 'rappel':
        return <Clock className="h-4 w-4 text-warning" />;
      default:
        return <Info className="h-4 w-4 text-primary-text" />;
    }
  };

  const getTypeTitle = (type: string) => {
    switch (type) {
      case 'paiement_confirme':
        return 'Paiement confirmé';
      case 'echeance_retard':
        return 'Échéance en retard';
      case 'nouvelle_note':
        return 'Nouvelle note';
      case 'rappel':
        return 'Rappel';
      case 'alerte':
        return 'Alerte';
      case 'info':
        return 'Information';
      default:
        return 'Notification';
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    markAsRead(item.id);
    if (onNavigateTab) {
      if (item.type === 'echeance_retard') {
        onNavigateTab('relances');
        onClose();
      } else if (item.type === 'paiement_confirme') {
        onNavigateTab('paiements_attente');
        onClose();
      }
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-md bg-surface-elevated border border-subtle shadow-elevated z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-subtle">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-sm bg-surface-subtle text-primary-text flex items-center justify-center border border-subtle">
            <Bell className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold text-main leading-tight">
              Notifications
            </h3>
            <p className="text-xs text-muted">
              {unreadCount > 0 ? `${unreadCount} non lue(s)` : 'Toutes vos notifications sont lues'}
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllAsRead()}
            className="text-xs font-bold text-primary-text hover:text-primary-hover flex items-center gap-1 transition-colors px-2 py-1 rounded-sm hover:bg-surface-subtle focus-halo cursor-pointer"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            <span>Tout marquer lu</span>
          </button>
        )}
      </div>

      {/* RLS or fetch error alert */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border-b border-red-200 dark:border-red-800 text-xs text-red-800 dark:text-red-200 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <span className="leading-snug">{error}</span>
        </div>
      )}

      {/* Notifications List */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-subtle">
        {isLoading ? (
          <div className="p-8 text-center text-muted text-xs space-y-2">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
            <p className="font-medium">Chargement des notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-muted text-xs space-y-1">
            <Bell className="h-8 w-8 mx-auto text-muted mb-2" />
            <p className="font-semibold text-main">Aucune notification.</p>
            <p className="text-xs">Vous êtes à jour dans vos alertes.</p>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => handleNotificationClick(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleNotificationClick(item);
                }
              }}
              className={`p-3.5 sm:p-4 transition-colors cursor-pointer flex items-start gap-3 relative focus-halo ${
                !item.lu
                  ? 'bg-surface-subtle hover:bg-surface-subtle/80'
                  : 'hover:bg-surface-subtle'
              }`}
            >
              {/* Unread indicator dot */}
              {!item.lu && (
                <span className="absolute left-1.5 top-5 h-2 w-2 rounded-sm bg-primary ring-2 ring-surface" />
              )}

              <div className="h-8 w-8 rounded-sm bg-surface-subtle border border-subtle flex items-center justify-center shrink-0 mt-0.5">
                {getIcon(item.type)}
              </div>

              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center justify-between gap-1">
                  <h4 className={`text-xs font-bold truncate ${!item.lu ? 'text-main' : 'text-secondary'}`}>
                    {getTypeTitle(item.type)}
                  </h4>
                  <span className="text-xs text-muted shrink-0 font-medium tabular-nums">
                    {formatNotificationDate(item.created_at)}
                  </span>
                </div>
                <p className="text-xs text-muted leading-snug line-clamp-2">
                  {item.message}
                </p>
              </div>

              <ChevronRight className="h-4 w-4 text-muted shrink-0 self-center" />
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 bg-surface-subtle border-t border-subtle text-center">
        <span className="text-xs text-muted font-medium">
          Notifications en temps réel
        </span>
      </div>
    </div>
  );
};
