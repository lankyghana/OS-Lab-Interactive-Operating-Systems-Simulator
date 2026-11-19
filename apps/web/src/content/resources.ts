import type { ModuleId } from '@/lib/progress';

/**
 * Curated learning resources. Links verified November 2026.
 * Summaries are written for OS Lab; prices, editions and availability can change,
 * so the page says so and every entry links to the official source.
 */

export type ResourceKind = 'book' | 'course' | 'video' | 'reference' | 'tool';
export type ResourceLevel = 'beginner' | 'intermediate' | 'advanced';
export type ResourceTopic = ModuleId | 'concurrency' | 'deadlock' | 'file-systems' | 'kernel' | 'overview';

export interface Resource {
  id: string;
  title: string;
  by: string;
  kind: ResourceKind;
  level: ResourceLevel;
  free: boolean;
  url: string;
  summary: string;
  useFor: string;
  topics: ResourceTopic[];
  note?: string;
}

export const KIND_LABEL: Record<ResourceKind, string> = {
  book: 'Book',
  course: 'Course',
  video: 'Video series',
  reference: 'Reference',
  tool: 'Hands-on',
};

export const TOPIC_LABEL: Record<ResourceTopic, string> = {
  overview: 'Whole subject',
  process: 'Processes',
  cpu: 'CPU scheduling',
  memory: 'Memory',
  paging: 'Virtual memory',
  disk: 'Disk & storage',
  concurrency: 'Concurrency',
  deadlock: 'Deadlocks',
  'file-systems': 'File systems',
  kernel: 'Kernels & internals',
};

