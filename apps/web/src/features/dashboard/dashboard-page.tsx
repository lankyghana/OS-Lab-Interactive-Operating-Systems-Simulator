'use client';

import type { ComponentType } from 'react';
import { PageHeader } from '@/components/layout/app-shell';
import { MediaCardGrid, type MediaAspect, type MediaCardItem } from '@/components/gallery/media-card-grid';
import { ModulePlate } from '@/components/gallery/plates';
import { AppLink, useNavigate } from '@/lib/router';
import { useProgress, type ModuleId, type ProgressState } from '@/lib/progress';
import { MODULES, moduleById } from '@/content/modules';
import { TOPICS, topicsFor } from '@/content/topics';
import { QUIZZES } from '@/content/quizzes';
import { timeAgo } from '@/lib/utils';
import { IconBook, IconCpu, IconDisk, IconLayers, IconMemory, IconProcess } from '@/components/icons';

export const MODULE_ICONS: Record<ModuleId, ComponentType<{ size?: number }>> = {
  process: IconProcess,
  cpu: IconCpu,
  memory: IconMemory,
  paging: IconLayers,
  disk: IconDisk,
};

/**
 * Module mastery (0–100): 40% topics read, 30% simulators used (capped at 3 runs),
 * 30% best quiz score.
 */
export function moduleMastery(s: ProgressState, id: ModuleId): number {
  const topics = topicsFor(id);
  const read = topics.filter((t) => s.topicsRead.includes(t.slug)).length / Math.max(1, topics.length);
  const sims = Math.min(3, s.simulations.filter((x) => x.module === id).length) / 3;
  const quiz = Math.max(0, ...s.quizzes.filter((q) => q.module === id).map((q) => q.score / q.total));
  return Math.round((read * 0.4 + sims * 0.3 + quiz * 0.3) * 100);
}

export const SWATCH: Record<ModuleId | 'practice', string> = {
  process: '#b0aea5',
  cpu: '#6a9bcc',
  memory: '#d97757',
  paging: '#788c5d',
  disk: '#c96a8a',
  practice: '#c4a35a',
};

const ASPECT: Record<ModuleId | 'practice', MediaAspect> = {
  cpu: 'tall',
  process: 'square',
  memory: 'portrait',
  paging: 'portrait',
  disk: 'landscape',
  practice: 'square',
};

export function DashboardPage() {
  const s = useProgress();
  const navigate = useNavigate();
  const firstName = s.user?.name.split(' ')[0];
  const recent = Object.entries(s.visits)
    .sort((a, b) => (b[1] ?? '').localeCompare(a[1] ?? ''))
    .slice(0, 4)
    .map(([id, at]) => ({ module: MODULES.find((m) => m.id === id)!, at: at! }));
  const recommended = TOPICS.filter((t) => !s.topicsRead.includes(t.slug)).slice(0, 3);
  const quizAvg = s.quizzes.length ? Math.round((s.quizzes.reduce((a, q) => a + q.score / q.total, 0) / s.quizzes.length) * 100) : null;

  const facts = [
    `${s.simulations.length} ${s.simulations.length === 1 ? 'simulation' : 'simulations'} run`,
    `${s.topicsRead.length} of ${TOPICS.length} topics read`,
    s.exercises.length ? `${s.exercises.length} exercises attempted` : null,
    quizAvg !== null ? `quiz average ${quizAvg}%` : null,
  ].filter(Boolean);

  const moduleCards: MediaCardItem[] = [
    ...MODULES.map((m) => {
      const firstTopic = topicsFor(m.id)[0];
      return {
        id: m.id,
        title: m.name,
        media: <ModulePlate module={m.id} />,
        chip: m.algorithms.join(' · '),
        chipSwatch: SWATCH[m.id],
        prompt: m.description,
        aspectRatio: ASPECT[m.id],
        viewLabel: 'Open lab',
        onView: () => navigate(m.href),
        secondary: { label: `Read about ${m.name}`, icon: <IconBook size={15} />, onClick: () => navigate(`/learn/${firstTopic.slug}`) },
        caption: (
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[16px] font-semibold">{m.name}</p>
            <p className="shrink-0 text-[13.5px] text-muted tabular">{moduleMastery(s, m.id)}% mastery</p>
          </div>
        ),
      };
    }),
    {
      id: 'practice',
      title: 'Practice',
      media: <ModulePlate module="practice" />,
      chip: `${Object.values(QUIZZES).flat().length} quiz questions`,
      chipSwatch: SWATCH.practice,
      prompt: 'Freshly generated exam-style exercises, checked against the simulation engine, with a worked solution for every one.',
      aspectRatio: ASPECT.practice,
      viewLabel: 'Start practising',
      onView: () => navigate('/practice'),
      caption: (
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[16px] font-semibold">Practice</p>
          <p className="shrink-0 text-[13.5px] text-muted">Exercises and quizzes</p>
        </div>
      ),
    },
  ];

  const readNext: MediaCardItem[] = recommended.map((t) => ({
    id: t.slug,
    title: t.title,
    media: <ModulePlate module={t.module} algorithm={'algorithm' in t.example ? t.example.algorithm : undefined} />,
    chip: moduleById(t.module).name,
    chipSwatch: SWATCH[t.module],
    prompt: t.summary,
    aspectRatio: 'landscape',
    viewLabel: 'Read',
    onView: () => navigate(`/learn/${t.slug}`),
    caption: <p className="text-[15px] font-semibold">{t.title}</p>,
  }));

  return (
    <>
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : 'Learn operating systems by running them'}
        description={
          <>
            Pick a lab, watch the algorithm work, then check yourself.{' '}
            <span className="text-faint">{facts.join(' · ')}.</span>
          </>
        }
      />

      {!s.user && (
        <p className="-mt-3 mb-8 text-[14px] text-muted">
          You’re in guest mode, so your progress stays in this browser.{' '}
          <AppLink href="/sign-up" className="font-semibold text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
            Create an account
          </AppLink>{' '}
          to keep it everywhere.
        </p>
      )}

      {recent.length > 0 && (
        <nav aria-label="Recently used" className="mb-8 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[14px] text-muted">Continue</span>
          {recent.map(({ module, at }) => {
            const Icon = MODULE_ICONS[module.id];
            return (
              <AppLink key={module.id} href={module.href} className="inline-flex items-center gap-2 rounded-full border border-line px-3.5 py-1.5 text-[14px] hover:bg-ink/[0.06]">
                <Icon size={15} />
                {module.name}
                <span className="text-faint">{timeAgo(at)}</span>
              </AppLink>
            );
          })}
        </nav>
      )}

      <section aria-labelledby="labs-h" className="mb-12">
        <h2 id="labs-h" className="mb-4 text-[20px] font-semibold tracking-tight">
          Labs
        </h2>
        <MediaCardGrid items={moduleCards} label="Simulation labs" />
      </section>

      {readNext.length > 0 && (
        <section aria-labelledby="next-h">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 id="next-h" className="text-[20px] font-semibold tracking-tight">
              Read next
            </h2>
            <AppLink href="/learn" className="text-[14px] text-muted hover:text-ink">
              All {TOPICS.length} topics →
            </AppLink>
          </div>
          <MediaCardGrid items={readNext} label="Recommended topics" />
        </section>
      )}

      <p className="mt-10 border-t border-line pt-6 text-[15px] text-muted">
        Going deeper? The{' '}
        <AppLink href="/resources" className="font-semibold text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
          resource library
        </AppLink>{' '}
        collects the best free textbooks, university courses and video series on operating systems.
      </p>
    </>
  );
}
