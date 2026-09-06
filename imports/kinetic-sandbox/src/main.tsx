import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import * as THREE from 'three';

// Suppress THREE.GLTFLoader texture format errors for broken user blobs
const originalError = console.error;
console.error = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes("Couldn't load texture")) {
        console.warn(...args); // Downgrade to warning
        return;
    }
    originalError.apply(console, args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

