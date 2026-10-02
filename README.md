# MIDI Profiler

Offline tooling for researching real MIDI devices and, eventually,
generating [`DeviceProfile`](https://github.com/lwojas/midi-core/blob/main/docs/contracts/device-profile.md)
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

## Research materials

Raw research material — manufacturer PDFs, reference links — lives under
[`research/`](research), catalogued as `Evidence` in
[`src/evidence/manifest.ts`](src/evidence/manifest.ts).

## Development

```
npm install
npm test        # run the test suite (vitest)
npm run typecheck
npm run build    # emit dist/
```
