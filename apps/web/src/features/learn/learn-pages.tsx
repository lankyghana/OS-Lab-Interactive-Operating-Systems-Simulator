'use client';

import { useMemo } from 'react';
import { allocateMemory, applyProcAction, createSystem, replacePages, scheduleCpu, scheduleDisk } from '@os-lab/engine';
import { PageHeader } from '@/components/layout/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { AppLink, useNavigate } from '@/lib/router';
import { presetStore, progress, useProgress } from '@/lib/progress';
import { MODULES, moduleById } from '@/content/modules';
import { TOPICS, topicBySlug, topicsFor, type Topic } from '@/content/topics';
import { readingFor, resourceById } from '@/content/resources';
import { CpuResults } from '@/features/cpu/cpu-results';
import { MemoryResults } from '@/features/memory/memory-simulator';
import { PagingResults } from '@/features/paging/paging-simulator';
import { DiskResults } from '@/features/disk/disk-simulator';
import { StateDiagram } from '@/features/process/process-simulator';
import { LabPanel } from '@/components/sim/lab';
import { IconArrowRight, IconCheck, IconExternal, IconLightbulb, IconPlay, IconTarget } from '@/components/icons';
import { MediaCardGrid, type MediaAspect, type MediaCardItem } from '@/components/gallery/media-card-grid';
import { ModulePlate } from '@/components/gallery/plates';
import { SWATCH } from '@/features/dashboard/dashboard-page';
import { cn } from '@/lib/utils';

/** Loads a topic's worked example into its simulator and opens it. */
export function openExample(topic: Topic, navigate: (href: string) => void) {
  const ex = topic.example;
  if (ex.kind === 'cpu') presetStore.set('cpu', { processes: ex.processes, algorithm: ex.algorithm, quantum: ex.quantum });
  if (ex.kind === 'memory') presetStore.set('memory', { blocks: ex.blocks, requests: ex.requests, algorithm: ex.algorithm });
  if (ex.kind === 'paging') presetStore.set('paging', { reference: ex.reference, frames: ex.frames, algorithm: ex.algorithm });
  if (ex.kind === 'disk') presetStore.set('disk', { requests: ex.requests, head: ex.head, cylinders: ex.cylinders, direction: ex.direction, algorithm: ex.algorithm });
  navigate(moduleById(topic.module).href);
}

const ASPECTS: MediaAspect[] = ['portrait', 'landscape', 'square', 'tall', 'portrait', 'landscape'];

export function LearnIndex() {
  const { topicsRead } = useProgress();
  const navigate = useNavigate();
  return (
    <>
      <PageHeader
        title="Learn"
        description="Every algorithm in OS Lab, explained: what it is, why it’s used, how it works, its trade-offs, and a worked example you can open in the simulator. Each picture is that algorithm running on the same input."
      />
      <div className="flex flex-col gap-12">
        {MODULES.map((m) => {
          const topics = topicsFor(m.id);
          const read = topics.filter((t) => topicsRead.includes(t.slug)).length;
          const items: MediaCardItem[] = topics.map((t, i) => ({
            id: t.slug,
            title: t.title,
            media: <ModulePlate module={t.module} algorithm={'algorithm' in t.example ? t.example.algorithm : undefined} />,
            chip: m.name,
            chipSwatch: SWATCH[m.id],
            prompt: t.summary,
            aspectRatio: topics.length === 1 ? 'landscape' : ASPECTS[i % ASPECTS.length],
            viewLabel: 'Read',
            onView: () => navigate(`/learn/${t.slug}`),
            secondary:
              t.example.kind === 'process'
                ? undefined
                : { label: `Open the ${t.title} example in the simulator`, icon: <IconPlay size={13} />, onClick: () => openExample(t, navigate) },
            caption: (
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[15.5px] font-semibold">{t.title}</p>
                {topicsRead.includes(t.slug) && (
                  <span className="inline-flex shrink-0 items-center gap-1 text-[13px] text-ok">
                    <IconCheck size={14} /> Read
                  </span>
                )}
              </div>
            ),
          }));
          return (
            <section key={m.id} aria-labelledby={`learn-${m.id}`}>
              <div className="mb-4 flex items-baseline justify-between gap-3">
                <h2 id={`learn-${m.id}`} className="text-[20px] font-semibold tracking-tight">
                  {m.name}
                </h2>
                <span className="text-[14px] text-muted tabular">
                  {read} of {topics.length} read
                </span>
              </div>
              <MediaCardGrid items={items} label={`${m.name} topics`} className={topics.length === 1 ? 'sm:columns-2 xl:columns-2' : undefined} />
            </section>
          );
        })}
      </div>
    </>
  );
}

