'use client';

import { useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { SPEEDS, type Playback } from '@/lib/use-playback';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { PageHeader } from '@/components/layout/app-shell';
import { AppLink } from '@/lib/router';
import { progress, useProgress, type ModuleId } from '@/lib/progress';
import { topicForAlgorithm } from '@/content/topics';
import { IconBack, IconBook, IconCompare, IconEye, IconPause, IconPlay, IconReset, IconStar, IconStep, IconTerminal } from '@/components/icons';

/** Dark "lab bench" container used inside every simulator. */
export function LabPanel({ title, meta, children, className }: { title?: ReactNode; meta?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('lab-grid overflow-hidden rounded-2xl border border-lab-line text-lab-text', className)}>
      {(title || meta) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-lab-line bg-lab-panel/80 px-4 py-2.5">
          <div className="flex items-center gap-2 text-[13px] font-medium text-lab-dim">
            <span className="h-1.5 w-1.5 rounded-full bg-signal" aria-hidden />
            {title}
          </div>
          {meta && <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-lab-dim">{meta}</div>}
        </div>
      )}
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function LabBox({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-lab-line bg-lab-panel/70 p-3', className)}>
      <p className="mb-2 text-[12.5px] font-medium text-lab-dim">{label}</p>
      {children}
    </div>
  );
}

/** Start / Pause / Resume / Step / Back / Reset / Speed. Keyboard: Space, →, ←, R. */
export function PlaybackControls({ pb, stepLabel = 'Step', positionLabel }: { pb: Playback; stepLabel?: string; positionLabel?: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (e.key === ' ') {
        e.preventDefault();
        if (pb.status === 'playing') pb.pause();
        else if (pb.status === 'paused') pb.resume();
        else pb.start();
      } else if (e.key === 'ArrowRight') pb.step();
      else if (e.key === 'ArrowLeft') pb.back();
      else if (e.key.toLowerCase() === 'r' && !e.metaKey && !e.ctrlKey) pb.reset();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pb]);

  const primary =
    pb.status === 'playing' ? (
      <Button variant="signal" size="sm" onClick={pb.pause}>
        <IconPause size={14} /> Pause
      </Button>
    ) : pb.status === 'paused' ? (
      <Button variant="signal" size="sm" onClick={pb.resume}>
        <IconPlay size={14} /> Resume
      </Button>
    ) : (
      <Button variant="signal" size="sm" onClick={pb.start}>
        <IconPlay size={14} /> {pb.status === 'finished' ? 'Replay' : 'Start'}
      </Button>
    );

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-lab-line bg-lab-panel/90 p-3">
      <div className="flex flex-wrap items-center gap-2">
        {primary}
        <Button variant="lab" size="sm" onClick={pb.back} disabled={pb.index === 0} aria-label="Step back">
          <IconBack size={14} />
        </Button>
        <Button variant="lab" size="sm" onClick={pb.step} disabled={pb.index >= pb.last}>
          <IconStep size={14} /> {stepLabel}
        </Button>
        <Button variant="lab" size="sm" onClick={pb.reset} disabled={pb.status === 'idle' && pb.index === 0}>
          <IconReset size={14} /> Reset
        </Button>
        <div className="ml-auto flex items-center gap-1.5" role="group" aria-label="Simulation speed">
          <span className="mr-1 text-[13px] text-lab-dim">Speed</span>
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => pb.setSpeed(s)}
              aria-pressed={pb.speed === s}
              className={cn(
                'h-7 rounded-md px-2 font-mono text-[11px] transition-colors cursor-pointer',
                pb.speed === s ? 'bg-signal/15 text-signal ring-1 ring-signal/40' : 'text-lab-dim hover:bg-lab-raised hover:text-lab-text',
              )}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={pb.last}
          value={pb.index}
          onChange={(e) => pb.seek(Number(e.target.value))}
          aria-label="Simulation position"
          className="h-1.5 flex-1 cursor-pointer accent-signal"
        />
        <span className="min-w-[96px] text-right font-mono text-[11px] text-lab-dim tabular">{positionLabel ?? `${pb.index} / ${pb.last}`}</span>
        <Badge variant="lab" className="hidden sm:inline-flex">
          {pb.status}
        </Badge>
      </div>
      <p className="hidden font-mono text-[10px] text-lab-dim/70 sm:block">Keys: Space start/pause · ← → step · R reset</p>
    </div>
  );
}

