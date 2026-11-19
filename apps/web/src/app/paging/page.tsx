import type { Metadata } from 'next';
import { PagingSimulator } from '@/features/paging/paging-simulator';

export const metadata: Metadata = { title: 'Page Replacement' };
export default function Page() {
  return <PagingSimulator />;
}
