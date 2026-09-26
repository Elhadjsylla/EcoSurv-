import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useThemeStore } from './store/useThemeStore';
import { useAuthStore } from './store/useAuthStore';
import { Sidebar, NavTab } from './components/ui/Sidebar';
import { TeacherSidebar, TeacherNavTab } from './components/enseignant/TeacherSidebar';
import { CaissierSidebar, CaissierNavTab } from './components/caissier/CaissierSidebar';
import { ParentSidebar, ParentNavTab } from './components/parent/ParentSidebar';
import { Header } from './components/ui/Header';
import { useNavigationStore, selectCurrentRoute } from './store/useNavigationStore';
import { useSwipeNavigation } from './hooks/useSwipeNavigation';
import { DirectorDashboard } from './components/dashboard/DirectorDashboard';
import { ElevesPage } from './pages/ElevesPage';
import { EcheancesPage } from './pages/EcheancesPage';
import { RelancesPage } from './pages/RelancesPage';
import { RapportsPage } from './pages/RapportsPage';
import { ConfigPage } from './pages/ConfigPage';
import { TeacherDashboard } from './pages/enseignant/TeacherDashboard';
import { TeacherClassesPage } from './pages/enseignant/TeacherClassesPage';
import { TeacherAbsencesPage } from './pages/enseignant/TeacherAbsencesPage';
import { TeacherGradesPage } from './pages/enseignant/TeacherGradesPage';
import { CaissierGuichetPage } from './pages/caissier/CaissierGuichetPage';
import { CaissierJournalPage } from './pages/caissier/CaissierJournalPage';
import { CaissierImpayesPage } from './pages/caissier/CaissierImpayesPage';
import { ParentDashboardPage } from './pages/parent/ParentDashboardPage';
import { ParentPaiementsPage } from './pages/parent/ParentPaiementsPage';
import { ParentPedagogiePage } from './pages/parent/ParentPedagogiePage';
import { ParentAssiduitePage } from './pages/parent/ParentAssiduitePage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PendingActivationScreen } from './pages/PendingActivationScreen';
import { SuperAdminConsole } from './pages/admin/SuperAdminConsole';
import { SetPasswordPage } from './pages/SetPasswordPage';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { isRoleSimulatorAllowed } from './config/features';
import { supabase } from './lib/supabase';
import { parsePath, getPathForState } from './lib/router';
import { PORTAL_HOME } from './store/useNavigationStore';
import type { UserRole, PortalRole, UserProfile } from './store/useAuthStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

