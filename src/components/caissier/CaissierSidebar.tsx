import React from 'react';
import { cn } from '../../lib/utils';
import {
  WalletCards,
  ReceiptText,
  BadgeAlert,
  GraduationCap,
  Building2,
} from 'lucide-react';
import { CURRENT_CAISSIER } from '../../lib/mockData';
import { useAuthStore } from '../../store/useAuthStore';
import { Tooltip, TooltipLabel } from '../ui/Tooltip';
import { SidebarShell } from '../ui/SidebarShell';

export type CaissierNavTab =
  | 'caissier_guichet'
  | 'caissier_journal'
  | 'caissier_impayes';

interface CaissierSidebarProps {
  activeTab: CaissierNavTab;
  onTabChange: (tab: CaissierNavTab) => void;
  className?: string;
}

import { useLanguageStore } from '../../i18n/useLanguageStore';
import { translations } from '../../i18n/translations';

export const CaissierSidebar: React.FC<CaissierSidebarProps> = ({
  activeTab,
  onTabChange,
  className,
}) => {
  const storeT = useLanguageStore((s) => s.t);
  const t = storeT?.nav ? storeT : translations.fr;
  const authProfile = useAuthStore((s) => s.profile);
  const isReal = Boolean(authProfile?.ecole_id);
  const caissierName = authProfile
    ? `${authProfile.prenom} ${authProfile.nom}`
    : `${CURRENT_CAISSIER.prenom} ${CURRENT_CAISSIER.nom}`;

  const navItems: Array<{
    id: CaissierNavTab;
    label: string;
    icon: React.ReactNode;
    badge?: string;
  }> = [
    {
      id: 'caissier_guichet',
      label: t.nav?.counter || "Guichet d'Encaissement",
      icon: <WalletCards className="h-4 w-4 shrink-0" />,
    },
    {
      id: 'caissier_journal',
      label: t.nav?.cashRegister || 'Journal de Caisse',
      icon: <ReceiptText className="h-4 w-4 shrink-0" />,
    },
    {
      id: 'caissier_impayes',
      label: t.nav?.unpaid || 'Relevé des Impayés',
      icon: <BadgeAlert className="h-4 w-4 shrink-0" />,
    },
  ];

  return (
    <SidebarShell
      role="caissier"
      logoIcon={<GraduationCap className="h-5 w-5 min-h-5 min-w-5 shrink-0" />}
      subtitle="Espace Caissier"
      className={className}
    >
      {(isCollapsed) => (
        <>
          {/* Cashier Station Info (expanded only) */}
          {!isCollapsed && (
            <div className="p-4 mx-3 mt-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-amber-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {caissierName[0] || 'C'}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {caissierName}
                  </div>
                  <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium truncate">
                    Agent Comptable
                  </div>
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-amber-200/50 dark:border-amber-800/50 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-amber-600" />
                  Poste :
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {isReal ? 'Guichet Principal' : CURRENT_CAISSIER.guichet}
                </span>
              </div>
            </div>
          )}

          {/* Nav items */}
          <div className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
            {!isCollapsed && (
              <div className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t.nav?.financialManagement || 'Gestion Financière'}
              </div>
            )}

            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <Tooltip
                  key={item.id}
                  content={<TooltipLabel label={item.label} badge={item.badge} />}
                  side="right"
                  disabled={!isCollapsed}
                  className="flex w-full"
                >
                  <button
                    onClick={() => onTabChange(item.id)}
                    aria-label={isCollapsed ? item.label : undefined}
                    className={cn(
                      'w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group',
                      isActive
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80',
                      isCollapsed && 'justify-center px-2.5'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={cn(
                          'transition-colors shrink-0',
                          isActive
                            ? 'text-white'
                            : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                        )}
                      >
                        {item.icon}
                      </span>
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!isCollapsed && item.badge && (
                      <span
                        className={cn(
                          'px-2 py-0.5 text-[10px] font-bold rounded-full',
                          isActive
                            ? 'bg-white text-amber-600'
                            : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                </Tooltip>
              );
            })}
          </div>
        </>
      )}
    </SidebarShell>
  );
};
