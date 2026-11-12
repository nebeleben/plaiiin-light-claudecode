import { homedir } from 'node:os';
import { join } from 'node:path';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Registry } from './lamp/registry';
import { FleetStore } from './store/fleet';
import { makeSecrets } from './store/secrets';
import { buildServer } from './server';
import { Confirmations } from './tools/confirm';
import { errorText, type ToolContext } from './tools/context';
import { consoleToStderr } from './util/stdout';

// stdout is the JSON-RPC channel: library console output must not corrupt it.
consoleToStderr();

const stateDir = process.env.PLAIIIN_LAMPS_DIR ?? join(homedir(), '.plaiiin', 'lamps');
const registry = new Registry(new FleetStore(stateDir), makeSecrets(stateDir));
const ctx: ToolContext = { registry, confirm: new Confirmations(), stateDir };

const server = buildServer(ctx);
await server.connect(new StdioServerTransport());

// Re-read every lamp's access in the background; startup must not wait for slow or offline lamps.
registry.refreshAccess().catch((e) => process.stderr.write(`plaiiin-lamps: access refresh failed: ${errorText(e)}\n`));

const shutdown = () => { registry.close(); void server.close().finally(() => process.exit(0)); };
process.stdin.on('end', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
