'use client';

import { useSyncExternalStore } from 'react';
import { api, apiEnabled, type ApiUser } from './api';

/**
 * Learning progress store.
 *
 * Offline-first: everything is recorded in the browser so guests get a working
 * dashboard. When a student is signed in, each event is also sent to the API, and
 * the server copy is loaded (and merged) at sign-in.
 */

export type ModuleId = 'process' | 'cpu' | 'memory' | 'paging' | 'disk';

export interface SimulationRecord {
  module: ModuleId;
  algorithm: string;
  mode: 'visual' | 'text' | 'compare';
  at: string;
  summary?: string;
}
export interface ExerciseRecord {
  id: string;
  kind: string;
  difficulty: string;
  score: number;
  at: string;
}
export interface QuizRecord {
  module: ModuleId;
  score: number;
  total: number;
  at: string;
}

export interface ProgressState {
  user: ApiUser | null;
  token: string | null;
  simulations: SimulationRecord[];
  visits: Partial<Record<ModuleId, string>>;
  topicsRead: string[];
  exercises: ExerciseRecord[];
  quizzes: QuizRecord[];
  favourites: string[];
  savedResources: string[];
  completedResources: string[];
}

const KEY = 'os-lab:progress:v1';
const empty: ProgressState = {
  user: null,
  token: null,
  simulations: [],
  visits: {},
  topicsRead: [],
  exercises: [],
  quizzes: [],
  favourites: [],
  savedResources: [],
  completedResources: [],
};

let state: ProgressState = empty;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...empty, ...JSON.parse(raw) };
  } catch {
    /* storage unavailable (private mode, sandboxed frame) — keep in memory */
  }
}

function persist() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function set(update: (s: ProgressState) => ProgressState) {
  load();
  state = update(state);
  persist();
  listeners.forEach((l) => l());
}

/** Fire-and-forget sync to the API when signed in. */
function sync(path: string, body: unknown, method = 'POST') {
  if (!apiEnabled() || !state.token) return;
  api(path, { method, body: JSON.stringify(body), token: state.token }).catch(() => {
    /* the local copy remains the source of truth for the UI */
  });
}

const now = () => new Date().toISOString();

export const progress = {
  get: () => {
    load();
    return state;
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },

  visit(module: ModuleId) {
    set((s) => ({ ...s, visits: { ...s.visits, [module]: now() } }));
  },
  recordSimulation(r: Omit<SimulationRecord, 'at'>) {
    const rec = { ...r, at: now() };
    set((s) => ({ ...s, simulations: [rec, ...s.simulations].slice(0, 500) }));
    sync('/simulations', rec);
  },
  markTopicRead(slug: string) {
    set((s) => (s.topicsRead.includes(slug) ? s : { ...s, topicsRead: [...s.topicsRead, slug] }));
    sync(`/progress/topics/${encodeURIComponent(slug)}`, {});
  },
  recordExercise(r: Omit<ExerciseRecord, 'at'>, answers?: Record<string, unknown>, seed?: number) {
    const rec = { ...r, at: now() };
    set((s) => ({ ...s, exercises: [rec, ...s.exercises].slice(0, 500) }));
    sync('/practice/exercises/attempts', { kind: r.kind, difficulty: r.difficulty, seed, answers, at: rec.at });
  },
  recordQuiz(r: Omit<QuizRecord, 'at'>) {
    const rec = { ...r, at: now() };
    set((s) => ({ ...s, quizzes: [rec, ...s.quizzes].slice(0, 200) }));
    sync('/practice/quizzes/attempts', rec);
  },
  toggleFavourite(algorithmKey: string) {
    const on = !state.favourites.includes(algorithmKey);
    set((s) => ({
      ...s,
      favourites: on ? [...s.favourites, algorithmKey] : s.favourites.filter((f) => f !== algorithmKey),
    }));
    sync(`/favourites/${encodeURIComponent(algorithmKey)}`, {}, on ? 'PUT' : 'DELETE');
  },

  /** Bookmark ("save for later") or tick off ("done") a learning resource. */
  toggleResource(id: string, field: 'saved' | 'completed') {
    const key = field === 'saved' ? 'savedResources' : 'completedResources';
    load();
    const on = !state[key].includes(id);
    set((s) => ({ ...s, [key]: on ? [...s[key], id] : s[key].filter((x) => x !== id) }));
    sync(`/resources/${encodeURIComponent(id)}`, { [field]: on }, 'PUT');
  },

  async signedIn(user: ApiUser, token: string) {
    set((s) => ({ ...s, user, token }));
    if (!apiEnabled()) return;
    try {
      const remote = await api<Omit<ProgressState, 'user' | 'token' | 'visits'>>('/progress', { token });
      set((s) => ({
        ...s,
        simulations: mergeByAt(s.simulations, remote.simulations),
        exercises: mergeByAt(s.exercises, remote.exercises),
        quizzes: mergeByAt(s.quizzes, remote.quizzes),
        topicsRead: Array.from(new Set([...s.topicsRead, ...remote.topicsRead])),
        favourites: Array.from(new Set([...s.favourites, ...remote.favourites])),
        savedResources: Array.from(new Set([...s.savedResources, ...(remote.savedResources ?? [])])),
        completedResources: Array.from(new Set([...s.completedResources, ...(remote.completedResources ?? [])])),
      }));
    } catch {
      /* keep local data */
    }
  },
  signOut() {
    set((s) => ({ ...s, user: null, token: null }));
  },
  reset() {
    set((s) => ({ ...empty, user: s.user, token: s.token }));
  },
};

function mergeByAt<T extends { at: string }>(a: T[], b: T[]): T[] {
  const seen = new Set(a.map((x) => x.at));
  return [...a, ...b.filter((x) => !seen.has(x.at))].sort((x, y) => y.at.localeCompare(x.at));
}

const serverSnapshot = () => empty;
export function useProgress(): ProgressState {
  return useSyncExternalStore(progress.subscribe, progress.get, serverSnapshot);
}

/**
 * Hand-off of example inputs from Learn pages to a simulator. `peek` does not consume
 * (safe with React StrictMode's double-invoked initialisers); the simulator calls
 * `clear` in an effect once mounted.
 */
const presets = new Map<string, unknown>();
export const presetStore = {
  set: (module: ModuleId, value: unknown) => presets.set(module, value),
  peek: <T,>(module: ModuleId): T | undefined => presets.get(module) as T | undefined,
  clear: (module: ModuleId) => presets.delete(module),
};
