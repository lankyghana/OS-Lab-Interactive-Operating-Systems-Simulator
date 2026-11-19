'use client';

import type { ReactNode } from 'react';
import { PageHeader } from '@/components/layout/app-shell';
import { AppLink } from '@/lib/router';
import { DEVELOPER, PROJECT, repoReady } from '@/content/about';
import { MODULES } from '@/content/modules';
import { TOPICS } from '@/content/topics';
import { QUIZZES } from '@/content/quizzes';
import { RESOURCES } from '@/content/resources';
import { CPU_ALGORITHMS, DISK_ALGORITHMS, FIT_ALGORITHMS, PAGE_ALGORITHMS } from '@os-lab/engine';
import { IconArrowRight, IconGithub, IconGlobe, IconLinkedin, IconMail } from '@/components/icons';
import { ModulePlate } from '@/components/gallery/plates';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .filter((_, i, a) => i === 0 || i === a.length - 1)
    .map((p) => p[0]!.toUpperCase())
    .join('');

function LinkPill({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) {
  const external = !href.startsWith('mailto:');
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="inline-flex h-9 items-center gap-2 rounded-full border border-line px-3.5 text-[14px] font-medium hover:bg-ink/[0.05]"
    >
      {icon}
      {children}
    </a>
  );
}

const STACK: { layer: string; tech: string; why: string }[] = [
  { layer: 'Simulation engine', tech: 'TypeScript, no dependencies', why: 'Pure functions shared by the browser and the server, tested against textbook answers.' },
  { layer: 'Frontend', tech: 'Next.js, React, Tailwind CSS', why: 'Fast page loads, typed components, and a token-based light and dark theme.' },
  { layer: 'Backend', tech: 'NestJS', why: 'Accounts, progress sync and server-side grading of exercises.' },
  { layer: 'Database', tech: 'PostgreSQL with Prisma', why: 'A typed schema for students, history, attempts and bookmarks.' },
  { layer: 'Testing', tech: 'Vitest and Playwright', why: 'Unit tests for every algorithm and browser tests on desktop and mobile.' },
];

