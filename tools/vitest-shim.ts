// Minimal Vitest-compatible shim so the engine tests can run with `node --test`
// in environments without Vitest installed (used by tools/run-engine-tests.mjs).
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

export { describe, it };

export function expect(actual: any) {
  return {
    toBe: (e: any) => assert.equal(actual, e),
    toEqual: (e: any) => assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), JSON.parse(JSON.stringify(e))),
    toHaveLength: (n: number) => assert.equal(actual.length, n),
    toBeGreaterThan: (n: number) => assert.ok(actual > n, `${actual} > ${n}`),
    toBeLessThanOrEqual: (n: number) => assert.ok(actual <= n, `${actual} <= ${n}`),
    toThrow: (m?: any) => {
      if (m && typeof m === 'function' && !(m instanceof RegExp)) assert.throws(actual, (err: any) => err instanceof m);
      else assert.throws(actual, m);
    },
  };
}
