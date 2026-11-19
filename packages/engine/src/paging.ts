/**
 * Page replacement engine: FIFO, LRU and Optimal (Belady's MIN).
 * Pages occupy fixed frame slots so the visual simulator can show replacement in place.
 */

import { ValidationError } from './cpu';

export type PageAlgorithm = 'FIFO' | 'LRU' | 'OPTIMAL';

export const PAGE_ALGORITHMS: { id: PageAlgorithm; name: string }[] = [
  { id: 'FIFO', name: 'First In, First Out' },
  { id: 'LRU', name: 'Least Recently Used' },
  { id: 'OPTIMAL', name: 'Optimal' },
];

export interface PageStep {
  index: number;
  page: number;
  frames: (number | null)[];
  hit: boolean;
  /** Frame slot that was filled or replaced (null on a hit). */
  slot: number | null;
  evicted: number | null;
  explanation: string;
}

export interface PageResult {
  algorithm: PageAlgorithm;
  frameCount: number;
  reference: number[];
  steps: PageStep[];
  faults: number;
  hits: number;
  hitRatio: number;
  faultRatio: number;
}

export function parseReferenceString(text: string): number[] {
  const parts = text.split(/[\s,]+/).filter(Boolean);
  const out = parts.map((p) => Number(p));
  if (out.some((n) => !Number.isInteger(n) || n < 0))
    throw new ValidationError('Reference string must contain whole numbers ≥ 0, separated by spaces or commas.');
  return out;
}

export function replacePages(reference: number[], frameCount: number, algorithm: PageAlgorithm): PageResult {
  if (reference.length === 0) throw new ValidationError('Enter a reference string.');
  if (reference.length > 200) throw new ValidationError('A maximum of 200 references is supported.');
  if (!Number.isInteger(frameCount) || frameCount < 1 || frameCount > 20)
    throw new ValidationError('Number of frames must be between 1 and 20.');

  const frames: (number | null)[] = Array(frameCount).fill(null);
  const loadedAt: number[] = Array(frameCount).fill(-1);
  const lastUsed: number[] = Array(frameCount).fill(-1);
  const steps: PageStep[] = [];
  let faults = 0;

  reference.forEach((page, i) => {
    const existing = frames.indexOf(page);
    if (existing !== -1) {
      lastUsed[existing] = i;
      steps.push({ index: i, page, frames: [...frames], hit: true, slot: null, evicted: null, explanation: `Page ${page} is already in frame ${existing + 1} — hit.` });
      return;
    }
    faults++;
    const empty = frames.indexOf(null);
    let slot: number;
    let explanation: string;
    let evicted: number | null = null;
    if (empty !== -1) {
      slot = empty;
      explanation = `Page fault: page ${page} loaded into empty frame ${slot + 1}.`;
    } else {
      if (algorithm === 'FIFO') {
        slot = loadedAt.indexOf(Math.min(...loadedAt));
        explanation = `Page fault: page ${frames[slot]} has been in memory longest, so it is replaced by ${page}.`;
      } else if (algorithm === 'LRU') {
        slot = lastUsed.indexOf(Math.min(...lastUsed));
        explanation = `Page fault: page ${frames[slot]} was least recently used, so it is replaced by ${page}.`;
      } else {
        let farthest = -1;
        slot = 0;
        for (let s = 0; s < frameCount; s++) {
          const next = reference.indexOf(frames[s] as number, i + 1);
          const distance = next === -1 ? Infinity : next;
          if (distance > farthest) {
            farthest = distance;
            slot = s;
          }
        }
        explanation =
          farthest === Infinity
            ? `Page fault: page ${frames[slot]} is never used again, so it is replaced by ${page}.`
            : `Page fault: page ${frames[slot]} is used farthest in the future (at position ${farthest + 1}), so it is replaced by ${page}.`;
      }
      evicted = frames[slot];
    }
    frames[slot] = page;
    loadedAt[slot] = i;
    lastUsed[slot] = i;
    steps.push({ index: i, page, frames: [...frames], hit: false, slot, evicted, explanation });
  });

  const hits = reference.length - faults;
  return {
    algorithm,
    frameCount,
    reference,
    steps,
    faults,
    hits,
    hitRatio: Math.round((hits / reference.length) * 10000) / 100,
    faultRatio: Math.round((faults / reference.length) * 10000) / 100,
  };
}
