'use client';

import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { AppLink, usePathname } from '@/lib/router';
import { cn } from '@/lib/utils';
import { progress, useProgress } from '@/lib/progress';
import { ThemeSwitcher } from '@/lib/theme';
import {
  IconBook,
  IconChart,
  IconCpu,
  IconDashboard,
  IconDisk,
  IconLayers,
  IconGitBranch,
  IconLibrary,
  IconLogout,
  IconMemory,
  IconMenu,
  IconProcess,
  IconTarget,
  IconUser,
  IconX,
} from '@/components/icons';

interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number }>;
}

const NAV: { heading: string; items: NavItem[] }[] = [
  {
    heading: 'Overview',
    items: [
      { href: '/', label: 'Dashboard', icon: IconDashboard },
      { href: '/learn', label: 'Learn', icon: IconBook },
    ],
  },
  {
    heading: 'Simulators',
    items: [
      { href: '/process', label: 'Process Management', icon: IconProcess },
      { href: '/cpu', label: 'CPU Scheduling', icon: IconCpu },
      { href: '/memory', label: 'Memory Management', icon: IconMemory },
      { href: '/paging', label: 'Page Replacement', icon: IconLayers },
      { href: '/disk', label: 'Disk Scheduling', icon: IconDisk },
    ],
  },
  {
    heading: 'Study',
    items: [
      { href: '/practice', label: 'Practice', icon: IconTarget },
      { href: '/resources', label: 'Resources', icon: IconLibrary },
      { href: '/progress', label: 'My Progress', icon: IconChart },
    ],
  },
  {
    heading: 'Project',
    items: [
      { href: '/about', label: 'About', icon: IconUser },
      { href: '/contribute', label: 'Contribute', icon: IconGitBranch },
    ],
  },
];

function Logo() {
  return (
    <AppLink href="/" className="flex items-center gap-2.5 px-2">
      {/* Mark: three scheduled bursts, the smallest Gantt chart there is. */}
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
        <rect x="1" y="3" width="11" height="4" rx="2" fill="#6a9bcc" />
        <rect x="7" y="9" width="8" height="4" rx="2" fill="#d97757" />
        <rect x="11" y="15" width="10" height="4" rx="2" fill="#c4a35a" />
      </svg>
      <span className="text-[18px] font-semibold tracking-tight">OS Lab</span>
    </AppLink>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/'));
  return (
    <nav aria-label="Main" className="flex flex-col gap-5">
      {NAV.map((group) => (
        <div key={group.heading}>
          <p className="mb-1 px-3 text-[12.5px] font-medium text-faint">{group.heading}</p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <AppLink
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-full px-3 py-2 text-[15px] transition-colors',
                      active ? 'bg-ink/[0.09] font-medium text-ink' : 'text-muted hover:bg-ink/[0.05] hover:text-ink',
                    )}
                  >
                    <Icon size={17} />
                    {item.label}
                  </AppLink>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Account() {
  const { user } = useProgress();
  if (!user)
    return (
      <div className="px-1">
        <p className="text-[13px] text-muted">Guest mode. Sign in to keep your progress on every device.</p>
        <div className="mt-2.5 flex gap-2">
          <AppLink href="/sign-in" className="flex-1 rounded-full bg-ink px-3 py-1.5 text-center text-[13px] font-semibold text-canvas hover:bg-ink/85">
            Sign in
          </AppLink>
          <AppLink href="/sign-up" className="flex-1 rounded-full border border-line px-3 py-1.5 text-center text-[13px] font-semibold hover:bg-ink/[0.06]">
            Sign up
          </AppLink>
        </div>
      </div>
    );
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-canvas p-2.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-ink">
        {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-8 w-8 rounded-full" /> : <IconUser size={16} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold">{user.name}</p>
        <p className="truncate text-[11px] text-muted">{user.email}</p>
      </div>
      <button onClick={() => progress.signOut()} className="rounded-md p-1.5 text-muted hover:bg-ink/[0.06] hover:text-ink cursor-pointer" aria-label="Sign out" title="Sign out">
        <IconLogout size={16} />
      </button>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[264px_1fr]">
      <a
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main')?.focus();
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2">
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col gap-7 border-r border-line bg-canvas p-4 pt-5 lg:flex">
        <Logo />
        <div className="flex-1 overflow-y-auto pr-1">
          <NavLinks />
        </div>
        <ThemeSwitcher className="w-full" />
        <Account />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-canvas/90 px-4 py-3 backdrop-blur lg:hidden">
        <Logo />
        <div className="flex items-center gap-2">
        <ThemeSwitcher compact />
        <button onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-ink/[0.06] cursor-pointer" aria-label="Open navigation">
          <IconMenu />
        </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col gap-6 bg-surface p-4 shadow-xl animate-slide-in">
            <div className="flex items-center justify-between">
              <Logo />
              <button onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-ink/[0.06] cursor-pointer" aria-label="Close navigation">
                <IconX />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
            <ThemeSwitcher className="w-full" />
            <Account />
          </div>
        </div>
      )}

      <main id="main" tabIndex={-1} className="min-w-0 focus:outline-none px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
        <div className="mx-auto max-w-[1200px]">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <p className="mb-2 text-[14px] text-muted">{eyebrow}</p>}
        <h1 className="text-[30px] font-semibold leading-[1.1] tracking-tight [text-wrap:balance] sm:text-[38px]">{title}</h1>
        {description && <p className="mt-3 text-[17px] leading-relaxed text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
