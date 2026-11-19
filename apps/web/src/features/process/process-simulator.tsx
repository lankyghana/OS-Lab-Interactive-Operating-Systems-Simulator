'use client';

import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import {
  TRANSITIONS,
  allowedActions,
  applyProcAction,
  createSystem,
  generateLifecycle,
  type ProcAction,
  type ProcState,
  type ProcSystem,
} from '@os-lab/engine';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Tabs } from '@/components/ui/tabs';
import { EventLog, LabBox, LabPanel, PlaybackControls, SimulatorFrame, type SimTab } from '@/components/sim/lab';
import { usePlayback } from '@/lib/use-playback';
import { progress } from '@/lib/progress';
import { cn, PROCESS_COLORS } from '@/lib/utils';

const pidColor = (pid: number) => PROCESS_COLORS[(pid - 1) % PROCESS_COLORS.length];

const NODES: Record<ProcState, { x: number; y: number; label: string }> = {
  NEW: { x: 75, y: 70, label: 'New' },
  READY: { x: 235, y: 70, label: 'Ready' },
  RUNNING: { x: 415, y: 70, label: 'Running' },
  TERMINATED: { x: 575, y: 70, label: 'Terminated' },
  WAITING: { x: 325, y: 220, label: 'Waiting' },
};

const EDGES: { action: string; d: string; lx: number; ly: number; label: string }[] = [
  { action: 'admit', d: 'M130 70 L180 70', lx: 155, ly: 60, label: 'admit' },
  { action: 'dispatch', d: 'M270 46 Q325 0 380 46', lx: 325, ly: 16, label: 'dispatch' },
  { action: 'timeout', d: 'M380 94 Q325 132 270 94', lx: 325, ly: 128, label: 'timeout' },
  { action: 'exit', d: 'M470 70 L520 70', lx: 495, ly: 60, label: 'exit' },
  { action: 'block', d: 'M425 94 L365 196', lx: 425, ly: 160, label: 'I/O wait' },
  { action: 'wake', d: 'M285 196 L225 94', lx: 225, ly: 160, label: 'I/O done' },
];

/** The five-state diagram with live counts and the last transition highlighted. */
export function StateDiagram({ sys, last }: { sys: ProcSystem; last?: string | null }) {
  const count = (s: ProcState) => sys.processes.filter((p) => p.state === s);
  return (
    <svg viewBox="0 0 650 260" className="h-auto w-full" role="img" aria-label="Five-state process model diagram">
      <defs>
        <marker id="pm-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 10 5 0 10z" fill="var(--lab-dim)" />
        </marker>
        <marker id="pm-arrow-hot" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 10 5 0 10z" fill="var(--signal)" />
        </marker>
      </defs>
      {EDGES.map((e) => {
        const hot = e.action === last;
        return (
          <g key={e.action}>
            <path d={e.d} fill="none" stroke={hot ? 'var(--signal)' : 'var(--lab-line)'} strokeWidth={hot ? 3 : 1.8} markerEnd={`url(#${hot ? 'pm-arrow-hot' : 'pm-arrow'})`} className="transition-all duration-300" />
            <text x={e.lx} y={e.ly} textAnchor="middle" fontSize="11" fontFamily="ui-monospace, monospace" fill={hot ? 'var(--signal)' : 'var(--lab-dim)'}>
              {e.label}
            </text>
          </g>
        );
      })}
      {(Object.keys(NODES) as ProcState[]).map((s) => {
        const n = NODES[s];
        const ps = count(s);
        const active = ps.length > 0;
        return (
          <g key={s}>
            <rect x={n.x - 55} y={n.y - 24} width={110} height={48} rx={12} fill={active ? 'var(--lab-raised)' : 'var(--lab-panel)'} stroke={s === 'RUNNING' && active ? 'var(--signal)' : 'var(--lab-line)'} strokeWidth={s === 'RUNNING' && active ? 2 : 1} />
            <text x={n.x} y={n.y - 4} textAnchor="middle" fontSize="12.5" fontWeight="700" fill="var(--lab-text)">
              {n.label}
            </text>
            <g>
              {ps.slice(0, 5).map((p, i) => (
                <circle key={p.pid} cx={n.x - ((Math.min(ps.length, 5) - 1) * 9) / 2 + i * 9} cy={n.y + 11} r={3.6} fill={pidColor(p.pid)}>
                  <title>{p.name}</title>
                </circle>
              ))}
              {ps.length === 0 && (
                <text x={n.x} y={n.y + 14} textAnchor="middle" fontSize="10" fill="var(--lab-dim)" fontFamily="ui-monospace, monospace">
                  —
                </text>
              )}
              {ps.length > 5 && (
                <text x={n.x + 30} y={n.y + 14} fontSize="10" fill="var(--lab-dim)">
                  +{ps.length - 5}
                </text>
              )}
            </g>
          </g>
        );
      })}
    </svg>
  );
}

