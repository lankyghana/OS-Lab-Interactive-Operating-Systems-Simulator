'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { AppLink, useNavigate } from '@/lib/router';
import { api, apiEnabled, googleSignInUrl, type ApiUser } from '@/lib/api';
import { progress } from '@/lib/progress';
import { IconGoogle } from '@/components/icons';

type Mode = 'sign-in' | 'sign-up';

export function AuthPage({ mode }: { mode: Mode }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const enabled = apiEnabled();
  const signUp = mode === 'sign-up';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (signUp && password.length < 8) return setError('Use at least 8 characters for your password.');
    setBusy(true);
    try {
      const res = await api<{ accessToken: string; user: ApiUser }>(signUp ? '/auth/register' : '/auth/login', {
        method: 'POST',
        body: JSON.stringify(signUp ? { name, email, password } : { email, password }),
      });
      await progress.signedIn(res.user, res.accessToken);
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-[960px] overflow-hidden rounded-3xl border border-line bg-surface shadow-sm md:grid-cols-2">
      <div className="lab-grid hidden flex-col justify-between p-8 text-lab-text md:flex">
        <p className="font-mono text-[11px] text-signal">OS Lab</p>
        <div>
          <p className="text-2xl font-bold leading-snug">Your lab notebook, everywhere.</p>
          <ul className="mt-4 flex flex-col gap-2 text-sm text-lab-dim">
            <li>▸ Save simulation history</li>
            <li>▸ Track learning progress</li>
            <li>▸ Keep favourite algorithms</li>
            <li>▸ Continue exercises on any device</li>
          </ul>
        </div>
        <p className="font-mono text-[11px] text-lab-dim">All simulators remain free to use without an account.</p>
      </div>
      <Card className="rounded-none border-0 shadow-none">
        <CardContent className="p-6 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight">{signUp ? 'Create your account' : 'Sign in'}</h1>
          <p className="mt-1 text-sm text-muted">
            {signUp ? 'Already have an account? ' : 'New to OS Lab? '}
            <AppLink href={signUp ? '/sign-in' : '/sign-up'} className="font-medium text-brand hover:underline">
              {signUp ? 'Sign in' : 'Create an account'}
            </AppLink>
          </p>

          {!enabled && (
            <Alert tone="warn" className="mt-5" title="Accounts aren’t available in this preview">
              This build runs without the OS Lab server, so you are in guest mode and your progress is saved in this browser. Set <code>NEXT_PUBLIC_API_URL</code> to enable
              sign-in.
            </Alert>
          )}

          <Button
            variant="outline"
            className="mt-6 w-full"
            size="lg"
            disabled={!enabled}
            onClick={() => {
              window.location.href = googleSignInUrl();
            }}
          >
            <IconGoogle /> Continue with Google
          </Button>
          <div className="my-5 flex items-center gap-3 text-xs text-faint">
            <span className="h-px flex-1 bg-line" /> or with email <span className="h-px flex-1 bg-line" />
          </div>
          <form onSubmit={submit} className="flex flex-col gap-4">
            {signUp && (
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input id="name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} disabled={!enabled} />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={!enabled} />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={signUp ? 'new-password' : 'current-password'}
                required
                minLength={signUp ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!enabled}
              />
              {signUp && <p className="mt-1 text-xs text-muted">At least 8 characters.</p>}
            </div>
            {error && <Alert tone="error">{error}</Alert>}
            <Button type="submit" size="lg" disabled={!enabled || busy}>
              {busy ? 'Please wait…' : signUp ? 'Create account' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

/** Landing page for the Google OAuth redirect: /auth/callback#token=… */
export function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get('token');
    if (!token) {
      setError('Sign-in was cancelled or failed. Please try again.');
      return;
    }
    api<ApiUser>('/me', { token })
      .then(async (user) => {
        await progress.signedIn(user, token);
        navigate('/');
      })
      .catch((e: Error) => setError(e.message));
  }, [navigate]);
  return error ? (
    <Alert tone="error" title="Couldn’t sign you in">
      {error}{' '}
      <AppLink href="/sign-in" className="underline">
        Back to sign in
      </AppLink>
    </Alert>
  ) : (
    <p className="text-muted">Signing you in…</p>
  );
}
