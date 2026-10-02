# Deterministic Profile Generation Pipeline

Status: Draft
Linear: [ECS-44](https://linear.app/ecs3d/issue/ECS-44/design-deterministic-profile-generation-pipeline)
Depends on: [docs/evidence-model.md](./evidence-model.md) (ECS-43), [midi-core's profile validation](https://github.com/lwojas/midi-core/blob/main/docs/contracts/profile-validation.md) (ECS-42)
Source of truth: [`src/generation/`](../src/generation)

## Scope

The ticket names four stages: **Technical Evidence → Offline Profiler →
Validated Device Profile → Deterministic Runtime Behaviour**. The first
stage already exists ([`Evidence`](./evidence-model.md), ECS-43); the last
is already true of midi-core by construction — nothing in Core, the profile
layer, or the mapping layer re-derives or infers a device's behavior at
runtime, it only consumes whatever a `DeviceProfile` document says. This
ticket designs the two stages in between: how research (`Evidence`) actually
becomes a candidate `DeviceProfile`-shaped document ("Offline Profiler"), and
how that candidate is gated before anything may treat it as real
("Validated Device Profile").

Per the ticket, two constraints hold across both stages:

- **AI may assist offline analysis but must never be a runtime dependency.**
  A person can use an AI model to help read a manufacturer PDF or implementation
  chart and draft candidate field values — that happens before anything in
  this module runs, and is not code this module ships. What this module
  defines is deterministic: the same `composeGeneratedProfile`/
  `toValidatedProfile` arguments always produce the same result, with no
  model call, no file read, no clock, nothing non-reproducible inside either
  function.
- **Do not fill undocumented behavior by guesswork.** A field with no
  supporting evidence is left out of the generated document and named in
  `unresolved`, never defaulted to a plausible-sounding guess. This is the
  same stance midi-core's own validation layer takes ("report... rather than
  invented handshakes"); here it governs what gets generated in the first
  place.

This ticket is **not** [`docs/provenance-model.md`](./provenance-model.md)
(ECS-45, "profile confidence/provenance model"): ECS-45 is a sibling
depending on the same evidence model, not a dependency of this one, and its
job — linking individual profile *fields* to the evidence and confidence
behind each — is explicitly out of scope here. This pipeline cites evidence
only at the whole-profile level (`evidenceIds`), not per field.

## `GeneratedDeviceProfile`

```ts
interface UnresolvedField {
  readonly path: string; // e.g. "controls[2].feedback"
  readonly reason: string;
}

interface GeneratedDeviceProfile {
  readonly profile: Readonly<Record<string, unknown>>;
  readonly evidenceIds: readonly string[];
  readonly unresolved: readonly UnresolvedField[];
}
```

- **`profile`** — a document shaped like midi-core's `DeviceProfile` schema,
  by convention, the same relationship `DeviceReference` already has to
  `DeviceIdentity` (see [`docs/evidence-model.md`](./evidence-model.md)): no
  import, no code dependency, just field names chosen to line up. Typed as
  `Record<string, unknown>` rather than a locally-duplicated mirror of the
  entire `DeviceProfile` schema (ports, controls, grids, sysex, handshake) —
  re-declaring that whole shape here, only to never check it against the
  real one, would drift silently the moment either schema changes. The
  actual boundary where shape is checked is `toValidatedProfile`, against a
  real validator.
- **`evidenceIds`** — `Evidence.id`s (from [`src/evidence/`](../src/evidence))
  that informed this profile. Required, not optional: a `GeneratedDeviceProfile`
  citing nothing is a guess wearing this pipeline's shape, not a real output
  of it.
- **`unresolved`** — aspects investigated but not determinable from current
  evidence, named explicitly rather than omitted silently. `path` follows the
  same notation midi-core's own `ProfileDiagnostic.path` uses, so a human
  reviewer (or ECS-46's CLI) can line an unresolved field up with the
  document it's missing from.

## `composeGeneratedProfile(args): GeneratedDeviceProfile`

Assembles the three fields above from whatever a caller already resolved.
Deliberately as thin as midi-core's own `composeDeviceProfile`: assembly
only, no validation, no inference, no default-filling. Extracting facts out
of a PDF, a captured-traffic log, or an AI-assisted reading of either is
explicitly **not** this function's job — see "What's deliberately not here."

## `toValidatedProfile(generated, validate): GenerationReport`

```ts
interface Diagnostic {
  readonly severity: "error" | "warning";
  readonly path: string;
  readonly message: string;
}

interface GenerationReport extends GeneratedDeviceProfile {
  readonly diagnostics: readonly Diagnostic[];
}

function toValidatedProfile(
  generated: GeneratedDeviceProfile,
  validate: (profile: unknown) => readonly Diagnostic[],
): GenerationReport;

function isReadyForRuntime(report: GenerationReport): boolean;
```

The Offline Profiler → Validated Device Profile boundary. `validate` is
injected by the caller rather than imported — the same "no single thing
owns this" shape `ControlRegistry`/`MidiDiscovery` already take in
midi-core, applied here to cross a repo boundary instead of a registry: this
repo has no code dependency on midi-core, so whatever eventually calls
`toValidatedProfile` (ECS-46's CLI, most likely) is the thing that actually
imports and passes in midi-core's real `validateDeviceProfile`. Tests here
prove the boundary's shape against a fixture validator instead.

`isReadyForRuntime` draws the same `"error"` vs `"warning"` line midi-core's
validation layer already draws: a report with only warnings (or only
`unresolved` entries — a separate, softer signal from the generation stage
itself) can still be ready for Deterministic Runtime Behaviour. A report
with any error-severity diagnostic is not, regardless of how much evidence
backs the rest of the document.

## What's deliberately not here

- **No evidence parsing or extraction** — nothing here reads a PDF, calls an
  AI model, or turns `Evidence.source` into structured facts. That stays a
  human (optionally AI-assisted) step entirely outside this module, per the
  ticket's own "AI... must never be a runtime dependency." This module starts
  from facts someone has already resolved.
- **No per-field confidence or provenance** — `evidenceIds` is whole-profile,
  not per-field. That finer-grained linking is
  [`docs/provenance-model.md`](./provenance-model.md)'s job (ECS-45), a
  sibling of this ticket, not a dependency either way.
- **No CLI or tooling surface** — see [`docs/cli.md`](./cli.md) (ECS-46,
  "Build MIDI Profiler CLI/tooling"), which drives these functions end to
  end against real research and midi-core's real validator. This ticket
  only defines the pipeline's shape.
- **No schema mirror of `DeviceProfile`** — see `profile`'s field above;
  deliberately `Record<string, unknown>`, not a duplicated type.
- **No defaulting or correction** — same stance as midi-core's own
  `composeDeviceProfile`/`validateDeviceProfile`: nothing here invents a
  value for a gap, or fixes a `profile` a validator flags. A diagnostic or an
  `unresolved` entry is the end of this pipeline's responsibility for that
  fact; acting on it is a human's (or a later tool's) job.
