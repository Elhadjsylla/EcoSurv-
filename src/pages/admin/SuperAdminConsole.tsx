import React, { useState, useEffect } from 'react';
import { Menu, School } from 'lucide-react';
import { AdminSidebar, AdminTab } from '../../components/admin/AdminSidebar';
import { AdminDashboardPage } from './AdminDashboardPage';
import { AdminEcolesPage, AdminEcoleItem } from './AdminEcolesPage';
import { AdminUsersPage, AdminUserRow } from './AdminUsersPage';
import { AdminAbonnementsPage } from './AdminAbonnementsPage';
import { AdminAuditPage } from './AdminAuditPage';
import { supabase } from '../../lib/supabase';

interface SuperAdminConsoleProps {
  onReturnToLanding?: () => void;
}

export const SuperAdminConsole: React.FC<SuperAdminConsoleProps> = ({ onReturnToLanding }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [ecoles, setEcoles] = useState<AdminEcoleItem[]>([]);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch schools from Supabase
      const { data: ecolesData, error: ecolesError } = await supabase
        .from('ecoles')
        .select('*')
        .order('created_at', { ascending: false });

      // 2. Fetch profiles from Supabase
      const { data: profilsData, error: profilsError } = await supabase
        .from('profils')
        .select('*');

      if (!ecolesError && ecolesData) {
        const mappedEcoles: AdminEcoleItem[] = ecolesData.map((e: any) => {
          const directeur = profilsData?.find((p: any) => p.ecole_id === e.id && p.role === 'directeur');
          return {
            id: e.id,
            nom: e.nom,
            ville: e.ville || 'Nouakchott',
            telephone: e.telephone,
            email: e.email,
            statut_activation: e.statut_activation || 'active',
            statut_abonnement: e.statut_abonnement || 'essai',
            created_at: e.created_at,
            directeur_nom: directeur ? `${directeur.prenom} ${directeur.nom}` : 'Directeur',
            directeur_email: directeur?.email || e.email,
          };
        });
        setEcoles(mappedEcoles);
      }

      if (!profilsError && profilsData) {
        const mappedUsers: AdminUserRow[] = profilsData.map((p: any) => {
          const ecole = ecolesData?.find((e: any) => e.id === p.ecole_id);
          return {
            id: p.id,
            nom: p.nom,
            prenom: p.prenom,
            email: p.email || '—',
            role: p.role,
            telephone: p.telephone,
            ecole_nom: ecole?.nom,
            actif: p.actif ?? true,
          };
        });
        setUsers(mappedUsers);
      }
    } catch (err) {
      console.warn('[SuperAdminConsole] Erreur chargement données:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-['Plus_Jakarta_Sans',sans-serif] text-slate-900 dark:text-slate-100 antialiased">
      {/* Sidebar dedicated to Super Admin (Responsive: Desktop standard, Mobile slide-over drawer) */}
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onReturnToLanding={onReturnToLanding}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Top Header */}
        <header className="md:hidden flex items-center justify-between p-3.5 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <School className="h-4 w-4" />
              </div>
              <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                EcoSurv Admin
              </span>
            </div>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Super Admin
          </span>
        </header>

        {/* Tab View Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden w-full">
          {activeTab === 'dashboard' && (
            <AdminDashboardPage
              onNavigateTab={setActiveTab}
              ecoles={ecoles}
              users={users}
            />
          )}

          {activeTab === 'ecoles' && (
            <AdminEcolesPage
              ecoles={ecoles}
              onRefresh={fetchAdminData}
              isLoading={isLoading}
            />
          )}

          {activeTab === 'utilisateurs' && (
            <AdminUsersPage
              users={users}
              onRefresh={fetchAdminData}
            />
          )}

          {activeTab === 'abonnements' && (
            <AdminAbonnementsPage ecoles={ecoles} />
          )}

          {activeTab === 'audit' && (
            <AdminAuditPage />
          )}
        </main>
      </div>
    </div>
  );
};
