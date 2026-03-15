import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Header } from './components/Header';
import { LoadingSpinner } from './components/LoadingSpinner';
import { HomePage } from './pages/HomePage';
import { ResultPage } from './pages/ResultPage';
import { DashboardPage } from './pages/DashboardPage';

const LoadingState: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-600 p-4">
            <LoadingSpinner className="w-12 h-12 text-lime-500" />
            <h3 className="text-2xl font-semibold text-gray-800 mt-6">Generating your website...</h3>
            <p className="mt-2 text-gray-500">This may take a moment. Great things are on the way!</p>
        </div>
    );
};

const AppContent: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-lime-50 via-white to-green-50">
            <Header />
            <main className="container mx-auto">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/result" element={<ResultPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/loading" element={<LoadingState />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
        </div>
    );
};

const App: React.FC = () => {
    return (
        <Router>
            <AppProvider>
                <AppContent />
            </AppProvider>
        </Router>
    );
};

export default App;
