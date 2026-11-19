/**
 * Clients record activity locally first (guest mode / offline) and send the original
 * timestamp so that local and server histories can be merged without duplicates.
 * Accept it only if it is a valid date that is not in the future.
 */
export function clientTimestamp(at?: string): Date {
  if (!at) return new Date();
  const d = new Date(at);
  if (Number.isNaN(d.getTime()) || d.getTime() > Date.now() + 60_000) return new Date();
  return d;
}
