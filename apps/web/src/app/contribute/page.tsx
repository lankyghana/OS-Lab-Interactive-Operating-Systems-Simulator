import type { Metadata } from 'next';
import { ContributePage } from '@/features/contribute/contribute-page';

export const metadata: Metadata = { title: 'Contribute', description: 'How to set up OS Lab locally and contribute code, content and resources.' };
export default function Page() {
  return <ContributePage />;
}
