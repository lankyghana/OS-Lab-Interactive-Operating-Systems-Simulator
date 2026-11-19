'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { PageHeader } from '@/components/layout/app-shell';
import { Input, Select } from '@/components/ui/input';
import { Tabs } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { progress, useProgress } from '@/lib/progress';
import { cn } from '@/lib/utils';
import {
  KIND_LABEL,
  RESOURCES,
  START_HERE,
  TOPIC_LABEL,
  resourceById,
  type Resource,
  type ResourceKind,
  type ResourceLevel,
  type ResourceTopic,
} from '@/content/resources';
import { IconBookmark, IconCheck, IconExternal, IconSearch } from '@/components/icons';

const LEVEL_LABEL: Record<ResourceLevel, string> = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
type KindFilter = 'all' | ResourceKind;

/** Opens in a new tab; external links never navigate away from the user's lab. */
function ExternalLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

function Meta({ r }: { r: Resource }) {
  return (
    <p className="text-[14px] text-muted">
      {KIND_LABEL[r.kind]} · {LEVEL_LABEL[r.level]} ·{' '}
      <span className={r.free ? 'font-medium text-ok' : ''}>{r.free ? 'Free' : 'Paid'}</span> · {r.by}
    </p>
  );
}

function MarkButtons({ r, size = 'sm' }: { r: Resource; size?: 'sm' | 'md' }) {
  const { savedResources, completedResources } = useProgress();
  const saved = savedResources.includes(r.id);
  const done = completedResources.includes(r.id);
  return (
    <div className="flex shrink-0 gap-1.5">
      <Button
        variant={saved ? 'soft' : 'outline'}
        size={size}
        aria-pressed={saved}
        onClick={() => progress.toggleResource(r.id, 'saved')}
        title={saved ? 'Remove from saved' : 'Save for later'}
      >
        <IconBookmark size={15} className={saved ? 'fill-current text-brand' : ''} />
        {saved ? 'Saved' : 'Save'}
      </Button>
      <Button
        variant={done ? 'soft' : 'outline'}
        size={size}
        aria-pressed={done}
        onClick={() => progress.toggleResource(r.id, 'completed')}
        title={done ? 'Mark as not done' : 'Mark as done'}
      >
        <IconCheck size={15} className={done ? 'text-ok' : ''} />
        {done ? 'Done' : 'Mark done'}
      </Button>
    </div>
  );
}

function FeaturedCard({ r, reason }: { r: Resource; reason: string }) {
  return (
    <article className="flex flex-col rounded-2xl border border-line bg-surface p-5">
      <p className="text-[13.5px] font-medium text-brand">{reason}</p>
      <h3 className="mt-2 text-[19px] font-semibold leading-snug tracking-tight">
        <ExternalLink href={r.url} className="hover:underline hover:decoration-ink/30 hover:underline-offset-4">
          {r.title}
        </ExternalLink>
      </h3>
      <div className="mt-1">
        <Meta r={r} />
      </div>
      <p className="mt-3 flex-1 text-[15.5px] leading-relaxed text-ink/85">{r.summary}</p>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <ExternalLink
          href={r.url}
          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-brand px-3.5 text-[13px] font-medium text-white hover:bg-brand-ink"
        >
          Open <IconExternal size={14} />
        </ExternalLink>
        <MarkButtons r={r} />
      </div>
    </article>
  );
}

function ResourceRow({ r }: { r: Resource }) {
  return (
    <li className="grid gap-3 py-5 md:grid-cols-[1fr_auto] md:gap-8">
      <div className="min-w-0">
        <h3 className="text-[17.5px] font-semibold leading-snug">
          <ExternalLink href={r.url} className="group inline-flex items-baseline gap-1.5 hover:underline hover:decoration-ink/30 hover:underline-offset-4">
            {r.title}
            <IconExternal size={14} className="shrink-0 translate-y-0.5 text-faint group-hover:text-ink" />
          </ExternalLink>
        </h3>
        <Meta r={r} />
        <p className="mt-2 max-w-[70ch] text-[15.5px] leading-relaxed text-ink/85">{r.summary}</p>
        <p className="mt-1.5 max-w-[70ch] text-[14.5px] leading-relaxed text-muted">
          <span className="font-medium text-ink">Use it for:</span> {r.useFor}
          {r.note && <span className="text-faint"> {r.note}</span>}
        </p>
        <ul className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Topics">
          {r.topics.map((t) => (
            <li key={t} className="rounded-full bg-ink/[0.05] px-2.5 py-0.5 text-[12.5px] text-muted">
              {TOPIC_LABEL[t]}
            </li>
          ))}
        </ul>
      </div>
      <MarkButtons r={r} />
    </li>
  );
}

