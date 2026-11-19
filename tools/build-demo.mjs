// Builds the standalone OS Lab demo: the real apps/web feature code bundled with
// esbuild behind a hash-router adapter, with Tailwind v4 compiled from the same
// globals.css. Output: dist/os-lab-demo.html (single self-contained file).
//
// Usage: node tools/build-demo.mjs [node_modules dir containing esbuild, react, tailwindcss…]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nm = path.resolve(process.argv[2] ?? path.join(root, 'node_modules'));
const require = createRequire(path.join(nm, 'noop.js'));
const esbuild = require('esbuild');
const { compile } = await import(pathToFileURL(path.join(nm, 'tailwindcss/dist/lib.mjs')).href);

const web = path.join(root, 'apps/web');
const result = await esbuild.build({
  entryPoints: [path.join(web, 'demo/main.tsx')],
  bundle: true,
  write: false,
  format: 'iife',
  minify: true,
  target: 'es2020',
  jsx: 'automatic',
  nodePaths: [nm],
  alias: {
    '@os-lab/engine': path.join(root, 'packages/engine/src/index.ts'),
  },
  plugins: [
    {
      name: 'at-alias',
      setup(b) {
        b.onResolve({ filter: /^@\// }, async (args) => {
          const base = path.join(web, 'src', args.path.slice(2));
          for (const ext of ['.tsx', '.ts', '/index.tsx', '/index.ts']) if (fs.existsSync(base + ext)) return { path: base + ext };
          return { errors: [{ text: `Cannot resolve ${args.path}` }] };
        });
      },
    },
  ],
  define: { 'process.env.NODE_ENV': '"production"', 'process.env.NEXT_PUBLIC_API_URL': '""' },
  logLevel: 'warning',
});
const js = result.outputFiles[0].text;

// Tailwind: collect candidate tokens from all source files (what Tailwind's scanner does).
const files = [];
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
  const p = path.join(d, e.name);
  if (e.isDirectory()) walk(p);
  else if (/\.(tsx?|css)$/.test(e.name)) files.push(p);
});
walk(path.join(web, 'src'));
walk(path.join(web, 'demo'));
const candidates = new Set();
for (const f of files) for (const m of fs.readFileSync(f, 'utf8').matchAll(/[^\s"'`{}<>;=]+/g)) { candidates.add(m[0]); candidates.add(m[0].replace(/[,)]+$/, '')); }

const twBase = path.join(nm, 'tailwindcss');
const compiler = await compile(fs.readFileSync(path.join(web, 'src/app/globals.css'), 'utf8'), {
  base: web,
  loadStylesheet: async (id) => {
    const file = id === 'tailwindcss' ? 'index.css' : id.replace(/^tailwindcss\//, '');
    return { path: path.join(twBase, file), base: twBase, content: fs.readFileSync(path.join(twBase, file), 'utf8') };
  },
});
const css = compiler.build([...candidates]);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>OS Lab — Interactive Operating Systems Simulator</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500;600&family=Source+Sans+3:wght@400;500;600;700&display=swap" />
<meta name="description" content="Learn operating system concepts through interactive simulations of process management, CPU scheduling, memory allocation, page replacement and disk scheduling." />
<style>${css}</style>
</head>
<body>
<div id="root"></div>
<script>${js.replace(/<\/script/g, '<\\/script')}</script>
</body>
</html>`;
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/os-lab-demo.html'), html);
console.log(`dist/os-lab-demo.html  ${(html.length / 1024).toFixed(0)} KB  (js ${(js.length / 1024).toFixed(0)} KB, css ${(css.length / 1024).toFixed(0)} KB)`);