function WorkedExample({ topic }: { topic: Topic }) {
  const ex = topic.example;
  const content = useMemo(() => {
    switch (ex.kind) {
      case 'cpu':
        return <CpuResults result={scheduleCpu(ex.processes, ex.algorithm, { quantum: ex.quantum })} compact />;
      case 'memory':
        return <MemoryResults result={allocateMemory(ex.blocks, ex.requests, ex.algorithm, 'variable')} />;
      case 'paging':
        return <PagingResults result={replacePages(ex.reference, ex.frames, ex.algorithm)} />;
      case 'disk':
        return <DiskResults result={scheduleDisk(ex.requests, ex.head, ex.algorithm, { cylinders: ex.cylinders, direction: ex.direction })} />;
      case 'process': {
        let s = createSystem();
        s = applyProcAction(s, { type: 'create', name: 'editor' });
        s = applyProcAction(s, { type: 'create', name: 'compiler' });
        s = applyProcAction(s, { type: 'admit', pid: 1 });
        s = applyProcAction(s, { type: 'admit', pid: 2 });
        s = applyProcAction(s, { type: 'dispatch', pid: 1 });
        s = applyProcAction(s, { type: 'block', pid: 1, reason: 'keyboard input' });
        s = applyProcAction(s, { type: 'dispatch', pid: 2 });
        return (
          <div className="flex flex-col gap-4">
            <LabPanel title="Snapshot">
              <StateDiagram sys={s} last="dispatch" />
            </LabPanel>
            <ol className="flex flex-col gap-1.5 text-sm">
              {s.log.map((l, i) => (
                <li key={i} className="flex gap-2">
                  <span className="w-[150px] shrink-0 font-mono text-xs text-muted">{l.transition}</span>
                  <span>{l.message}</span>
                </li>
              ))}
            </ol>
          </div>
        );
      }
    }
  }, [ex]);
  return <>{content}</>;
}

