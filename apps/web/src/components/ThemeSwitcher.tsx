'use client';

import { useTheme } from './ThemeProvider';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex gap-2 p-2 rounded-lg" style={{ background: 'var(--surface)' }}>
      {(['simple', 'cute', 'cool'] as const).map((t) => (
        <button
          key={t}
          onClick={() => setTheme(t)}
          className="px-3 py-1 rounded-md text-sm font-medium transition-all"
          style={{
            background: theme === t ? 'var(--primary)' : 'var(--surface2)',
            color: theme === t ? 'var(--primaryText)' : 'var(--text)',
            borderRadius: 'var(--r-md)',
          }}
        >
          {t === 'simple' && 'シンプル'}
          {t === 'cute' && 'キュート'}
          {t === 'cool' && 'クール'}
        </button>
      ))}
    </div>
  );
}
