# PlaiiinLight lamps — MCP server and Claude Code plugin

A local [MCP](https://modelcontextprotocol.io) server (stdio, Node ≥ 20) that lets Claude Code
control PlaiiinLight lamps on your LAN: fleet and access, power/colour/brightness, swarms, effect
scripts with a sandboxed local preview, images, scenes, live streaming and firmware updates. It
talks only to your lamps and, for firmware checks/downloads, to the GitHub releases of
`nebeleben/plaiiin-light`. No hosted service, no telemetry.

```
mcp/
  src/                     server source (TypeScript)
  test/                    vitest suites (fake lamp, stdio, packaging)
  plugin/                  the Claude Code plugin
    .claude-plugin/plugin.json
    .mcp.json              starts node ${CLAUDE_PLUGIN_ROOT}/dist/index.js
    skills/                compose-effect, draw-image, scenes, fleet-ota, lamp-access
    commands/              /plaiiin-lamps:lamps, /plaiiin-lamps:compose
    dist/                  built bundle (gitignored — run npm run build)
  .claude-plugin/marketplace.json   local marketplace "plaiiin" with the one plugin
  scripts/smoke.mjs        live smoke test against a real lamp
```

## Build and test

```sh
cd mcp
npm ci
npm test            # checks vendor/shade-runtime.js, then all vitest suites (builds the bundle too)
npm run typecheck
npm run build       # → plugin/dist/index.js + plugin/dist/preview-worker.mjs
claude plugin validate ./plugin && claude plugin validate .
```

The plugin ships the bundled `dist/` and no `package.json`/`node_modules`: Node is the only
runtime requirement. **Build before installing** — a fresh checkout has no `plugin/dist/`.

## Install locally

```sh
cd mcp && npm ci && npm run build
claude plugin marketplace add ./mcp          # from the repo root (or an absolute path to mcp/)
claude plugin install plaiiin-lamps@plaiiin
```

Restart Claude Code, then try `/plaiiin-lamps:lamps` or "find my lamps". Unpaired lamps are found
with full access; for a paired lamp the owner creates an **AI access** key in the PlaiiinLight app
(Share → New Share → pick the lamp → Access: AI → choose permissions) and you hand it over by
copying the link (Claude reads the clipboard) or a QR screenshot — see the lamp-access skill.

Installing copies the plugin (with the built `dist/`) into Claude Code's plugin cache. After
rebuilding, run `claude plugin marketplace update plaiiin` and `claude plugin update
plaiiin-lamps@plaiiin` (bump `version` in `plugin.json` if the update says it is current), then
restart Claude Code.

## State

- `~/.plaiiin/lamps/fleet.json` — the lamps this computer knows (no secrets).
- `~/.plaiiin/lamps/library/{effects,images,scenes}/` — things saved with the `library_*` tools.
- Keys: macOS Keychain, service `plaiiin-lamp-mcp`, account = the lamp's deviceId; on other systems
  `~/.plaiiin/lamps/secrets.json` (mode 0600).
- `PLAIIIN_LAMPS_DIR` overrides the state directory (tests and the smoke script use a temp dir).

## Security notes

- **Effect preview sandbox.** `effect_preview` runs untrusted scripts in a separate Node process
  under the Node permission model (`--permission`, reading only its own worker file), with a heap
  cap and a timeout; the script itself runs in a `vm` context holding only the shade runtime (no
  `require`, `process` or `fetch`). The permission model blocks file-system access, child processes
  and worker threads, but it does **not** restrict network access: a script that escaped the `vm`
  context could still open sockets. Treat previews of scripts from strangers accordingly.
- **Share links are `http://` only.** Lamps serve plain http on the LAN, so an `https://` share link
  is refused ("lamps use http — use the http:// link") rather than guessed at port 443 or 80.
- **Moved lamps.** When a lamp is found at a new address (mDNS re-resolve or `lamps_discover`), the
  new host must report the same `deviceId` on the open `GET /api` before the stored key is sent to it.
- **Keys.** On macOS the key is passed to `security -i` on stdin, never on its command line.

## Uninstall

```sh
claude plugin uninstall plaiiin-lamps@plaiiin
claude plugin marketplace remove plaiiin
rm -rf ~/.plaiiin/lamps                                   # optional: fleet and library
security delete-generic-password -s plaiiin-lamp-mcp      # optional, macOS: repeat until none are left
```

Revoke the AI keys themselves in the app's Share tab.

## Live smoke test

```sh
npm run build
node scripts/smoke.mjs 192.168.178.195
```

Spawns the built server with a temporary `PLAIIIN_LAMPS_DIR`, discovers the lamp at that address
(it must be unpaired), reads info/scenes/swarm/firmware, previews and validates a tiny script, and
changes brightness and restores it. It uploads, deletes, pairs, renames and updates nothing.
