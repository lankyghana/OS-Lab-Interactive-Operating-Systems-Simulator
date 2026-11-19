'use client';

import { useMemo, useState } from 'react';
import {
  allocateMemory,
  generateExercise,
  gradeExercise,
  replacePages,
  scheduleCpu,
  scheduleDisk,
  type Difficulty,
  type Exercise,
  type ExerciseGrade,
  type ExerciseKind,
  type ProcessInput,
  type MemoryRequest,
  type CpuAlgorithm,
  type FitAlgorithm,
  type PageAlgorithm,
  type DiskAlgorithm,
  type Direction,
} from '@os-lab/engine';
import { PageHeader } from '@/components/layout/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Tabs } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, ProgressBar } from '@/components/ui/alert';
import { Table, Td, Th } from '@/components/ui/table';
import { CpuResults } from '@/features/cpu/cpu-results';
import { MemoryResults } from '@/features/memory/memory-simulator';
import { PagingResults } from '@/features/paging/paging-simulator';
import { DiskResults } from '@/features/disk/disk-simulator';
import { QUIZZES } from '@/content/quizzes';
import { MODULES } from '@/content/modules';
import { progress, useProgress, type ModuleId } from '@/lib/progress';
import { cn } from '@/lib/utils';
import { IconCheck, IconX, IconSparkle } from '@/components/icons';

const KINDS: { value: ExerciseKind; label: string }[] = [
  { value: 'cpu', label: 'CPU Scheduling' },
  { value: 'memory', label: 'Memory' },
  { value: 'paging', label: 'Page Replacement' },
  { value: 'disk', label: 'Disk Scheduling' },
];

function ExerciseData({ ex }: { ex: Exercise }) {
  const d = ex.data as Record<string, unknown>;
  if (ex.kind === 'cpu') {
    const ps = d.processes as ProcessInput[];
    return (
      <Table className="max-w-md">
        <thead>
          <tr>
            <Th>Process</Th>
            <Th className="text-right">Arrival</Th>
            <Th className="text-right">Burst</Th>
            {Boolean(d.showPriority) && <Th className="text-right">Priority</Th>}
          </tr>
        </thead>
        <tbody>
          {ps.map((p) => (
            <tr key={p.id}>
              <Td className="font-mono font-semibold">{p.id}</Td>
              <Td className="text-right">{p.arrival}</Td>
              <Td className="text-right">{p.burst}</Td>
              {Boolean(d.showPriority) && <Td className="text-right">{p.priority}</Td>}
            </tr>
          ))}
        </tbody>
      </Table>
    );
  }
  if (ex.kind === 'memory') {
    const blocks = d.blocks as number[];
    const reqs = d.requests as MemoryRequest[];
    return (
      <div className="grid gap-3 font-mono text-sm sm:grid-cols-2">
        <div>
          <p className="mb-1 font-sans text-xs font-semibold text-muted">Blocks</p>
          {blocks.map((b, i) => `B${i + 1}=${b}`).join('  ')}
        </div>
        <div>
          <p className="mb-1 font-sans text-xs font-semibold text-muted">Processes (in order)</p>
          {reqs.map((r) => `${r.id}=${r.size}`).join('  ')}
        </div>
      </div>
    );
  }
  if (ex.kind === 'paging')
    return (
      <div className="font-mono text-sm">
        <p className="mb-1 font-sans text-xs font-semibold text-muted">Reference string · {String(d.frames)} frames</p>
        <p className="text-base tracking-wide">{(d.reference as number[]).join(' ')}</p>
      </div>
    );
  return (
    <div className="font-mono text-sm">
      <p className="mb-1 font-sans text-xs font-semibold text-muted">Request queue · head at {String(d.head)}</p>
      <p className="text-base tracking-wide">{(d.requests as number[]).join(', ')}</p>
    </div>
  );
}

