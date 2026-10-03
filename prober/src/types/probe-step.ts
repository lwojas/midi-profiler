/**
 * One known message to send and how long to listen afterward. `send` is
 * raw wire bytes (e.g. `[0xb0, 1, 127]` for a Control Change on channel 1,
 * controller 1, value 127), not a semantic `MidiMessage` union — the same
 * level of abstraction midi-core's own `RawMidiInput`/`RawMidiOutput` deal
 * in. Keeping this raw means `runProbeSession` needs no message codec at
 * all (no dependency on midi-core, no reimplementation of its encoder) and
 * means a probe plan's author decides exactly what bytes go on the wire —
 * a "known CC/Note/SysEx" per the ticket, authored directly, not decoded
 * or reinterpreted by this app.
 */
export interface ProbeStep {
  readonly id: string;
  readonly description: string;
  readonly send: readonly number[];
  /** How long, in milliseconds, to keep listening for a response after sending. */
  readonly listenMs: number;
}
