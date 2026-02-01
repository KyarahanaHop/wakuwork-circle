'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

type Theme = 'simple' | 'cute' | 'cool';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('simple');
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    // Load saved theme from localStorage
    const saved = localStorage.getItem('wakuwork-theme') as Theme;
    if (saved && ['simple', 'cute', 'cool'].includes(saved)) {
      setThemeState(saved);
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      // Set default theme
      document.documentElement.setAttribute('data-theme', 'simple');
    }
  }, []);

  // Set data-mode for overlay transparency
  useEffect(() => {
    if (pathname?.startsWith('/overlay')) {
      document.documentElement.setAttribute('data-mode', 'overlay');
    } else {
      document.documentElement.removeAttribute('data-mode');
    }
  }, [pathname]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('wakuwork-theme', newTheme);
  };

  // Always provide context, even during SSR
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
