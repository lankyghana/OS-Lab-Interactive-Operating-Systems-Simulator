'use client';

import { PageHeader } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { BarChart } from '@/components/charts/bar-chart';
import { AppLink } from '@/lib/router';
import { progress, useProgress } from '@/lib/progress';
import { MODULES } from '@/content/modules';
import { TOPICS } from '@/content/topics';
import { RESOURCES, resourceById } from '@/content/resources';
import { timeAgo } from '@/lib/utils';
import { MODULE_ICONS, moduleMastery } from '@/features/dashboard/dashboard-page';
import { IconStar } from '@/components/icons';

export function ProgressPage() {
  const s = useProgress();
  const exAvg = s.exercises.length ? Math.round(s.exercises.reduce((a, e) => a + e.score, 0) / s.exercises.length) : null;
  const history = [
    ...s.simulations.map((x) => ({ at: x.at, kind: 'Simulation', text: `${MODULES.find((m) => m.id === x.module)?.name} · ${x.algorithm === 'ALL' ? 'all algorithms' : x.algorithm.replace('_', ' ')}`, tag: x.mode })),
    ...s.exercises.map((x) => ({ at: x.at, kind: 'Exercise', text: `${x.kind.toUpperCase()} exercise (${x.difficulty})`, tag: `${x.score}%` })),
    ...s.quizzes.map((x) => ({ at: x.at, kind: 'Quiz', text: `${MODULES.find((m) => m.id === x.module)?.name} quiz`, tag: `${x.score}/${x.total}` })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 30);

  return (
    <>
      <PageHeader
        eyebrow="My Progress"
        title="Learning statistics & history"
        description={s.user ? `Synced to ${s.user.email}.` : 'You are using guest mode, so this data is stored in this browser only. Sign in to keep it.'}
        actions={
          <Button
            variant="outline"
            onClick={() => {
              if (window.confirm('Clear all local progress? This cannot be undone.')) progress.reset();
            }}
          >
            Reset local progress
          </Button>
        }
      />

      <div className="mb-6 grid gap-3 md:grid-cols-5">
        {MODULES.map((m) => {
          const Icon = MODULE_ICONS[m.id];
          const v = moduleMastery(s, m.id);
          return (
            <Card key={m.id}>
              <CardContent className="p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Icon size={16} /> {m.short}
                </div>
                <p className="text-2xl font-bold tabular">{v}%</p>
                <ProgressBar value={v} className="mt-2" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Simulations by module</CardTitle>
          </CardHeader>
          <CardContent>
            {s.simulations.length === 0 ? (
              <p className="text-sm text-muted">No simulations yet.</p>
            ) : (
              <BarChart lowerIsBetter={false} data={MODULES.map((m) => ({ label: m.short, value: s.simulations.filter((x) => x.module === m.id).length }))} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-canvas p-3">
              <p className="text-muted">Topics read</p>
              <p className="text-xl font-bold tabular">
                {s.topicsRead.length}/{TOPICS.length}
              </p>
            </div>
            <div className="rounded-xl bg-canvas p-3">
              <p className="text-muted">Exercise average</p>
              <p className="text-xl font-bold tabular">{exAvg === null ? '—' : `${exAvg}%`}</p>
            </div>
            <div className="rounded-xl bg-canvas p-3">
              <p className="text-muted">Quizzes taken</p>
              <p className="text-xl font-bold tabular">{s.quizzes.length}</p>
            </div>
            <div className="rounded-xl bg-canvas p-3">
              <p className="text-muted">Visual vs calculator</p>
              <p className="text-xl font-bold tabular">
                {s.simulations.filter((x) => x.mode === 'visual').length} / {s.simulations.filter((x) => x.mode === 'text').length}
              </p>
            </div>
            <div className="col-span-2 rounded-xl bg-canvas p-3">
              <p className="mb-1.5 text-muted">
                Resources: {s.completedResources.length} of {RESOURCES.length} done
              </p>
              {s.savedResources.length === 0 ? (
                <p className="text-muted">
                  Nothing saved yet.{' '}
                  <AppLink href="/resources" className="font-medium text-ink underline decoration-ink/30 underline-offset-4">
                    Browse the library
                  </AppLink>
                </p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {s.savedResources.map((id) => {
                    const r = resourceById(id);
                    if (!r) return null;
                    return (
                      <li key={id} className="flex items-center justify-between gap-3">
                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="truncate font-medium hover:underline">
                          {r.title}
                        </a>
                        {s.completedResources.includes(id) && <span className="shrink-0 text-[12.5px] text-ok">Done</span>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="col-span-2 rounded-xl bg-canvas p-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-muted">
                <IconStar size={14} /> Favourite algorithms
              </p>
              {s.favourites.length === 0 ? (
                <p className="text-muted">None yet. Use the ☆ button on any simulator.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {s.favourites.map((f) => {
                    const [mod, algo] = f.split(':');
                    const m = MODULES.find((x) => x.id === mod);
                    return (
                      <AppLink key={f} href={m?.href ?? '/'} className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium ring-1 ring-line hover:ring-brand/40">
                        {m?.short} · {algo === 'STATES' ? 'States' : algo.replace('_', ' ')}
                      </AppLink>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-muted">Your simulation history, exercises and quizzes will appear here.</p>
            ) : (
              <ul className="divide-y divide-line">
                {history.map((h, i) => (
                  <li key={i} className="flex items-center gap-3 py-2.5 text-sm">
                    <Badge variant={h.kind === 'Simulation' ? 'neutral' : h.kind === 'Quiz' ? 'amber' : 'default'} className="w-24 justify-center">
                      {h.kind}
                    </Badge>
                    <span className="flex-1">{h.text}</span>
                    <span className="font-mono text-xs text-muted">{h.tag}</span>
                    <span className="w-20 text-right text-xs text-faint">{timeAgo(h.at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