function Pill({ sys, pid }: { sys: ProcSystem; pid: number }) {
  const p = sys.processes.find((x) => x.pid === pid)!;
  return (
    <span className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-mono text-[12px] font-bold text-[#141413] animate-slide-in" style={{ background: pidColor(pid) }}>
      {p.name}
      {p.waitReason && <span className="rounded bg-black/15 px-1 text-[10px] font-medium">{p.waitReason}</span>}
    </span>
  );
}

function Board({ sys, last, onAction }: { sys: ProcSystem; last?: string | null; onAction?: (a: ProcAction) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr]">
        <LabBox label="Process state model">
          <StateDiagram sys={sys} last={last} />
        </LabBox>
        <div className="flex flex-col gap-3">
          <LabBox label="CPU">
            <div className="flex min-h-9 items-center">
              {sys.running ? <Pill sys={sys} pid={sys.running} /> : <span className="font-mono text-xs text-lab-dim">idle</span>}
            </div>
          </LabBox>
          <LabBox label={`Ready queue (${sys.readyQueue.length})`}>
            <div className="flex min-h-9 flex-wrap items-center gap-1.5">
              {sys.readyQueue.length === 0 && <span className="font-mono text-xs text-lab-dim">empty</span>}
              {sys.readyQueue.map((pid) => (
                <Pill key={pid} sys={sys} pid={pid} />
              ))}
            </div>
          </LabBox>
          <LabBox label={`Waiting / blocked (${sys.waitQueue.length})`}>
            <div className="flex min-h-9 flex-wrap items-center gap-1.5">
              {sys.waitQueue.length === 0 && <span className="font-mono text-xs text-lab-dim">empty</span>}
              {sys.waitQueue.map((pid) => (
                <Pill key={pid} sys={sys} pid={pid} />
              ))}
            </div>
          </LabBox>
        </div>
      </div>

      <LabBox label="Process table (PCBs)">
        {sys.processes.length === 0 ? (
          <p className="font-mono text-xs text-lab-dim">No processes yet. Create one to begin.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] font-mono text-[12px] tabular">
              <thead>
                <tr className="text-left text-lab-dim">
                  <th className="py-1 pr-2 font-medium">PID</th>
                  <th className="py-1 pr-2 font-medium">Name</th>
                  <th className="py-1 pr-2 font-medium">State</th>
                  <th className="py-1 pr-2 text-right font-medium">Prio</th>
                  <th className="py-1 pr-2 text-right font-medium">PC</th>
                  <th className="py-1 pr-2 text-right font-medium">CPU</th>
                  {onAction && <th className="py-1 font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {sys.processes.map((p) => {
                  const allowed = allowedActions(sys, p.pid);
                  return (
                    <tr key={p.pid} className={cn('border-t border-lab-line/60', p.state === 'TERMINATED' && 'opacity-45')}>
                      <td className="py-1.5 pr-2 font-bold" style={{ color: pidColor(p.pid) }}>
                        {p.pid}
                      </td>
                      <td className="py-1.5 pr-2">{p.name}</td>
                      <td className="py-1.5 pr-2">
                        <span
                          className={cn(
                            'rounded px-1.5 py-0.5 text-[10.5px]',
                            p.state === 'RUNNING' && 'bg-signal/15 text-signal',
                            p.state === 'READY' && 'bg-warn/15 text-warn',
                            p.state === 'WAITING' && 'bg-fault/15 text-fault',
                            (p.state === 'NEW' || p.state === 'TERMINATED') && 'bg-lab-raised text-lab-dim',
                          )}
                        >
                          {p.state}
                        </span>
                      </td>
                      <td className="py-1.5 pr-2 text-right">{p.priority}</td>
                      <td className="py-1.5 pr-2 text-right">0x{p.programCounter.toString(16).padStart(4, '0')}</td>
                      <td className="py-1.5 pr-2 text-right">{p.cpuTime}</td>
                      {onAction && (
                        <td className="py-1">
                          <div className="flex flex-wrap gap-1">
                            {TRANSITIONS.filter((t) => t.from === p.state).map((t) => (
                              <button
                                key={t.action}
                                disabled={!allowed.includes(t.action)}
                                onClick={() => onAction({ type: t.action, pid: p.pid } as ProcAction)}
                                className="rounded-md border border-lab-line bg-lab-raised px-2 py-0.5 text-[11px] text-lab-text hover:border-signal/50 hover:text-signal disabled:cursor-not-allowed disabled:opacity-35 cursor-pointer"
                                title={allowed.includes(t.action) ? `${t.from} → ${t.to}` : 'The CPU is busy'}
                              >
                                {t.label}
                              </button>
                            ))}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </LabBox>

      <LabBox label="Kernel event log">
        <EventLog
          entries={[...sys.log].reverse().map((l, i) => ({ key: String(sys.log.length - i), time: `t=${l.time}`, text: `${l.transition.padEnd(20, ' ')} ${l.message}`, tone: l.transition.includes('RUNNING →') ? 'bad' : l.transition.endsWith('RUNNING') ? 'good' : 'default' }))}
          emptyText="Kernel events will appear here."
        />
      </LabBox>
    </div>
  );
}

function AutoScenario() {
  const [count, setCount] = useState(4);
  const [seed, setSeed] = useState(7);
  const frames = useMemo(() => generateLifecycle(count, seed), [count, seed]);
  const pb = usePlayback(frames.length + 1, frames, () => progress.recordSimulation({ module: 'process', algorithm: 'STATES', mode: 'visual', summary: 'auto scenario' }));
  const sys = pb.index === 0 ? createSystem() : frames[pb.index - 1].state;
  const lastAction = pb.index === 0 ? null : frames[pb.index - 1].action.type;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label className="text-lab-dim">Processes</Label>
          <div className="flex gap-1">
            {[2, 3, 4, 5, 6].map((n) => (
              <Button key={n} size="sm" variant={n === count ? 'signal' : 'lab'} onClick={() => setCount(n)}>
                {n}
              </Button>
            ))}
          </div>
        </div>
        <Button size="sm" variant="lab" onClick={() => setSeed((s) => s + 1)}>
          New scenario
        </Button>
      </div>
      <PlaybackControls pb={pb} stepLabel="Next event" positionLabel={`event ${pb.index} / ${frames.length}`} />
      <Board sys={sys} last={lastAction} />
    </div>
  );
}

function Sandbox({ sys, setSys, last, setLast }: { sys: ProcSystem; setSys: (s: ProcSystem) => void; last: string | null; setLast: (s: string | null) => void }) {
  const [name, setName] = useState('');
  const [priority, setPriority] = useState('2');
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  const act = (a: ProcAction) => {
    try {
      setSys(applyProcAction(sys, a));
      setLast(a.type);
      setError(null);
      if (!started.current) {
        started.current = true;
        progress.recordSimulation({ module: 'process', algorithm: 'STATES', mode: 'visual', summary: 'sandbox' });
      }
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-lab-line bg-lab-panel/90 p-3">
        <div className="w-40">
          <label htmlFor="pm-name" className="mb-1 block text-[12.5px] text-lab-dim">
            Name
          </label>
          <input id="pm-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={`P${sys.nextPid}`} className="h-8 w-full rounded-md border border-lab-line bg-lab px-2 font-mono text-sm text-lab-text placeholder:text-lab-dim/60 focus:border-signal focus:outline-none" />
        </div>
        <div className="w-20">
          <label htmlFor="pm-prio" className="mb-1 block text-[12.5px] text-lab-dim">
            Priority
          </label>
          <input id="pm-prio" type="number" value={priority} onChange={(e) => setPriority(e.target.value)} className="h-8 w-full rounded-md border border-lab-line bg-lab px-2 font-mono text-sm text-lab-text focus:border-signal focus:outline-none" />
        </div>
        <Button
          size="sm"
          variant="signal"
          onClick={() => {
            act({ type: 'create', name, priority: Number(priority) || 0 });
            setName('');
          }}
        >
          + Create process
        </Button>
        <Button size="sm" variant="lab" onClick={() => act({ type: 'tick' })} disabled={sys.running === null}>
          Run 1 tick
        </Button>
        <Button
          size="sm"
          variant="lab"
          onClick={() => {
            setSys(createSystem());
            setLast(null);
            setError(null);
          }}
        >
          Reset
        </Button>
      </div>
      {error && (
        <div role="alert" className="rounded-lg border border-fault/40 bg-fault/10 px-3 py-2 font-mono text-[12.5px] text-fault">
          ✕ {error}
        </div>
      )}
      <Board sys={sys} last={last} onAction={act} />
    </div>
  );
}

const HELP = [
  'create [name] [priority]   create a process (NEW)',
  'admit <pid>                NEW → READY',
  'dispatch <pid>             READY → RUNNING',
  'timeout <pid>              RUNNING → READY',
  'block <pid> [reason]       RUNNING → WAITING',
  'wake <pid>                 WAITING → READY',
  'exit <pid>                 RUNNING → TERMINATED',
  'tick                       advance the clock one unit',
  'ps                         list processes',
  'reset | clear | help',
];

function Console({ sys, setSys, setLast }: { sys: ProcSystem; setSys: (s: ProcSystem) => void; setLast: (s: string | null) => void }) {
  const [lines, setLines] = useState<{ text: string; kind: 'in' | 'out' | 'err' }[]>([
    { text: 'OS Lab process console. Type "help" for commands. Try: create editor', kind: 'out' },
  ]);
  const [cmd, setCmd] = useState('');
  const [hist, setHist] = useState<string[]>([]);
  const [hi, setHi] = useState(-1);
  const out = (text: string, kind: 'out' | 'err' = 'out') => setLines((l) => [...l, { text, kind }]);

  const resolvePid = (s: ProcSystem, token?: string) => {
    if (!token) throw new Error('Missing PID.');
    const n = Number(token);
    if (Number.isInteger(n)) return n;
    const p = s.processes.find((x) => x.name.toLowerCase() === token.toLowerCase());
    if (!p) throw new Error(`No process named "${token}".`);
    return p.pid;
  };

  const run = (input: string) => {
    const [c, ...args] = input.trim().split(/\s+/);
    setLines((l) => [...l, { text: `$ ${input}`, kind: 'in' }]);
    if (!c) return;
    try {
      switch (c.toLowerCase()) {
        case 'help':
          HELP.forEach((h) => out(h));
          return;
        case 'clear':
          setLines([]);
          return;
        case 'reset':
          setSys(createSystem());
          setLast(null);
          out('System reset.');
          return;
        case 'ps': {
          if (!sys.processes.length) return out('(no processes)');
          out('PID  NAME         STATE       PRIO  CPU');
          sys.processes.forEach((p) => out(`${String(p.pid).padEnd(5)}${p.name.padEnd(13)}${p.state.padEnd(12)}${String(p.priority).padEnd(6)}${p.cpuTime}`));
          return;
        }
        case 'create': {
          const next = applyProcAction(sys, { type: 'create', name: args[0], priority: args[1] ? Number(args[1]) : undefined });
          setSys(next);
          setLast('create');
          out(next.log[next.log.length - 1].message);
          break;
        }
        case 'tick': {
          setSys(applyProcAction(sys, { type: 'tick' }));
          out(`Clock → t=${sys.time + 1}`);
          break;
        }
        case 'admit':
        case 'dispatch':
        case 'timeout':
        case 'block':
        case 'wake':
        case 'exit': {
          const pid = resolvePid(sys, args[0]);
          const action = { type: c.toLowerCase(), pid, reason: args.slice(1).join(' ') || undefined } as ProcAction;
          const next = applyProcAction(sys, action);
          setSys(next);
          setLast(action.type);
          const l = next.log[next.log.length - 1];
          out(`[${l.transition}] ${l.message}`);
          break;
        }
        default:
          out(`Unknown command "${c}". Type "help".`, 'err');
          return;
      }
      progress.recordSimulation({ module: 'process', algorithm: 'STATES', mode: 'text', summary: c });
    } catch (e) {
      out(`error: ${(e as Error).message}`, 'err');
    }
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      run(cmd);
      if (cmd.trim()) setHist((h) => [cmd, ...h]);
      setCmd('');
      setHi(-1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const i = Math.min(hist.length - 1, hi + 1);
      if (i >= 0) {
        setHi(i);
        setCmd(hist[i]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const i = hi - 1;
      setHi(i);
      setCmd(i >= 0 ? hist[i] : '');
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
      <div className="flex flex-col overflow-hidden rounded-xl border border-lab-line bg-lab">
        <div className="max-h-[420px] min-h-[300px] flex-1 overflow-y-auto p-3 font-mono text-[12.5px] leading-relaxed" aria-live="polite">
          {lines.map((l, i) => (
            <pre key={i} className={cn('whitespace-pre-wrap', l.kind === 'in' ? 'text-signal' : l.kind === 'err' ? 'text-fault' : 'text-lab-text')}>
              {l.text}
            </pre>
          ))}
        </div>
        <div className="flex items-center gap-2 border-t border-lab-line bg-lab-panel px-3 py-2 font-mono text-sm">
          <span className="text-signal">$</span>
          <input
            value={cmd}
            onChange={(e) => setCmd(e.target.value)}
            onKeyDown={onKey}
            aria-label="Command"
            autoComplete="off"
            spellCheck={false}
            className="flex-1 bg-transparent text-lab-text placeholder:text-lab-dim/60 focus:outline-none"
            placeholder="type a command, e.g. create browser 1"
          />
        </div>
      </div>
      <LabBox label="Live state">
        <StateDiagram sys={sys} />
        <div className="mt-2 grid grid-cols-3 gap-2 font-mono text-[11.5px]">
          <div>
            <p className="text-lab-dim">CPU</p>
            <p>{sys.running ? sys.processes.find((p) => p.pid === sys.running)!.name : 'idle'}</p>
          </div>
          <div>
            <p className="text-lab-dim">Ready</p>
            <p>{sys.readyQueue.map((p) => sys.processes.find((x) => x.pid === p)!.name).join(', ') || '—'}</p>
          </div>
          <div>
            <p className="text-lab-dim">Waiting</p>
            <p>{sys.waitQueue.map((p) => sys.processes.find((x) => x.pid === p)!.name).join(', ') || '—'}</p>
          </div>
        </div>
      </LabBox>
    </div>
  );
}

export function ProcessSimulator() {
  const [tab, setTab] = useState<SimTab>('visual');
  const [mode, setMode] = useState<'sandbox' | 'auto'>('sandbox');
  const [sys, setSys] = useState<ProcSystem>(() => {
    // Start with two processes so the board isn't empty.
    let s = createSystem();
    s = applyProcAction(s, { type: 'create', name: 'init', priority: 1 });
    s = applyProcAction(s, { type: 'create', name: 'shell', priority: 2, parent: 1 });
    return s;
  });
  const [last, setLast] = useState<string | null>(null);

  return (
    <SimulatorFrame
      module="process"
      eyebrow="Simulators / Process Management"
      title="Process Management"
      description="Create processes and move them through the five-state model. Invalid transitions are rejected with an explanation, just as a real kernel would refuse them."
      algorithm="STATES"
      tab={tab}
      onTab={setTab}
      hideCompare
      textLabel="Command console"
      inputs={
        <Alert tone="info" title="How to use this lab">
          In <b>Visual lab</b>, use <b>Sandbox</b> to create processes and click the transition buttons, or <b>Auto scenario</b> to watch a generated lifecycle play out. The{' '}
          <b>Command console</b> drives the same system with typed commands.
        </Alert>
      }
    >
      {tab === 'visual' && (
        <LabPanel
          title="Process manager · single CPU"
          meta={
            <Tabs
              tone="lab"
              value={mode}
              onChange={setMode}
              items={[
                { value: 'sandbox', label: 'Sandbox' },
                { value: 'auto', label: 'Auto scenario' },
              ]}
            />
          }
        >
          {mode === 'sandbox' ? <Sandbox sys={sys} setSys={setSys} last={last} setLast={setLast} /> : <AutoScenario />}
        </LabPanel>
      )}
      {tab === 'text' && (
        <Card className="border-lab-line bg-lab-panel">
          <CardContent className="p-4 text-lab-text">
            <Console sys={sys} setSys={setSys} setLast={setLast} />
          </CardContent>
        </Card>
      )}
    </SimulatorFrame>
  );
}