export type SimTab = 'visual' | 'text' | 'compare';

export function SimulatorFrame({
  module,
  eyebrow,
  title,
  description,
  algorithm,
  tab,
  onTab,
  inputs,
  children,
  hideCompare,
  textLabel = 'Calculator',
}: {
  module: ModuleId;
  eyebrow: string;
  title: string;
  description: string;
  algorithm: string;
  tab: SimTab;
  onTab: (t: SimTab) => void;
  inputs: ReactNode;
  children: ReactNode;
  hideCompare?: boolean;
  textLabel?: string;
}) {
  const { favourites } = useProgress();
  const favKey = `${module}:${algorithm}`;
  const fav = favourites.includes(favKey);
  const topic = topicForAlgorithm(module, algorithm);

  useEffect(() => progress.visit(module), [module]);

  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          <>
            {topic && (
              <AppLink
                href={`/learn/${topic.slug}`}
                className="inline-flex h-9 items-center gap-2 rounded-full border border-line bg-surface px-3.5 text-sm font-medium hover:bg-ink/[0.06]"
              >
                <IconBook size={16} /> Learn {topic.title.split(' (')[0]}
              </AppLink>
            )}
            <Button variant={fav ? 'soft' : 'outline'} onClick={() => progress.toggleFavourite(favKey)} aria-pressed={fav}>
              <IconStar size={16} className={fav ? 'fill-current' : ''} />
              {fav ? 'Favourited' : 'Favourite'}
            </Button>
          </>
        }
      />
      <div className="mb-5">{inputs}</div>
      <div className="mb-4 max-w-full">
        <Tabs<SimTab>
          value={tab}
          onChange={onTab}
          items={[
            { value: 'visual', label: 'Visual lab', icon: <IconEye size={15} /> },
            { value: 'text', label: textLabel, icon: <IconTerminal size={15} /> },
            ...(hideCompare ? [] : [{ value: 'compare' as SimTab, label: 'Compare', icon: <IconCompare size={15} /> }]),
          ]}
        />
      </div>
      <div className="animate-slide-in" key={tab}>
        {children}
      </div>
    </>
  );
}

export function Stat({ label, value, hint, tone = 'light' }: { label: string; value: ReactNode; hint?: ReactNode; tone?: 'light' | 'lab' }) {
  return (
    <div className={cn('rounded-xl border p-3.5', tone === 'light' ? 'border-line bg-surface' : 'border-lab-line bg-lab-panel/80')}>
      <p className={cn('text-[12.5px] font-medium', tone === 'light' ? 'text-muted' : 'text-lab-dim')}>{label}</p>
      <p className={cn('mt-1 text-2xl font-bold tracking-tight tabular', tone === 'lab' && 'font-mono text-lab-text')}>{value}</p>
      {hint && <p className={cn('mt-0.5 text-xs', tone === 'light' ? 'text-muted' : 'text-lab-dim')}>{hint}</p>}
    </div>
  );
}

export function EventLog({ entries, emptyText = 'Events will appear here as the simulation runs.' }: { entries: { key: string; time?: ReactNode; text: ReactNode; tone?: 'default' | 'good' | 'bad' }[]; emptyText?: string }) {
  return (
    <div className="max-h-56 overflow-y-auto rounded-lg bg-lab/70 p-2 font-mono text-[12px] leading-relaxed" aria-live="polite">
      {entries.length === 0 && <p className="px-1 text-lab-dim">{emptyText}</p>}
      {entries.map((e) => (
        <div key={e.key} className="flex gap-3 px-1 py-0.5 animate-slide-in">
          {e.time !== undefined && <span className="w-10 shrink-0 text-right text-lab-dim tabular">{e.time}</span>}
          <span className={cn(e.tone === 'good' ? 'text-signal' : e.tone === 'bad' ? 'text-fault' : 'text-lab-text')}>{e.text}</span>
        </div>
      ))}
    </div>
  );
}
