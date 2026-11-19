import type { Metadata } from 'next';
import { CpuSimulator } from '@/features/cpu/cpu-simulator';

export const metadata: Metadata = { title: 'CPU Scheduling' };
export default function Page() {
  return <CpuSimulator />;
}
