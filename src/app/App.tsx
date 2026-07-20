import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useAppActions } from '@/hooks/useAppActions';
import { Header } from '@/components/Header';
import { HomePage } from '@/pages/HomePage';
import { ResultPage } from '@/pages/ResultPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { AdminPage } from '@/pages/AdminPage';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PrivacyModal } from '@/components/PrivacyModal';

const AppContent: React.FC = () => {
  const pageState = useAppStore((state) => state.pageState);
  const privacyMode = useAppStore((state) => state.privacyMode);
  const { setPrivacyMode } = useAppActions();

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
        {pageState === 'admin' && <AdminPage />}
      </main>
      {!privacyMode && <PrivacyModal onChoose={setPrivacyMode} />}
    </div>
  );
};

const App: React.FC = () => (
  <AppContent />
);

export default App;
