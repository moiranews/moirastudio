/* Moira:Bridge v0: a local helper that lets the director screen drive an ATEM.
   Browsers can't speak the ATEM's UDP protocol, so this runs beside OBS and takes commands
   over a WebSocket on loopback, the same pattern as obs-websocket.

   Run:  npm run bridge   (from director/; reads bridge/config.json, see config.example.json)

   Protocol (JSON, one message per frame, version 1):
     client → bridge  { op: 'hello', v: 1 }   { op: 'cut', input: 2, id: 'c17' }
     bridge → client  { ev: 'hello', v, bridge }  { ev: 'status', connected, model, firmware, protocol }
                      { ev: 'inputs', list }  { ev: 'pgm', input, source: 'bridge'|'external', t }
                      { ev: 'ack', id, ok, error? }  { ev: 'error', error }
   ack ok means the switcher has REPORTED program = the requested input, not that the command
   was sent: the director switches OBS only after it, so a send-only ack would let OBS cut early. */
import { WebSocketServer } from 'ws';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AtemSwitcher, isCutTarget } from './switcher.mjs';

export const PROTOCOL_VERSION = 1;
export const DEFAULT_ORIGINS = ['http://localhost:*', 'http://127.0.0.1:*'];

/* Is this Origin header allowed? Entries are exact origins ('https://x.github.io') or a port
   wildcard ('http://localhost:*'). Parsed and compared part by part, never by prefix, so
   'http://localhost.evil.com' and 'http://localhost:8080.evil.com' don't get in. No Origin,
   or 'null' (a file:// page or a sandboxed frame), is refused. */
export function originAllowed(origin, allowed) {
  if (!origin || origin === 'null') return false;
  let u;
  try { u = new URL(origin); } catch { return false; }
  if (u.origin !== origin) return false;              // not a bare origin (path, odd case, credentials)
  const defPort = p => (p === 'https:' ? '443' : '80');
  const port = u.port || defPort(u.protocol);
  for (const a of allowed) {
    const m = /^(https?):\/\/([a-z0-9.-]+)(?::(\d+|\*))?$/i.exec(a);
    if (!m) continue;
    if (u.protocol !== m[1].toLowerCase() + ':' || u.hostname !== m[2].toLowerCase()) continue;
    const want = m[3] ?? defPort(m[1].toLowerCase() + ':');
    if (want === '*' || want === port) return true;
  }
  return false;
}

