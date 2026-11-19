import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <p className="font-mono text-sm text-brand">404 · page fault</p>
      <h1 className="mt-2 text-3xl font-bold">This page isn’t in memory.</h1>
      <Link href="/" className="mt-6 inline-block rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-canvas">
        Back to the dashboard
      </Link>
    </div>
  );
}