export const RESOURCES: Resource[] = [
  // ── Books ───────────────────────────────────────────────
  {
    id: 'ostep',
    title: 'Operating Systems: Three Easy Pieces',
    by: 'Remzi and Andrea Arpaci-Dusseau',
    kind: 'book',
    level: 'beginner',
    free: true,
    url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/',
    summary:
      'A friendly, conversational textbook organised around three ideas: virtualisation, concurrency and persistence. Every chapter is a free PDF and ends with homework you can run.',
    useFor: 'Your main free textbook. Read the matching chapter alongside each OS Lab simulator.',
    topics: ['overview', 'process', 'cpu', 'memory', 'paging', 'disk', 'concurrency', 'file-systems'],
    note: 'Version 1.10. Free PDFs; printed copies are also sold.',
  },
  {
    id: 'os-concepts',
    title: 'Operating System Concepts (10th edition)',
    by: 'Silberschatz, Galvin and Gagne',
    kind: 'book',
    level: 'beginner',
    free: false,
    url: 'https://os-book.com/OS10/',
    summary:
      'The "dinosaur book", the most widely prescribed OS textbook. Its companion site offers free chapter slides and solutions to the practice exercises.',
    useFor: 'If your course prescribes it. The free slides and practice solutions are useful even without the book.',
    topics: ['overview', 'process', 'cpu', 'memory', 'paging', 'disk', 'concurrency', 'deadlock', 'file-systems'],
  },
  {
    id: 'tanenbaum',
    title: 'Modern Operating Systems (5th edition)',
    by: 'Andrew S. Tanenbaum and Herbert Bos',
    kind: 'book',
    level: 'intermediate',
    free: false,
    url: 'https://www.pearson.com/store/p/modern-operating-systems/P200000003295',
    summary:
      'A classic, readable text with case studies of Unix/Linux/Android and Windows 11, plus chapters on virtualisation, the cloud and security.',
    useFor: 'Seeing how the concepts appear in real systems, and broader coverage of security and multiprocessors.',
    topics: ['overview', 'process', 'memory', 'paging', 'deadlock', 'file-systems', 'kernel'],
  },
  {
    id: 'ospp',
    title: 'Operating Systems: Principles and Practice (2nd edition)',
    by: 'Thomas Anderson and Michael Dahlin',
    kind: 'book',
    level: 'intermediate',
    free: false,
    url: 'https://ospp.cs.washington.edu/',
    summary:
      'A first-course textbook that goes from high-level concepts down to working code, with a strong, practical treatment of concurrency. Used by Berkeley CS162.',
    useFor: 'Writing correct concurrent code, and connecting theory to implementation.',
    topics: ['overview', 'process', 'cpu', 'concurrency', 'memory', 'file-systems'],
  },
  {
    id: 'xv6-book',
    title: 'xv6: a simple, Unix-like teaching operating system',
    by: 'Russ Cox, Frans Kaashoek and Robert Morris (MIT)',
    kind: 'book',
    level: 'advanced',
    free: true,
    url: 'https://pdos.csail.mit.edu/6.828/2024/xv6.html',
    summary:
      'A short book that explains a complete small kernel line by line: system calls, traps, page tables, scheduling, locks and the file system, all on RISC-V.',
    useFor: 'Seeing exactly how a real kernel implements what the simulators show.',
    topics: ['kernel', 'process', 'cpu', 'paging', 'concurrency', 'file-systems'],
  },
  {
    id: 'semaphores',
    title: 'The Little Book of Semaphores',
    by: 'Allen B. Downey',
    kind: 'book',
    level: 'intermediate',
    free: true,
    url: 'https://greenteapress.com/wp/semaphores/',
    summary:
      'A free, puzzle-driven book on synchronisation. Each classic problem (producer–consumer, readers–writers, dining philosophers) comes with a hint before the solution.',
    useFor: 'Practising synchronisation until it clicks. A good fit for exam preparation.',
    topics: ['concurrency', 'deadlock'],
    note: 'Creative Commons licensed (CC BY-NC-SA).',
  },
  {
    id: 'csapp',
    title: 'Computer Systems: A Programmer’s Perspective',
    by: 'Randal E. Bryant and David R. O’Hallaron',
    kind: 'book',
    level: 'intermediate',
    free: false,
    url: 'https://csapp.cs.cmu.edu/',
    summary:
      'Explains how programs actually run: processes, exceptions, virtual memory, linking and system-level I/O, seen from the programmer’s side.',
    useFor: 'Filling gaps in computer organisation that OS courses assume you already know.',
    topics: ['process', 'memory', 'paging', 'kernel'],
  },

  // ── Courses ────────────────────────────────────────────
  {
    id: 'mit-61810',
    title: 'MIT 6.1810: Operating System Engineering',
    by: 'MIT PDOS',
    kind: 'course',
    level: 'advanced',
    free: true,
    url: 'https://pdos.csail.mit.edu/6.828/2025/index.html',
    summary:
      'MIT’s OS course: lectures, notes and labs in which you extend xv6 with features such as system calls, virtual-memory tricks and networking.',
    useFor: 'The best free path from understanding an OS to building one.',
    topics: ['kernel', 'process', 'paging', 'concurrency', 'file-systems'],
  },
  {
    id: 'mit-ocw',
    title: 'MIT OpenCourseWare: 6.1810 (Fall 2023)',
    by: 'MIT OpenCourseWare',
    kind: 'course',
    level: 'advanced',
    free: true,
    url: 'https://ocw.mit.edu/courses/6-1810-operating-system-engineering-fall-2023',
    summary: 'An archived, self-paced copy of the MIT course with its syllabus and materials in one place.',
    useFor: 'Following the MIT course at your own pace.',
    topics: ['kernel', 'overview'],
  },
  {
    id: 'cs162',
    title: 'Berkeley CS162: Operating Systems and Systems Programming',
    by: 'UC Berkeley EECS',
    kind: 'course',
    level: 'intermediate',
    free: true,
    url: 'https://inst.eecs.berkeley.edu/~cs162',
    summary:
      'Berkeley’s core OS course. Past offerings publish lecture slides, recordings and section worksheets covering processes, synchronisation, scheduling, memory and file systems.',
    useFor: 'Lecture slides and worked section problems that match a university syllabus closely.',
    topics: ['overview', 'process', 'cpu', 'concurrency', 'memory', 'file-systems'],
    note: 'Redirects to the current term; older terms are linked from the archive.',
  },
  {
    id: 'nptel',
    title: 'NPTEL: Operating System',
    by: 'Prof. Sorav Bansal, IIT Delhi',
    kind: 'course',
    level: 'intermediate',
    free: true,
    url: 'https://onlinecourses.nptel.ac.in/noc21_cs44/preview',
    summary: 'A 12-week university course on OS design and implementation, taught using xv6, with recorded lectures.',
    useFor: 'A complete lecture course if you prefer a structured, semester-style pace.',
    topics: ['overview', 'kernel', 'process', 'memory', 'concurrency'],
  },

  // ── Videos ─────────────────────────────────────────────
  {
    id: 'fcc-os',
    title: 'Operating Systems: Comprehensive Course for Beginners',
    by: 'freeCodeCamp (Kshitij Sharma)',
    kind: 'video',
    level: 'beginner',
    free: true,
    url: 'https://www.freecodecamp.org/news/learn-about-operating-systems-in-depth/',
    summary: 'A free, 25-hour academic-style course on YouTube covering the full undergraduate syllabus, including the numerical problems.',
    useFor: 'Long-form video explanations from first principles.',
    topics: ['overview', 'process', 'cpu', 'memory', 'paging', 'disk', 'concurrency', 'deadlock'],
    note: 'Assumes basic C and computer organisation.',
  },
  {
    id: 'gate-smashers',
    title: 'Operating System (full playlist)',
    by: 'Gate Smashers',
    kind: 'video',
    level: 'beginner',
    free: true,
    url: 'https://www.youtube.com/playlist?list=PLxCzCOWd7aiGz9donHRrE9I3Mwn6XdP8p',
    summary:
      'Short, exam-focused videos with many solved numericals on scheduling, paging, page replacement and disk scheduling.',
    useFor: 'Quick revision before exams, and seeing many worked examples.',
    topics: ['cpu', 'memory', 'paging', 'disk', 'deadlock', 'process'],
    note: 'Taught mainly in Hindi with English terms; some videos have English subtitles.',
  },
  {
    id: 'iitd-sarangi',
    title: 'Operating Systems lecture videos',
    by: 'Prof. Smruti R. Sarangi, IIT Delhi',
    kind: 'video',
    level: 'intermediate',
    free: true,
    url: 'https://www.cse.iitd.ac.in/~srsarangi/os-videos.html',
    summary: 'Chapter-by-chapter lecture videos on OS services, system calls, processes and beyond, with a focus on how Linux does it.',
    useFor: 'Going a level deeper into how real kernels implement each concept.',
    topics: ['overview', 'process', 'kernel', 'memory'],
  },

  // ── References & hands-on ──────────────────────────────
  {
    id: 'ostep-homework',
    title: 'OSTEP homework simulators',
    by: 'Remzi Arpaci-Dusseau',
    kind: 'tool',
    level: 'beginner',
    free: true,
    url: 'https://github.com/remzi-arpacidusseau/ostep-homework',
    summary:
      'Small Python simulators that generate unlimited practice problems and check your answers: scheduling, MLFQ, paging, free-space management, disks and more.',
    useFor: 'Extra practice in the terminal, the same idea as OS Lab’s Practice page.',
    topics: ['cpu', 'memory', 'paging', 'disk', 'process'],
  },
  {
    id: 'phil-opp',
    title: 'Writing an OS in Rust',
    by: 'Philipp Oppermann',
    kind: 'tool',
    level: 'advanced',
    free: true,
    url: 'https://os.phil-opp.com/',
    summary: 'A step-by-step blog series that builds a small x86-64 kernel in Rust: booting, interrupts, paging, heap allocation and async tasks.',
    useFor: 'A guided project if you want to build your own kernel.',
    topics: ['kernel', 'paging', 'memory'],
  },
  {
    id: 'osdev',
    title: 'OSDev Wiki',
    by: 'OSDev community',
    kind: 'reference',
    level: 'advanced',
    free: true,
    url: 'https://wiki.osdev.org/',
    summary: 'A community wiki covering everything needed to write an OS from scratch: boot process, hardware, memory management, tutorials and common pitfalls.',
    useFor: 'Low-level details when you start building your own OS.',
    topics: ['kernel', 'memory', 'disk'],
  },
  {
    id: 'kernel-docs',
    title: 'The Linux Kernel documentation',
    by: 'Linux kernel community',
    kind: 'reference',
    level: 'advanced',
    free: true,
    url: 'https://docs.kernel.org/',
    summary: 'The official documentation for Linux, including design notes on its scheduler, memory management and block layer.',
    useFor: 'Seeing how a production OS solves the problems you have simulated.',
    topics: ['kernel', 'cpu', 'memory', 'disk'],
  },
  {
    id: 'man-pages',
    title: 'Linux man-pages',
    by: 'Michael Kerrisk (man7.org)',
    kind: 'reference',
    level: 'intermediate',
    free: true,
    url: 'https://man7.org/linux/man-pages/',
    summary: 'The authoritative reference for Linux system calls and library functions such as fork, exec, wait, mmap and pthread.',
    useFor: 'Looking up exactly what a system call does when you write real programs.',
    topics: ['process', 'concurrency', 'memory', 'file-systems'],
  },
];

