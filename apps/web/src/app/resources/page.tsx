import type { Metadata } from 'next';
import { ResourcesPage } from '@/features/resources/resources-page';

export const metadata: Metadata = {
  title: 'Resources',
  description: 'Hand-picked operating systems books, courses, videos and references.',
};

export default async function Page({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const { topic } = await searchParams;
  return <ResourcesPage initialTopic={topic} />;
}
