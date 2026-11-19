import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TopicPage } from '@/features/learn/learn-pages';
import { TOPICS, topicBySlug } from '@/content/topics';

export function generateStaticParams() {
  return TOPICS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = topicBySlug(slug);
  return t ? { title: t.title, description: t.summary } : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!topicBySlug(slug)) notFound();
  return <TopicPage slug={slug} />;
}
