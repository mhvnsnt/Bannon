import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

window.addEventListener('error', (event) => {
  console.error('[Error Interceptor] Caught error, preventing crash/reload:', event.error);
  event.preventDefault(); // prevents default browser error handling which might trigger reload loops
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Error Interceptor] Caught unhandled rejection:', event.reason);
  event.preventDefault();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
