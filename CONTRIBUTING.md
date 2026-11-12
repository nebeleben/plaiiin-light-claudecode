# Working on the plugin

The plugin is developed in a private mono-repo and mirrored here; issues and pull requests are
welcome here all the same.

It is a local [MCP](https://modelcontextprotocol.io) server (stdio, Node ≥ 20) plus skills and
commands, packaged as a Claude Code plugin.

```
src/                     server source (TypeScript)
test/                    vitest suites (fake lamp, stdio, packaging, release commit)
vendor/shade-runtime.js  the lamps' script runtime, copied from the firmware's web portal
plugin/                  the Claude Code plugin
  .claude-plugin/plugin.json
  .mcp.json              starts node ${CLAUDE_PLUGIN_ROOT}/dist/index.js
  skills/                compose-effect, draw-image, scenes, fleet-ota, lamp-access
  commands/              /plaiiin-lamps:lamps, /plaiiin-lamps:compose
  dist/                  built bundle (git-ignored on the source branch)
.claude-plugin/marketplace.json   marketplace "plaiiin-lamps" with the one plugin
scripts/                 notices generator, release commit, vendor check, live smoke test
```

## Build and test

```sh
npm ci
npm test            # checks the vendored runtime, then all vitest suites (builds the bundle too)
npm run typecheck
npm run build       # → plugin/dist/index.js, plugin/dist/preview-worker.mjs, plugin/THIRD-PARTY-NOTICES.txt
claude plugin validate ./plugin && claude plugin validate .
```

The plugin ships the bundled `dist/` and no `package.json`/`node_modules`: Node is the only runtime
requirement. The build is reproducible: the same source gives the same bytes on macOS and Linux.

`npm test` starts with `scripts/check-vendor.mjs`, which compares `vendor/shade-runtime.js` with
the firmware's copy. Outside the mono-repo that copy is absent and the check only prints a warning.

## Install from a checkout

```sh
npm ci && npm run build
claude plugin marketplace add "$PWD"
claude plugin install plaiiin-lamps@plaiiin-lamps
```

Installing copies the plugin, with the built `dist/`, into Claude Code's plugin cache. After
rebuilding, run `claude plugin marketplace update plaiiin-lamps` and
`claude plugin update plaiiin-lamps@plaiiin-lamps` (bump `version` in `plugin.json` if the update
says it is current), then restart Claude Code.

`PLAIIIN_LAMPS_DIR` overrides the state directory `~/.plaiiin/lamps` (the tests and the smoke
script use a temporary one). On systems other than macOS, keys go to `secrets.json` (mode 0600) in
that directory instead of a keychain.

## Live smoke test

```sh
npm run build
node scripts/smoke.mjs <lamp-address>
```

Spawns the built server with a temporary `PLAIIIN_LAMPS_DIR`, discovers the lamp at that address
(it must be unpaired), reads info/scenes/swarm/firmware, previews and validates a tiny script, and
changes brightness and restores it. It uploads, deletes, pairs, renames and updates nothing.

## Releasing

Releases are cut in the private mono-repo:

1. Set the new version in `plugin/.claude-plugin/plugin.json` and `package.json`, refresh
   `package-lock.json` (`npm install --package-lock-only`), and update the version asserted in
   `test/packaging.test.ts`. Commit.
2. Tag that commit `claudecode-vX.Y.Z` and push the tag.

The mirror workflow then filters the history to this repository's `source` branch, runs the type
check and the tests, builds, and calls `scripts/release-commit.sh`, which pushes one commit (source
plus bundle plus notices) to `main` together with the tag `vX.Y.Z`. Here, `ci` and `release`
rebuild the bundle and compare; `release` then creates the GitHub Release.

The three version numbers and the tag must agree, or nothing is published. A published version is
never released again: fix forward with a new version. Users only receive a release when the
version in `plugin.json` changes.
