import type { CpuAlgorithm, DiskAlgorithm, Direction, FitAlgorithm, PageAlgorithm, ProcessInput, MemoryRequest, ExerciseKind } from '@os-lab/engine';
import type { ModuleId } from '@/lib/progress';

export type TopicExample =
  | { kind: 'cpu'; algorithm: CpuAlgorithm; processes: ProcessInput[]; quantum?: number }
  | { kind: 'memory'; algorithm: FitAlgorithm; blocks: number[]; requests: MemoryRequest[] }
  | { kind: 'paging'; algorithm: PageAlgorithm; reference: number[]; frames: number }
  | { kind: 'disk'; algorithm: DiskAlgorithm; requests: number[]; head: number; cylinders: number; direction: Direction }
  | { kind: 'process' };

export interface Topic {
  slug: string;
  module: ModuleId;
  title: string;
  summary: string;
  what: string;
  why: string;
  how: string[];
  pros: string[];
  cons: string[];
  formulas?: string[];
  example: TopicExample;
  exercise?: ExerciseKind;
}

const cpuExample: ProcessInput[] = [
  { id: 'P1', arrival: 0, burst: 5, priority: 3 },
  { id: 'P2', arrival: 1, burst: 3, priority: 1 },
  { id: 'P3', arrival: 2, burst: 8, priority: 4 },
  { id: 'P4', arrival: 3, burst: 6, priority: 2 },
];
const cpuFormulas = [
  'Turnaround time = Completion time − Arrival time',
  'Waiting time = Turnaround time − Burst time',
  'Response time = First time on CPU − Arrival time',
];
const memBlocks = [100, 500, 200, 300, 600];
const memRequests: MemoryRequest[] = [
  { id: 'P1', size: 212 },
  { id: 'P2', size: 417 },
  { id: 'P3', size: 112 },
  { id: 'P4', size: 426 },
];
const reference = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1];
const diskQueue = [98, 183, 37, 122, 14, 124, 65, 67];

