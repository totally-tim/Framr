import { useState, useEffect, useCallback, useRef } from 'react';

type Theme = 'light' | 'dark';
const STORAGE_KEY = 'framr-theme';

function readStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw === 'light' || raw === 'dark' ? raw : null;
}

function readSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme() ?? readSystemTheme());
  const userExplicitRef = useRef<boolean>(readStoredTheme() !== null);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');

    // Only persist when the user has explicitly chosen — otherwise the system theme keeps following OS changes.
    if (userExplicitRef.current) {
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch (err) {
        console.warn('Framr: could not persist theme preference', err);
      }
    }
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      if (!userExplicitRef.current) {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    userExplicitRef.current = true;
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    userExplicitRef.current = true;
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  return { theme, setTheme, toggleTheme };
}
