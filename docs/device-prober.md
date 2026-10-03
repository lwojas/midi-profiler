# Device Prober: Live Hardware Probing Architecture and Profiler Boundary

Status: Draft
Linear: [ECS-58](https://linear.app/ecs3d/issue/ECS-58/design-device-prober-live-hardware-probing-architecture-and-profiler)
Depends on: [docs/evidence-model.md](./evidence-model.md) (ECS-43),
[docs/generation-pipeline.md](./generation-pipeline.md) (ECS-44),
[docs/provenance-model.md](./provenance-model.md) (ECS-45),
midi-core's discovery/lifecycle and input/output contracts
([ECS-27](https://github.com/lwojas/midi-core/blob/main/docs/contracts/discovery-lifecycle.md)/[29](https://github.com/lwojas/midi-core/blob/main/docs/contracts/input.md)/[30](https://github.com/lwojas/midi-core/blob/main/docs/contracts/output.md)/[31](https://github.com/lwojas/midi-core/blob/main/docs/contracts/bidirectional.md))
Source of truth: [`../prober/`](../prober)
Does not block: [ECS-47](https://linear.app/ecs3d/issue/ECS-47/create-first-real-device-profile-as-profiler-validation-exercise) — a profile can still be built evidence-only.

## Scope

Every profile built so far comes from reading manufacturer documentation —
honest, but one step removed from the device itself. This ticket designs a
**device prober**: something that connects to a real, physically present
device via midi-core's live I/O, sends known Control Change/Note/SysEx
bytes, and records exactly what comes back. That's a stronger source of
truth than a PDF, and it fits the same evidence/provenance pipeline
`docs/evidence-model.md` and `docs/provenance-model.md` already define —
this ticket's job is to say *how* it fits, not to re-derive either model.

Two things have to be true at once, and they pull in opposite directions:

- **Live hardware probing needs midi-core.** There's no way to talk to a
  real port without midi-core's discovery/lifecycle/input/output contracts
  — unlike `src/evidence/`, `src/generation/`, and `src/provenance/`, which
  all deliberately import nothing from midi-core.
- **midi-profiler's existing core has to stay exactly as dependency-free and
  deterministic as it already is.** Per every prior doc in this repo, `src/`
  has no code dependency on midi-core and nothing in the generation/
  provenance pipeline depends on wall-clock time, a live connection, or
  anything else non-reproducible.

The resolution: **the prober is a separate app, `prober/`, not a module
under midi-profiler's own `src/`.**

## Why a separate package, not a new `src/` module

`prober/` is its own npm package (own `package.json`, own `tsconfig.json`,
own `npm test`/`npm run build`), sitting alongside `src/` in this repo —
"self-contained... companion app in this repo," not a new GitHub repo and
not folded into midi-profiler's existing dependency graph. Concretely:

- The root `midi-profiler` `package.json` gains **no new dependency** from
  this ticket. `src/evidence/`, `src/generation/`, `src/provenance/`, and
  `src/cli/` are untouched — still zero code dependency on midi-core, still
  deterministic, still importable as a library with no live-I/O surface at
  all.
- `prober/` is the one place in this repo where talking to midi-core's live
  I/O is actually the point. It has its own install step
  (`cd prober && npm install`) and its own test/build pipeline, independent
  of the root package's.

This is the same boundary `docs/evidence-model.md` already drew around
midi-core itself ("this repo doesn't install or import it"), carried one
level further: midi-profiler's research/generation/provenance pipeline
still doesn't, and now there's a clearly separate place — not a carve-out
inside `src/` — for the one piece of this project that legitimately needs
to.

## Keeping midi-core at the edge, even inside `prober/`

Needing midi-core doesn't mean importing it everywhere. `prober/`'s own
deterministic core — composing a probe plan, running it against a
transport, collecting observations — is written against a small local
interface, `ProbeTransport` (see
[`prober/src/transport/types.ts`](../prober/src/transport/types.ts)),
shaped after the slice of midi-core's `RawMidiInput`/`RawMidiOutput` that
probing actually needs (`sendRaw`/`onRawMessage`), **not imported**. This is
the same "field names line up by convention, not by a shared type" stance
midi-profiler's own `DeviceReference` already takes toward midi-core's
`DeviceIdentity` — extended from data shapes to a behavioral interface.

Concretely, this app has exactly one place that is allowed to actually
import midi-core: a `--transport <module>` glue script, loaded by path at
runtime, never by static import —the same reason midi-profiler's own
`generate --validator <module>` loads midi-core's real
`validateDeviceProfile` by path instead of depending on it (see
midi-profiler's `docs/cli.md`). `prober/examples/midi-core-mock-transport.mjs`
is exactly such a script, wired against midi-core's real mock device
(`midi-core/adapters/mock`) — real midi-core types and behavior, proven
without needing hardware or a browser, the same role the mock device played
for midi-core's own bidirectional-communication work before a real adapter
existed. Wiring the same shape against midi-core's real Web MIDI adapter (or
a future Node-native transport) is a drop-in replacement script, not a
change to anything in `prober/src/`.

Net effect: `prober/`'s own `package.json` carries no midi-core dependency
either, same as the root package. midi-core is only ever present at the one
seam a human explicitly points `--transport` at.

## Shape

```ts
interface ProbeStep {
  readonly id: string;
  readonly description: string;
  readonly send: readonly number[]; // raw wire bytes, e.g. [0xb0, 1, 127]
  readonly listenMs: number;
}

interface ProbeObservation {
  readonly raw: readonly number[];
  readonly receivedAtMs: number; // elapsed since the step's message was sent
}

interface ProbeStepResult {
  readonly step: ProbeStep;
  readonly sentAt: string; // ISO timestamp
  readonly observations: readonly ProbeObservation[];
}

interface ProbeSession {
  readonly id: string;
  readonly device: { readonly manufacturer: string; readonly model: string };
  readonly startedAt: string;
  readonly completedAt: string;
  readonly steps: readonly ProbeStepResult[];
}
```

- **`ProbeStep.send` is raw bytes, not a semantic message union.** A "known
  CC/Note/SysEx" is authored directly as wire bytes in a plan file — the
  same level of abstraction midi-core's own `RawMidiInput`/`RawMidiOutput`
  already operate at. This is what lets `runProbeSession` need no message
  codec at all: no dependency on midi-core's encoder, no reimplementation of
  it either.
- **`ProbeObservation.raw` is exactly what came back, undecoded.** No
  interpretation of what a response *means* — the same "report, don't
  invent" discipline the evidence and provenance docs already hold
  themselves to, applied to a live device's answer instead of a document.
- **`ProbeSession` is plain, JSON-serializable data**, the same shape
  discipline `GeneratedDeviceProfile`/`FieldProvenance` already follow, so
  it can be written straight to disk with no serializer of its own.

### `runProbeSession(transport, plan, clock?): Promise<ProbeSession>`

([`prober/src/run-probe-session.ts`](../prober/src/run-probe-session.ts))
For each step, in order: subscribe to the transport's input, send the
step's bytes on its output, wait `listenMs`, unsubscribe, record whatever
came in. Deterministic given a deterministic `transport` and `clock` — the
same arguments always produce the same `ProbeSession`. `clock` (`now`/`wait`)
is injected rather than calling `Date.now()`/`setTimeout` directly, the same
"inject the dependency" stance `toValidatedProfile` already takes toward a
validator — this is what lets the whole probing core be unit-tested
instantly against a fake transport and fake clock, with no real waiting and
no hardware, mirroring how midi-core itself tested `createMidiInput`/
`createMidiOutput` against small local fakes before any real transport
existed.

`runProbeSession` never calls `connect()`/`disconnect()` on anything —
opening a connection and picking a port is the caller's job (the `--transport`
module), not the step-runner's.

## How a probe session feeds the evidence/provenance pipeline

Per the ticket, probing has to feed the *same* pipeline the rest of this
project already uses, not a parallel one. It does so as **data passed
through files, not a code dependency**:

1. `midi-prober probe <plan.json> --transport <module> --out <file>` writes
   a completed `ProbeSession` as JSON.
2. A human moves that file under
   `research/<device-slug>/captured-traffic/`, the same `research/`
   convention `docs/profiling-workflow.md` already uses for manufacturer
   PDFs and other material.
3. The human registers it in `src/evidence/manifest.ts` as an `Evidence`
   entry with `kind: "captured-traffic"` — already one of `EvidenceKind`'s
   values (`docs/evidence-model.md`, ECS-43); this ticket needed no change
   to that model at all.
4. From there it's an ordinary piece of `Evidence`: citable in a
   `generate-input.json`'s `evidenceIds`, and citable per field in
   `fieldProvenance` with `confidence: "experimentally-verified"` — the
   confidence level `docs/provenance-model.md` already reserves for
   "confirmed by hands-on testing against a real device." Nothing in
   `prober/` assigns that confidence itself; recognizing that a captured
   response actually confirms a specific `DeviceProfile` field is the same
   human judgment call authoring any other `fieldProvenance` entry already
   requires.

`prober/` never writes to `src/evidence/`, never imports
`src/evidence/`/`src/generation/`/`src/provenance/`, and the evidence
pipeline never imports anything from `prober/`. The two are linked purely by
a file-system convention and the shared `Evidence`/`EvidenceKind` shape, the
same arm's-length relationship this repo already keeps with midi-core
itself.

## What's deliberately not here

- **No real hardware transport wired up by this ticket.** `prober/`'s own
  tests and its deterministic core run against local fakes; the one
  `--transport` example ships against midi-core's real mock device, not real
  hardware or a browser. Wiring midi-core's real Web MIDI adapter (needs a
  browser) or a Node-native MIDI transport is the same kind of follow-on
  work midi-core itself scoped as a separate ticket (ECS-31) once its own
  input/output contracts existed — not bolted onto this one.
- **No automatic evidence registration.** Writing a `ProbeSession` to
  `research/.../captured-traffic/` and adding it to
  `src/evidence/manifest.ts` are both manual steps, on purpose — the same
  "authored, not loaded" stance `docs/evidence-model.md` already takes for
  every other kind of evidence.
- **No inference from a captured response to a profile field or a
  confidence level.** A `ProbeObservation` is exactly the bytes received;
  deciding that it confirms `controls[2].feedback` with
  `confidence: "experimentally-verified"` is a human authoring a
  `fieldProvenance` entry, not something `prober/` computes.
- **No device grouping or port-picking UI.** `ProbeTransport` assumes a
  caller (the `--transport` module) already resolved which port is which —
  same as midi-core's own discovery/lifecycle contract, which explicitly
  leaves "picking a port" to a higher layer.
- **No message codec.** `ProbeStep.send`/`ProbeObservation.raw` are raw
  bytes; nothing in `prober/` encodes or decodes a `MidiMessage`. A plan
  author (or a future tool) authors known bytes directly.
- **No SysEx content interpretation.** A SysEx probe step is just bytes out,
  bytes in, same as midi-core's own message model keeps SysEx opaque.
