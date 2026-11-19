// Offline test runner: bundles the Vitest-style engine tests with esbuild, aliasing
// 'vitest' to a node:test shim, then runs them with `node --test`.
// Usage: node tools/run-engine-tests.mjs [path/to/esbuild]
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const esbuild = require(process.argv[2] ?? 'esbuild');
const out = path.join(root, 'tools/.tmp/engine.test.mjs');

await esbuild.build({
  entryPoints: [path.join(root, 'packages/engine/test/engine.test.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: out,
  alias: { vitest: path.join(root, 'tools/vitest-shim.ts') },
  logLevel: 'warning',
});
execFileSync(process.execPath, ['--test', out], { stdio: 'inherit' });
