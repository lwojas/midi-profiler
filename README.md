# MIDI Profiler

Offline tooling for researching real MIDI devices and generating
[`DeviceProfile`](https://github.com/lwojas/midi-core/blob/main/docs/contracts/device-profile.md)
documents consumable by [`midi-core`](https://github.com/lwojas/midi-core).
Deterministic by design, same as `midi-core` itself: no runtime
inference or AI-driven guessing anywhere in this tool's output, only
documented, traceable research.

## Evidence

[`src/evidence/`](src/evidence) models the research itself — manufacturer
documentation, DAW mapping references, captured traffic, hands-on
experiment notes — independent of any particular device's eventual
profile:

```ts
import { EVIDENCE, type Evidence } from "./src/evidence/index.js";

const launchpadDocs = EVIDENCE.filter((e) => e.device?.model === "Launchpad Mini [MK3]");
```

See [`docs/evidence-model.md`](docs/evidence-model.md) for the full
`Evidence` shape and the reasoning behind it.

## Generation pipeline

[`src/generation/`](src/generation) defines how resolved research becomes a
candidate `DeviceProfile` document, and how that candidate is gated through
an injected validator before anything may treat it as real — deterministic
by construction, with no AI or inference inside either step. See
[`docs/generation-pipeline.md`](docs/generation-pipeline.md).

## Confidence & provenance

[`src/provenance/`](src/provenance) links an individual profile field to
how confident its value is and the evidence that backs it — manufacturer-
documented, DAW-discovered, inferred, experimentally verified, or honestly
unknown, so a proprietary, undocumented handshake can be represented as
such instead of invented. See [`docs/provenance-model.md`](docs/provenance-model.md).

## CLI

[`src/cli/`](src/cli) ties the three pieces above together into a runnable
tool: ingest the evidence catalogue, and run an authored candidate profile
through generation, validation, and field-provenance checking in one pass.
No AI or network call anywhere in it.

```
npx midi-profiler evidence list --device "Launchpad Mini [MK3]"
npx midi-profiler generate profile-input.json --validator ./validate.mjs --out report.json
```

`--validator` points at a module exporting `validateDeviceProfile`
(`midi-core`'s real one, in practice — this repo still has no code
dependency on it). Exit code is `0` exactly when the generated report is
ready for Deterministic Runtime Behaviour. See [`docs/cli.md`](docs/cli.md).

## Research materials

Raw research material — manufacturer PDFs, reference links — lives under
[`research/`](research), one folder per device, catalogued as `Evidence` in
[`src/evidence/manifest.ts`](src/evidence/manifest.ts).

## Profiling a real device

[`docs/profiling-workflow.md`](docs/profiling-workflow.md) is the
step-by-step guide tying all of the above together: where research and
drafted profiles go, a ready-to-use prompt for AI-assisted extraction from
evidence, and how to run the result through the CLI against `midi-core`'s
real validator. Written in preparation for
[ECS-47](https://linear.app/ecs3d/issue/ECS-47/create-first-real-device-profile-as-profiler-validation-exercise).

## Device prober (companion app)

[`prober/`](prober) is a separate, self-contained companion app: it connects
to a real device over midi-core's live I/O, sends known CC/Note/SysEx bytes,
and records what actually comes back, as a stronger alternative to
manufacturer docs alone. It stays decoupled from this package's own
dependency-free, deterministic core — see
[`docs/device-prober.md`](docs/device-prober.md) for the architecture and
[`prober/README.md`](prober/README.md) for how to run it. A completed probe
session feeds back into the evidence model above as `captured-traffic`
evidence, the same as any other research material.

## Development

```
npm install
npm test        # run the test suite (vitest)
npm run typecheck
npm run build    # emit dist/
```

`prober/` has its own independent `npm install`/`npm test`/`npm run build` —
see [`prober/README.md`](prober/README.md).