export function TopicPage({ slug }: { slug: string }) {
  const topic = topicBySlug(slug);
  const navigate = useNavigate();
  const { topicsRead } = useProgress();
  if (!topic)
    return (
      <Alert tone="warn" title="Topic not found">
        <AppLink href="/learn" className="underline">
          Back to all topics
        </AppLink>
      </Alert>
    );

  const module = moduleById(topic.module);
  const read = topicsRead.includes(topic.slug);
  const siblings = TOPICS.filter((t) => t.module === topic.module);
  const idx = TOPICS.indexOf(topic);
  const next = TOPICS[idx + 1];

  const openInSimulator = () => openExample(topic, navigate);

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_240px]">
      <article className="min-w-0">
        <AppLink href="/learn" className="mb-3 inline-block text-sm text-muted hover:text-ink">
          ← All topics
        </AppLink>
        <PageHeader eyebrow={module.name} title={topic.title} description={topic.summary} />
        <div className="mb-9 aspect-[21/9] overflow-hidden rounded-2xl" aria-hidden>
          <ModulePlate module={topic.module} algorithm={'algorithm' in topic.example ? topic.example.algorithm : undefined} />
        </div>

        <div className="flex flex-col gap-6">
          <section>
            <h2 className="mb-2 text-lg font-bold">What it is</h2>
            <p className="text-[17px] leading-relaxed text-ink/85">{topic.what}</p>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-bold">Why it is used</h2>
            <p className="text-[17px] leading-relaxed text-ink/85">{topic.why}</p>
          </section>
          <section>
            <h2 className="mb-3 text-lg font-bold">How it works</h2>
            <ol className="flex flex-col gap-2">
              {topic.how.map((h, i) => (
                <li key={i} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink font-mono text-xs font-bold text-canvas">{i + 1}</span>
                  <span className="pt-0.5 leading-relaxed">{h}</span>
                </li>
              ))}
            </ol>
          </section>
          {topic.formulas && (
            <section className="rounded-xl border border-line bg-surface p-4">
              <p className="mb-2 text-xs font-semibold text-muted">Key formulas</p>
              <ul className="flex flex-col gap-1 font-mono text-[13px]">
                {topic.formulas.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </section>
          )}
          <section className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-ok/20 bg-ok-soft/60 p-4">
              <p className="mb-2 font-semibold text-ok">Advantages</p>
              <ul className="flex flex-col gap-1.5 text-sm">
                {topic.pros.map((p) => (
                  <li key={p} className="flex gap-2">
                    <IconCheck size={16} className="mt-0.5 shrink-0 text-ok" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-bad/20 bg-bad-soft/60 p-4">
              <p className="mb-2 font-semibold text-bad">Disadvantages</p>
              <ul className="flex flex-col gap-1.5 text-sm">
                {topic.cons.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span className="mt-0.5 shrink-0 font-bold text-bad">−</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </section>
          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold">Step-by-step example</h2>
              {topic.example.kind !== 'process' ? (
                <Button variant="soft" size="sm" onClick={openInSimulator}>
                  Open this example in the simulator <IconArrowRight size={15} />
                </Button>
              ) : (
                <Button variant="soft" size="sm" onClick={() => navigate('/process')}>
                  Try it in the simulator <IconArrowRight size={15} />
                </Button>
              )}
            </div>
            <Card>
              <CardContent className="p-4 sm:p-5">
                <WorkedExample topic={topic} />
              </CardContent>
            </Card>
          </section>

          <section aria-labelledby="further-h">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="further-h" className="text-lg font-bold">
                Further reading
              </h2>
              <AppLink href={`/resources?topic=${topic.module}`} className="text-[14px] text-muted hover:text-ink">
                More {module.short.toLowerCase()} resources →
              </AppLink>
            </div>
            <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
              {readingFor(topic.module).map((p, i) => {
                const r = resourceById(p.resourceId)!;
                const href = p.url ?? r.url;
                return (
                  <li key={i}>
                    <a href={href} target="_blank" rel="noopener noreferrer" className="group flex items-start justify-between gap-4 px-4 py-3.5 hover:bg-ink/[0.03]">
                      <span className="min-w-0">
                        <span className="block text-[15.5px] font-medium">{p.label}</span>
                        <span className="block text-[14px] text-muted">
                          {r.title} · {r.free ? 'Free' : 'Paid'}
                          {!p.url && ' · see this chapter in the book'}
                        </span>
                      </span>
                      <IconExternal size={15} className="mt-1 shrink-0 text-faint group-hover:text-ink" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-soft text-amber">
                <IconLightbulb size={18} />
              </span>
              <div>
                <p className="font-semibold">Practise it</p>
                <p className="text-sm text-muted">Generate an exercise and check your answers, or take the {module.short} quiz.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={read ? 'outline' : 'default'}
                onClick={() => progress.markTopicRead(topic.slug)}
                disabled={read}
              >
                {read ? (
                  <>
                    <IconCheck size={16} /> Marked as read
                  </>
                ) : (
                  'Mark as read'
                )}
              </Button>
              <AppLink href={`/practice?module=${topic.module}`} className="inline-flex h-9 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-medium hover:bg-ink/[0.06]">
                <IconTarget size={16} /> Practice
              </AppLink>
            </div>
          </section>

          {next && (
            <AppLink href={`/learn/${next.slug}`} className="group flex items-center justify-between rounded-2xl border border-line bg-surface p-4 hover:border-brand/30">
              <span>
                <span className="block text-xs text-muted">Next topic</span>
                <span className="font-semibold">{next.title}</span>
              </span>
              <IconArrowRight className="text-faint group-hover:text-brand" />
            </AppLink>
          )}
        </div>
      </article>

      <aside className="hidden xl:block">
        <div className="sticky top-8">
          <p className="mb-2 text-[10.5px] font-semibold text-faint">{module.name}</p>
          <ul className="flex flex-col gap-0.5">
            {siblings.map((t) => (
              <li key={t.slug}>
                <AppLink
                  href={`/learn/${t.slug}`}
                  className={cn('flex items-center justify-between rounded-full px-3 py-1.5 text-[14.5px]', t.slug === slug ? 'bg-ink/[0.09] font-medium text-ink' : 'text-muted hover:bg-ink/[0.06] hover:text-ink')}
                >
                  {t.title.replace(/ \(.+\)/, '')}
                  {topicsRead.includes(t.slug) && <IconCheck size={14} />}
                </AppLink>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
