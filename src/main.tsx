import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import * as Sentry from "@sentry/react";
import App from './App.tsx';
import './index.css';
import { LoadingProvider } from './components/LoadingProvider.tsx';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || "https://8a6a68297fc9e2fb7dbfcb263bda4f8d@o4507000000000000.ingest.us.sentry.io/4507111111111111",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      },
      (err) => {
        console.log('ServiceWorker registration failed: ', err);
      }
    );
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <LoadingProvider>
        <App />
      </LoadingProvider>
    </HelmetProvider>
  </StrictMode>,
);