export function ResourcesPage({ initialTopic }: { initialTopic?: string }) {
  const { savedResources, completedResources } = useProgress();
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<KindFilter>('all');
  const [topic, setTopic] = useState<'all' | ResourceTopic>(initialTopic && initialTopic in TOPIC_LABEL ? (initialTopic as ResourceTopic) : 'all');
  const [level, setLevel] = useState<'all' | ResourceLevel>('all');
  const [freeOnly, setFreeOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return RESOURCES.filter(
      (r) =>
        (kind === 'all' || r.kind === kind) &&
        (topic === 'all' || r.topics.includes(topic)) &&
        (level === 'all' || r.level === level) &&
        (!freeOnly || r.free) &&
        (!savedOnly || savedResources.includes(r.id)) &&
        (!q || `${r.title} ${r.by} ${r.summary} ${r.useFor} ${r.topics.map((t) => TOPIC_LABEL[t]).join(' ')}`.toLowerCase().includes(q)),
    );
  }, [query, kind, topic, level, freeOnly, savedOnly, savedResources]);

  const filtered = query || kind !== 'all' || topic !== 'all' || level !== 'all' || freeOnly || savedOnly;
  const reset = () => {
    setQuery('');
    setKind('all');
    setTopic('all');
    setLevel('all');
    setFreeOnly(false);
    setSavedOnly(false);
  };

  const reasons: Record<string, string> = {
    ostep: 'Free textbook',
    'fcc-os': 'Free video course',
    'ostep-homework': 'Extra practice',
  };

  return (
    <>
      <PageHeader
        title="Resources"
        description={
          <>
            Hand-picked books, courses, videos and references for going beyond the simulators. Save what you want to read, and tick it off when you’re done.{' '}
            <span className="text-faint">
              {completedResources.length} of {RESOURCES.length} done · {savedResources.length} saved.
            </span>
          </>
        }
      />

      {!filtered && (
        <section aria-labelledby="start-h" className="mb-12">
          <h2 id="start-h" className="mb-4 text-[20px] font-semibold tracking-tight">
            Start here
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {START_HERE.map((id) => (
              <FeaturedCard key={id} r={resourceById(id)!} reason={reasons[id]} />
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="lib-h">
        <h2 id="lib-h" className="mb-4 text-[20px] font-semibold tracking-tight">
          Library
        </h2>

        <div className="mb-2 flex flex-col gap-3 rounded-2xl border border-line bg-surface p-3 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <IconSearch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search titles, authors and topics"
                aria-label="Search resources"
                className="h-10 rounded-full pl-9 text-[15px]"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select aria-label="Topic" value={topic} onChange={(e) => setTopic(e.target.value as typeof topic)} className="h-10 w-auto rounded-full">
                <option value="all">All topics</option>
                {(Object.keys(TOPIC_LABEL) as ResourceTopic[]).map((t) => (
                  <option key={t} value={t}>
                    {TOPIC_LABEL[t]}
                  </option>
                ))}
              </Select>
              <Select aria-label="Level" value={level} onChange={(e) => setLevel(e.target.value as typeof level)} className="h-10 w-auto rounded-full">
                <option value="all">Any level</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="max-w-full">
              <Tabs<KindFilter>
                value={kind}
                onChange={setKind}
                items={[
                  { value: 'all', label: 'All' },
                  { value: 'book', label: 'Books' },
                  { value: 'course', label: 'Courses' },
                  { value: 'video', label: 'Videos' },
                  { value: 'reference', label: 'References' },
                  { value: 'tool', label: 'Hands-on' },
                ]}
              />
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 text-[14.5px]">
              <input type="checkbox" checked={freeOnly} onChange={(e) => setFreeOnly(e.target.checked)} className="h-4 w-4 accent-brand" />
              Free only
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2 text-[14.5px]">
              <input type="checkbox" checked={savedOnly} onChange={(e) => setSavedOnly(e.target.checked)} className="h-4 w-4 accent-brand" />
              Saved
            </label>
          </div>
        </div>

        <div className="flex items-baseline justify-between px-1 py-2 text-[14px] text-muted" aria-live="polite">
          <span>
            {results.length} {results.length === 1 ? 'resource' : 'resources'}
          </span>
          {filtered && (
            <button onClick={reset} className="font-medium text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink cursor-pointer">
              Clear filters
            </button>
          )}
        </div>

        {results.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line px-6 py-12 text-center">
            <p className="font-medium">{savedOnly && savedResources.length === 0 ? 'You haven’t saved anything yet.' : 'Nothing matches those filters.'}</p>
            <p className="mt-1 text-[14.5px] text-muted">
              {savedOnly && savedResources.length === 0 ? 'Use Save on any resource to keep it here.' : 'Try a broader topic or level.'}
            </p>
          </div>
        ) : (
          <ul className={cn('divide-y divide-line border-y border-line')}>
            {results.map((r) => (
              <ResourceRow key={r.id} r={r} />
            ))}
          </ul>
        )}

        <p className="mt-6 text-[13.5px] text-faint">
          Links open the official source in a new tab. Editions, prices and course pages change over time; summaries were last checked in November 2026.
        </p>
      </section>
    </>
  );
}
