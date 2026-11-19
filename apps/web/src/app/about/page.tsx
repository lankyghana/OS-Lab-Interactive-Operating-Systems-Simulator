import type { Metadata } from 'next';
import { AboutPage } from '@/features/about/about-page';

export const metadata: Metadata = { title: 'About', description: 'The developer behind OS Lab, why it exists, and how it is built.' };
export default function Page() {
  return <AboutPage />;
}
