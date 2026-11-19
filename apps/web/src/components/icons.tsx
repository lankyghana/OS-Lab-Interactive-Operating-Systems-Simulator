import type { ReactNode, SVGProps } from 'react';

/** Small stroke icon set (24×24, lucide-style) so the app ships without an icon dependency. */
type P = SVGProps<SVGSVGElement> & { size?: number };

const base = (size = 18, p: P) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...p,
});

const make = (paths: string[], extra?: (p: P) => ReactNode) =>
  function Icon({ size, ...p }: P) {
    return (
      <svg {...base(size, p)}>
        {paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
        {extra?.(p)}
      </svg>
    );
  };

export const IconDashboard = make(['M3 3h7v9H3z', 'M14 3h7v5h-7z', 'M14 12h7v9h-7z', 'M3 16h7v5H3z']);
export const IconBook = make(['M4 19.5V5a2 2 0 0 1 2-2h14v16H6.5a2.5 2.5 0 0 0 0 5H20', 'M8 7h8', 'M8 11h6']);
export const IconProcess = make(['M3 12h4l3-8 4 16 3-8h4']);
export const IconCpu = make(['M9 2v3', 'M15 2v3', 'M9 19v3', 'M15 19v3', 'M2 9h3', 'M2 15h3', 'M19 9h3', 'M19 15h3', 'M5 5h14v14H5z', 'M9 9h6v6H9z']);
export const IconMemory = make(['M3 7h18v10H3z', 'M7 7v10', 'M11 7v10', 'M15 7v10', 'M5 17v3', 'M19 17v3', 'M9 17v3', 'M14 17v3']);
export const IconLayers = make(['M12 3 2 8l10 5 10-5z', 'M2 13l10 5 10-5', 'M2 18l10 5 10-5']);
export const IconDisk = make(['M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0', 'M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0', 'M12 3v4']);
export const IconTarget = make(['M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0', 'M12 12m-5 0a5 5 0 1 0 10 0a5 5 0 1 0-10 0', 'M12 12h.01']);
export const IconChart = make(['M3 3v18h18', 'M7 15l4-4 3 3 5-6']);
export const IconPlay = make(['M7 4v16l13-8z']);
export const IconPause = make(['M7 4h3v16H7z', 'M14 4h3v16h-3z']);
export const IconStep = make(['M5 4v16l10-8z', 'M19 4v16']);
export const IconBack = make(['M19 20V4L9 12z', 'M5 4v16']);
export const IconReset = make(['M3 12a9 9 0 1 0 3-6.7', 'M3 4v5h5']);
export const IconStar = make(['M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z']);
export const IconUser = make(['M12 8m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0', 'M4 21a8 8 0 0 1 16 0']);
export const IconLogout = make(['M15 4h4v16h-4', 'M10 8l-4 4 4 4', 'M6 12h10']);
export const IconMenu = make(['M4 6h16', 'M4 12h16', 'M4 18h16']);
export const IconX = make(['M6 6l12 12', 'M18 6 6 18']);
export const IconCheck = make(['M5 12l5 5L20 7']);
export const IconArrowRight = make(['M5 12h14', 'M13 6l6 6-6 6']);
export const IconCompare = make(['M8 3v18', 'M16 3v18', 'M3 8h5', 'M3 14h5', 'M16 10h5', 'M16 16h5']);
export const IconTerminal = make(['M4 17l6-5-6-5', 'M12 19h8']);
export const IconEye = make(['M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z', 'M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0']);
export const IconPlus = make(['M12 5v14', 'M5 12h14']);
export const IconSparkle = make(['M12 3v4', 'M12 17v4', 'M3 12h4', 'M17 12h4', 'M6 6l2.5 2.5', 'M15.5 15.5 18 18', 'M18 6l-2.5 2.5', 'M8.5 15.5 6 18']);
export const IconLightbulb = make(['M9 18h6', 'M10 22h4', 'M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z']);

export function IconGoogle({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
export const IconSun = make(['M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0', 'M12 2v2', 'M12 20v2', 'M4.9 4.9l1.4 1.4', 'M17.7 17.7l1.4 1.4', 'M2 12h2', 'M20 12h2', 'M4.9 19.1l1.4-1.4', 'M17.7 6.3l1.4-1.4']);
export const IconMoon = make(['M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z']);
export const IconMonitor = make(['M3 4h18v12H3z', 'M8 20h8', 'M12 16v4']);
export const IconBookmark = make(['M6 3h12v18l-6-4-6 4z']);
export const IconExternal = make(['M14 4h6v6', 'M20 4l-9 9', 'M18 14v6H4V6h6']);
export const IconLibrary = make(['M4 4h3v16H4z', 'M9 4h3v16H9z', 'M14.5 4.8l2.9-.8 3.9 15.2-2.9.8z']);
export const IconSearch = make(['M11 11m-7 0a7 7 0 1 0 14 0a7 7 0 1 0-14 0', 'M21 21l-4.5-4.5']);
export const IconMail = make(['M3 5h18v14H3z', 'M3 6l9 7 9-7']);
export const IconGlobe = make(['M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0', 'M3 12h18', 'M12 3a14 14 0 0 1 0 18', 'M12 3a14 14 0 0 0 0 18']);
export const IconGitBranch = make(['M6 3v12', 'M18 9m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0', 'M6 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0', 'M18 12a9 9 0 0 1-9 6']);
export const IconCopy = make(['M9 9h11v11H9z', 'M5 15H4V4h11v1']);
export const IconHeart = make(['M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z']);

/** Brand marks (filled). */
export function IconGithub({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.3-1.69-1.3-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.56-.29-5.25-1.28-5.25-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.7 5.38-5.27 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z" />
    </svg>
  );
}
export function IconLinkedin({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05C20.6 8.65 21 11.2 21 14.5V21h-4v-5.8c0-1.38-.03-3.16-1.93-3.16-1.93 0-2.22 1.5-2.22 3.06V21H9z" />
    </svg>
  );
}
