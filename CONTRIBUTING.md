# Contributing to OS Lab

Repository: <https://github.com/lankyghana/OS-Lab-Interactive-Operating-Systems-Simulator>  
Maintainer: Daniel Kwadwo Takyi (danielkwadwotakyi@gmail.com)

Thanks for helping students understand operating systems. You don't need to write code to contribute: correct answers and clear explanations are most of the value.

The same guide, with a step-by-step walkthrough, is in the app at **/contribute**.

## Ways to help

- **Report a bug** — a wrong answer, broken control or confusing message. Include the input you used and what you expected.
- **Fix an explanation** — clarify a Learn topic, add a worked example, correct a quiz question.
- **Add an algorithm** — a new scheduling, allocation, replacement or disk policy, with tests.
- **Suggest a resource** — a free book, course or video, with one sentence on what it's best for.
- **Improve accessibility** — keyboard paths, screen-reader labels, contrast in both themes, small screens.
- **Build a new module** — Deadlocks and File Systems are next on the roadmap.

Before starting anything bigger than a typo, comment on (or open) an issue so work isn't duplicated.

## Set up

Requirements: Node.js 20+, pnpm 9. Docker only if you need the database.

```bash
# fork on GitHub first, then:
git clone https://github.com/<your-github-username>/OS-Lab-Interactive-Operating-Systems-Simulator.git
cd OS-Lab-Interactive-Operating-Systems-Simulator
git remote add upstream https://github.com/lankyghana/OS-Lab-Interactive-Operating-Systems-Simulator.git
pnpm install

# frontend only (guest mode, no database)
pnpm --filter @os-lab/engine build
pnpm dev:web                      # http://localhost:3000

# full stack
cp apps/api/.env.example apps/api/.env          # set JWT_SECRET
cp apps/web/.env.example apps/web/.env.local
pnpm db:up && pnpm db:migrate
pnpm dev                          # web :3000, API :4000
```

Check your work:

```bash
pnpm test        # engine + API unit tests
pnpm typecheck
pnpm test:e2e    # Playwright, desktop + mobile
```

## Where things live

| Path | What |
|---|---|
| `packages/engine/` | All algorithms. Pure TypeScript, no dependencies, tested against textbook answers. |
| `apps/web/src/features/` | One folder per page; all UI. |
| `apps/web/src/content/` | Learn topics, quizzes, resources, about settings. |
| `apps/api/` | NestJS API and Prisma schema. |
| `docs/ARCHITECTURE.md` | Data model and API reference. |

The visual lab, calculator and compare view all render the same engine result. If an answer is wrong, the fix (and its test) belongs in `packages/engine`, not in a component.

## Adding an algorithm (example: HRRN)

1. Add the id to the algorithm type and list in `packages/engine/src/cpu.ts`.
2. Add its selection rule to the `switch` in `key()` (the scheduler runs the smallest key).
3. Add a test with a hand-worked or published example in `packages/engine/test/engine.test.ts`, and say where the numbers came from.
4. Add a Learn topic in `apps/web/src/content/topics.ts` and map it in `topicForAlgorithm`.
5. Run `pnpm dev:web` — the dropdown, visual lab, calculator, compare tab and card picture pick it up automatically.

## Conventions

**Engine** — pure, deterministic functions; no React/Next/Nest imports; invalid input throws `ValidationError` with a student-readable message; every result carries a trace for the visual lab.

**Interface** — use theme tokens (`bg-surface`, `text-muted`, …), never raw hex colours; everything works by keyboard; respect `prefers-reduced-motion`; check at 360px wide, in light and dark.

**Content** — plain, accurate language for second-year students; state conventions explicitly (tie-breaks, which end SCAN travels to); link to sources, never paste textbook text.

**Git** — branch from `main` (`feat/hrrn`, `fix/rr-tie-break`, `docs/paging-topic`); [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`); small, focused pull requests; rebase on `upstream/main` before opening.

## Pull requests

The PR template contains the checklist. In short: one change per PR, tests and typecheck pass, engine changes have tests, UI works by keyboard in both themes at 360px, and visible changes include screenshots.

## Licence

By contributing, you agree that your contributions are licensed under the [MIT licence](LICENSE).

Please also read the [Code of Conduct](CODE_OF_CONDUCT.md).