export function AboutPage() {
  const d = DEVELOPER;
  const algorithmCount = CPU_ALGORITHMS.length + FIT_ALGORITHMS.length + PAGE_ALGORITHMS.length + DISK_ALGORITHMS.length;
  const facts = [
    { n: MODULES.length, label: 'interactive simulators' },
    { n: algorithmCount, label: 'algorithms and variants' },
    { n: TOPICS.length, label: 'Learn topics' },
    { n: Object.values(QUIZZES).flat().length, label: 'quiz questions' },
    { n: RESOURCES.length, label: 'curated resources' },
  ];
  const links = [
    d.links.linkedin && { href: d.links.linkedin, icon: <IconLinkedin size={16} />, label: 'LinkedIn' },
    d.links.github && { href: d.links.github, icon: <IconGithub size={16} />, label: 'GitHub' },
    d.links.website && { href: d.links.website, icon: <IconGlobe size={16} />, label: 'Website' },
    d.links.email && { href: `mailto:${d.links.email}`, icon: <IconMail size={16} />, label: d.links.email },
  ].filter(Boolean) as { href: string; icon: ReactNode; label: string }[];

  return (
    <>
      <PageHeader title="About" description={`The person behind ${PROJECT.name}, why it exists, and how it’s built.`} />

      {/* ── The developer ───────────────────────────── */}
      <section aria-labelledby="dev-h" className="mb-14 grid gap-8 rounded-3xl border border-line bg-surface p-6 sm:p-8 md:grid-cols-[180px_1fr]">
        <div className="flex justify-center md:block">
          {d.avatarUrl ? (
            <img src={d.avatarUrl} alt={`Portrait of ${d.name}`} className="h-40 w-40 rounded-full object-cover md:h-44 md:w-44" />
          ) : (
            <div className="grid h-40 w-40 place-items-center rounded-full bg-brand text-[52px] font-semibold tracking-tight text-white md:h-44 md:w-44" aria-hidden>
              {initials(d.name)}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[14px] text-muted">Developer</p>
          <h2 id="dev-h" className="mt-1 text-[30px] font-semibold leading-tight tracking-tight">
            {d.name}
          </h2>
          {(d.headline || d.location) && (
            <p className="mt-1 text-[17px] text-muted">{[d.headline, d.location].filter(Boolean).join(' · ')}</p>
          )}
          {d.bio.length > 0 ? (
            <div className="mt-4 flex max-w-[68ch] flex-col gap-3 text-[16.5px] leading-relaxed text-ink/85">
              {d.bio.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          ) : (
            <p className="mt-4 max-w-[68ch] text-[16.5px] leading-relaxed text-ink/85">
              {d.name.split(' ')[0]} designed and built {PROJECT.name}: the product direction, the interface and visual design, the simulation engine, the
              learning content and the platform itself.
            </p>
          )}
          {d.focus.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Focus areas">
              {d.focus.map((f) => (
                <li key={f} className="rounded-full bg-ink/[0.06] px-3 py-1 text-[13.5px]">
                  {f}
                </li>
              ))}
            </ul>
          )}
          {links.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {links.map((l) => (
                <LinkPill key={l.href} href={l.href} icon={l.icon}>
                  {l.label}
                </LinkPill>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── The project ─────────────────────────────── */}
      <section aria-labelledby="why-h" className="mb-14 grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div>
          <h2 id="why-h" className="text-[24px] font-semibold tracking-tight">
            Why {PROJECT.name} exists
          </h2>
          <div className="mt-4 flex flex-col gap-3 text-[16.5px] leading-relaxed text-ink/85">
            <p>
              Operating systems are usually taught with slides and hand-drawn Gantt charts. Students learn to reproduce the answer to an exam question without
              ever watching a scheduler make its decisions, or seeing why one page-replacement policy beats another.
            </p>
            <p>
              {PROJECT.name} closes that gap between theory and practice. Every algorithm runs in two ways: as a visual simulation you can pause, step and
              rewind, and as a calculator that shows every number. Both use the same engine, so they always agree, and every engine result is tested against
              published textbook answers.
            </p>
            <p>It is free to use, needs no account, and is built first for university Computer Science and IT students.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 aspect-[16/7] overflow-hidden rounded-2xl" aria-hidden>
            <ModulePlate module="cpu" algorithm="RR" />
          </div>
          {facts.slice(0, 4).map((f) => (
            <div key={f.label} className="rounded-2xl border border-line bg-surface p-4">
              <p className="text-[30px] font-semibold leading-none tracking-tight tabular">{f.n}</p>
              <p className="mt-1.5 text-[14px] text-muted">{f.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="stack-h" className="mb-14">
        <h2 id="stack-h" className="mb-4 text-[24px] font-semibold tracking-tight">
          How it’s built
        </h2>
        <ul className="divide-y divide-line border-y border-line">
          {STACK.map((s) => (
            <li key={s.layer} className="grid gap-1 py-4 sm:grid-cols-[180px_240px_1fr] sm:gap-6">
              <span className="text-[14px] text-muted">{s.layer}</span>
              <span className="font-semibold">{s.tech}</span>
              <span className="text-[15.5px] text-ink/85">{s.why}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="next-h" className="mb-14">
        <h2 id="next-h" className="mb-4 text-[24px] font-semibold tracking-tight">
          What’s next
        </h2>
        <ol className="grid gap-3 md:grid-cols-3">
          {[
            { when: 'Next release', what: 'Deadlock management (resource-allocation graphs, Banker’s algorithm) and file-system simulators.' },
            { when: 'After that', what: 'Lecturer accounts: classes, assigned exercises and a view of how a class is doing.' },
            { when: 'Later', what: 'Institutional features, so whole departments can adopt OS Lab, and audiences beyond universities.' },
          ].map((r) => (
            <li key={r.when} className="rounded-2xl border border-line bg-surface p-5">
              <p className="text-[14px] font-medium text-brand">{r.when}</p>
              <p className="mt-2 text-[15.5px] leading-relaxed">{r.what}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-4 rounded-3xl bg-ink p-7 text-canvas sm:flex-row sm:items-center sm:justify-between sm:p-9">
        <div className="max-w-xl">
          <h2 className="text-[24px] font-semibold tracking-tight">{PROJECT.name} is open source</h2>
          <p className="mt-2 text-[16px] leading-relaxed opacity-80">
            Released under the {PROJECT.license} licence. Students, lecturers and developers are welcome to fix bugs, add algorithms, improve explanations and
            suggest resources.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <AppLink href="/contribute" className="inline-flex h-10 items-center gap-2 rounded-full bg-brand px-5 text-[15px] font-semibold text-white hover:bg-brand-ink">
            How to contribute <IconArrowRight size={16} />
          </AppLink>
          {repoReady() && (
            <a
              href={PROJECT.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-canvas/30 px-5 text-[15px] font-semibold hover:bg-canvas/10"
            >
              <IconGithub size={16} /> View the code
            </a>
          )}
        </div>
      </section>
    </>
  );
}
