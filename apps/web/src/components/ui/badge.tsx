import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium', {
  variants: {
    variant: {
      default: 'bg-brand-soft text-brand-ink',
      neutral: 'bg-ink/[0.06] text-muted',
      ok: 'bg-ok-soft text-ok',
      bad: 'bg-bad-soft text-bad',
      amber: 'bg-amber-soft text-amber',
      lab: 'bg-lab-raised text-lab-dim border border-lab-line',
    },
  },
  defaultVariants: { variant: 'default' },
});

export const Badge = ({ className, variant, ...p }: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) => (
  <span className={cn(badgeVariants({ variant }), className)} {...p} />
);
