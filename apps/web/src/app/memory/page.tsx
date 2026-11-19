import type { Metadata } from 'next';
import { MemorySimulator } from '@/features/memory/memory-simulator';

export const metadata: Metadata = { title: 'Memory Management' };
export default function Page() {
  return <MemorySimulator />;
}
