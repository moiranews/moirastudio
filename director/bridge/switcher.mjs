/* The Switcher interface Bridge talks to, and AtemSwitcher, which wraps atem-connection.
   MockSwitcher (mockswitcher.mjs) has the same shape, so the tests never need hardware.

   Interface:
     connect(), disconnect()
     status        → { connected, model, firmware, protocol }
     inputs()      → [{ id, longName, shortName, external }]   every input the switcher lists
     programInput()→ number | null
     cut(id)       → Promise: resolves once the command is sent; rejects if not connected or the
                     id isn't listed. Confirmation (program really changed) is Bridge's job.
     events: 'status' (status), 'pgm' ({ input }), 'inputs' (inputs())                         */
import { EventEmitter } from 'node:events';
import { Atem, AtemConnectionStatus, Enums } from 'atem-connection';

/* Internal sources it makes sense to cut to on an ATEM Mini: black, bars, the two colour
   generators and media player 1. Other models (SuperSource, more media players) need their
   own list. Everything else internal (keys, outputs, multiview, direct feeds) is refused. */
export const MINI_INTERNAL_TARGETS = new Set([0, 1000, 2001, 2002, 3010]);

/* May Bridge cut program to this input? External inputs (by port type, so no fixed camera
   count) plus the internal list above; never anything at 8000 or over. */
export const isCutTarget = i => Number.isInteger(i.id) && i.id < 8000 && (i.external || MINI_INTERNAL_TARGETS.has(i.id));

/* "2.32" from 131104 (0x00020020): atem-connection reports the protocol, not the firmware. */
const protocolString = v => (v ? `${v >>> 16}.${v & 0xffff}` : null);

export class AtemSwitcher extends EventEmitter {
  constructor(ip) {
    super();
    this.ip = ip;
    this.atem = null;
  }

  async connect() {
    const atem = this.atem = new Atem();
    atem.on('connected', () => {
      this.emit('status', this.status);
      this.emit('inputs', this.inputs());
      const p = this.programInput();
      if (p != null) this.emit('pgm', { input: p });
    });
    atem.on('disconnected', () => this.emit('status', this.status));
    atem.on('stateChanged', (_state, paths) => {
      if (paths.some(p => p.startsWith('video.mixEffects.0.programInput'))) {
        const p = this.programInput();
        if (p != null) this.emit('pgm', { input: p });
      }
      if (paths.some(p => p.startsWith('inputs'))) this.emit('inputs', this.inputs());
    });
    atem.on('error', e => this.emit('log', `ATEM error: ${e}`));
    await atem.connect(this.ip);      // keeps retrying by itself if nothing answers
  }

  async disconnect() {
    if (!this.atem) return;
    const a = this.atem; this.atem = null;
    try { await a.disconnect(); } catch {}
    try { await a.destroy(); } catch {}
    this.emit('status', this.status);
  }

  get status() {
    const connected = this.atem?.status === AtemConnectionStatus.CONNECTED;
    const info = connected ? this.atem.state?.info : null;
    return {
      connected,
      model: info ? info.productIdentifier || Enums.Model[info.model] || null : null,
      firmware: null,                                   // not reported by atem-connection
      protocol: info ? protocolString(info.apiVersion) : null,
    };
  }

  inputs() {
    const all = this.atem?.state?.inputs || {};
    return Object.values(all).filter(Boolean).map(i => ({
      id: i.inputId, longName: i.longName, shortName: i.shortName,
      external: i.internalPortType === Enums.InternalPortType.External,
    })).sort((a, b) => a.id - b.id);
  }

  programInput() {
    const p = this.atem?.state?.video?.mixEffects?.[0]?.programInput;
    return Number.isInteger(p) ? p : null;
  }

  async cut(id) {
    if (!this.status.connected) throw new Error('not connected');
    if (!this.inputs().some(i => i.id === id)) throw new Error(`no input ${id} on this switcher`);
    await this.atem.changeProgramInput(id, 0);
  }
}
