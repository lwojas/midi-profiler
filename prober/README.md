# MIDI Prober

A companion app to `midi-profiler`: connects to a real device over
midi-core's live I/O, sends known CC/Note/SysEx bytes, and records exactly
what comes back — a stronger alternative to manufacturer docs alone. See
[`../docs/device-prober.md`](../docs/device-prober.md) for the full design
and why this lives as its own package instead of inside `midi-profiler`'s
own `src/`.

```
src/
  types/        ProbeStep, ProbeSession, ProbePlan (+ parseProbePlan)
  transport/     ProbeTransport — the live-I/O seam, shaped after
                 midi-core's RawMidiInput/RawMidiOutput but not importing it
  clock.ts       injected time, so runProbeSession is deterministic
  run-probe-session.ts
  draft-evidence.ts  formats a completed ProbeSession as a draft Evidence
                      object -- see docs/probe-capture-bridge.md
  cli/           `midi-prober probe <plan.json> --transport <module> [--out <file>]`
                 `midi-prober draft-evidence <session.json> [--kind ...] [--out <file>]`
examples/
  midi-core-mock-transport.mjs   a real --transport module wired to
                                  midi-core's real mock device
```

## Running a probe

1. Write a plan — the device and the ordered steps to run:

   ```json
   {
     "id": "launchpad-mini-mk3.sysex-handshake-probe",
     "device": { "manufacturer": "Novation", "model": "Launchpad Mini [MK3]" },
     "steps": [
       { "id": "step-1", "description": "Enter Programmer mode", "send": [240, 0, 32, 41, 2, 13, 14, 1, 247], "listenMs": 200 }
     ]
   }
   ```

2. Write (or copy) a `--transport` module exporting `createProbeTransport()`
   — in practice, one that imports midi-core's real live I/O and connects to
   a chosen port. `examples/midi-core-mock-transport.mjs` is a working
   example against midi-core's mock device; adjust it to wire a real port
   once midi-core's real transport (Web MIDI, or a future Node-native one)
   is what you're pointing at.

3. Run it:

   ```sh
   npm run build
   node dist/cli/index.js probe plan.json --transport ./examples/midi-core-mock-transport.mjs --out session.json
   ```

4. Draft the `Evidence` entry from `session.json`:

   ```sh
   node dist/cli/index.js draft-evidence session.json --out draft.json
   ```

   This only formats what the session already states (device, step ids,
   observation counts, timestamps) into the shape
   `../src/evidence/manifest.ts` expects — it never writes to that manifest
   itself. See [`../docs/probe-capture-bridge.md`](../docs/probe-capture-bridge.md)
   for the full field-by-field mapping.

5. Move `session.json` under `../research/<device-slug>/captured-traffic/`
   (matching the `path` the draft already assumes, unless `--research-path`
   overrode it) and paste the (reviewed, possibly edited) draft into
   `../src/evidence/manifest.ts` as a new `Evidence` entry, same as any
   other piece of research — see
   [`../docs/profiling-workflow.md`](../docs/profiling-workflow.md). Turning
   an observation into a `fieldProvenance` entry with
   `confidence: "experimentally-verified"` is a human judgment call from
   there, same as any other evidence.

## Development

```
npm install
npm test
npm run typecheck
npm run build
```
