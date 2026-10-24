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
} from 'lucide-react';

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifications = useNotificationsStore((s) => s.notifications);
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

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'paiement':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'alerte':
        return <AlertTriangle className="h-4 w-4 text-danger" />;
      case 'rappel':
        return <Clock className="h-4 w-4 text-warning" />;
      default:
        return <Info className="h-4 w-4 text-primary-text" />;
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    markAsRead(item.id);
    if (item.lien_onglet && onNavigateTab) {
      onNavigateTab(item.lien_onglet);
      onClose();
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

      {/* Notifications List */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-subtle">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-muted text-xs space-y-1">
            <Bell className="h-8 w-8 mx-auto text-muted mb-2" />
            <p className="font-semibold text-main">Aucune notification</p>
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
                    {item.titre}
                  </h4>
                  <span className="text-xs text-muted shrink-0 font-medium tabular-nums">
                    {item.created_at}
                  </span>
                </div>
                <p className="text-xs text-muted leading-snug line-clamp-2">
                  {item.message}
                </p>
              </div>

              {item.lien_onglet && (
                <ChevronRight className="h-4 w-4 text-muted shrink-0 self-center" />
              )}
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
