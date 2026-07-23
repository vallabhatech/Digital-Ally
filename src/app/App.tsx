import React, { useContext } from 'react';
import { AppProvider, AppContext } from '@/app/context/AppContext';
import { Header } from '@/components/Header';
import { HomePage } from '@/pages/HomePage';
import { ResultPage } from '@/pages/ResultPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PrivacyModal } from '@/components/PrivacyModal';
import { ScrollToTop } from '@/components/ScrollToTop';

const AppContent: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) return null;

  const { pageState, privacyMode, setPrivacyMode } = context;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {pageState === 'form' && <HomePage />}
        {pageState === 'loading' && (
          <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-lime-800">
            <LoadingSpinner className="w-12 h-12" />
            <p className="text-lg font-semibold">Creating your content...</p>
          </div>
        )}
        {pageState === 'result' && <ResultPage />}
        {pageState === 'dashboard' && <DashboardPage />}
      </main>
      <ScrollToTop />
      {!privacyMode && <PrivacyModal onChoose={setPrivacyMode} />}
    </div>
  );
};

const App: React.FC = () => (
  <AppProvider>
    <AppContent />
  </AppProvider>
);

export default App;
