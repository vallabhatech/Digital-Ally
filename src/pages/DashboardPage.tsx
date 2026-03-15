import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { analyzeAndTranslateDashboard } from '../services/geminiService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { 
    UserGroupIcon, CalendarDaysIcon, ChatBubbleOvalLeftEllipsisIcon,
    DocumentChartBarIcon, BuildingStorefrontIcon, SparklesIcon, ArrowRightIcon,
    PlusCircleIcon, StopCircleIcon, SpeakerWaveIcon, CodeIcon
} from '../components/icons';

const DashboardCard: React.FC<{ title: string, icon: React.ReactNode, children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 flex flex-col hover:shadow-lime-100 hover:-translate-y-1 transition-all duration-300">
    <div className="flex items-center gap-4 mb-4">
      <div className="bg-lime-100 text-lime-700 rounded-full p-3">{icon}</div>
      <h3 className="text-lg font-bold text-gray-800">{title}</h3>
    </div>
    <div className="text-gray-600 space-y-3 flex-grow flex flex-col">{children}</div>
  </div>
);

export const DashboardPage: React.FC = () => {
  const context = useContext(AppContext);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const { isSpeaking, speak, cancel } = useTextToSpeech();
  
  if (!context) return null;
  const { t, businessName, userName, userEmail, userPhone, setPageState, language, error, setError, generatedCode } = context;

  const handleAnalyze = async () => {
    if (isSpeaking) {
        cancel();
        return;
    }
    if (!businessName || isAnalyzing) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setError(null);

    try {
        const mockDashboardData = `
        Business: ${businessName}
        Owner: ${userName}
        Website Status: ${generatedCode ? 'Generated' : 'Not Generated'}
        Contact: ${userEmail}, ${userPhone}
        Recent Activity: Website generation completed
        `;
        
        const analysis = await analyzeAndTranslateDashboard({
            dashboardData: mockDashboardData,
            language
        });
        
        setAnalysisResult(analysis);
        
        if (analysis) {
            speak(analysis, language);
        }
    } catch (err) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to analyze dashboard: ${errorMessage}`);
    } finally {
        setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8">
        <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800">{t('dashboard')}</h2>
            <p className="mt-4 text-lg text-gray-600">{t('dashboardSubtext')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {generatedCode && (
          <DashboardCard title={t('websiteManagement')} icon={<CodeIcon className="w-7 h-7" />}>
            <p className="text-sm mb-4 flex-grow">{t('websiteManagementSubtext')}</p>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-center gap-2 bg-lime-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-lime-700 transition">
                <ArrowRightIcon className="w-5 h-5"/>
                {t('viewWebsite')}
              </button>
            </div>
            <button
                onClick={() => setPageState('result')}
                className="mt-auto pt-3 w-full flex items-center justify-center gap-2 bg-lime-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-lime-700 transition"
            >
                <CodeIcon className="w-5 h-5"/>
                {t('customizeWebsite')}
            </button>
          </DashboardCard>
        )}
        <DashboardCard title={t('businessProfile')} icon={<BuildingStorefrontIcon className="w-7 h-7" />}>
          <p><strong>{t('businessNamePlaceholder')}:</strong> {businessName}</p>
          <p><strong>{t('yourNamePlaceholder')}:</strong> {userName}</p>
          <p><strong>{t('emailPlaceholder')}:</strong> {userEmail}</p>
          <p><strong>{t('phonePlaceholder')}:</strong> {userPhone}</p>
        </DashboardCard>
        <DashboardCard title={t('aiAnalysis')} icon={<SparklesIcon className="w-7 h-7" />}>
          <p className="text-sm mb-4 flex-grow">{t('aiAnalysisSubtext')}</p>
          <button 
              onClick={handleAnalyze} 
              disabled={isAnalyzing || !businessName}
              className="w-full flex items-center justify-center gap-2 bg-lime-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-lime-700 transition disabled:bg-gray-400"
          >
              {isAnalyzing 
                  ? <LoadingSpinner className="w-5 h-5" />
                  : (isSpeaking ? <StopCircleIcon className="w-5 h-5"/> : <SpeakerWaveIcon className="w-5 h-5"/>)
              }
              {isAnalyzing ? t('analyzing') : (isSpeaking ? t('stopSpeaking') : t('analyzeAndSpeak'))}
          </button>
          {error && !isAnalyzing && <p className="text-red-500 mt-2 text-xs text-center">{error}</p>}
           {analysisResult && !isAnalyzing && (
              <div className="mt-4 p-3 bg-lime-50 border border-lime-200 rounded-lg text-sm text-lime-900">
                  {analysisResult}
              </div>
          )}
        </DashboardCard>
        <DashboardCard title={t('todaysVisitors')} icon={<UserGroupIcon className="w-7 h-7" />}>
           <p className="text-4xl font-bold text-gray-900">1,234</p>
           <p><strong>{t('peakTime')}:</strong> 2:15 PM</p>
           <p><strong>{t('mostViewed')}:</strong> {t('servicesPage')}</p>
        </DashboardCard>
        <DashboardCard title={t('campaignLaunches')} icon={<CalendarDaysIcon className="w-7 h-7" />}>
            <p><strong>{t('upcoming')}:</strong> {t('summerSale')}</p>
            <p><strong>{t('past')}:</strong> {t('springLaunch')}</p>
            <button className="text-lime-600 font-semibold flex items-center gap-1 mt-2 hover:underline"><PlusCircleIcon className="w-5 h-5"/> {t('newCampaign')}</button>
        </DashboardCard>
        <DashboardCard title={t('mostViewedPages')} icon={<DocumentChartBarIcon className="w-7 h-7" />}>
            <ol className="list-decimal list-inside space-y-1">
                <li>{t('homePage')}</li>
                <li>{t('servicesPage')}</li>
                <li>{t('aboutPage')}</li>
            </ol>
        </DashboardCard>
        <DashboardCard title={t('latestReviews')} icon={<ChatBubbleOvalLeftEllipsisIcon className="w-7 h-7" />}>
             <p>"Great service! Very happy." - ⭐⭐⭐⭐⭐</p>
             <p>"The product was okay." - ⭐⭐⭐☆☆</p>
             <p><strong>{t('sentiment')}:</strong> <span className="text-green-600 font-semibold">{t('positive')}</span></p>
        </DashboardCard>
      </div>
    </div>
  );
};
