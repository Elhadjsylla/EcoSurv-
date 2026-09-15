import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useThemeStore } from './store/useThemeStore';
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

  // Mode d'affichage : Landing vitrine vs Application opérationnelle
  const viewMode = useNavigationStore((s) => s.viewMode);
  const setViewMode = useNavigationStore((s) => s.setViewMode);

  // Rôle actif (basculable dans le Header pour la démo) et écran courant,
  // pilotés par l'historique de navigation (boutons Précédent / Suivant)
  const currentRole = useNavigationStore((s) => s.portal);
  const currentRoute = useNavigationStore(selectCurrentRoute);
  const navigate = useNavigationStore((s) => s.navigate);
  const switchPortal = useNavigationStore((s) => s.switchPortal);

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
  const [selectedParentChildId, setSelectedParentChildId] = useState<string>('el-003');

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
    if (currentRole === 'directeur') navigate(tab as NavTab);
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

  if (viewMode === 'landing') {
    return (
      <div key="landing-page" className="animate-page-enter">
        <LandingPage />
      </div>
    );
  }

  return (
    <div key="app-view" className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-['Plus_Jakarta_Sans',sans-serif] text-slate-900 dark:text-slate-100 antialiased animate-page-enter">
      {/* Dynamic Sidebar based on current role */}
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

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header
          currentRole={currentRole}
          onRoleChange={switchPortal}
          onNavigateTab={handleHeaderNavigate}
          onReturnToLanding={() => setViewMode('landing')}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {currentRole === 'enseignant' && renderTeacherContent()}
          {currentRole === 'caissier' && renderCaissierContent()}
          {currentRole === 'parent' && renderParentContent()}
          {currentRole === 'directeur' && renderDirectorContent()}
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;

