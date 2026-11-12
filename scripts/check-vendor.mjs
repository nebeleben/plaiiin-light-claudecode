#!/usr/bin/env node
// Fails when mcp/vendor/shade-runtime.js differs from the canonical lampos/portal/shade-runtime.js.
// The published plugin repo has no lampos/ tree: then it only warns and passes.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const mcp = join(dirname(fileURLToPath(import.meta.url)), '..');
const vendored = join(mcp, 'vendor', 'shade-runtime.js');
const canonical = join(mcp, '..', 'lampos', 'portal', 'shade-runtime.js');

if (!existsSync(canonical)) {
  console.warn(`check-vendor: skipped — ${canonical} not found (not in the plaiiinlightOS repo)`);
  process.exit(0);
}
if (!existsSync(vendored) || !readFileSync(vendored).equals(readFileSync(canonical))) {
  console.error('check-vendor: mcp/vendor/shade-runtime.js differs from lampos/portal/shade-runtime.js — copy the canonical file over it (never edit the copy)');
  process.exit(1);
}
console.log('check-vendor: vendor/shade-runtime.js is identical to lampos/portal/shade-runtime.js');
