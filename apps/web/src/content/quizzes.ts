import type { ModuleId } from '@/lib/progress';

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
}

export const QUIZZES: Record<ModuleId, QuizQuestion[]> = {
  process: [
    {
      id: 'p1',
      prompt: 'A running process issues a disk read. Which state does it move to?',
      options: ['Ready', 'Waiting', 'New', 'Terminated'],
      answer: 1,
      explanation: 'It cannot continue until the I/O completes, so it blocks in the Waiting state and releases the CPU.',
    },
    {
      id: 'p2',
      prompt: 'Which transition happens when a time-slice (quantum) expires?',
      options: ['Running → Waiting', 'Ready → Running', 'Running → Ready', 'Waiting → Ready'],
      answer: 2,
      explanation: 'A timer interrupt preempts the process. It is still able to run, so it goes back to the ready queue.',
    },
    {
      id: 'p3',
      prompt: 'Which of these is NOT a valid transition in the five-state model?',
      options: ['Waiting → Running', 'Ready → Running', 'Running → Terminated', 'New → Ready'],
      answer: 0,
      explanation: 'A process whose I/O completes must first go to Ready. Only the dispatcher moves a process from Ready to Running.',
    },
    {
      id: 'p4',
      prompt: 'What data structure holds the information the OS needs to resume a process?',
      options: ['Page table', 'Process Control Block (PCB)', 'File allocation table', 'Ready queue'],
      answer: 1,
      explanation: 'The PCB stores the process state, program counter, registers, scheduling and memory information.',
    },
    {
      id: 'p5',
      prompt: 'On a single-CPU system, how many processes can be in the Running state at once?',
      options: ['One', 'Two', 'As many as are in memory', 'Unlimited'],
      answer: 0,
      explanation: 'One CPU executes one process at a time; all other runnable processes wait in the ready queue.',
    },
    {
      id: 'p6',
      prompt: 'Saving the state of one process and loading another is called…',
      options: ['Paging', 'Swapping', 'A context switch', 'Spooling'],
      answer: 2,
      explanation: 'A context switch saves the old process’s context into its PCB and restores the next one. It is overhead, as no useful work is done.',
    },
  ],
  cpu: [
    {
      id: 'c1',
      prompt: 'Which algorithm gives the minimum average waiting time when all processes arrive together?',
      options: ['FCFS', 'Round Robin', 'SJF', 'Priority'],
      answer: 2,
      explanation: 'Running shorter jobs first reduces the waiting time of every job that follows; SJF is provably optimal in this case.',
    },
    {
      id: 'c2',
      prompt: 'The “convoy effect” is associated with which algorithm?',
      options: ['FCFS', 'SRTF', 'Round Robin', 'Preemptive priority'],
      answer: 0,
      explanation: 'In FCFS, many short processes may queue behind one long CPU-bound process.',
    },
    {
      id: 'c3',
      prompt: 'Processes P1(burst 24), P2(3), P3(3) all arrive at 0. What is the FCFS average waiting time?',
      options: ['3', '17', '27', '15'],
      answer: 1,
      explanation: 'Waiting times are 0, 24 and 27, so the average is 51 ÷ 3 = 17.',
    },
    {
      id: 'c4',
      prompt: 'What happens to Round Robin as the time quantum becomes very large?',
      options: ['It becomes SJF', 'It becomes FCFS', 'It becomes priority scheduling', 'Context switches increase'],
      answer: 1,
      explanation: 'If the quantum exceeds every burst, no process is ever preempted, which is exactly FCFS.',
    },
    {
      id: 'c5',
      prompt: 'Which technique prevents starvation in priority scheduling?',
      options: ['Thrashing', 'Ageing', 'Paging', 'Compaction'],
      answer: 1,
      explanation: 'Ageing gradually increases the priority of processes that wait for a long time.',
    },
    {
      id: 'c6',
      prompt: 'Turnaround time is defined as…',
      options: ['Completion − Arrival', 'Completion − Burst', 'First run − Arrival', 'Burst − Waiting'],
      answer: 0,
      explanation: 'Turnaround is the total time from submission to completion. Waiting time = Turnaround − Burst.',
    },
  ],
  memory: [
    {
      id: 'm1',
      prompt: 'Which strategy allocates the smallest hole that is large enough?',
      options: ['First Fit', 'Best Fit', 'Worst Fit', 'Next Fit'],
      answer: 1,
      explanation: 'Best Fit searches all holes and chooses the tightest fit.',
    },
    {
      id: 'm2',
      prompt: 'Free memory split into many small non-contiguous holes is called…',
      options: ['Internal fragmentation', 'External fragmentation', 'Thrashing', 'Segmentation'],
      answer: 1,
      explanation: 'External fragmentation: the total free space may be enough, but it is not contiguous.',
    },
    {
      id: 'm3',
      prompt: 'Unused space inside an allocated fixed partition is…',
      options: ['External fragmentation', 'Internal fragmentation', 'A page fault', 'Compaction'],
      answer: 1,
      explanation: 'The partition is allocated to the process, but part of it is unused, so the waste is internal.',
    },
    {
      id: 'm4',
      prompt: 'Holes 100, 500, 200, 300, 600 KB. With Best Fit, where does a 212 KB process go?',
      options: ['500 KB', '300 KB', '600 KB', '200 KB'],
      answer: 1,
      explanation: '300 KB is the smallest hole ≥ 212 KB, leaving 88 KB.',
    },
    {
      id: 'm5',
      prompt: 'Which technique removes external fragmentation by moving processes together?',
      options: ['Compaction', 'Swapping', 'Ageing', 'Spooling'],
      answer: 0,
      explanation: 'Compaction shuffles memory contents so all free memory forms one large block. It requires dynamic relocation.',
    },
    {
      id: 'm6',
      prompt: 'Which strategy is generally fastest because it stops at the first suitable hole?',
      options: ['Best Fit', 'Worst Fit', 'First Fit', 'Buddy system'],
      answer: 2,
      explanation: 'First Fit stops searching as soon as it finds a hole that is large enough.',
    },
  ],
  paging: [
    {
      id: 'g1',
      prompt: 'Which algorithm can suffer from Belady’s anomaly?',
      options: ['LRU', 'Optimal', 'FIFO', 'None of them'],
      answer: 2,
      explanation: 'With FIFO, adding frames can increase faults. LRU and Optimal are stack algorithms and are immune.',
    },
    {
      id: 'g2',
      prompt: 'Why can the Optimal algorithm not be implemented in a real OS?',
      options: ['It needs too much memory', 'It requires knowing future references', 'It is too slow', 'It causes thrashing'],
      answer: 1,
      explanation: 'Optimal evicts the page used farthest in the future, which is not known in advance. It is used as a benchmark.',
    },
    {
      id: 'g3',
      prompt: 'Reference string 7 0 1 2 0 3 0 4 2 3 0 3 2 1 2 0 1 7 0 1 with 3 frames: how many faults does LRU produce?',
      options: ['9', '12', '15', '10'],
      answer: 1,
      explanation: 'LRU produces 12 faults; FIFO produces 15 and Optimal 9.',
    },
    {
      id: 'g4',
      prompt: 'A page fault occurs when…',
      options: ['A page is referenced twice', 'A referenced page is not in physical memory', 'Memory is full', 'The TLB is updated'],
      answer: 1,
      explanation: 'The page must be brought in from secondary storage, possibly evicting another page.',
    },
    {
      id: 'g5',
      prompt: 'LRU replaces the page that…',
      options: ['Was loaded first', 'Will be used last', 'Has not been used for the longest time', 'Is used least frequently'],
      answer: 2,
      explanation: '“Least recently used” refers to recency of use, not frequency (that would be LFU).',
    },
    {
      id: 'g6',
      prompt: 'When a system spends more time paging than executing, it is…',
      options: ['Thrashing', 'Swapping', 'Compacting', 'Starving'],
      answer: 0,
      explanation: 'Thrashing occurs when processes do not have enough frames for their working sets.',
    },
  ],
  disk: [
    {
      id: 'd1',
      prompt: 'Which algorithm is also called the elevator algorithm?',
      options: ['SSTF', 'SCAN', 'FCFS', 'C-LOOK'],
      answer: 1,
      explanation: 'SCAN sweeps up and down like a lift, servicing requests along the way.',
    },
    {
      id: 'd2',
      prompt: 'Head at 53; queue 98, 183, 37, 122, 14, 124, 65, 67. What is the FCFS total head movement?',
      options: ['236', '640', '382', '208'],
      answer: 1,
      explanation: '45 + 85 + 146 + 85 + 108 + 110 + 59 + 2 = 640 cylinders.',
    },
    {
      id: 'd3',
      prompt: 'Which algorithm can starve requests far from the head?',
      options: ['FCFS', 'SSTF', 'SCAN', 'C-SCAN'],
      answer: 1,
      explanation: 'SSTF keeps choosing nearby requests; distant ones may wait indefinitely under heavy load.',
    },
    {
      id: 'd4',
      prompt: 'How does C-SCAN differ from SCAN?',
      options: [
        'It services requests in both directions',
        'It services requests in one direction only, then returns to the start',
        'It always picks the nearest request',
        'It does not go to the disk ends',
      ],
      answer: 1,
      explanation: 'C-SCAN treats the cylinders as a circle: it sweeps one way, then jumps back without servicing.',
    },
    {
      id: 'd5',
      prompt: 'Seek time is the time needed to…',
      options: ['Rotate the sector under the head', 'Move the head to the correct cylinder', 'Transfer the data', 'Queue the request'],
      answer: 1,
      explanation: 'Seek time is arm movement; rotational latency and transfer time are separate components.',
    },
    {
      id: 'd6',
      prompt: 'LOOK improves on SCAN by…',
      options: ['Reversing at the last request instead of the disk end', 'Using priorities', 'Sorting requests by arrival', 'Never reversing'],
      answer: 0,
      explanation: 'LOOK only goes as far as the final request in each direction, saving needless travel.',
    },
  ],
};
