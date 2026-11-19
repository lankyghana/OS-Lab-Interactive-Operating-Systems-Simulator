/**
 * Disk scheduling engine: FCFS, SSTF, SCAN, C-SCAN (plus LOOK and C-LOOK).
 *
 * Conventions (stated in the UI as well):
 *  - SCAN / C-SCAN travel to the physical end of the disk (0 or cylinders-1)
 *    before reversing / wrapping, when requests remain on the other side.
 *  - The C-SCAN / C-LOOK return sweep is counted in total head movement by default
 *    (configurable via `countReturnSweep`).
 */

import { ValidationError } from './cpu';

export type DiskAlgorithm = 'FCFS' | 'SSTF' | 'SCAN' | 'C_SCAN' | 'LOOK' | 'C_LOOK';
export type Direction = 'up' | 'down';

export const DISK_ALGORITHMS: { id: DiskAlgorithm; name: string; core: boolean }[] = [
  { id: 'FCFS', name: 'First Come, First Served', core: true },
  { id: 'SSTF', name: 'Shortest Seek Time First', core: true },
  { id: 'SCAN', name: 'SCAN (Elevator)', core: true },
  { id: 'C_SCAN', name: 'Circular SCAN', core: true },
  { id: 'LOOK', name: 'LOOK', core: false },
  { id: 'C_LOOK', name: 'Circular LOOK', core: false },
];

export interface DiskOptions {
  cylinders?: number;
  direction?: Direction;
  countReturnSweep?: boolean;
}

export interface DiskMove {
  from: number;
  to: number;
  distance: number;
  /** true when `to` is a request being serviced; false for travel to a disk end. */
  service: boolean;
  /** true for the C-SCAN / C-LOOK jump back to the other end. */
  wrap: boolean;
}

export interface DiskResult {
  algorithm: DiskAlgorithm;
  head: number;
  cylinders: number;
  direction: Direction;
  requests: number[];
  order: number[];
  path: number[];
  moves: DiskMove[];
  totalMovement: number;
  averageSeek: number;
}

export function validateDisk(requests: number[], head: number, cylinders: number) {
  if (requests.length === 0) throw new ValidationError('Enter at least one request.');
  if (requests.length > 100) throw new ValidationError('A maximum of 100 requests is supported.');
  if (!Number.isInteger(cylinders) || cylinders < 2 || cylinders > 100000)
    throw new ValidationError('Disk size must be between 2 and 100000 cylinders.');
  if (!Number.isInteger(head) || head < 0 || head >= cylinders)
    throw new ValidationError(`Head position must be between 0 and ${cylinders - 1}.`);
  for (const r of requests)
    if (!Number.isInteger(r) || r < 0 || r >= cylinders)
      throw new ValidationError(`Request ${r} is outside the disk (0–${cylinders - 1}).`);
}

export function scheduleDisk(requests: number[], head: number, algorithm: DiskAlgorithm, options: DiskOptions = {}): DiskResult {
  const cylinders = options.cylinders ?? 200;
  const direction = options.direction ?? 'up';
  const countReturn = options.countReturnSweep ?? true;
  validateDisk(requests, head, cylinders);
  const max = cylinders - 1;

  const moves: DiskMove[] = [];
  const order: number[] = [];
  let pos = head;
  const go = (to: number, service: boolean, wrap = false) => {
    moves.push({ from: pos, to, distance: wrap && !countReturn ? 0 : Math.abs(to - pos), service, wrap });
    if (service) order.push(to);
    pos = to;
  };

  const lower = requests.filter((r) => r < head).sort((a, b) => a - b);
  const upper = requests.filter((r) => r >= head).sort((a, b) => a - b);

  switch (algorithm) {
    case 'FCFS':
      requests.forEach((r) => go(r, true));
      break;
    case 'SSTF': {
      const pending = [...requests];
      while (pending.length) {
        let best = 0;
        for (let i = 1; i < pending.length; i++) {
          const d = Math.abs(pending[i] - pos);
          const bd = Math.abs(pending[best] - pos);
          // Tie: prefer the request in the current direction of travel.
          if (d < bd || (d === bd && (direction === 'up' ? pending[i] > pending[best] : pending[i] < pending[best]))) best = i;
        }
        go(pending.splice(best, 1)[0], true);
      }
      break;
    }
    case 'SCAN':
    case 'LOOK': {
      const first = direction === 'up' ? upper : [...lower].reverse();
      const second = direction === 'up' ? [...lower].reverse() : upper;
      first.forEach((r) => go(r, true));
      if (second.length) {
        if (algorithm === 'SCAN') {
          const end = direction === 'up' ? max : 0;
          if (pos !== end) go(end, false);
        }
        second.forEach((r) => go(r, true));
      }
      break;
    }
    case 'C_SCAN':
    case 'C_LOOK': {
      const first = direction === 'up' ? upper : [...lower].reverse();
      const second = direction === 'up' ? lower : [...upper].reverse();
      first.forEach((r) => go(r, true));
      if (second.length) {
        if (algorithm === 'C_SCAN') {
          const end = direction === 'up' ? max : 0;
          const start = direction === 'up' ? 0 : max;
          if (pos !== end) go(end, false);
          go(start, false, true);
        } else {
          go(second[0], true, true);
          second.slice(1).forEach((r) => go(r, true));
          break;
        }
        second.forEach((r) => go(r, true));
      }
      break;
    }
  }

  const totalMovement = moves.reduce((a, m) => a + m.distance, 0);
  return {
    algorithm,
    head,
    cylinders,
    direction,
    requests: [...requests],
    order,
    path: [head, ...moves.map((m) => m.to)],
    moves,
    totalMovement,
    averageSeek: Math.round((totalMovement / requests.length) * 100) / 100,
  };
}
