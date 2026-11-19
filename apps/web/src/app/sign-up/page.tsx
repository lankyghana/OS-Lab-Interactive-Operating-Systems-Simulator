import type { Metadata } from 'next';
import { AuthPage } from '@/features/auth/auth-pages';

export const metadata: Metadata = { title: 'Create account' };
export default function Page() {
  return <AuthPage mode="sign-up" />;
}
