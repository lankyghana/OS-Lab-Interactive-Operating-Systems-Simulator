'use client';

import { createContext, useContext, type ComponentType, type ReactNode } from 'react';

/**
 * A small routing adapter so that feature components don't depend on Next.js directly.
 * The Next.js app provides an adapter backed by next/link + next/navigation; the
 * standalone demo build provides a hash-router adapter. Feature code only uses
 * `AppLink`, `usePathname` and `useNavigate`.
 */
export interface LinkProps {
  href: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  'aria-current'?: 'page' | undefined;
}

export interface RouterAdapter {
  pathname: string;
  navigate: (href: string) => void;
  Link: ComponentType<LinkProps>;
}

const FallbackLink = ({ href, children, ...rest }: LinkProps) => (
  <a href={href} {...rest}>
    {children}
  </a>
);

const RouterContext = createContext<RouterAdapter>({
  pathname: '/',
  navigate: (href) => {
    window.location.href = href;
  },
  Link: FallbackLink,
});

export const RouterProvider = RouterContext.Provider;
export const usePathname = () => useContext(RouterContext).pathname;
export const useNavigate = () => useContext(RouterContext).navigate;

export function AppLink(props: LinkProps) {
  const { Link } = useContext(RouterContext);
  return <Link {...props} />;
}