export const TOPICS: Topic[] = [
  {
    slug: 'process-states',
    module: 'process',
    title: 'The Process Life Cycle',
    summary: 'A process moves between New, Ready, Running, Waiting and Terminated as the OS manages it.',
    what: 'A process is a program in execution. The operating system tracks each process in a Process Control Block (PCB) that records its ID, state, program counter, registers, priority and resources. At any moment a process is in exactly one of five states.',
    why: 'The state model lets the OS share a small number of CPUs among many processes. Processes that cannot use the CPU (because they are waiting for I/O) step aside so another ready process can run, keeping the CPU busy.',
    how: [
      'NEW → READY (admit): the OS finishes creating the process and puts it in the ready queue.',
      'READY → RUNNING (dispatch): the scheduler picks the process and the dispatcher loads its context onto the CPU.',
      'RUNNING → READY (timeout/interrupt): the process is preempted, for example when its time slice ends.',
      'RUNNING → WAITING (I/O or event wait): the process requests I/O or waits for an event and gives up the CPU.',
      'WAITING → READY (event completion): the I/O finishes and the process becomes eligible to run again.',
      'RUNNING → TERMINATED (exit): the process finishes and the OS reclaims its resources.',
    ],
    pros: [
      'Separates “able to run” (Ready) from “cannot run yet” (Waiting), so the CPU is never handed to a blocked process.',
      'Gives schedulers a clean set of queues to work with.',
      'Makes multiprogramming and time sharing possible.',
    ],
    cons: [
      'Every transition into or out of Running costs a context switch, which is pure overhead.',
      'The basic model ignores suspended (swapped-out) states, which real systems add.',
    ],
    example: { kind: 'process' },
  },
  {
    slug: 'cpu-fcfs',
    module: 'cpu',
    title: 'First Come, First Served (FCFS)',
    summary: 'The process that arrives first runs first, to completion.',
    what: 'FCFS is the simplest CPU scheduling algorithm. The ready queue is a FIFO queue: the process at its head gets the CPU and keeps it until its burst finishes. It is non-preemptive.',
    why: 'It is easy to understand and implement, has very low scheduling overhead, and is completely fair in the sense of “first in line is served first”. It is a useful baseline against which other algorithms are compared.',
    how: [
      'Sort processes by arrival time (ties keep their original order).',
      'When the CPU is free, give it to the process at the head of the ready queue.',
      'Let it run for its entire burst time.',
      'If no process has arrived yet, the CPU stays idle until the next arrival.',
      'Repeat until every process has completed.',
    ],
    pros: ['Simple, with no starvation: every process eventually runs.', 'Minimal context switching.'],
    cons: [
      'Convoy effect: short processes wait behind long ones, giving a high average waiting time.',
      'Poor for interactive systems because response time can be very long.',
    ],
    formulas: cpuFormulas,
    example: { kind: 'cpu', algorithm: 'FCFS', processes: cpuExample },
    exercise: 'cpu',
  },
  {
    slug: 'cpu-sjf',
    module: 'cpu',
    title: 'Shortest Job First (SJF)',
    summary: 'Whenever the CPU becomes free, run the ready process with the smallest burst.',
    what: 'SJF picks the ready process with the shortest CPU burst. In its basic form it is non-preemptive: once a process starts, it runs to completion even if a shorter job arrives.',
    why: 'SJF gives the minimum possible average waiting time for a given set of processes (when all are available together), so it is used as a theoretical benchmark and inspires practical schedulers that estimate burst lengths.',
    how: [
      'When the CPU becomes free, look at every process that has arrived.',
      'Choose the one with the smallest burst time (ties: earliest arrival).',
      'Run it to completion.',
      'Repeat until all processes have completed.',
    ],
    pros: ['Optimal average waiting time among non-preemptive algorithms.', 'High throughput for short jobs.'],
    cons: [
      'Burst lengths are not known in advance; real systems must predict them (e.g., exponential averaging).',
      'Long processes can starve if short ones keep arriving.',
    ],
    formulas: cpuFormulas,
    example: { kind: 'cpu', algorithm: 'SJF', processes: cpuExample },
    exercise: 'cpu',
  },
  {
    slug: 'cpu-srtf',
    module: 'cpu',
    title: 'Shortest Remaining Time First (SRTF)',
    summary: 'The preemptive version of SJF: a newly arrived shorter job takes the CPU.',
    what: 'SRTF always runs the process with the least remaining burst time. When a new process arrives whose burst is shorter than what the running process has left, the running process is preempted.',
    why: 'It improves on SJF when processes arrive at different times, achieving the minimum average waiting time of any algorithm.',
    how: [
      'At every time unit (or whenever a process arrives), compare the remaining time of all ready processes and the running one.',
      'Run the process with the smallest remaining time; on a tie keep the current process.',
      'If a different process wins, preempt the running process and return it to the ready queue.',
      'Continue until all processes have finished.',
    ],
    pros: ['Lowest average waiting time.', 'Short jobs get very fast service.'],
    cons: ['Needs remaining-time estimates.', 'Frequent preemptions add context-switch overhead.', 'Long jobs can starve.'],
    formulas: cpuFormulas,
    example: { kind: 'cpu', algorithm: 'SRTF', processes: cpuExample },
    exercise: 'cpu',
  },
  {
    slug: 'cpu-priority',
    module: 'cpu',
    title: 'Priority Scheduling',
    summary: 'Each process has a priority; the highest-priority ready process runs first.',
    what: 'Every process is assigned a priority number. In OS Lab, as in most textbooks, a lower number means a higher priority. The non-preemptive version waits for the running process to finish; the preemptive version interrupts it when a higher-priority process arrives.',
    why: 'Real systems need to favour important work: kernel tasks over user tasks, foreground over background, real-time over batch.',
    how: [
      'When a scheduling decision is needed, find the ready process with the best (lowest) priority number.',
      'Ties are broken by arrival time.',
      'Non-preemptive: run it to completion. Preemptive: re-check whenever a process arrives and preempt if a better one is ready.',
    ],
    pros: ['Expresses the relative importance of work.', 'Flexible: priorities can be internal (memory, I/O ratio) or external (user, payment).'],
    cons: ['Starvation of low-priority processes.', 'The usual fix is ageing: gradually raising the priority of processes that have waited a long time.'],
    formulas: cpuFormulas,
    example: { kind: 'cpu', algorithm: 'PRIORITY', processes: cpuExample },
    exercise: 'cpu',
  },
  {
    slug: 'cpu-rr',
    module: 'cpu',
    title: 'Round Robin (RR)',
    summary: 'Each process gets a fixed time quantum in turn.',
    what: 'Round Robin is FCFS with preemption. Each process runs for at most one time quantum; if it has not finished, it goes to the back of the ready queue.',
    why: 'It is designed for time-sharing systems. Every process gets the CPU regularly, so response time is short and predictable.',
    how: [
      'Keep the ready queue in FIFO order.',
      'Dispatch the head process for at most one quantum.',
      'If it finishes early, the next process starts immediately.',
      'If the quantum expires, put the process at the tail. Processes that arrive at that same moment join the queue before it.',
      'Repeat until all processes have finished.',
    ],
    pros: ['Fair: no starvation.', 'Good response time for interactive users.'],
    cons: [
      'Performance depends heavily on the quantum: too large behaves like FCFS, too small causes excessive context switching.',
      'Average turnaround time is often higher than SJF.',
    ],
    formulas: cpuFormulas,
    example: { kind: 'cpu', algorithm: 'RR', processes: cpuExample, quantum: 2 },
    exercise: 'cpu',
  },
  {
    slug: 'memory-first-fit',
    module: 'memory',
    title: 'First Fit',
    summary: 'Allocate the first hole that is large enough.',
    what: 'In contiguous memory allocation, free memory is a set of holes. First Fit scans the holes from the beginning and places the process in the first one that is big enough.',
    why: 'It is fast because the search stops as soon as a suitable hole is found, and in practice it uses memory about as well as Best Fit.',
    how: [
      'Take the next process request.',
      'Scan the holes from the start of memory.',
      'Allocate the first hole whose size ≥ the request; the remainder stays as a smaller hole.',
      'If no hole is large enough, the process must wait.',
    ],
    pros: ['Fastest search on average.', 'Simple to implement.'],
    cons: ['Small leftover holes collect near the start of memory, slowing later searches.', 'Suffers from external fragmentation.'],
    example: { kind: 'memory', algorithm: 'FIRST_FIT', blocks: memBlocks, requests: memRequests },
    exercise: 'memory',
  },
  {
    slug: 'memory-best-fit',
    module: 'memory',
    title: 'Best Fit',
    summary: 'Allocate the smallest hole that is large enough.',
    what: 'Best Fit searches every hole and picks the one that leaves the smallest leftover space.',
    why: 'By using the tightest hole, it keeps large holes free for large processes that might arrive later.',
    how: [
      'Take the next process request.',
      'Examine every hole and keep the smallest one whose size ≥ the request.',
      'Allocate it; the (small) remainder stays as a hole.',
      'If nothing fits, the process waits.',
    ],
    pros: ['Preserves large holes.', 'Often allocates more processes than the other strategies.'],
    cons: ['Must search the whole list (unless holes are kept sorted).', 'Creates many tiny, unusable holes.'],
    example: { kind: 'memory', algorithm: 'BEST_FIT', blocks: memBlocks, requests: memRequests },
    exercise: 'memory',
  },
  {
    slug: 'memory-worst-fit',
    module: 'memory',
    title: 'Worst Fit',
    summary: 'Allocate the largest available hole.',
    what: 'Worst Fit always places the process in the largest hole, so the leftover piece is as big as possible.',
    why: 'The idea is that a large leftover is more likely to be useful than the tiny slivers Best Fit leaves.',
    how: ['Take the next process request.', 'Find the largest hole.', 'If it is big enough, allocate there; otherwise the process waits.'],
    pros: ['Leftover holes tend to be usable.'],
    cons: ['Quickly breaks up large holes, so big processes often cannot be placed.', 'Usually the worst utilisation of the three in simulations.'],
    example: { kind: 'memory', algorithm: 'WORST_FIT', blocks: memBlocks, requests: memRequests },
    exercise: 'memory',
  },
  {
    slug: 'paging-fifo',
    module: 'paging',
    title: 'FIFO Page Replacement',
    summary: 'Replace the page that has been in memory the longest.',
    what: 'With virtual memory, a page fault occurs when a referenced page is not in a frame. If all frames are full, a victim must be chosen. FIFO evicts the page that was loaded earliest.',
    why: 'It is trivial to implement with a queue and needs no per-reference bookkeeping.',
    how: [
      'For each reference: if the page is in a frame, it is a hit.',
      'Otherwise it is a fault. Use an empty frame if one exists.',
      'If not, evict the page at the head of the FIFO queue and load the new page.',
    ],
    pros: ['Very cheap to implement.'],
    cons: [
      'Ignores how often or how recently a page is used, so it may evict a heavily used page.',
      "Suffers from Belady's anomaly: adding frames can increase faults (try 1 2 3 4 1 2 5 1 2 3 4 5 with 3 and 4 frames).",
    ],
    formulas: ['Hit ratio = hits ÷ references', 'Fault ratio = faults ÷ references'],
    example: { kind: 'paging', algorithm: 'FIFO', reference, frames: 3 },
    exercise: 'paging',
  },
  {
    slug: 'paging-lru',
    module: 'paging',
    title: 'Least Recently Used (LRU)',
    summary: 'Replace the page that has not been used for the longest time.',
    what: 'LRU uses the recent past to predict the near future: the page untouched for the longest time is assumed least likely to be needed soon.',
    why: 'Programs show locality of reference, so LRU approximates Optimal well and is the basis of most real replacement policies (often via the clock / second-chance approximation).',
    how: [
      'Record the time of the last use of each page in memory.',
      'On a hit, update that page’s last-use time.',
      'On a fault with full frames, evict the page with the oldest last-use time.',
    ],
    pros: ['Good fault rate in practice.', "A stack algorithm, so it never suffers from Belady's anomaly."],
    cons: ['Exact LRU needs hardware support (counters or a stack) on every memory reference, which is expensive.'],
    formulas: ['Hit ratio = hits ÷ references'],
    example: { kind: 'paging', algorithm: 'LRU', reference, frames: 3 },
    exercise: 'paging',
  },
  {
    slug: 'paging-optimal',
    module: 'paging',
    title: 'Optimal Page Replacement',
    summary: 'Replace the page that will not be used for the longest time in the future.',
    what: 'Optimal (OPT or MIN) looks ahead in the reference string and evicts the page whose next use is farthest away, or never.',
    why: 'It gives the lowest possible number of page faults, so it is the benchmark other algorithms are measured against.',
    how: [
      'On a fault with full frames, for each page in memory find when it will next be referenced.',
      'Evict the page that is never used again, or otherwise the one used farthest in the future.',
    ],
    pros: ['Provably minimal page faults.', "No Belady's anomaly."],
    cons: ['Impossible to implement in a real OS because it needs knowledge of future references.'],
    example: { kind: 'paging', algorithm: 'OPTIMAL', reference, frames: 3 },
    exercise: 'paging',
  },
  {
    slug: 'disk-fcfs',
    module: 'disk',
    title: 'FCFS Disk Scheduling',
    summary: 'Service requests in the order they arrive.',
    what: 'The disk head moves to each requested cylinder in arrival order, regardless of where it currently is.',
    why: 'It is fair and simple, and works well when the load is light.',
    how: ['Start at the current head position.', 'Move to each request in queue order, adding the distance travelled.'],
    pros: ['Fair; no starvation.', 'No computation needed.'],
    cons: ['The head may swing wildly back and forth, giving a large total head movement.'],
    formulas: ['Seek distance = |next cylinder − current cylinder|', 'Total head movement = sum of all seek distances'],
    example: { kind: 'disk', algorithm: 'FCFS', requests: diskQueue, head: 53, cylinders: 200, direction: 'up' },
    exercise: 'disk',
  },
  {
    slug: 'disk-sstf',
    module: 'disk',
    title: 'Shortest Seek Time First (SSTF)',
    summary: 'Always go to the closest pending request.',
    what: 'SSTF picks the pending request nearest to the current head position, similar in spirit to SJF.',
    why: 'Choosing the nearest request greatly reduces total head movement compared with FCFS.',
    how: [
      'From the current position, compute the distance to every pending request.',
      'Move to the closest one (ties: continue in the current direction).',
      'Repeat until the queue is empty.',
    ],
    pros: ['Much lower total head movement than FCFS.', 'Higher throughput.'],
    cons: ['Requests far from the head can starve under heavy load.', 'Not optimal: greedy choices can lead to extra travel.'],
    formulas: ['Total head movement = sum of all seek distances'],
    example: { kind: 'disk', algorithm: 'SSTF', requests: diskQueue, head: 53, cylinders: 200, direction: 'up' },
    exercise: 'disk',
  },
  {
    slug: 'disk-scan',
    module: 'disk',
    title: 'SCAN (Elevator)',
    summary: 'Sweep to one end of the disk, then reverse.',
    what: 'The head moves in one direction servicing requests until it reaches the end of the disk, then reverses and services requests on the way back, like a lift.',
    why: 'It gives more uniform waiting times than SSTF and avoids starvation.',
    how: [
      'Move in the current direction, servicing each request you pass.',
      'Continue to the last cylinder in that direction (0 or the maximum).',
      'Reverse and service the remaining requests.',
    ],
    pros: ['No starvation.', 'Good throughput under heavy load.'],
    cons: [
      'Requests just behind the head wait for a full round trip.',
      'Travelling to the very end is wasteful when no requests are there (LOOK fixes this).',
    ],
    formulas: ['Total head movement = sum of all seek distances, including travel to the disk end'],
    example: { kind: 'disk', algorithm: 'SCAN', requests: diskQueue, head: 53, cylinders: 200, direction: 'down' },
    exercise: 'disk',
  },
  {
    slug: 'disk-cscan',
    module: 'disk',
    title: 'Circular SCAN (C-SCAN)',
    summary: 'Sweep in one direction only, then jump back to the start.',
    what: 'C-SCAN services requests in one direction only. On reaching the end, the head returns immediately to the other end without servicing requests, and starts the sweep again.',
    why: 'It treats the cylinders as a circular list, giving more uniform waiting times than SCAN.',
    how: [
      'Move in the chosen direction, servicing requests.',
      'Continue to the end of the disk.',
      'Jump to the opposite end. OS Lab counts this return in the total by default; some textbooks do not, so it can be switched off.',
      'Continue in the same direction, servicing the remaining requests.',
    ],
    pros: ['More uniform waiting time than SCAN.', 'No starvation.'],
    cons: ['Extra movement for the return sweep.', 'C-LOOK avoids going to the physical ends.'],
    formulas: ['Total head movement = sum of all seek distances (+ return sweep)'],
    example: { kind: 'disk', algorithm: 'C_SCAN', requests: diskQueue, head: 53, cylinders: 200, direction: 'up' },
    exercise: 'disk',
  },
];