export function createBridge({
  switcher, port = 4456, host = '127.0.0.1', allowedOrigins = DEFAULT_ORIGINS,
  confirmTimeoutMs = 1000, matchWindowMs = 500, version = '0.0.0', log = () => {},
}) {
  let wss = null;
  let lastPgm = null;
  let pending = [];          // cuts Bridge sent: { input, until } — matched by input AND time, used once
  let waiters = [];          // cuts waiting for the switcher to confirm: { input, ws, id, timer }

  const send = (ws, msg) => { if (ws.readyState === 1) ws.send(JSON.stringify(msg)); };
  const broadcast = msg => { for (const ws of wss?.clients || []) send(ws, msg); };
  const targets = () => switcher.inputs().filter(isCutTarget)
    .map(({ id, longName, shortName }) => ({ id, longName, shortName }));
  const statusMsg = () => ({ ev: 'status', ...switcher.status });
  const ack = (ws, id, ok, error) => send(ws, error ? { ev: 'ack', id, ok, error } : { ev: 'ack', id, ok });

  const dropWaiter = w => { clearTimeout(w.timer); waiters = waiters.filter(x => x !== w); };

  /* A program change from the switcher. 'bridge' only if it matches an unexpired pending cut
     to that same input, which is then used up; anything else is 'external' (the panel,
     ATEM Software Control, Companion...). Known ambiguity: an external press to the SAME
     input inside the window counts as 'bridge'. */
  function onPgm({ input }) {
    if (input === lastPgm) return;                    // not a change
    lastPgm = input;
    const now = Date.now();
    pending = pending.filter(p => p.until >= now);
    const k = pending.findIndex(p => p.input === input);
    const source = k >= 0 ? 'bridge' : 'external';
    if (k >= 0) pending.splice(k, 1);
    if (source === 'external') log(`Program → ${input} (external)`);
    broadcast({ ev: 'pgm', input, source, t: now });
    // pgm first, then the acks: program now IS what these cuts asked for
    for (const w of waiters.filter(w => w.input === input)) { dropWaiter(w); ack(w.ws, w.id, true); }
  }

  function onStatus(st) {
    broadcast({ ev: 'status', ...st });
    log(st.connected ? `ATEM connected${st.model ? ': ' + st.model : ''}` : 'ATEM disconnected');
    if (!st.connected) {
      for (const w of [...waiters]) { dropWaiter(w); ack(w.ws, w.id, false, 'disconnected'); }
      pending = [];
    }
  }

  async function onCut(ws, msg) {
    const { id, input } = msg;
    if (!((typeof id === 'string' && id) || Number.isFinite(id))) return send(ws, { ev: 'error', error: 'cut needs an id' });
    if (!Number.isInteger(input)) return send(ws, { ev: 'error', error: 'cut needs an integer input' });
    if (!switcher.status.connected) return ack(ws, id, false, 'not connected');   // never queued
    if (!targets().some(t => t.id === input)) return ack(ws, id, false, `${input} is not a cut target`);
    if (switcher.programInput() === input) return ack(ws, id, true);              // nothing will change
    pending.push({ input, until: Date.now() + matchWindowMs });
    const w = { input, ws, id, timer: null };
    w.timer = setTimeout(() => { dropWaiter(w); ack(ws, id, false, 'not confirmed'); }, confirmTimeoutMs);
    waiters.push(w);
    try { await switcher.cut(input); }
    catch (e) {
      if (!waiters.includes(w)) return;               // already answered (e.g. disconnected)
      dropWaiter(w);
      const k = pending.findIndex(p => p.input === input); if (k >= 0) pending.splice(k, 1);
      ack(ws, id, false, e.message || String(e));
    }
  }

  function onMessage(ws, raw) {
    let msg;
    try { msg = JSON.parse(String(raw)); } catch { return send(ws, { ev: 'error', error: 'bad JSON' }); }
    if (!msg || typeof msg !== 'object') return send(ws, { ev: 'error', error: 'bad message' });
    if (msg.op === 'hello') {
      if (msg.v !== undefined && msg.v !== PROTOCOL_VERSION) {
        send(ws, { ev: 'error', error: 'unsupported version' });
        return ws.close(1002, 'unsupported version');
      }
      send(ws, { ev: 'hello', v: PROTOCOL_VERSION, bridge: version });
      send(ws, statusMsg());
      send(ws, { ev: 'inputs', list: targets() });
      const p = switcher.programInput();
      return send(ws, { ev: 'pgm', input: p, source: 'external', t: Date.now() });
    }
    if (msg.op === 'cut') return void onCut(ws, msg);
    send(ws, { ev: 'error', error: `unknown op: ${msg.op}` });
  }

  const handlers = {
    pgm: onPgm,
    status: onStatus,
    inputs: () => broadcast({ ev: 'inputs', list: targets() }),
    log: m => log(m),
  };

  return {
    start() {
      lastPgm = switcher.programInput();
      for (const [ev, fn] of Object.entries(handlers)) switcher.on(ev, fn);
      return new Promise((resolve, reject) => {
        wss = new WebSocketServer({
          host, port,
          verifyClient: (info, cb) => {
            const origin = info.req.headers.origin;
            if (originAllowed(origin, allowedOrigins)) return cb(true);
            log(`Refused a connection from origin ${origin === undefined ? '(none)' : JSON.stringify(origin)}`);
            cb(false, 403, 'Origin not allowed');
          },
        });
        wss.once('listening', () => resolve(wss.address()));
        wss.once('error', reject);
        wss.on('connection', ws => {
          ws.on('message', raw => onMessage(ws, raw));
          ws.on('close', () => { for (const w of waiters.filter(w => w.ws === ws)) dropWaiter(w); });
        });
      });
    },
    address: () => wss?.address(),
    async close() {
      for (const [ev, fn] of Object.entries(handlers)) switcher.off(ev, fn);
      for (const w of [...waiters]) dropWaiter(w);
      for (const ws of wss?.clients || []) ws.terminate();
      await new Promise(r => (wss ? wss.close(() => r()) : r()));
      wss = null;
    },
  };
}

/* ---------- entry point ---------- */
async function main() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const stamp = () => new Date().toISOString().slice(11, 23);
  const log = m => console.log(`${stamp()}  ${m}`);
  let config = {};
  const file = path.join(here, 'config.json');
  if (fs.existsSync(file)) config = JSON.parse(fs.readFileSync(file, 'utf8'));
  else log('No bridge/config.json: using the defaults (copy config.example.json to change them)');
  const version = JSON.parse(fs.readFileSync(path.join(here, '..', 'package.json'), 'utf8')).version || '0.0.0';
  const atemIp = config.atemIp || '169.254.215.71';
  const switcher = new AtemSwitcher(atemIp);
  const bridge = createBridge({
    switcher, version, log,
    port: config.port ?? 4456,
    allowedOrigins: config.allowedOrigins || DEFAULT_ORIGINS,
    confirmTimeoutMs: config.confirmTimeoutMs ?? 1000,
    matchWindowMs: config.matchWindowMs ?? 500,
  });
  try {
    const a = await bridge.start();
    log(`Bridge ${version} listening on ws://${a.address}:${a.port} · ATEM at ${atemIp}`);
  } catch (e) {
    console.error(e.code === 'EADDRINUSE'
      ? `Port ${config.port ?? 4456} is already in use (another Bridge running?). Not starting.`
      : `Bridge could not start: ${e.message}`);
    process.exit(1);
  }
  switcher.connect().catch(e => log(`ATEM connect failed: ${e.message}`));
  const stop = async () => { log('Stopping'); await bridge.close(); await switcher.disconnect(); process.exit(0); };
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
