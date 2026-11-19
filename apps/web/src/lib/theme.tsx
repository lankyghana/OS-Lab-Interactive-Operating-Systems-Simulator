'use client';

import { useSyncExternalStore } from 'react';
import { cn } from '@/lib/utils';
import { THEME_KEY } from './theme-script';
import { IconMonitor, IconMoon, IconSun } from '@/components/icons';

export type ThemePref = 'light' | 'dark' | 'system';

const listeners = new Set<() => void>();
let pref: ThemePref | null = null;

function read(): ThemePref {
  if (pref) return pref;
  try {
    const v = localStorage.getItem(THEME_KEY);
    pref = v === 'dark' || v === 'system' ? v : 'light';
  } catch {
    pref = 'light';
  }
  return pref;
}

const systemDark = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;

/** Writes the resolved theme onto <html data-theme>. */
export function applyTheme(p: ThemePref = read()) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = p === 'dark' || (p === 'system' && systemDark()) ? 'dark' : 'light';
}

export function setTheme(p: ThemePref) {
  pref = p;
  try {
    localStorage.setItem(THEME_KEY, p);
  } catch {
    /* storage unavailable — keep for this session */
  }
  applyTheme(p);
  listeners.forEach((l) => l());
}

/** Applies the saved theme and keeps "System" in step with the OS. */
export function initTheme() {
  applyTheme();
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
    if (read() === 'system') applyTheme('system');
  });
}

export function useTheme(): ThemePref {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => 'light' as ThemePref,
  );
}

const OPTIONS: { value: ThemePref; label: string; Icon: typeof IconSun }[] = [
  { value: 'light', label: 'Light', Icon: IconSun },
  { value: 'dark', label: 'Dark', Icon: IconMoon },
  { value: 'system', label: 'System', Icon: IconMonitor },
];

/** Light / Dark / System segmented switch. */
export function ThemeSwitcher({ className, compact = false }: { className?: string; compact?: boolean }) {
  const current = useTheme();
  return (
    <div role="radiogroup" aria-label="Colour theme" className={cn('inline-flex rounded-full bg-ink/[0.06] p-1', className)}>
      {OPTIONS.map(({ value, label, Icon }) => {
        const on = current === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              'inline-flex h-8 items-center justify-center gap-1 rounded-full text-[13px] transition-colors cursor-pointer',
              compact ? 'w-8' : 'min-w-0 flex-1 px-1.5',
              on ? 'bg-surface text-ink shadow-[0_1px_2px_rgb(0_0_0/0.12)]' : 'text-muted hover:text-ink',
            )}
          >
            <Icon size={15} />
            {!compact && label}
          </button>
        );
      })}
    </div>
  );
}
