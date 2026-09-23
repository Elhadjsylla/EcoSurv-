import { create } from 'zustand';

export type Theme = 'light' | 'dark';

interface ThemeStore {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  initTheme: () => void;
}

const applyThemeToDocument = (theme: Theme) => {
  if (typeof document !== 'undefined') {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
};

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: (typeof window !== 'undefined' && (localStorage.getItem('ecosurv_theme') as Theme)) || 'dark',
  toggleTheme: () => {
    const nextTheme: Theme = get().theme === 'light' ? 'dark' : 'light';
    if (typeof window !== 'undefined') {
      localStorage.setItem('ecosurv_theme', nextTheme);
    }
    applyThemeToDocument(nextTheme);
    set({ theme: nextTheme });
  },
  setTheme: (theme: Theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ecosurv_theme', theme);
    }
    applyThemeToDocument(theme);
    set({ theme });
  },
  initTheme: () => {
    const saved = typeof window !== 'undefined' ? (localStorage.getItem('ecosurv_theme') as Theme) : null;
    const initial = saved || 'dark';
    applyThemeToDocument(initial);
    set({ theme: initial });
  },
}));
