# plaiiin-lamps — PlaiiinLight lamps for Claude Code

Control, compose for and manage PlaiiinLight lamps on your local network from Claude Code.

- **Fleet and access** — `lamps_discover`, `lamps_list`, `lamp_info`, `lamp_add_shared` (AI access
  key from the clipboard or a QR image; keys stay in the Keychain), `lamp_forget`, `lamp_rename`,
  `swarms_list`.
- **Control** — power, colour, brightness, mode, play/next/prev/stop.
- **Effects** — `lamp_form_prompt`, local `effect_preview` (renders frames as a PNG strip in a
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

Node.js 20 or newer, and lamps on the same network (mDNS). The plugin runs `dist/index.js`, which is
built from the source with `npm run build` in the `mcp/` directory — build it before a local
install (see `../README.md`):

```sh
cd mcp && npm ci && npm run build
claude plugin marketplace add ./mcp
claude plugin install plaiiin-lamps@plaiiin
```

Everything stays on your network: the server talks only to your lamps and, for firmware updates, to
GitHub's release downloads.
