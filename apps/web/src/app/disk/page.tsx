import type { Metadata } from 'next';
import { DiskSimulator } from '@/features/disk/disk-simulator';

export const metadata: Metadata = { title: 'Disk Scheduling' };
export default function Page() {
  return <DiskSimulator />;
}
