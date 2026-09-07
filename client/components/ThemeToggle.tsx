'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
const STORAGE_KEY = 'inv-theme';

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) || 'dark';
    setTheme(stored);
    applyTheme(stored);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  return (
    <button
      type="button"
      className="icon-btn"
      onClick={toggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> 80c67bd0b7a27054c2a21e0173fca4bdd288c9e0
