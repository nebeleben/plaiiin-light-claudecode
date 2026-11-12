import { readFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { build } from 'esbuild';
import { writeNotices } from './scripts/notices.mjs';

/** `import text from './file?raw'` → the file's text (the same suffix Vite/vitest understand). */
const raw = {
  name: 'raw',
  setup(b) {
    // path stays relative so the bundle doesn't carry this machine's directory names
    b.onResolve({ filter: /\?raw$/ }, (a) => {
      const abs = resolve(dirname(a.importer), a.path.slice(0, -4));
      return { path: relative(process.cwd(), abs), namespace: 'raw', pluginData: abs };
    });
    b.onLoad({ filter: /.*/, namespace: 'raw' }, async (a) => ({ contents: await readFile(a.pluginData, 'utf8'), loader: 'text' }));
  },
};

const server = await build({
  metafile: true,
  entryPoints: ['src/index.ts'],
  outfile: 'plugin/dist/index.js',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  plugins: [raw],
  // CJS dependencies (pngjs, bonjour-service, …) call require() for Node built-ins.
  banner: { js: "#!/usr/bin/env node\nimport { createRequire as __cr } from 'node:module';\nconst require = __cr(import.meta.url);" },
  legalComments: 'none',
});

// The preview worker runs as its own process (src/preview/shade.ts finds it next to index.js).
const worker = await build({
  metafile: true,
  entryPoints: ['src/preview/preview-worker.mjs'],
  outfile: 'plugin/dist/preview-worker.mjs',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  legalComments: 'none',
});

// legalComments are stripped above; the bundled packages' licence notices ship in this file instead.
await writeNotices([server.metafile, worker.metafile], 'plugin/THIRD-PARTY-NOTICES.txt');
