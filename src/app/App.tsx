import React, { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import {
  selectCheckHealth,
  selectPageState,
  selectPrivacyMode,
  selectSetPrivacyMode,
} from '@/store/selectors';
import { Header } from '@/components/Header';
import { HomePage } from '@/pages/HomePage';
import { ResultPage } from '@/pages/ResultPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PrivacyModal } from '@/components/PrivacyModal';

const App: React.FC = () => {
  const pageState = useAppStore(selectPageState);
  const privacyMode = useAppStore(selectPrivacyMode);
  const setPrivacyMode = useAppStore(selectSetPrivacyMode);
  const checkHealth = useAppStore(selectCheckHealth);

  useEffect(() => {
    void checkHealth();
  }, [checkHealth]);

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
      {!privacyMode && <PrivacyModal onChoose={setPrivacyMode} />}
    </div>
  );
};

export default App;
