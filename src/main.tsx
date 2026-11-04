import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/plus-jakarta-sans/latin-400.css';
import '@fontsource/plus-jakarta-sans/latin-500.css';
import '@fontsource/plus-jakarta-sans/latin-600.css';
import '@fontsource/plus-jakarta-sans/latin-700.css';
import '@fontsource/plus-jakarta-sans/latin-800.css';
import '@fontsource/plus-jakarta-sans/latin-ext-400.css';
import '@fontsource/plus-jakarta-sans/latin-ext-500.css';
import '@fontsource/plus-jakarta-sans/latin-ext-600.css';
import '@fontsource/plus-jakarta-sans/latin-ext-700.css';
import '@fontsource/plus-jakarta-sans/latin-ext-800.css';
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