export const topicBySlug = (slug: string) => TOPICS.find((t) => t.slug === slug);
export const topicsFor = (module: ModuleId) => TOPICS.filter((t) => t.module === module);

/** Maps an engine algorithm id to its Learn topic. */
export function topicForAlgorithm(module: ModuleId, algorithm: string): Topic | undefined {
  const map: Record<string, string> = {
    'cpu:FCFS': 'cpu-fcfs',
    'cpu:SJF': 'cpu-sjf',
    'cpu:SRTF': 'cpu-srtf',
    'cpu:PRIORITY': 'cpu-priority',
    'cpu:PRIORITY_P': 'cpu-priority',
    'cpu:RR': 'cpu-rr',
    'memory:FIRST_FIT': 'memory-first-fit',
    'memory:BEST_FIT': 'memory-best-fit',
    'memory:WORST_FIT': 'memory-worst-fit',
    'paging:FIFO': 'paging-fifo',
    'paging:LRU': 'paging-lru',
    'paging:OPTIMAL': 'paging-optimal',
    'disk:FCFS': 'disk-fcfs',
    'disk:SSTF': 'disk-sstf',
    'disk:SCAN': 'disk-scan',
    'disk:LOOK': 'disk-scan',
    'disk:C_SCAN': 'disk-cscan',
    'disk:C_LOOK': 'disk-cscan',
    'process:STATES': 'process-states',
  };
  return topicBySlug(map[`${module}:${algorithm}`]);
}
