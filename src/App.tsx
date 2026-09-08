import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar, NavTab } from './components/ui/Sidebar';
import { Header } from './components/ui/Header';
import { DirectorDashboard } from './components/dashboard/DirectorDashboard';
import { ElevesPage } from './pages/ElevesPage';
import { EcheancesPage } from './pages/EcheancesPage';
import { RelancesPage } from './pages/RelancesPage';
import { RapportsPage } from './pages/RapportsPage';
import { ConfigPage } from './pages/ConfigPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

export function AppContent() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DirectorDashboard />;
      case 'eleves':
        return <ElevesPage />;
      case 'echeances':
        return <EcheancesPage />;
      case 'relances':
        return <RelancesPage />;
      case 'rapports':
        return <RapportsPage />;
      case 'config':
        return <ConfigPage />;
      default:
        return <DirectorDashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-['Plus_Jakarta_Sans',sans-serif] text-slate-900 antialiased">
      {/* Left Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto">{renderContent()}</main>
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
