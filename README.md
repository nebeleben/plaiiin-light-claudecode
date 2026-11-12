# plaiiin-lamps — PlaiiinLight lamps for Claude Code

A [Claude Code](https://claude.com/claude-code) plugin that lets Claude work with your
[PlaiiinLight](https://plaiiin-light.com) lamps from a conversation: switch and colour them, write
and preview new light effects, draw pictures, save scenes, keep several lamps in step and check
them for firmware updates.

It runs entirely on your computer and talks to the lamps over your own network. You decide, per
lamp, what Claude is allowed to do.

## Requirements

- **macOS.** Linux and Windows are untested and not released.
- Node.js 20 or newer (`node --version`).
- Claude Code.
- A PlaiiinLight lamp with firmware 2.8 or newer, on the same network as your computer.

## Install

```sh
claude plugin marketplace add nebeleben/plaiiin-light-claudecode
claude plugin install plaiiin-lamps@plaiiin-lamps
```

Restart Claude Code, then try `/plaiiin-lamps:lamps` or just say "find my lamps".

If the first command fails with a Git or SSH error, you have no GitHub SSH key set up; tell Claude
Code to use HTTPS instead and run it again:

```sh
export CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1
```

## Update

Claude Code does not update third-party plugins by itself. To move to the newest release:

```sh
claude plugin marketplace update plaiiin-lamps
claude plugin update plaiiin-lamps@plaiiin-lamps
```

Or turn on auto-update for this marketplace in Claude Code under `/plugin` → **Marketplaces**.
To stay on one release, add the marketplace with its tag instead, for example
`nebeleben/plaiiin-light-claudecode#v0.1.0`.

## Giving Claude access to a lamp

A lamp that nobody has paired yet is found on the network and can be used right away, with full
access.

For a lamp you have paired in the PlaiiinLight app, you create a key for Claude:

1. In the app: **Share** → **New Share** → pick the lamp.
2. **Access: AI**.
3. Choose what Claude may do. Each of these is a separate switch: control (power, colour,
   brightness, modes), scripts, drawings, scenes, live streaming, firmware update, rename, and
   reading the swarm.
4. Optionally limit the brightness, and allow Claude to act only while the lamp is switched on.
5. Create. The app shows a link and a QR code.

Copy the link and tell Claude to add the lamp; it reads the link from the clipboard, so the key
does not pass through the chat. A saved screenshot of the QR code works too.

The lamp itself enforces these permissions. You can change them, or revoke the key, in the app's
Share tab at any time. An AI key cannot be used by the apps.

## What it does and what it talks to

- **Lamps and access** — find lamps, list them with their state, add a shared lamp, forget one.
- **Control** — power, colour, brightness, mode, play, next, previous, stop.
- **Effects** — write an effect script, preview it locally as a strip of frames, check and compile
  it on the lamp, upload it, tune it, copy it to other lamps, keep a local library.
- **Images** — draw pixel art or send a PNG, save, show, label, copy, delete.
- **Scenes** — capture what a lamp shows, edit, activate, copy between lamps.
- **Streaming** — GIFs, PNG frames or a script, live to the lamp.
- **Firmware** — compare lamps with the newest release and install it, one lamp at a time, with a
  checksum check.

It comes with five skills (compose-effect, draw-image, scenes, fleet-ota, lamp-access) and two
commands: `/plaiiin-lamps:lamps` and `/plaiiin-lamps:compose <idea> [lamp]`.

The plugin's server talks to exactly two things:

- your lamps, over plain HTTP and WebSocket on your local network;
- GitHub, to read and download the firmware releases of `nebeleben/plaiiin-light`, and only when
  you ask about or install firmware.

There is no hosted service, no account and no telemetry. Your conversation with Claude itself goes
to Anthropic as it always does; that includes what the tools report back, such as lamp names and
states. Lamp keys are not part of that, unless you paste a share link into the chat yourself.

## Where things are stored

- Keys: the macOS Keychain, service `plaiiin-lamp-mcp`, one entry per lamp.
- `~/.plaiiin/lamps/fleet.json` — the lamps this computer knows. No secrets.
- `~/.plaiiin/lamps/library/` — effects, images and scenes you saved to the local library.

## Safety

- **Two steps for anything destructive.** Deleting, overwriting, renaming, forgetting a lamp and
  firmware updates first return a summary; Claude shows it to you and acts only after you agree.
- **An AI key only allows what you granted**, and the lamp firmware enforces it, not just the
  plugin.
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
claude plugin uninstall plaiiin-lamps@plaiiin-lamps
claude plugin marketplace remove plaiiin-lamps
rm -rf ~/.plaiiin/lamps                                   # optional: fleet and library
security delete-generic-password -s plaiiin-lamp-mcp      # optional: repeat until none are left
```

Revoke the AI keys themselves in the app's Share tab.

## How releases are built

What Claude Code runs is a single bundled file, `plugin/dist/index.js`. Nobody reads a bundle, so
this repository is arranged to let you check it against the source instead:

- **`main`** (this branch) has one commit per release. Each holds that release's source code *and*
  the bundle built from it, plus `plugin/THIRD-PARTY-NOTICES.txt` for the packages inside the
  bundle.
- **`source`** has the full commit history of the code, without bundles.
- The **`ci`** workflow runs on every release commit. It rebuilds the bundle from the source in
  the same commit and fails if the result is not byte-for-byte what was published. Its results are
  public in the Actions tab, and the GitHub Release for a version is only created when the same
  comparison passes.

You can repeat that comparison on your own machine from a checkout of `main`:

```sh
npm ci && npm run build && git diff --exit-code -- plugin
```

No output means the published bundle is exactly what this source builds.

More on building and testing in [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

Apache-2.0, see [LICENSE](LICENSE).
