import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n/i18n';
import App from './App.tsx';
import { useAuthStore } from './store/useAuthStore';
import { useNavigationStore } from './store/useNavigationStore';

if (import.meta.env.DEV) {
  (window as any).__eco_stores = { useAuthStore, useNavigationStore };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
