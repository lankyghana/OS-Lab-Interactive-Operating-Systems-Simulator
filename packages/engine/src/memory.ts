/**
 * Contiguous memory allocation engine: First Fit, Best Fit, Worst Fit.
 *
 * Two partitioning modes are supported:
 *  - 'fixed'    each block holds at most one process; leftover space is internal fragmentation.
 *  - 'variable' a block is split on allocation and the leftover hole stays available
 *               (the classic textbook exercise, e.g. 100/500/200/300/600 KB with 212/417/112/426 KB).
 */

import { ValidationError } from './cpu';

export type FitAlgorithm = 'FIRST_FIT' | 'BEST_FIT' | 'WORST_FIT';
export type PartitionMode = 'fixed' | 'variable';

export const FIT_ALGORITHMS: { id: FitAlgorithm; name: string }[] = [
  { id: 'FIRST_FIT', name: 'First Fit' },
  { id: 'BEST_FIT', name: 'Best Fit' },
  { id: 'WORST_FIT', name: 'Worst Fit' },
];

export interface MemoryRequest {
  id: string;
  size: number;
}

/** A region inside an original block: either a process or free space. */
export interface Segment {
  owner: string | null;
  size: number;
}

export interface MemoryBlockState {
  index: number;
  size: number;
  segments: Segment[];
  free: number;
}

export interface CandidateCheck {
  block: number;
  free: number;
  fits: boolean;
}

export interface MemoryStep {
  request: MemoryRequest;
  checked: CandidateCheck[];
  chosenBlock: number | null;
  blocks: MemoryBlockState[];
  explanation: string;
}

export interface Allocation {
  id: string;
  size: number;
  block: number | null;
  /** Free space left in the block (fixed mode) or in the hole that was used (variable mode). */
  leftover: number | null;
}

export interface MemoryResult {
  algorithm: FitAlgorithm;
  mode: PartitionMode;
  allocations: Allocation[];
  steps: MemoryStep[];
  finalBlocks: MemoryBlockState[];
  allocatedCount: number;
  unallocated: string[];
  totalMemory: number;
  usedMemory: number;
  utilization: number;
  /** Fixed mode: unused space inside allocated blocks. */
  internalFragmentation: number;
  /** Free memory that exists but could not satisfy an unallocated request. */
  externalFragmentation: number;
}

export function validateMemory(blocks: number[], requests: MemoryRequest[]) {
  if (blocks.length === 0) throw new ValidationError('Add at least one memory block.');
  if (requests.length === 0) throw new ValidationError('Add at least one process.');
  if (blocks.length > 30 || requests.length > 30) throw new ValidationError('A maximum of 30 blocks and 30 processes is supported.');
  blocks.forEach((b, i) => {
    if (!Number.isInteger(b) || b < 1) throw new ValidationError(`Block ${i + 1}: size must be a whole number ≥ 1.`);
  });
  const ids = new Set<string>();
  for (const r of requests) {
    if (!r.id.trim()) throw new ValidationError('Every process needs an ID.');
    if (ids.has(r.id)) throw new ValidationError(`Duplicate process ID "${r.id}".`);
    ids.add(r.id);
    if (!Number.isInteger(r.size) || r.size < 1) throw new ValidationError(`${r.id}: size must be a whole number ≥ 1.`);
  }
}

const freeOf = (segments: Segment[]) => segments.filter((s) => !s.owner).reduce((a, s) => a + s.size, 0);

/** Largest contiguous hole inside a block (variable mode keeps one hole at the end). */
const holeOf = (b: MemoryBlockState, mode: PartitionMode) =>
  mode === 'fixed' ? (b.segments.some((s) => s.owner) ? 0 : b.size) : b.free;

const clone = (blocks: MemoryBlockState[]): MemoryBlockState[] =>
  blocks.map((b) => ({ ...b, segments: b.segments.map((s) => ({ ...s })) }));

export function allocateMemory(
  blockSizes: number[],
  requests: MemoryRequest[],
  algorithm: FitAlgorithm,
  mode: PartitionMode = 'variable',
): MemoryResult {
  validateMemory(blockSizes, requests);
  const blocks: MemoryBlockState[] = blockSizes.map((size, index) => ({
    index,
    size,
    segments: [{ owner: null, size }],
    free: size,
  }));

  const steps: MemoryStep[] = [];
  const allocations: Allocation[] = [];

  for (const req of requests) {
    const checked: CandidateCheck[] = [];
    let chosen: number | null = null;
    for (const b of blocks) {
      const hole = holeOf(b, mode);
      const fits = hole >= req.size;
      checked.push({ block: b.index, free: hole, fits });
      if (!fits) continue;
      if (algorithm === 'FIRST_FIT') {
        chosen = b.index;
        break;
      }
      if (chosen === null) chosen = b.index;
      else {
        const current = holeOf(blocks[chosen], mode);
        if (algorithm === 'BEST_FIT' && hole < current) chosen = b.index;
        if (algorithm === 'WORST_FIT' && hole > current) chosen = b.index;
      }
    }

    let explanation: string;
    if (chosen === null) {
      allocations.push({ id: req.id, size: req.size, block: null, leftover: null });
      explanation = `${req.id} (${req.size}) does not fit in any block and must wait.`;
    } else {
      const b = blocks[chosen];
      const hole = holeOf(b, mode);
      // Replace the trailing free segment with [process, remaining hole].
      const freeIdx = b.segments.findIndex((s) => !s.owner);
      const leftover = hole - req.size;
      const replacement: Segment[] = [{ owner: req.id, size: req.size }];
      if (leftover > 0) replacement.push({ owner: null, size: leftover });
      b.segments.splice(freeIdx, 1, ...replacement);
      b.free = mode === 'fixed' ? 0 : freeOf(b.segments);
      allocations.push({ id: req.id, size: req.size, block: chosen, leftover });
      const why =
        algorithm === 'FIRST_FIT'
          ? 'the first block large enough'
          : algorithm === 'BEST_FIT'
            ? 'the smallest block that fits'
            : 'the largest available block';
      explanation = `${req.id} (${req.size}) → Block ${chosen + 1}, ${why} (${hole} free, ${leftover} left over).`;
    }
    steps.push({ request: req, checked, chosenBlock: chosen, blocks: clone(blocks), explanation });
  }

  const totalMemory = blockSizes.reduce((a, b) => a + b, 0);
  const usedMemory = allocations.reduce((a, x) => a + (x.block !== null ? x.size : 0), 0);
  const internalFragmentation =
    mode === 'fixed' ? allocations.reduce((a, x) => a + (x.leftover ?? 0), 0) : 0;
  const unallocated = allocations.filter((a) => a.block === null).map((a) => a.id);
  const freeTotal = blocks.reduce((a, b) => a + holeOf(b, mode), 0);
  const smallestUnplaced = Math.min(...allocations.filter((a) => a.block === null).map((a) => a.size));
  const externalFragmentation = unallocated.length > 0 && freeTotal >= smallestUnplaced ? freeTotal : 0;

  return {
    algorithm,
    mode,
    allocations,
    steps,
    finalBlocks: clone(blocks),
    allocatedCount: allocations.length - unallocated.length,
    unallocated,
    totalMemory,
    usedMemory,
    utilization: Math.round((usedMemory / totalMemory) * 10000) / 100,
    internalFragmentation,
    externalFragmentation,
  };
}
