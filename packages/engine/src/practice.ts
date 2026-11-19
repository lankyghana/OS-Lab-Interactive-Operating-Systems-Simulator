/**
 * Practice exercise generators. Exercises are deterministic for a given seed, so the
 * backend can regenerate and verify an exercise from (kind, seed) alone.
 */

import { scheduleCpu, type CpuAlgorithm, type ProcessInput } from './cpu';
import { allocateMemory, type FitAlgorithm } from './memory';
import { replacePages, type PageAlgorithm } from './paging';
import { scheduleDisk, type DiskAlgorithm, type Direction } from './disk';
import { rng } from './process';

export type ExerciseKind = 'cpu' | 'memory' | 'paging' | 'disk';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface ExerciseQuestion {
  key: string;
  label: string;
  answer: number;
  /** Optional hint unit, e.g. "ms" or "cylinders". */
  unit?: string;
}

export interface Exercise {
  id: string;
  kind: ExerciseKind;
  seed: number;
  difficulty: Difficulty;
  title: string;
  algorithm: string;
  prompt: string;
  /** Data shown to the student as a table or list. */
  data: Record<string, unknown>;
  questions: ExerciseQuestion[];
}

const pick = <T>(rand: () => number, arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const int = (rand: () => number, min: number, max: number) => min + Math.floor(rand() * (max - min + 1));

export function generateExercise(kind: ExerciseKind, seed: number, difficulty: Difficulty = 'medium'): Exercise {
  const rand = rng(seed * 31 + kind.length);
  const size = difficulty === 'easy' ? 0 : difficulty === 'medium' ? 1 : 2;
  const id = `${kind}-${difficulty}-${seed}`;

  if (kind === 'cpu') {
    const algos: CpuAlgorithm[] =
      difficulty === 'easy' ? ['FCFS', 'SJF'] : difficulty === 'medium' ? ['SJF', 'PRIORITY', 'RR', 'SRTF'] : ['SRTF', 'PRIORITY_P', 'RR'];
    const algorithm = pick(rand, algos);
    const n = 3 + size;
    const processes: ProcessInput[] = Array.from({ length: n }, (_, i) => ({
      id: `P${i + 1}`,
      arrival: i === 0 ? 0 : int(rand, 0, 2 + size * 2),
      burst: int(rand, 1, 6 + size * 2),
      priority: int(rand, 1, 5),
    }));
    const quantum = algorithm === 'RR' ? int(rand, 2, 4) : undefined;
    const r = scheduleCpu(processes, algorithm, { quantum });
    return {
      id,
      kind,
      seed,
      difficulty,
      algorithm,
      title: `CPU Scheduling — ${algorithm.replace('_P', ' (preemptive)')}`,
      prompt: `Schedule the processes below using ${algorithm}${quantum ? ` with a time quantum of ${quantum}` : ''}.${
        algorithm.startsWith('PRIORITY') ? ' A lower number means a higher priority.' : ''
      } Compute the averages to two decimal places.`,
      data: { processes, quantum, showPriority: algorithm.startsWith('PRIORITY') },
      questions: [
        { key: 'avgWaiting', label: 'Average waiting time', answer: r.averageWaiting },
        { key: 'avgTurnaround', label: 'Average turnaround time', answer: r.averageTurnaround },
        { key: 'completion', label: `Completion time of the last process to finish`, answer: r.totalTime },
      ],
    };
  }

  if (kind === 'memory') {
    const algorithm = pick(rand, ['FIRST_FIT', 'BEST_FIT', 'WORST_FIT'] as FitAlgorithm[]);
    const blocks = Array.from({ length: 4 + size }, () => int(rand, 1, 7) * 100);
    const requests = Array.from({ length: 3 + size }, (_, i) => ({ id: `P${i + 1}`, size: int(rand, 5, 50) * 10 }));
    const r = allocateMemory(blocks, requests, algorithm, 'variable');
    return {
      id,
      kind,
      seed,
      difficulty,
      algorithm,
      title: `Memory Allocation — ${algorithm.replace('_', ' ').toLowerCase()}`,
      prompt: `Using ${algorithm.replace('_', ' ').toLowerCase()} with variable partitioning (blocks are split and the leftover hole remains usable), allocate the processes in order. Enter the block number for each process, or 0 if it cannot be allocated.`,
      data: { blocks, requests },
      questions: r.allocations.map((a) => ({ key: a.id, label: `Block for ${a.id} (${a.size} KB)`, answer: a.block === null ? 0 : a.block + 1 })),
    };
  }

  if (kind === 'paging') {
    const algorithm = pick(rand, ['FIFO', 'LRU', 'OPTIMAL'] as PageAlgorithm[]);
    const len = 10 + size * 4;
    const reference = Array.from({ length: len }, () => int(rand, 0, 5 + size));
    const frames = int(rand, 3, 4);
    const r = replacePages(reference, frames, algorithm);
    return {
      id,
      kind,
      seed,
      difficulty,
      algorithm,
      title: `Page Replacement — ${algorithm}`,
      prompt: `With ${frames} initially empty frames, apply ${algorithm} page replacement to the reference string.`,
      data: { reference, frames },
      questions: [
        { key: 'faults', label: 'Number of page faults', answer: r.faults },
        { key: 'hits', label: 'Number of page hits', answer: r.hits },
      ],
    };
  }

  const algorithm = pick(rand, ['FCFS', 'SSTF', 'SCAN', 'C_SCAN'] as DiskAlgorithm[]);
  const cylinders = 200;
  const requests = Array.from({ length: 6 + size * 2 }, () => int(rand, 0, cylinders - 1));
  const head = int(rand, 20, 180);
  const direction: Direction = rand() < 0.5 ? 'up' : 'down';
  const r = scheduleDisk(requests, head, algorithm, { cylinders, direction });
  return {
    id,
    kind,
    seed,
    difficulty,
    algorithm,
    title: `Disk Scheduling — ${algorithm.replace('_', '-')}`,
    prompt: `The disk has cylinders 0–${cylinders - 1} and the head is at ${head}${
      algorithm === 'SCAN' || algorithm === 'C_SCAN' || algorithm === 'SSTF' ? `, moving towards ${direction === 'up' ? 'higher' : 'lower'} cylinders` : ''
    }. Using ${algorithm.replace('_', '-')}, compute the total head movement${
      algorithm === 'C_SCAN' ? ' (count the return sweep)' : ''
    }.`,
    data: { requests, head, cylinders, direction },
    questions: [{ key: 'total', label: 'Total head movement', answer: r.totalMovement, unit: 'cylinders' }],
  };
}

export interface ExerciseGrade {
  correct: number;
  total: number;
  score: number;
  results: { key: string; expected: number; given: number | null; correct: boolean }[];
}

export function gradeExercise(ex: Exercise, answers: Record<string, number | string | null | undefined>): ExerciseGrade {
  const results = ex.questions.map((q) => {
    const raw = answers[q.key];
    const given = raw === null || raw === undefined || raw === '' ? null : Number(raw);
    const correct = given !== null && Number.isFinite(given) && Math.abs(given - q.answer) <= 0.011;
    return { key: q.key, expected: q.answer, given, correct };
  });
  const correct = results.filter((r) => r.correct).length;
  return { correct, total: results.length, score: Math.round((correct / results.length) * 100), results };
}
