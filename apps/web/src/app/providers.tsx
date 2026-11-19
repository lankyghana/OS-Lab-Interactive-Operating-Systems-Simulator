'use client';

import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, type ReactNode } from 'react';
import { initTheme } from '@/lib/theme';
import { RouterProvider, type LinkProps, type RouterAdapter } from '@/lib/router';
import { AppShell } from '@/components/layout/app-shell';

function Link({ href, children, ...rest }: LinkProps) {
  return (
    <NextLink href={href} {...rest}>
      {children}
    </NextLink>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => initTheme(), []);
  const adapter = useMemo<RouterAdapter>(() => ({ pathname, navigate: (href) => router.push(href), Link }), [pathname, router]);
  return (
    <RouterProvider value={adapter}>
      <AppShell>{children}</AppShell>
    </RouterProvider>
  );
}
