/**
 * Standalone demo entry: renders the same OS Lab feature components as the Next.js
 * app, behind a hash-router adapter, so the whole frontend can be shipped as a
 * single static HTML file (see tools/build-demo.mjs). Guest mode only.
 */
import { StrictMode, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, type LinkProps, type RouterAdapter } from '@/lib/router';
import { AppShell } from '@/components/layout/app-shell';
import { DashboardPage } from '@/features/dashboard/dashboard-page';
import { LearnIndex, TopicPage } from '@/features/learn/learn-pages';
import { ProcessSimulator } from '@/features/process/process-simulator';
import { CpuSimulator } from '@/features/cpu/cpu-simulator';
import { MemorySimulator } from '@/features/memory/memory-simulator';
import { PagingSimulator } from '@/features/paging/paging-simulator';
import { DiskSimulator } from '@/features/disk/disk-simulator';
import { PracticePage } from '@/features/practice/practice-page';
import { ProgressPage } from '@/features/progress/progress-page';
import { AuthPage } from '@/features/auth/auth-pages';
import { ResourcesPage } from '@/features/resources/resources-page';
import { AboutPage } from '@/features/about/about-page';
import { ContributePage } from '@/features/contribute/contribute-page';
import { initTheme } from '@/lib/theme';

/**
 * Hash routes use plain names (#cpu, #learn--cpu-fcfs, #practice--disk) because the
 * artifact host only passes [A-Za-z0-9-] hashes through to the page.
 */
export function toHash(href: string): string {
  const [path, q = ''] = href.split('?');
  const segs = path.split('/').filter(Boolean);
  const params = new URLSearchParams(q);
  const extra = segs[0] === 'practice' ? params.get('module') : segs[0] === 'resources' ? params.get('topic') : null;
  if (extra) segs.push(extra);
  return segs.join('--') || 'dashboard';
}

const readHash = () => {
  const segs = window.location.hash.replace(/^#/, '').split('--').filter(Boolean);
  const query = new URLSearchParams();
  if (segs.length === 0 || segs[0] === 'dashboard') return { path: '/', query };
  if (segs[0] === 'learn' && segs[1]) return { path: `/learn/${segs[1]}`, query };
  if (segs[0] === 'practice' && segs[1]) query.set('module', segs[1]);
  if (segs[0] === 'resources' && segs[1]) query.set('topic', segs[1]);
  return { path: `/${segs[0]}`, query };
};

function Link({ href, children, onClick, ...rest }: LinkProps) {
  return (
    <a href={`#${toHash(href)}`} onClick={onClick} {...rest}>
      {children}
    </a>
  );
}

function route(path: string, query: URLSearchParams): ReactNode {
  if (path === '/') return <DashboardPage />;
  if (path === '/learn') return <LearnIndex />;
  if (path.startsWith('/learn/')) return <TopicPage slug={path.slice(7)} />;
  if (path === '/process') return <ProcessSimulator />;
  if (path === '/cpu') return <CpuSimulator />;
  if (path === '/memory') return <MemorySimulator />;
  if (path === '/paging') return <PagingSimulator />;
  if (path === '/disk') return <DiskSimulator />;
  if (path === '/practice') return <PracticePage initialModule={query.get('module') ?? undefined} />;
  if (path === '/progress') return <ProgressPage />;
  if (path === '/about') return <AboutPage />;
  if (path === '/contribute') return <ContributePage />;
  if (path === '/resources') return <ResourcesPage initialTopic={query.get('topic') ?? undefined} />;
  if (path === '/sign-in') return <AuthPage mode="sign-in" />;
  if (path === '/sign-up') return <AuthPage mode="sign-up" />;
  return (
    <div className="py-16 text-center">
      <p className="font-mono text-sm text-brand">404 · page fault</p>
      <h1 className="mt-2 text-3xl font-bold">This page isn’t in memory.</h1>
      <a href="#dashboard" className="mt-6 inline-block rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white">
        Back to the dashboard
      </a>
    </div>
  );
}

function App() {
  const [loc, setLoc] = useState(readHash);
  useEffect(() => {
    const on = () => {
      setLoc(readHash());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const adapter = useMemo<RouterAdapter>(
    () => ({
      pathname: loc.path,
      navigate: (href) => {
        window.location.hash = toHash(href);
      },
      Link,
    }),
    [loc.path],
  );
  return (
    <RouterProvider value={adapter}>
      <AppShell>
        {/* key: remount pages on navigation, like Next.js does */}
        <div key={loc.path + loc.query.toString()}>{route(loc.path, loc.query)}</div>
      </AppShell>
    </RouterProvider>
  );
}

initTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
