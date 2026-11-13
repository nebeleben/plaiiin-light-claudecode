// The packaging folders this tree can build. Every target ships the same server bundle, the same
// third-party notices and the same skills; what differs is the manifest each assistant reads.
// A public repo carries only its own target's folder, so everything here works on "the targets
// that are present" and never assumes both.
import { existsSync } from 'node:fs';
import { join } from 'node:path';

/** @typedef {{ name: string, dir: string, manifest: string }} Target */

/** @type {Target[]} */
export const TARGETS = [
  { name: 'claudecode', dir: 'plugin', manifest: 'plugin/.claude-plugin/plugin.json' },
  { name: 'chatgpt', dir: 'plugin-chatgpt', manifest: 'plugin-chatgpt/.codex-plugin/plugin.json' },
];

/** The targets whose manifest exists under `root`. @returns {Target[]} */
export function presentTargets(root) {
  return TARGETS.filter((t) => existsSync(join(root, t.manifest)));
}
