# plaiiin-lamps — PlaiiinLight lamps for Claude Code

Control, compose for and manage PlaiiinLight lamps on your local network from Claude Code.

- **Fleet and access** — `lamps_discover`, `lamps_list`, `lamp_info`, `lamp_add_shared` (AI access
  key from the clipboard or a QR image; keys stay in the Keychain), `lamp_forget`, `lamp_rename`,
  `swarms_list`.
- **Control** — power, colour, brightness, mode, play/next/prev/stop.
- **Effects** — `lamp_form_prompt`, local `effect_preview` (renders frames as an enlarged PNG in a
  sandbox), validate/compile on the lamp, upload, tunes, copy, local library.
- **Images** — draw pixel art or a PNG, save, show, label, copy, delete.
- **Scenes** — capture, write, activate (swarm-aware), copy with script and image, library.
- **Streaming** — GIFs, PNG frames or a script, live over the lamp's WebSocket.
- **Firmware** — check and install the newest release, one lamp at a time, checksum-verified.

Destructive actions (delete, overwrite, rename, forget, firmware update) are two-step: Claude shows
you a summary and acts only after you say yes. With an AI access key Claude can only do what the
key's permissions allow.

Skills: compose-effect, draw-image, scenes, fleet-ota, lamp-access. Commands:
`/plaiiin-lamps:lamps` (overview table) and `/plaiiin-lamps:compose <idea> [lamp]`.

## Requirements

Node.js 20 or newer, lamp firmware 2.8 or newer, and lamps on the same network (mDNS). Developed
and tested on macOS; on Linux and Windows keys are kept in a file instead of the Keychain.

```sh
claude plugin marketplace add nebeleben/plaiiin-light-claudecode
claude plugin install plaiiin-lamps@plaiiin-lamps
```

## Where it works

The lamp tools come from a local server that this plugin starts on your computer with `node`. They
are available in Claude Code and Cowork when the session runs on your own computer. In Chat, and in
sessions that run in the cloud, only the skills and commands load: a cloud session cannot reach
lamps on your home network.

## What it talks to

The server talks to exactly two things:

- **Your lamps**, over plain HTTP and WebSocket on your local network (lamps do not serve HTTPS),
  found through mDNS.
- **GitHub** (`api.github.com` and `github.com` release downloads of `nebeleben/plaiiin-light`), to
  list and download lamp firmware, and only when you ask about or install firmware.

There is no hosted service, no account and no telemetry. What the tools report back (lamp names,
states) becomes part of your conversation with Claude like any other tool result. Lamp keys are
not part of that, unless you paste a share link into the chat yourself.

## What it stores

- Lamp access keys: the macOS Keychain, service `plaiiin-lamp-mcp`, one entry per lamp. On Linux
  and Windows: `~/.plaiiin/lamps/secrets.json`, readable only by you.
- `~/.plaiiin/lamps/fleet.json`: the lamps this computer knows (names, addresses, no secrets).
- `~/.plaiiin/lamps/library/`: effects, images and scenes you saved.

The server reads the clipboard only when you ask it to add a shared lamp from the clipboard
(macOS). `effect_preview` runs effect scripts in a separate, permission-restricted Node process.

## What is in `dist/`

`dist/index.js` is the whole server in one file: about 190 KiB of this project's own code and the
open-source packages it uses (zod, the MCP SDK, ajv, ws, jsQR, pngjs and others, listed with their
licences in `THIRD-PARTY-NOTICES.txt`). It is bundled so the plugin needs no `npm install`, and it
is not minified. The TypeScript source is in `src/` of the same repository; every release commit is
rebuilt by the repository's `ci` workflow and must match this file byte for byte. To check it
yourself, from a checkout of the repository: `npm ci && npm run build && git diff --exit-code -- plugin`.