export const resourceById = (id: string) => RESOURCES.find((r) => r.id === id);

/** Featured picks shown first on the Resources page. */
export const START_HERE = ['ostep', 'fcc-os', 'ostep-homework'];

/**
 * Chapter-level pointers for each Learn topic. OSTEP chapter PDFs are linked directly;
 * Operating System Concepts chapter numbers refer to the 10th edition.
 */
export interface ReadingPointer {
  resourceId: string;
  label: string;
  url?: string;
}

const OSTEP = 'https://pages.cs.wisc.edu/~remzi/OSTEP/';

const byModule: Record<ModuleId, ReadingPointer[]> = {
  process: [
    { resourceId: 'ostep', label: 'Chapter 4: The Abstraction: The Process', url: `${OSTEP}cpu-intro.pdf` },
    { resourceId: 'os-concepts', label: 'Chapter 3: Processes' },
    { resourceId: 'man-pages', label: 'fork(2), exec(3) and wait(2) on Linux', url: 'https://man7.org/linux/man-pages/man2/fork.2.html' },
  ],
  cpu: [
    { resourceId: 'ostep', label: 'Chapter 7: Scheduling: Introduction', url: `${OSTEP}cpu-sched.pdf` },
    { resourceId: 'ostep', label: 'Chapter 8: Multi-Level Feedback Queue', url: `${OSTEP}cpu-sched-mlfq.pdf` },
    { resourceId: 'os-concepts', label: 'Chapter 5: CPU Scheduling' },
    { resourceId: 'ostep-homework', label: 'scheduler.py and mlfq.py simulators', url: 'https://github.com/remzi-arpacidusseau/ostep-homework' },
  ],
  memory: [
    { resourceId: 'ostep', label: 'Chapter 17: Free-Space Management', url: `${OSTEP}vm-freespace.pdf` },
    { resourceId: 'os-concepts', label: 'Chapter 9: Main Memory (contiguous allocation)' },
  ],
  paging: [
    { resourceId: 'ostep', label: 'Chapter 18: Introduction to Paging', url: `${OSTEP}vm-paging.pdf` },
    { resourceId: 'ostep', label: 'Chapter 22: Swapping: Policies', url: `${OSTEP}vm-beyondphys-policy.pdf` },
    { resourceId: 'os-concepts', label: 'Chapter 10: Virtual Memory (page replacement)' },
  ],
  disk: [
    { resourceId: 'ostep', label: 'Chapter 37: Hard Disk Drives', url: `${OSTEP}file-disks.pdf` },
    { resourceId: 'os-concepts', label: 'Chapter 11: Mass-Storage Structure (HDD scheduling)' },
  ],
};

export const readingFor = (module: ModuleId) => byModule[module];
