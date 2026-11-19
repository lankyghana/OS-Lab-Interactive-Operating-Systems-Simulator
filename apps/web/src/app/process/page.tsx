import type { Metadata } from 'next';
import { ProcessSimulator } from '@/features/process/process-simulator';

export const metadata: Metadata = { title: 'Process Management' };
export default function Page() {
  return <ProcessSimulator />;
}
