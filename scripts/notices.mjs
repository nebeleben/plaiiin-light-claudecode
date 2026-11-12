// Writes the licence notices of every npm package that esbuild bundled into plugin/dist/.
// The bundle is built with legalComments: 'none', so this file is where those notices ship.
// The output depends only on the packages' own files: no dates, no absolute paths, fixed order.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const MARK = 'node_modules/';

/** `a/node_modules/@scope/pkg/lib/x.js` → `a/node_modules/@scope/pkg` (the innermost package). */
function packageDir(input) {
  const at = input.lastIndexOf(MARK);
  if (at < 0) return undefined;
  const parts = input.slice(at + MARK.length).split('/');
  const name = parts[0].startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
  return input.slice(0, at + MARK.length) + name;
}

const byCodeUnit = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

async function licenceText(dir) {
  const names = (await readdir(dir)).filter((n) => /^(licen[sc]e|copying)/i.test(n)).sort(byCodeUnit);
  if (!names.length) return undefined;
  return (await readFile(join(dir, names[0]), 'utf8')).replace(/\r\n/g, '\n').trim();
}

/**
 * @param {import('esbuild').Metafile[]} metafiles  from every build that lands in plugin/dist/
 * @param {string} outFile
 */
export async function writeNotices(metafiles, outFile) {
  const dirs = new Set();
  for (const m of metafiles) for (const input of Object.keys(m.inputs)) {
    const d = packageDir(input.replace(/\\/g, '/'));
    if (d) dirs.add(d);
  }
  const packages = new Map();   // name@version → { licence, text }
  for (const dir of dirs) {
    const pkg = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'));
    if (!pkg.name || !pkg.version) continue;   // a nested package.json that only sets "type"
    const id = `${pkg.name}@${pkg.version}`;
    if (!packages.has(id)) packages.set(id, { licence: typeof pkg.license === 'string' ? pkg.license : 'see below', text: await licenceText(dir) });
  }
  const rule = '-'.repeat(78);
  const out = ['The files in dist/ bundle the following third-party packages. Their licence notices follow.', ''];
  for (const id of [...packages.keys()].sort(byCodeUnit)) {
    const p = packages.get(id);
    out.push(rule, id, `License: ${p.licence}`, '', p.text ?? '(the package ships no licence file)', '');
  }
  await writeFile(outFile, out.join('\n'));
}
