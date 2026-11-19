import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Process colours, chosen to stay distinguishable on both the dark lab bench and
 * the light dashboard. Assigned by position so P1 is always the same colour.
 */
export const PROCESS_COLORS = [
  '#d97757', // Claude orange
  '#6a9bcc', // blue
  '#9cae78', // olive
  '#d4ae5c', // ochre
  '#b08cc4', // heather
  '#5fb0ad', // teal
  '#d98aa3', // rose
  '#a8a072', // khaki
  '#e0a27f', // apricot
  '#86a9d8', // sky
  '#c9b98e', // sand
  '#8fbf9b', // sage
];

export function colorFor(id: string | null, ids: string[]): string {
  if (!id) return 'transparent';
  const i = ids.indexOf(id);
  return PROCESS_COLORS[(i === -1 ? hash(id) : i) % PROCESS_COLORS.length];
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export const fmt = (n: number, digits = 2) =>
  Number.isInteger(n) ? String(n) : n.toFixed(digits).replace(/\.?0+$/, '');

export function timeAgo(iso: string): string {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? '' : 's'} ago`;
}

export function parseNumberList(text: string): number[] {
  return text
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(Number);
}
