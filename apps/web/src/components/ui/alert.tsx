import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Alert({ tone = 'info', title, children, className }: { tone?: 'info' | 'error' | 'success' | 'warn'; title?: string; children?: ReactNode; className?: string }) {
  const tones = {
    info: 'border-brand/20 bg-brand-soft/60 text-brand-ink',
    error: 'border-bad/25 bg-bad-soft text-bad',
    success: 'border-ok/25 bg-ok-soft text-ok',
    warn: 'border-amber/25 bg-amber-soft text-amber',
  };
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cn('rounded-xl border px-4 py-3 text-sm', tones[tone], className)}>
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={cn(title && 'mt-0.5 opacity-90')}>{children}</div>}
    </div>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-ink/[0.09]', className)} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
