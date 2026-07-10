import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/app/styles.css';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import App from './app/App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
