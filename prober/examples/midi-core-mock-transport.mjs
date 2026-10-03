// Example `--transport` module: wires this app's `ProbeTransport` seam to
// midi-core's REAL mock device (`midi-core/adapters/mock`), not a fake
// invented for this app. This is the one file in this repo that actually
// imports midi-core -- deliberately not part of `midi-prober`'s own
// package.json dependencies or compiled `dist/`, the same reason
// midi-profiler's own docs/cli.md never bundles a `--validator`: whoever
// wants to talk to midi-core writes (or copies) a small glue module like
// this one and points `--transport` at it, per docs/device-prober.md.
//
// Adjust the import specifier below to wherever your midi-core checkout's
// build output actually is -- same caveat midi-profiler's own
// docs/profiling-workflow.md gives for `--validator ../midi-core/dist/...`.
//
//   node ../prober/dist/cli/index.js probe plan.json \
//     --transport ../prober/examples/midi-core-mock-transport.mjs \
//     --out research/<device-slug>/captured-traffic/session.json
//
// There's no real hardware or browser involved here (midi-core's real Web
// MIDI adapter needs one -- see midi-core's docs/contracts/bidirectional.md)
// -- this proves the ProbeTransport <-> midi-core wiring against midi-core's
// real exported types and mock implementation, the same role the mock
// device played for midi-core's own bidirectional-communication work before
// a real adapter existed.
import { createMockDevice } from "midi-core/adapters/mock";

export async function createProbeTransport() {
  const { input, output } = createMockDevice({ name: "Example Mock Device" });

  await input.connect();
  await output.connect();

  // The mock device has no hardware behind it to answer back on its own, so
  // this wires output -> input directly, the same manual "echo" pattern
  // midi-core's own docs/contracts/mock-device.md describes. A real device
  // (or a less trivial mock standing in for one) would instead send back
  // whatever it actually decides to -- this line is purely this example's
  // stand-in for "something answered."
  const realSendRaw = output.sendRaw.bind(output);
  output.sendRaw = (bytes) => {
    realSendRaw(bytes);
    input.emitRawMessage(bytes);
  };

  return {
    output: { sendRaw: (bytes) => output.sendRaw(bytes) },
    input: { onRawMessage: (listener) => input.onRawMessage(listener) },
  };
}
