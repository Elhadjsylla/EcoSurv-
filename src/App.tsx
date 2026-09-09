import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar, NavTab } from './components/ui/Sidebar';
import { TeacherSidebar, TeacherNavTab } from './components/enseignant/TeacherSidebar';
import { CaissierSidebar, CaissierNavTab } from './components/caissier/CaissierSidebar';
import { Header, UserRole } from './components/ui/Header';
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

export function AppContent() {
  // Rôle actif dans l'application (basculable dans le Header pour la démo)
  const [currentRole, setCurrentRole] = useState<UserRole>('caissier');

  // Onglet actif pour le portail Directeur
  const [activeDirectorTab, setActiveDirectorTab] = useState<NavTab>('dashboard');
  const [elevesStatutFilter, setElevesStatutFilter] = useState<string>('all');

  // Onglet actif pour le portail Enseignant
  const [activeTeacherTab, setActiveTeacherTab] = useState<TeacherNavTab>('teacher_dashboard');

  // Onglet actif et état pour le portail Caissier
  const [activeCaissierTab, setActiveCaissierTab] = useState<CaissierNavTab>('caissier_guichet');
  const [preselectedEleveForGuichet, setPreselectedEleveForGuichet] = useState<string | undefined>(undefined);

  const handleNavigateToElevesWithFilter = (statut: string) => {
    setElevesStatutFilter(statut);
    setActiveDirectorTab('eleves');
  };

  const handleGoToGuichetWithEleve = (eleveId: string) => {
    setPreselectedEleveForGuichet(eleveId);
    setActiveCaissierTab('caissier_guichet');
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
            onNavigateToTab={(tab) => setActiveTeacherTab(tab)}
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
            onNavigateToTab={(tab) => setActiveTeacherTab(tab)}
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

  return (
    <div className="flex min-h-screen bg-slate-50 font-['Plus_Jakarta_Sans',sans-serif] text-slate-900 antialiased">
      {/* Dynamic Sidebar based on current role */}
      {currentRole === 'enseignant' && (
        <TeacherSidebar
          activeTab={activeTeacherTab}
          onTabChange={setActiveTeacherTab}
        />
      )}
      {currentRole === 'caissier' && (
        <CaissierSidebar
          activeTab={activeCaissierTab}
          onTabChange={setActiveCaissierTab}
        />
      )}
      {currentRole === 'directeur' && (
        <Sidebar
          activeTab={activeDirectorTab}
          onTabChange={setActiveDirectorTab}
        />
      )}

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentRole={currentRole}
          onRoleChange={setCurrentRole}
        />
        <main className="flex-1 overflow-y-auto">
          {currentRole === 'enseignant' && renderTeacherContent()}
          {currentRole === 'caissier' && renderCaissierContent()}
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

