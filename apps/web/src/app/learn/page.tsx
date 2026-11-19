import type { Metadata } from 'next';
import { LearnIndex } from '@/features/learn/learn-pages';

export const metadata: Metadata = { title: 'Learn' };
export default function Page() {
  return <LearnIndex />;
}
