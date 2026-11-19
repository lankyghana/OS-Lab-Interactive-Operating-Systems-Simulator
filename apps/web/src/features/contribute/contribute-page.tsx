'use client';

import { useState, type ReactNode } from 'react';
import { PageHeader } from '@/components/layout/app-shell';
import { AppLink } from '@/lib/router';
import { cn } from '@/lib/utils';
import { DEVELOPER, PROJECT, forkUrl, repoDir, repoReady, repoUrl } from '@/content/about';
import { IconCheck, IconCopy, IconExternal, IconGithub } from '@/components/icons';

// ── Building blocks ──────────────────────────────────────────

function Code({ children, title, lang = 'bash' }: { children: string; title?: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable — the text is still selectable */
    }
  };
  return (
    <figure className="overflow-hidden rounded-xl border border-lab-line bg-lab">
      <div className="flex items-center justify-between border-b border-lab-line px-3.5 py-1.5">
        <figcaption className="truncate font-mono text-[12.5px] text-lab-dim">{title ?? lang}</figcaption>
        <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12.5px] text-lab-dim hover:bg-lab-raised hover:text-lab-text cursor-pointer" aria-label="Copy code">
          {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13.5px] leading-relaxed text-lab-text">
        <code>{children}</code>
      </pre>
    </figure>
  );
}

const C = ({ children }: { children: ReactNode }) => <code className="rounded bg-ink/[0.07] px-1.5 py-0.5 font-mono text-[0.88em]">{children}</code>;

