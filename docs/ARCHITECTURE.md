# OS Lab — Architecture

## 1. Overview

```
Browser ──► Next.js (Vercel) ──► NestJS API (Render) ──► PostgreSQL
               │                        │
               └──── @os-lab/engine ────┘   (same TypeScript package on both sides)
```

The **simulation engine** is a dependency-free TypeScript package. It does all algorithm work and knows nothing about React, Next.js or NestJS. The frontend renders engine output; the API uses the same engine to generate and grade exercises, so a student can never submit a score the server didn't compute.

## 2. Engine contract

Each engine is a pure function returning a *complete trace* plus summary metrics:

| Engine | Entry point | Trace used by the visual lab | Summary used by the text interface |
|---|---|---|---|
| CPU | `scheduleCpu(processes, algorithm, { quantum })` | `timeline[]` — per time unit: running, ready queue, states, remaining, events | `processes[]` (CT, TAT, WT, RT), averages, Gantt, utilisation |
| Memory | `allocateMemory(blocks, requests, algorithm, mode)` | `steps[]` — blocks checked, chosen block, memory snapshot | allocations, utilisation, fragmentation |
| Paging | `replacePages(reference, frames, algorithm)` | `steps[]` — frames, hit/fault, victim, explanation | faults, hits, ratios |
| Disk | `scheduleDisk(requests, head, algorithm, opts)` | `moves[]` / `path[]` | total movement, average seek |
| Process | `applyProcAction(state, action)` reducer, `generateLifecycle()` | system snapshots + kernel log | — |
| Practice | `generateExercise(kind, seed, difficulty)`, `gradeExercise()` | — | — |

Because the visual lab replays the same result object that the calculator shows, the two interfaces cannot disagree. Invalid input throws `ValidationError` with a student-readable message, which the UI shows inline.

Adding an algorithm = one branch in the engine + one entry in the algorithm list + a test. The UI picks it up from the list.

## 3. Frontend

- `src/app/*` route files are thin; all UI is in `src/features/<module>`.
- Feature code uses a small **router adapter** (`lib/router.tsx`) instead of importing `next/*` directly. This keeps features framework-agnostic and lets `tools/build-demo.mjs` ship the same code as a static demo.
- **Progress store** (`lib/progress.ts`) is offline-first: every event is written to localStorage (guest mode), and when signed in it is also POSTed to the API. At sign-in the server copy is fetched and merged by timestamp (clients send their original `at`, so records don't duplicate).
- **Playback** (`lib/use-playback.ts`) drives any frame list: start, pause, resume, step, back, seek, reset, 0.5–8× speed.
- Styling: Tailwind v4 tokens in `globals.css`; shadcn-style components in `components/ui` (no Radix dependency). Charts are small custom SVG/HTML components, to keep the bundle small and the visuals tailored to each simulator. Recharts and Framer Motion can be added if richer charts or motion are needed later.

## 4. Data model (PostgreSQL / Prisma)

```
User ─┬─< SimulationRun     (module, algorithm, mode, summary, createdAt)
      ├─< ExerciseAttempt   (kind, difficulty, seed, answers JSON, correct/total/score)
      ├─< QuizAttempt       (module, score, total)
      ├─< TopicProgress     PK(userId, slug)
      ├─< Favourite         PK(userId, key)   e.g. "cpu:RR"
      └─< ResourceMark      PK(userId, resourceId) — saved / completed flags for the Resources library
```

`User` holds `passwordHash` (email sign-up) and/or `googleId` (Google), so a Google sign-in with an existing email links to that account. All child rows cascade on account deletion. See `apps/api/prisma/schema.prisma`.

## 5. API reference

All endpoints except auth, `/health` and the public exercise endpoint require `Authorization: Bearer <JWT>`.

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/register` | `{ name, email, password }` → `{ accessToken, user }` |
| POST | `/auth/login` | `{ email, password }` → `{ accessToken, user }` |
| GET | `/auth/google` → `/auth/google/callback` | OAuth; redirects to `WEB_URL/auth/callback#token=…` |
| GET / PATCH / DELETE | `/me` | Profile; delete removes all data |
| GET | `/progress` | Full progress snapshot (simulations, exercises, quizzes, topics, favourites) |
| POST | `/progress/topics/:slug` | Mark a Learn topic as read |
| PUT / DELETE | `/favourites/:key` | Toggle a favourite algorithm |
| POST / GET | `/simulations` | Record / list simulation history |
| GET | `/practice/exercises/:kind/:seed?difficulty=` | Public exercise (answers withheld) |
| POST | `/practice/exercises/attempts` | `{ kind, difficulty, seed, answers }` — graded server-side |
| POST | `/practice/quizzes/attempts` | `{ module, score, total }` |
| GET | `/resources/marks` | Saved and completed resource ids |
| PUT | `/resources/:id` | `{ saved?, completed? }` for one library resource |
| GET | `/health` | Liveness + DB check |

Security: bcrypt (cost 12), JWT (7 days by default), global validation with whitelisting, a global rate limit plus a stricter one on auth routes, CORS restricted to `WEB_URL`, and the OAuth token passed in the URL fragment so it never reaches server logs.

## 6. Roadmap after the MVP

Deadlock (Banker's algorithm, resource-allocation graphs) and File System modules; lecturer accounts, classes and assignments; spaced-repetition practice; shareable simulation links (encode the input in the URL).
