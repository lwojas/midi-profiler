/**
 * The seam between this app's deterministic probing core and a live MIDI
 * transport. Shaped after the slice of midi-core's `RawMidiInput`/
 * `RawMidiOutput` (docs/contracts/input.md, docs/contracts/output.md in
 * midi-core) that probing actually needs — `sendRaw`/`onRawMessage` — not
 * imported, by the same "field names line up by convention, not by a shared
 * type" stance midi-profiler's own `DeviceReference` already takes toward
 * midi-core's `DeviceIdentity` (see midi-profiler's docs/evidence-model.md).
 *
 * Deliberately excludes the rest of `MidiConnection` (`port`, `state`,
 * `connect`/`disconnect`, `onStateChange`/`onError`): opening a connection
 * and picking a port is the caller's job (the CLI, or a glue script wiring
 * in midi-core's real transport), not something a probe run itself needs to
 * know about. `runProbeSession` assumes it's handed an already-connected
 * `ProbeTransport` and never calls connect/disconnect itself.
 */
export type Unsubscribe = () => void;

export interface ProbeOutputPort {
  sendRaw(bytes: Uint8Array): void;
}

export interface ProbeInputPort {
  onRawMessage(listener: (bytes: Uint8Array) => void): Unsubscribe;
}

/**
 * One physical device's worth of live I/O for probing: an output port to
 * send known bytes on, an input port to listen for whatever comes back.
 * Matches midi-core's own "a device is a paired input + output port"
 * convention (its mock device, docs/contracts/mock-device.md) rather than
 * inventing a device-level grouping of its own.
 */
export interface ProbeTransport {
  readonly output: ProbeOutputPort;
  readonly input: ProbeInputPort;
}