function Solution({ ex }: { ex: Exercise }) {
  const d = ex.data as Record<string, unknown>;
  if (ex.kind === 'cpu') return <CpuResults result={scheduleCpu(d.processes as ProcessInput[], ex.algorithm as CpuAlgorithm, { quantum: d.quantum as number | undefined })} compact />;
  if (ex.kind === 'memory') return <MemoryResults result={allocateMemory(d.blocks as number[], d.requests as MemoryRequest[], ex.algorithm as FitAlgorithm, 'variable')} />;
  if (ex.kind === 'paging') return <PagingResults result={replacePages(d.reference as number[], d.frames as number, ex.algorithm as PageAlgorithm)} />;
  return <DiskResults result={scheduleDisk(d.requests as number[], d.head as number, ex.algorithm as DiskAlgorithm, { cylinders: d.cylinders as number, direction: d.direction as Direction })} />;
}

function Exercises({ initial }: { initial: ExerciseKind }) {
  const [kind, setKind] = useState<ExerciseKind>(initial);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 100000));
  const ex = useMemo(() => generateExercise(kind, seed, difficulty), [kind, seed, difficulty]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [grade, setGrade] = useState<ExerciseGrade | null>(null);
  const [showSolution, setShowSolution] = useState(false);

  const fresh = (k = kind, d = difficulty) => {
    setKind(k);
    setDifficulty(d);
    setSeed(Math.floor(Math.random() * 100000));
    setAnswers({});
    setGrade(null);
    setShowSolution(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-0 max-w-full">
          <Label>Topic</Label>
          <Tabs<ExerciseKind> items={KINDS} value={kind} onChange={(k) => fresh(k)} />
        </div>
        <div className="min-w-0 max-w-full">
          <Label>Difficulty</Label>
          <Tabs<Difficulty>
            items={[
              { value: 'easy', label: 'Easy' },
              { value: 'medium', label: 'Medium' },
              { value: 'hard', label: 'Hard' },
            ]}
            value={difficulty}
            onChange={(d) => fresh(kind, d)}
          />
        </div>
        <Button variant="outline" onClick={() => fresh()}>
          <IconSparkle size={15} /> New exercise
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-5 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold">{ex.title}</h3>
            <Badge variant="neutral">{ex.difficulty}</Badge>
            <span className="ml-auto font-mono text-[11px] text-faint">#{ex.seed}</span>
          </div>
          <p className="text-[15px] leading-relaxed">{ex.prompt}</p>
          <ExerciseData ex={ex} />
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const g = gradeExercise(ex, answers);
              setGrade(g);
              progress.recordExercise({ id: ex.id, kind: ex.kind, difficulty: ex.difficulty, score: g.score }, answers, ex.seed);
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ex.questions.map((q) => {
                const r = grade?.results.find((x) => x.key === q.key);
                return (
                  <div key={q.key}>
                    <Label htmlFor={`q-${q.key}`} className="normal-case tracking-normal text-[13px] text-ink">
                      {q.label}
                    </Label>
                    <div className="relative">
                      <Input
                        id={`q-${q.key}`}
                        inputMode="decimal"
                        value={answers[q.key] ?? ''}
                        onChange={(e) => {
                          setAnswers((a) => ({ ...a, [q.key]: e.target.value }));
                          setGrade(null);
                        }}
                        className={cn(r && (r.correct ? 'border-ok ring-2 ring-ok/20' : 'border-bad ring-2 ring-bad/20'))}
                        placeholder={q.unit ?? 'Your answer'}
                      />
                      {r && <span className="absolute right-2.5 top-1/2 -translate-y-1/2">{r.correct ? <IconCheck size={16} className="text-ok" /> : <IconX size={16} className="text-bad" />}</span>}
                    </div>
                    {r && !r.correct && <p className="mt-1 text-xs text-bad">Correct answer: {q.answer}</p>}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit">Check answers</Button>
              <Button variant="ghost" onClick={() => setShowSolution((s) => !s)}>
                {showSolution ? 'Hide' : 'Show'} worked solution
              </Button>
              {grade && (
                <span className={cn('text-sm font-semibold', grade.score === 100 ? 'text-ok' : grade.score >= 50 ? 'text-amber' : 'text-bad')}>
                  {grade.correct}/{grade.total} correct · {grade.score}%{grade.score === 100 && ' 🎉'}
                </span>
              )}
            </div>
          </form>
          {showSolution && (
            <div className="border-t border-line pt-5 animate-slide-in">
              <Solution ex={ex} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Quiz({ initial }: { initial: ModuleId }) {
  const [module, setModule] = useState<ModuleId>(initial);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const qs = QUIZZES[module];
  const q = qs[i];
  const { quizzes } = useProgress();
  const best = Math.max(0, ...quizzes.filter((x) => x.module === module).map((x) => Math.round((x.score / x.total) * 100)));

  const restart = (m = module) => {
    setModule(m);
    setI(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Label>Module</Label>
        <Tabs<ModuleId> items={MODULES.map((m) => ({ value: m.id, label: m.short }))} value={module} onChange={(m) => restart(m)} />
      </div>
      <Card>
        <CardContent className="p-5">
          {done ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <p className="text-sm text-muted">{MODULES.find((m) => m.id === module)!.name} quiz complete</p>
              <p className="text-5xl font-bold tabular">
                {score}/{qs.length}
              </p>
              <p className="text-muted">{score === qs.length ? 'Perfect score. Well done!' : score >= qs.length / 2 ? 'Good work. Review the explanations for the ones you missed.' : 'Revisit the Learn pages and try again.'}</p>
              <Button onClick={() => restart()}>Try again</Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3 text-sm text-muted">
                <span>
                  Question {i + 1} of {qs.length}
                </span>
                <span>{best > 0 && `Best: ${best}%`}</span>
              </div>
              <ProgressBar value={(i / qs.length) * 100} />
              <p className="text-lg font-semibold leading-snug">{q.prompt}</p>
              <div className="flex flex-col gap-2" role="radiogroup" aria-label="Answers">
                {q.options.map((o, k) => {
                  const state = picked === null ? 'idle' : k === q.answer ? 'right' : k === picked ? 'wrong' : 'dim';
                  return (
                    <button
                      key={k}
                      role="radio"
                      aria-checked={picked === k}
                      disabled={picked !== null}
                      onClick={() => {
                        setPicked(k);
                        if (k === q.answer) setScore((s) => s + 1);
                      }}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-[15px] transition-all',
                        state === 'idle' && 'cursor-pointer border-line hover:border-brand/40 hover:bg-brand-soft/30',
                        state === 'right' && 'border-ok bg-ok-soft',
                        state === 'wrong' && 'border-bad bg-bad-soft',
                        state === 'dim' && 'border-line opacity-55',
                      )}
                    >
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-current font-mono text-xs">{String.fromCharCode(65 + k)}</span>
                      {o}
                    </button>
                  );
                })}
              </div>
              {picked !== null && (
                <Alert tone={picked === q.answer ? 'success' : 'error'} title={picked === q.answer ? 'Correct' : 'Not quite'}>
                  {q.explanation}
                </Alert>
              )}
              <div className="flex justify-end">
                <Button
                  disabled={picked === null}
                  onClick={() => {
                    if (i + 1 >= qs.length) {
                      setDone(true);
                      progress.recordQuiz({ module, score, total: qs.length });
                    } else {
                      setI(i + 1);
                      setPicked(null);
                    }
                  }}
                >
                  {i + 1 >= qs.length ? 'Finish quiz' : 'Next question'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function PracticePage({ initialModule }: { initialModule?: string }) {
  const [tab, setTab] = useState<'exercises' | 'quiz'>('exercises');
  const valid = MODULES.some((m) => m.id === initialModule) ? (initialModule as ModuleId) : 'cpu';
  const exerciseKind: ExerciseKind = valid === 'process' ? 'cpu' : (valid as ExerciseKind);
  return (
    <>
      <PageHeader
        eyebrow="Practice"
        title="Exercises & quizzes"
        description="Work problems by hand the way you would in an exam, then check them against the simulation engine. Every exercise is freshly generated and comes with a worked solution."
      />
      <div className="mb-5">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: 'exercises', label: 'Calculation exercises' },
            { value: 'quiz', label: 'Quizzes' },
          ]}
        />
      </div>
      {tab === 'exercises' ? <Exercises initial={exerciseKind} /> : <Quiz initial={valid} />}
    </>
  );
}