function Section({ id, title, intro, children }: { id: string; title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-20 border-t border-line pt-10">
      <h2 id={`${id}-h`} className="text-[24px] font-semibold tracking-tight">
        {title}
      </h2>
      {intro && <p className="mt-2 max-w-[70ch] text-[16.5px] leading-relaxed text-muted">{intro}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className="grid grid-cols-[36px_1fr] gap-4">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-brand font-semibold text-white">{n}</span>
      <div className="min-w-0 pb-2">
        <h3 className="pt-1 text-[17.5px] font-semibold">{title}</h3>
        <div className="mt-2 flex flex-col gap-3 text-[16px] leading-relaxed text-ink/85">{children}</div>
      </div>
    </li>
  );
}

// ── Content ───────────────────────────────────────────────

const WAYS: { title: string; body: string; who: string }[] = [
  { title: 'Report a bug', body: 'A wrong answer, a broken control or a confusing message. Include the input you used and what you expected.', who: 'Anyone' },
  { title: 'Fix an explanation', body: 'Make a Learn topic clearer, add a worked example, or correct a quiz question.', who: 'Students and lecturers' },
  { title: 'Add an algorithm', body: 'Extend the engine with a new scheduling, allocation, replacement or disk policy, with tests.', who: 'Developers' },
  { title: 'Suggest a resource', body: 'Recommend a free book, course or video that helped you, with a sentence on what it is best for.', who: 'Anyone' },
  { title: 'Improve accessibility', body: 'Keyboard paths, screen-reader labels, contrast in both themes, and small-screen layouts.', who: 'Designers and developers' },
  { title: 'Build a new module', body: 'Deadlocks and file systems are next on the roadmap and need engines, simulators and content.', who: 'Developers' },
];

const IDEAS: { title: string; label: 'good first issue' | 'help wanted' | 'bigger project'; detail: string }[] = [
  { title: 'Add Highest Response Ratio Next (HRRN)', label: 'good first issue', detail: 'The walkthrough below shows every step.' },
  { title: 'Write more quiz questions', label: 'good first issue', detail: 'content/quizzes.ts: one correct answer, three plausible distractors, an explanation.' },
  { title: 'Add a Next Fit memory strategy', label: 'good first issue', detail: 'One branch in packages/engine/src/memory.ts plus a test.' },
  { title: 'Shareable simulator links', label: 'help wanted', detail: 'Encode a simulator’s input in the URL so students can send a scenario to a classmate.' },
  { title: 'Multi-Level Feedback Queue simulator', label: 'help wanted', detail: 'Multiple ready queues with priority boost: a new engine function and a visual lab view.' },
  { title: 'Translations', label: 'help wanted', detail: 'Make UI text and Learn content translatable, starting with French.' },
  { title: 'Deadlock module', label: 'bigger project', detail: 'Resource-allocation graphs, deadlock detection and the Banker’s algorithm.' },
  { title: 'File system module', label: 'bigger project', detail: 'Contiguous, linked and indexed allocation with a visual disk block map.' },
];

const CHECKLIST = [
  'The change does one thing, and the PR description says what and why.',
  'pnpm test and pnpm typecheck pass locally.',
  'New or changed engine behaviour has a test, using a published textbook example where one exists.',
  'UI changes work with the keyboard alone, in light and dark themes, and at 360px wide.',
  'Animations respect prefers-reduced-motion.',
  'No hard-coded colours in components: use the theme tokens (bg-surface, text-muted, …).',
  'Learn content is written in your own words, and sources are linked rather than copied.',
  'Screenshots or a short recording are attached for visible changes.',
];

export function ContributePage() {
  const repo = repoUrl();
  const dir = repoDir();
  const sections = [
    ['ways', 'Ways to help'],
    ['setup', 'Set up'],
    ['map', 'Project map'],
    ['walkthrough', 'Add an algorithm'],
    ['conventions', 'Conventions'],
    ['pr', 'Pull requests'],
    ['ideas', 'Ideas'],
    ['community', 'Community'],
  ] as const;

  return (
    <div className="max-w-[920px]">
      <PageHeader
        title="Contribute"
        description={
          <>
            {PROJECT.name} is open source under the {PROJECT.license} licence. This guide gets you from clone to merged pull request, whether you are fixing a typo
            or adding a whole simulator.
          </>
        }
        actions={
          repoReady() ? (
            <a
              href={PROJECT.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-5 text-[15px] font-semibold text-canvas hover:bg-ink/85"
            >
              <IconGithub size={17} /> Repository
            </a>
          ) : undefined
        }
      />

      <nav aria-label="On this page" className="sticky top-0 z-10 -mx-1 mb-2 overflow-x-auto bg-canvas/90 px-1 py-2 backdrop-blur max-lg:top-[61px]">
        <ul className="flex gap-1.5 whitespace-nowrap">
          {sections.map(([id, label]) => (
            <li key={id}>
              <a
                href={`#${id}`}
                onClick={(e) => {
                  // In-page jump without touching the router's hash.
                  e.preventDefault();
                  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="inline-flex rounded-full border border-line px-3 py-1 text-[14px] text-muted hover:bg-ink/[0.05] hover:text-ink"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex flex-col gap-12">
        <Section id="ways" title="Ways to help" intro="You don’t need to write code to make OS Lab better. Most of the value is in correct answers and clear explanations.">
          <ul className="grid gap-3 sm:grid-cols-2">
            {WAYS.map((w) => (
              <li key={w.title} className="rounded-2xl border border-line bg-surface p-5">
                <p className="text-[17px] font-semibold">{w.title}</p>
                <p className="mt-1.5 text-[15.5px] leading-relaxed text-ink/85">{w.body}</p>
                <p className="mt-3 text-[13.5px] text-muted">Good for: {w.who}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section
          id="setup"
          title="Set up your machine"
          intro={
            <>
              You need Node.js 20 or newer and pnpm 9. Docker is only needed for the database; the frontend runs on its own in guest mode.
            </>
          }
        >
          <div className="flex flex-col gap-4">
            {!repoReady() && (
              <p className="rounded-xl border border-amber/30 bg-amber-soft px-4 py-3 text-[14.5px] text-amber">
                The public repository link hasn’t been published yet. Replace <C>{'<your-account>'}</C> once it is.
              </p>
            )}
            <Code title="1 · Fork on GitHub, then clone your fork">{`git clone ${forkUrl()}.git\ncd ${dir}\ngit remote add upstream ${repo}.git\npnpm install`}</Code>
            <Code title="2a · Frontend only (fastest — no database needed)">{`pnpm --filter @os-lab/engine build\npnpm dev:web          # http://localhost:3000`}</Code>
            <Code title="2b · Full stack (accounts and progress sync)">{`cp apps/api/.env.example apps/api/.env          # set JWT_SECRET
cp apps/web/.env.example apps/web/.env.local
pnpm db:up            # PostgreSQL in Docker
pnpm db:migrate       # create the tables
pnpm dev              # web :3000, API :4000`}</Code>
            <Code title="3 · Check everything still works">{`pnpm test             # engine + API unit tests (Vitest)
pnpm typecheck
pnpm test:e2e         # browser tests (Playwright), desktop + mobile`}</Code>
          </div>
        </Section>

        <Section id="map" title="Project map" intro="A monorepo with one rule that matters most: the simulation engine knows nothing about the UI.">
          <Code title="repository layout" lang="text">{`os-lab/
├── packages/engine/        ← all algorithms (pure TypeScript, no dependencies)
│   ├── src/cpu.ts          CPU scheduling
│   ├── src/memory.ts       First / Best / Worst Fit
│   ├── src/paging.ts       FIFO / LRU / Optimal
│   ├── src/disk.ts         FCFS / SSTF / SCAN / C-SCAN / LOOK / C-LOOK
│   ├── src/process.ts      five-state process model
│   ├── src/practice.ts     exercise generator and grader
│   └── test/               textbook-answer tests
├── apps/web/               ← Next.js frontend
│   ├── src/app/            thin route files
│   ├── src/features/       one folder per page (all UI lives here)
│   ├── src/components/     UI kit, gallery cards, charts, lab panels
│   └── src/content/        Learn topics, quizzes, resources, about
├── apps/api/               ← NestJS API + Prisma schema
└── docs/ARCHITECTURE.md    data model and API reference`}</Code>
          <p className="mt-4 max-w-[70ch] text-[16px] leading-relaxed text-ink/85">
            The visual lab, the calculator and the compare view all render the same engine result. If an answer is wrong, the fix (and its test) belongs in{' '}
            <C>packages/engine</C>, never in a component.
          </p>
        </Section>

        <Section
          id="walkthrough"
          title="Walkthrough: add a scheduling algorithm"
          intro="Highest Response Ratio Next (HRRN) is a good first contribution. When the CPU is free, it picks the ready process with the highest (waiting time + burst) ÷ burst. Short jobs go first, but long jobs gain priority as they wait, so nothing starves."
        >
          <ol className="flex flex-col gap-7">
            <Step n={1} title="Register the algorithm">
              <p>
                In <C>packages/engine/src/cpu.ts</C>, add the id to the type and to the list the UI reads its options from:
              </p>
              <Code title="packages/engine/src/cpu.ts" lang="ts">{`export type CpuAlgorithm = 'FCFS' | 'SJF' | 'SRTF' | 'PRIORITY' | 'PRIORITY_P' | 'RR' | 'HRRN';

export const CPU_ALGORITHMS = [
  // …existing entries
  { id: 'HRRN', name: 'Highest Response Ratio Next', preemptive: false },
];`}</Code>
            </Step>
            <Step n={2} title="Teach the scheduler how to choose">
              <p>
                The scheduler runs the ready process with the <em>smallest</em> key, so return the ratio negated. <C>t</C> is the current time inside{' '}
                <C>scheduleCpu</C>. Add this case to the <C>switch</C> inside <C>key()</C>. HRRN is non-preemptive, so no other change is needed.
              </p>
              <Code title="packages/engine/src/cpu.ts — inside key()" lang="ts">{`case 'HRRN': {
  const waiting = t - p.arrival;
  return -((waiting + p.burst) / p.burst);
}`}</Code>
            </Step>
            <Step n={3} title="Prove it with a worked example">
              <p>
                Add a test whose expected values you calculated by hand or took from a textbook, and say where they came from. Then run <C>pnpm test</C>.
              </p>
              <Code title="packages/engine/test/engine.test.ts" lang="ts">{`it('HRRN lets a long-waiting job overtake a newer short one', () => {
  // Worked by hand. P1 runs 0–6. At t=6 the ratios are
  //   P2 (5+8)/8 = 1.63   P3 (4+3)/3 = 2.33   P4 (1+2)/2 = 1.50  → P3
  // At t=9:  P2 (8+8)/8 = 2.00   P4 (4+2)/2 = 3.00              → P4, then P2
  // (FCFS gives P1,P2,P3,P4 and SJF gives P1,P4,P3,P2.)
  const r = scheduleCpu(
    [
      { id: 'P1', arrival: 0, burst: 6 },
      { id: 'P2', arrival: 1, burst: 8 },
      { id: 'P3', arrival: 2, burst: 3 },
      { id: 'P4', arrival: 5, burst: 2 },
    ],
    'HRRN',
  );
  expect(r.executionOrder).toEqual(['P1', 'P3', 'P4', 'P2']);
});`}</Code>
            </Step>
            <Step n={4} title="Explain it">
              <p>
                Add a Learn topic in <C>apps/web/src/content/topics.ts</C> (what, why, how, pros, cons and an example input), and map it in{' '}
                <C>topicForAlgorithm</C> so the simulator’s “Learn” button finds it. Write in your own words.
              </p>
            </Step>
            <Step n={5} title="Look at it">
              <p>
                That’s all the wiring. The algorithm now appears in the simulator’s dropdown, the visual lab, the calculator, the compare tab and its Learn card
                picture, because each of them reads <C>CPU_ALGORITHMS</C> and the engine result. Run <C>pnpm dev:web</C>, open CPU Scheduling and check it in
                both themes.
              </p>
            </Step>
          </ol>
        </Section>

        <Section id="conventions" title="Conventions">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                h: 'Engine',
                items: [
                  'Pure, deterministic functions: same input, same output.',
                  'No imports from React, Next.js or NestJS.',
                  'Invalid input throws ValidationError with a message a student understands.',
                  'Every result carries a trace (steps or timeline) for the visual lab.',
                ],
              },
              {
                h: 'Interface',
                items: [
                  'Use theme tokens, never raw hex colours, so light and dark both work.',
                  'Every control is reachable and usable by keyboard.',
                  'Respect prefers-reduced-motion.',
                  'Check layouts at 360px wide.',
                ],
              },
              {
                h: 'Content',
                items: [
                  'Plain, accurate language aimed at second-year students.',
                  'State conventions explicitly (tie-breaks, which end SCAN goes to).',
                  'Link to sources; never paste textbook text.',
                  'Quiz distractors must be plausible, with one clearly correct answer.',
                ],
              },
              {
                h: 'Git',
                items: [
                  'Branch from main: feat/hrrn, fix/rr-tie-break, docs/paging-topic.',
                  'Conventional Commits: feat:, fix:, docs:, test:, refactor:.',
                  'Keep pull requests small and focused on one change.',
                  'Rebase on upstream/main before opening the PR.',
                ],
              },
            ].map((g) => (
              <div key={g.h} className="rounded-2xl border border-line bg-surface p-5">
                <p className="text-[17px] font-semibold">{g.h}</p>
                <ul className="mt-2 flex flex-col gap-1.5 text-[15.5px] leading-relaxed text-ink/85">
                  {g.items.map((i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        <Section id="pr" title="Pull request checklist" intro="Copy this into your PR description; the repository’s template includes it too.">
          <ul className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-surface">
            {CHECKLIST.map((c) => (
              <li key={c} className="flex gap-3 px-4 py-3 text-[15.5px]">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border border-line text-faint" aria-hidden>
                  <IconCheck size={13} />
                </span>
                {c}
              </li>
            ))}
          </ul>
          <ol className="mt-6 grid gap-3 sm:grid-cols-4">
            {['Open an issue or comment on one', 'Branch, change, test', 'Open a pull request', 'Review, then merge'].map((s, i) => (
              <li key={s} className="rounded-2xl border border-line p-4">
                <p className="text-[13.5px] text-muted">Step {i + 1}</p>
                <p className="mt-1 font-medium">{s}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="ideas" title="Ideas to pick up" intro="Comment on the matching issue before starting, so two people don’t build the same thing.">
          <ul className="divide-y divide-line border-y border-line">
            {IDEAS.map((i) => (
              <li key={i.title} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:gap-4">
                <span
                  className={cn(
                    'w-fit shrink-0 rounded-full px-2.5 py-0.5 text-[12.5px] font-medium',
                    i.label === 'good first issue' && 'bg-ok-soft text-ok',
                    i.label === 'help wanted' && 'bg-brand-soft text-brand-ink',
                    i.label === 'bigger project' && 'bg-ink/[0.07] text-muted',
                  )}
                >
                  {i.label}
                </span>
                <span className="min-w-0">
                  <span className="font-semibold">{i.title}</span>
                  <span className="text-ink/80"> — {i.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="community" title="Community">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-line bg-surface p-5">
              <p className="text-[17px] font-semibold">Code of conduct</p>
              <p className="mt-1.5 text-[15.5px] leading-relaxed text-ink/85">
                Be kind, assume good intent, and help beginners. Harassment of any kind isn’t tolerated. See <C>CODE_OF_CONDUCT.md</C>.
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-5">
              <p className="text-[17px] font-semibold">Questions</p>
              <p className="mt-1.5 text-[15.5px] leading-relaxed text-ink/85">
                {PROJECT.discussionUrl ? (
                  <a href={PROJECT.discussionUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium underline decoration-ink/30 underline-offset-4">
                    Ask in the discussions <IconExternal size={13} />
                  </a>
                ) : repoReady() ? (
                  <>
                    <a href={`${PROJECT.repoUrl}/issues`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium underline decoration-ink/30 underline-offset-4">
                      Open an issue <IconExternal size={13} />
                    </a>{' '}
                    with the “question” label.
                  </>
                ) : (
                  'Open an issue with the “question” label.'
                )}{' '}
                No question is too basic.
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-5">
              <p className="text-[17px] font-semibold">Security</p>
              <p className="mt-1.5 text-[15.5px] leading-relaxed text-ink/85">
                Please don’t open public issues for vulnerabilities.{' '}
                {PROJECT.securityEmail || DEVELOPER.links.email ? (
                  <>
                    Email <span className="font-medium">{PROJECT.securityEmail || DEVELOPER.links.email}</span>.
                  </>
                ) : (
                  'Follow the private reporting steps in SECURITY.md.'
                )}
              </p>
            </div>
          </div>
          <p className="mt-8 text-[15.5px] text-muted">
            Maintained by{' '}
            <AppLink href="/about" className="font-medium text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
              {DEVELOPER.name}
            </AppLink>
            . Thank you for helping students understand operating systems.
          </p>
        </Section>
      </div>
    </div>
  );
}
