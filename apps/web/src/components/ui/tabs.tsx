'use client';

import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface TabItem<T extends string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
}

/** Accessible segmented tab list (roving selection with arrow keys). */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
  tone = 'light',
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  tone?: 'light' | 'lab';
}) {
  const id = useId();
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex max-w-full gap-1 overflow-x-auto rounded-full p-1',
        tone === 'light' ? 'bg-ink/[0.05]' : 'bg-lab-raised border border-lab-line',
        className,
      )}
      onKeyDown={(e) => {
        const i = items.findIndex((t) => t.value === value);
        if (e.key === 'ArrowRight') onChange(items[(i + 1) % items.length].value);
        if (e.key === 'ArrowLeft') onChange(items[(i - 1 + items.length) % items.length].value);
      }}
    >
      {items.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            id={`${id}-${t.value}`}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.value)}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[13px] font-medium transition-all cursor-pointer',
              tone === 'light'
                ? active
                  ? 'bg-ink/[0.12] text-ink'
                  : 'text-muted hover:text-ink'
                : active
                  ? 'bg-lab-line text-lab-text'
                  : 'text-lab-dim hover:text-lab-text',
            )}
          >
            {t.icon}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
