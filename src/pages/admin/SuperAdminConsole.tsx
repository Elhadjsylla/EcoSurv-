import React, { useState, useEffect } from 'react';
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
      {/* Sidebar dedicated to Super Admin */}
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onReturnToLanding={onReturnToLanding}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
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
  );
};
