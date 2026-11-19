'use client';

import { useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Media Hover Prompt Card Grid (Variant B — CSS only, no `motion` dependency).
 *
 * Idle: pure imagery with rounded corners. Hover or keyboard focus reveals a dark
 * scrim with a chip (top-left), a description clamped to three lines, and actions
 * (bottom) — opacity 0→1 and translateY 4px→0 over 180ms, easeOut (0.16, 1, 0.3, 1).
 * Reduced motion keeps the crossfade only. The overlay is `absolute inset-0` inside a
 * fixed-aspect `relative overflow-hidden` card, so nothing reflows.
 *
 * Page-level behaviour (routing) arrives through `onView`. A mouse click anywhere on
 * the card also calls it; a tap on touch screens first reveals the overlay (focus).
 */

export type MediaAspect = 'portrait' | 'square' | 'landscape' | 'tall';

export interface MediaCardItem {
  id: string;
  title: string;
  /** The card's picture. Must fill its box (e.g. an <svg className="h-full w-full">). */
  media: ReactNode;
  chip: string;
  chipSwatch?: string;
  prompt: string;
  aspectRatio?: MediaAspect;
  viewLabel?: string;
  onView?: (id: string) => void;
  secondary?: { label: string; icon: ReactNode; onClick: (id: string) => void };
  /** Shown under the card, outside the media, so the gallery stays navigable. */
  caption?: ReactNode;
}

const RATIO: Record<MediaAspect, string> = {
  portrait: 'aspect-[3/4]',
  square: 'aspect-square',
  landscape: 'aspect-[4/3]',
  tall: 'aspect-[9/14]',
};

export function MediaCardGrid({ items, label, className }: { items: MediaCardItem[]; label: string; className?: string }) {
  return (
    <div role="region" aria-label={label} className={cn('columns-1 gap-4 sm:columns-2 xl:columns-3', className)}>
      {items.map((item) => (
        <MediaCard key={item.id} item={item} />
      ))}
    </div>
  );
}

const reveal =
  'opacity-0 translate-y-1 transition-[opacity,transform] duration-[180ms] ease-reveal group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 motion-reduce:translate-y-0 motion-reduce:transition-opacity';
const live = 'pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto';

export function MediaCard({ item }: { item: MediaCardItem }) {
  const pointer = useRef<string>('mouse');
  return (
    <div className="mb-6 break-inside-avoid">
      <div
        role="article"
        tabIndex={0}
        aria-label={`${item.title}. ${item.chip}. ${item.prompt}`}
        onPointerDown={(e) => {
          pointer.current = e.pointerType;
        }}
        onClick={() => {
          if (pointer.current === 'mouse') item.onView?.(item.id);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && e.target === e.currentTarget) item.onView?.(item.id);
        }}
        className={cn(
          'group relative cursor-pointer overflow-hidden rounded-2xl bg-surface outline-none',
          'focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
          'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-canvas',
          RATIO[item.aspectRatio ?? 'portrait'],
        )}
      >
        <div className="absolute inset-0 select-none" aria-hidden>
          {item.media}
        </div>

        {/* Scrim + content. Background never captures the pointer; only revealed controls do. */}
        <div
          className={cn(
            'pointer-events-none absolute inset-0 flex flex-col justify-between bg-linear-to-b from-black/60 via-black/30 to-black/85 p-3.5 text-white',
            reveal,
          )}
        >
          <div className="flex items-center">
            <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[12.5px] font-medium backdrop-blur-md">
              <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ background: item.chipSwatch ?? '#f2f2f0' }} />
              <span className="truncate">{item.chip}</span>
            </span>
          </div>

          <p className="mb-2 mt-auto line-clamp-3 text-[14.5px] leading-snug text-white/85">{item.prompt}</p>

          <div className="flex items-center justify-between gap-2 pt-1">
            {item.secondary ? (
              <button
                type="button"
                aria-label={item.secondary.label}
                title={item.secondary.label}
                onClick={(e) => {
                  e.stopPropagation();
                  item.secondary!.onClick(item.id);
                }}
                className={cn(
                  'grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-black/40 backdrop-blur-md transition-colors hover:bg-white/20 cursor-pointer',
                  live,
                )}
              >
                {item.secondary.icon}
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                item.onView?.(item.id);
              }}
              className={cn(
                'rounded-full border border-white/20 bg-white/20 px-3.5 py-1.5 text-[13px] font-semibold backdrop-blur-md transition-colors hover:bg-white/30 cursor-pointer',
                live,
              )}
            >
              {item.viewLabel ?? 'View'}
            </button>
          </div>
        </div>
      </div>
      {item.caption && <div className="mt-2.5 px-0.5">{item.caption}</div>}
    </div>
  );
}
