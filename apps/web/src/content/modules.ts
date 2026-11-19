import type { ModuleId } from '@/lib/progress';

export interface ModuleInfo {
  id: ModuleId;
  name: string;
  short: string;
  href: string;
  tagline: string;
  description: string;
  algorithms: string[];
  priority: 'Critical' | 'High' | 'Medium';
}

export const MODULES: ModuleInfo[] = [
  {
    id: 'process',
    name: 'Process Management',
    short: 'Processes',
    href: '/process',
    tagline: 'Create processes and drive them through their life cycle.',
    description:
      'Explore the five-state process model. Create processes, admit, dispatch, block and terminate them, and watch the ready and waiting queues change.',
    algorithms: ['Five-state model'],
    priority: 'High',
  },
  {
    id: 'cpu',
    name: 'CPU Scheduling',
    short: 'CPU',
    href: '/cpu',
    tagline: 'See how the scheduler decides who runs next.',
    description: 'Run FCFS, SJF, SRTF, Priority and Round Robin on your own workloads, watch the Gantt chart build, and compare waiting times.',
    algorithms: ['FCFS', 'SJF', 'SRTF', 'Priority', 'Round Robin'],
    priority: 'Critical',
  },
  {
    id: 'memory',
    name: 'Memory Management',
    short: 'Memory',
    href: '/memory',
    tagline: 'Place processes into memory holes.',
    description: 'Allocate processes with First Fit, Best Fit and Worst Fit, and measure the fragmentation each strategy leaves behind.',
    algorithms: ['First Fit', 'Best Fit', 'Worst Fit'],
    priority: 'High',
  },
  {
    id: 'paging',
    name: 'Page Replacement',
    short: 'Paging',
    href: '/paging',
    tagline: 'Decide which page leaves memory on a fault.',
    description: "Trace a reference string through FIFO, LRU and Optimal replacement, count page faults and discover Belady's anomaly.",
    algorithms: ['FIFO', 'LRU', 'Optimal'],
    priority: 'High',
  },
  {
    id: 'disk',
    name: 'Disk Scheduling',
    short: 'Disk',
    href: '/disk',
    tagline: 'Minimise how far the disk head travels.',
    description: 'Service cylinder requests with FCFS, SSTF, SCAN and C-SCAN, and compare the total head movement of each strategy.',
    algorithms: ['FCFS', 'SSTF', 'SCAN', 'C-SCAN'],
    priority: 'Medium',
  },
];

export const moduleById = (id: ModuleId) => MODULES.find((m) => m.id === id)!;