export function AppContent() {
  const initTheme = useThemeStore((s) => s.initTheme);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  useSwipeNavigation();

  // État de chargement initial : tant que Supabase n'a pas vérifié la session,
  // on ne redirige vers AUCUN écran pour éviter de jeter l'utilisateur sur la landing page.
  const [isAuthResolving, setIsAuthResolving] = useState(true);

  // Mode d'affichage : Landing vitrine vs Application opérationnelle
  const viewMode = useNavigationStore((s) => s.viewMode);
  const setViewMode = useNavigationStore((s) => s.setViewMode);

  // Rôle actif et écran courant
  const userRole = useNavigationStore((s) => s.userRole);
  const currentRole = useNavigationStore((s) => s.portal);
  const currentRoute = useNavigationStore(selectCurrentRoute);
  const navigate = useNavigationStore((s) => s.navigate);
  const switchPortal = useNavigationStore((s) => s.switchPortal);

  const authProfile = useAuthStore((s) => s.profile);
  const isRealAccount = Boolean(authProfile?.ecole_id && authProfile.ecole_id !== 'ecole-demo');
  const allowSimulation = isRoleSimulatorAllowed(isRealAccount);

  // 1. Résolution de la session Supabase au démarrage / rafraîchissement (F5)
  useEffect(() => {
    let isMounted = true;

    const resolveSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          // Aucune session en base
          useAuthStore.getState().setLoading(false);
          const match = parsePath(window.location.pathname);
          if (match.viewMode === 'app') {
            // Tentative d'accès à une route protégée sans session -> Login
            useNavigationStore.getState().setViewMode('login');
            window.history.replaceState(null, '', '/login');
          } else {
            useNavigationStore.getState().setViewMode(match.viewMode);
          }
          if (isMounted) setIsAuthResolving(false);
          return;
        }

        // Session valide : charger le profil utilisateur
        const { data: profile, error: profileError } = await supabase
          .from('profils')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError || !profile || !profile.actif) {
          console.warn('[EcoSurv Auth] Profil introuvable ou désactivé.');
          await supabase.auth.signOut();
          useAuthStore.getState().logout();
          useNavigationStore.getState().setViewMode('login');
          window.history.replaceState(null, '', '/login');
          if (isMounted) setIsAuthResolving(false);
          return;
        }

        // Profil actif
        useAuthStore.getState().setUser(session.user);
        useAuthStore.getState().setProfile(profile as UserProfile);

        // Charger l'école
        if (profile.ecole_id) {
          const { data: ecoleData } = await supabase
            .from('ecoles')
            .select('id, nom, ville, telephone, email, statut_activation, statut_abonnement')
            .eq('id', profile.ecole_id)
            .maybeSingle();

          if (ecoleData) {
            useAuthStore.getState().setEcole(ecoleData);
            if (ecoleData.statut_activation !== 'active') {
              useNavigationStore.getState().navigateToPendingActivation();
              window.history.replaceState(null, '', '/activation');
              if (isMounted) setIsAuthResolving(false);
              return;
            }
          }
        }

        // Restauration exacte de l'URL courante demandée lors du F5
        const currentPath = window.location.pathname;
        const match = parsePath(currentPath);
        const role = profile.role as UserRole;

        if (role === 'super_admin') {
          // Aucun portail métier pour le super admin : il rejoint toujours sa console.
          if (match.viewMode === 'set_password') {
            useNavigationStore.getState().navigateToSetPassword();
          } else {
            useNavigationStore.getState().navigateToAdminConsole();
            window.history.replaceState(null, '', getPathForState('admin_console'));
          }
          if (isMounted) setIsAuthResolving(false);
          return;
        }

        const portalRole: PortalRole = role;
        useNavigationStore.getState().setUserRole(portalRole);

        if (match.viewMode === 'app' && match.route) {
          const targetPortal = match.portal || portalRole;
          useNavigationStore.getState().launchAppWithRoute(targetPortal, match.route);
        } else if (match.viewMode === 'set_password') {
          useNavigationStore.getState().navigateToSetPassword();
        } else {
          // Si l'utilisateur était sur '/' ou '/login' alors qu'il est déjà connecté
          useNavigationStore.getState().launchAppWithPortal(portalRole);
          const homePath = getPathForState('app', PORTAL_HOME[portalRole]);
          window.history.replaceState(null, '', homePath);
        }
      } catch (err) {
        console.error('[EcoSurv Auth] Erreur vérification session:', err);
        useAuthStore.getState().setLoading(false);
        useNavigationStore.getState().setViewMode('login');
      } finally {
        if (isMounted) setIsAuthResolving(false);
      }
    };

    resolveSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Synchronisation de la barre d'adresse lors des navigations dans l'application
  useEffect(() => {
    if (isAuthResolving) return;

    const targetPath = getPathForState(viewMode, currentRoute);
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  }, [viewMode, currentRoute, isAuthResolving]);

  // 3. Prise en charge des boutons Précédent / Suivant du navigateur (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const match = parsePath(window.location.pathname);
      if (match.viewMode === 'app' && match.route) {
        navigate(match.route);
      } else {
        setViewMode(match.viewMode);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate, setViewMode]);

  // Sécurité et cloisonnement :
  // - Si le simulateur n'est pas autorisé pour ce compte, le portail DOIT rester strictement égal au rôle d'origine.
  useEffect(() => {
    if (!allowSimulation && currentRole !== userRole) {
      switchPortal(userRole);
    }
  }, [userRole, currentRole, allowSimulation, switchPortal]);

  // Surveillance active et immédiate du statut du compte :
  // Si le compte est désactivé par la direction, la session est coupée sur-le-champ
  useEffect(() => {
    if (!authProfile?.id) return;

    // 1. Écoute temps réel des changements sur le profil
    const channel = supabase
      .channel(`profil-status-${authProfile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profils',
          filter: `id=eq.${authProfile.id}`,
        },
        async (payload: any) => {
          if (payload.new && payload.new.actif === false) {
            console.warn('[Security] Compte désactivé en temps réel par la direction.');
            await supabase.auth.signOut();
            useAuthStore.getState().logout();
            setViewMode('login');
            alert("Votre compte a été désactivé par l'administration de l'établissement.");
          }
        }
      )
      .subscribe();

    // 2. Vérification systématique lors du focus / reprise d'activité
    const verifyActiveState = async () => {
      const { data, error } = await supabase
        .from('profils')
        .select('actif')
        .eq('id', authProfile.id)
        .maybeSingle();

      if (!error && data && data.actif === false) {
        console.warn('[Security] Compte inactif détecté au focus.');
        await supabase.auth.signOut();
        useAuthStore.getState().logout();
        setViewMode('login');
        alert("Votre compte a été désactivé par l'administration de l'établissement.");
      }
    };

    window.addEventListener('focus', verifyActiveState);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('focus', verifyActiveState);
    };
  }, [authProfile?.id, setViewMode]);

  // L'écran courant n'appartient qu'au portail actif : les switchs de rendu
  // ci-dessous ne sont évalués que pour ce portail.
  const activeDirectorTab = currentRoute as NavTab;
  const activeTeacherTab = currentRoute as TeacherNavTab;
  const activeCaissierTab = currentRoute as CaissierNavTab;
  const activeParentTab = currentRoute as ParentNavTab;

  // État propre au portail Directeur
  const [elevesStatutFilter, setElevesStatutFilter] = useState<string>('all');

  // État propre au portail Caissier
  const [preselectedEleveForGuichet, setPreselectedEleveForGuichet] = useState<string | undefined>(undefined);

  // État propre au portail Parent
  const [selectedParentChildId, setSelectedParentChildId] = useState<string>('');

  const handleNavigateToElevesWithFilter = (statut: string) => {
    setElevesStatutFilter(statut);
    navigate('eleves');
  };

  const handleGoToGuichetWithEleve = (eleveId: string) => {
    setPreselectedEleveForGuichet(eleveId);
    navigate('caissier_guichet');
  };

  // Les raccourcis du Header (notifications, profil) ciblent des écrans Directeur
  const handleHeaderNavigate = (tab: string) => {
    if (userRole === 'directeur' && currentRole === 'directeur') {
      navigate(tab as NavTab);
    }
  };

  const renderDirectorContent = () => {
    switch (activeDirectorTab) {
      case 'dashboard':
        return <DirectorDashboard onNavigateToEleves={handleNavigateToElevesWithFilter} />;
      case 'eleves':
        return (
          <ElevesPage
            initialStatutFilter={elevesStatutFilter}
            onFilterChange={(statut) => setElevesStatutFilter(statut)}
          />
        );
      case 'echeances':
        return <EcheancesPage />;
      case 'relances':
        return <RelancesPage />;
      case 'rapports':
        return <RapportsPage />;
      case 'config':
        return <ConfigPage />;
      default:
        return <DirectorDashboard onNavigateToEleves={handleNavigateToElevesWithFilter} />;
    }
  };

  const renderTeacherContent = () => {
    switch (activeTeacherTab) {
      case 'teacher_dashboard':
        return (
          <TeacherDashboard
            onNavigateToTab={navigate}
          />
        );
      case 'teacher_classes':
        return <TeacherClassesPage />;
      case 'teacher_absences':
        return <TeacherAbsencesPage />;
      case 'teacher_grades':
        return <TeacherGradesPage />;
      default:
        return (
          <TeacherDashboard
            onNavigateToTab={navigate}
          />
        );
    }
  };

  const renderCaissierContent = () => {
    switch (activeCaissierTab) {
      case 'caissier_guichet':
        return <CaissierGuichetPage preselectedEleveId={preselectedEleveForGuichet} />;
      case 'caissier_journal':
        return <CaissierJournalPage />;
      case 'caissier_impayes':
        return (
          <CaissierImpayesPage
            onGoToGuichetWithEleve={handleGoToGuichetWithEleve}
          />
        );
      default:
        return <CaissierGuichetPage />;
    }
  };

  const renderParentContent = () => {
    switch (activeParentTab) {
      case 'parent_dashboard':
        return (
          <ParentDashboardPage
            selectedChildId={selectedParentChildId}
            onSelectChild={setSelectedParentChildId}
            onNavigateTab={navigate}
          />
        );
      case 'parent_paiements':
        return (
          <ParentPaiementsPage
            selectedChildId={selectedParentChildId}
          />
        );
      case 'parent_pedagogie':
        return (
          <ParentPedagogiePage
            selectedChildId={selectedParentChildId}
          />
        );
      case 'parent_assiduite':
        return (
          <ParentAssiduitePage
            selectedChildId={selectedParentChildId}
          />
        );
      default:
        return (
          <ParentDashboardPage
            selectedChildId={selectedParentChildId}
            onSelectChild={setSelectedParentChildId}
            onNavigateTab={navigate}
          />
        );
    }
  };

  if (isAuthResolving) {
    return (
      <div key="auth-resolving" className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="flex flex-col items-center space-y-4 animate-in fade-in duration-300">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25 ring-4 ring-white/10">
            <span className="text-xl font-black text-white tracking-wider">ECO</span>
          </div>
          <div className="space-y-1 text-center">
            <h2 className="text-base font-bold tracking-tight text-white">EcoSurv Mauritanie</h2>
            <p className="text-xs text-slate-400 font-medium">Chargement sécurisé de votre session...</p>
          </div>
          <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mt-2"></div>
        </div>
      </div>
    );
  }

  if (viewMode === 'landing') {
    return (
      <div key="landing-page" className="animate-page-enter">
        <LandingPage />
      </div>
    );
  }

  if (viewMode === 'login') {
    return (
      <div key="login-page" className="animate-page-enter">
        <LoginPage onReturnToLanding={() => setViewMode('landing')} />
      </div>
    );
  }

  if (viewMode === 'register') {
    return (
      <div key="register-page" className="animate-page-enter">
        <RegisterPage onReturnToLanding={() => setViewMode('landing')} />
      </div>
    );
  }

  if (viewMode === 'pending_activation') {
    return (
      <div key="pending-activation-page" className="animate-page-enter">
        <PendingActivationScreen />
      </div>
    );
  }

  if (viewMode === 'set_password') {
    return (
      <div key="set-password-page" className="animate-page-enter">
        <SetPasswordPage />
      </div>
    );
  }

  if (viewMode === 'admin_console') {
    return (
      <div key="admin-console-page" className="animate-page-enter">
        <SuperAdminConsole onReturnToLanding={() => setViewMode('landing')} />
      </div>
    );
  }

  return (
    <div key="app-view" className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-['Plus_Jakarta_Sans',sans-serif] text-slate-900 dark:text-slate-100 antialiased animate-page-enter">
      {/* Dynamic Sidebar based on current role with ErrorBoundary */}
      <ErrorBoundary name="Barre latérale">
        {currentRole === 'enseignant' && (
          <TeacherSidebar
            activeTab={activeTeacherTab}
            onTabChange={navigate}
          />
        )}
        {currentRole === 'caissier' && (
          <CaissierSidebar
            activeTab={activeCaissierTab}
            onTabChange={navigate}
          />
        )}
        {currentRole === 'parent' && (
          <ParentSidebar
            activeTab={activeParentTab}
            onTabChange={navigate}
            selectedChildId={selectedParentChildId}
            onSelectChild={setSelectedParentChildId}
          />
        )}
        {currentRole === 'directeur' && (
          <Sidebar
            activeTab={activeDirectorTab}
            onTabChange={navigate}
          />
        )}
      </ErrorBoundary>

      {/* Main Area with ErrorBoundary */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header
          currentRole={currentRole}
          onRoleChange={switchPortal}
          onNavigateTab={handleHeaderNavigate}
          onReturnToLanding={() => setViewMode('landing')}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <ErrorBoundary name="Contenu principal">
            {currentRole === 'enseignant' && renderTeacherContent()}
            {currentRole === 'caissier' && renderCaissierContent()}
            {currentRole === 'parent' && renderParentContent()}
            {currentRole === 'directeur' && renderDirectorContent()}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary name="EcoSurv">
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

