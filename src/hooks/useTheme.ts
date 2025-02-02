import { useState, useEffect } from 'react';

type Theme = 'dark' | 'light';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';
    const savedTheme = localStorage.getItem('theme') as Theme;
    return savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);

    // Update CSS variables based on theme
    if (theme === 'light') {
      document.documentElement.style.setProperty('--bg-primary', '#ffffff');
      document.documentElement.style.setProperty('--bg-secondary', '#f2f3f5');
      document.documentElement.style.setProperty('--text-primary', '#2e3338');
      document.documentElement.style.setProperty('--text-secondary', '#747f8d');
    } else {
      document.documentElement.style.setProperty('--bg-primary', '#313338');
      document.documentElement.style.setProperty('--bg-secondary', '#2b2d31');
      document.documentElement.style.setProperty('--text-primary', '#ffffff');
      document.documentElement.style.setProperty('--text-secondary', '#949ba4');
    }
  }, [theme]);

  return { theme, setTheme };
}