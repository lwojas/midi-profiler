# Profile Confidence/Provenance Model

Status: Draft
Linear: [ECS-45](https://linear.app/ecs3d/issue/ECS-45/define-profile-confidenceprovenance-model)
Depends on: [docs/evidence-model.md](./evidence-model.md) (ECS-43)
Aligns with: [docs/generation-pipeline.md](./generation-pipeline.md) (ECS-44) — a sibling, not a dependency either way
Source of truth: [`src/provenance/`](../src/provenance)

## Scope

[`Evidence`](./evidence-model.md) models research material, and the
[generation pipeline](./generation-pipeline.md) cites it only at the
whole-profile level (`GeneratedDeviceProfile.evidenceIds`). Neither says
anything about an individual field: whether `controls[2].feedback` is
something Novation documented outright, something only observed by
watching Ableton's remote script talk to the device, or something nobody
has actually confirmed at all. That per-field link — a confidence level
plus the evidence behind it — is this ticket's job, as both prior docs
already called out as explicitly out of scope for themselves.

Per the ticket, this must represent five states — manufacturer-documented,
discovered in a DAW's own implementation, inferred, experimentally
verified, and unknown — and must **allow** an unresolved, proprietary
handshake to be represented as unknown rather than forcing (or tempting)
anyone to invent one. This is the same "report, don't invent" stance the
evidence model and generation pipeline both already take, applied one
level more granular: per field, not just per document.

## `ProvenanceConfidence`

```ts
type ProvenanceConfidence =
  | "manufacturer-documented"
  | "daw-discovered"
  | "inferred"
  | "experimentally-verified"
  | "unknown";
```

Named directly after the ticket's own five states, in adjective form so
they read consistently: stated outright in the manufacturer's own
documentation; observed by watching a DAW's integration (Ableton Remote
Script, etc.) actually talk to the device; reasoned from related evidence
without being stated outright; confirmed by hands-on testing against a
real device; or `"unknown"` — investigated but not actually resolved by
any of the above. `"unknown"` is a first-class member of this type, not an
absence of one, specifically so a proprietary handshake nobody has
documented, discovered, inferred or verified can be represented honestly
instead of filled with a plausible-sounding guess.

## `FieldProvenance`

```ts
interface FieldProvenance {
  readonly path: string;
  readonly confidence: ProvenanceConfidence;
  readonly evidenceIds: readonly string[];
  readonly notes?: string;
}
```

- **`path`** — the same dotted/indexed notation the generation pipeline's
  own `UnresolvedField.path`/`Diagnostic.path` already use (e.g.
  `"controls[2].feedback"`), so a human reviewer can line a field's
  provenance up with the same field anywhere else in the pipeline's
  output.
- **`confidence`** — one `ProvenanceConfidence` value.
- **`evidenceIds`** — `Evidence.id`s (from [`src/evidence/`](../src/evidence))
  this confidence actually rests on. Not optional, so a field can't claim
  `"manufacturer-documented"` while citing nothing — see `isTraceable`
  below for the rule this enables.
- **`notes`** — optional free-text context: how the evidence supports this
  field, or why it doesn't fully resolve it.

## `composeFieldProvenance(args): FieldProvenance`

Assembles a `FieldProvenance` from a confidence level and whatever
evidence a human has already determined backs it. Deliberately as thin as
the generation pipeline's own `composeGeneratedProfile`: assembly only, no
validation, no inferring which evidence applies to which field. Pure and
deterministic, same as every other function in this pipeline — the same
arguments always produce the same result.

## `isTraceable(provenance): boolean`

```ts
function isTraceable(provenance: FieldProvenance): boolean;
```

The rule this whole model exists to enforce: `"unknown"` requires **no**
cited evidence (citing evidence while also claiming "unknown" would
contradict itself), and every other confidence level requires **at least
one** cited `Evidence.id` (a confidence with nothing behind it is a guess
wearing this model's shape, the same complaint the generation pipeline
already makes about an evidence-less `GeneratedDeviceProfile`). This is
what makes "allow unresolved proprietary handshakes rather than inventing
them" concrete: a handshake field with `confidence: "unknown"` and no
evidence is traceable (honestly unresolved); the same field with a
documented-sounding confidence and no real citation is not.

Kept separate from `composeFieldProvenance` rather than folded into it,
the same split the generation pipeline draws between `composeGeneratedProfile`
(assembly) and `toValidatedProfile` (checking) — assembling a
`FieldProvenance` and judging whether it's actually trustworthy are
different jobs.

## What's deliberately not here

- **No change to `GeneratedDeviceProfile` or `GenerationReport`** — this
  module doesn't extend or wrap the generation pipeline's types, and the
  pipeline doesn't import from here either. The two stay siblings, each
  usable without the other; a caller that wants both (ECS-46's CLI, most
  likely) attaches a profile's `FieldProvenance[]` alongside its
  `GenerationReport` itself, rather than this module reaching into the
  pipeline's shape or vice versa.
- **No cross-check against `GeneratedDeviceProfile.evidenceIds`** — nothing
  here confirms a field's `evidenceIds` are a subset of the whole
  profile's. That would couple this module to the pipeline's actual types;
  the two are linked by convention (the same `Evidence.id` universe and
  the same `path` notation), not by shared code.
- **No per-field validation beyond `isTraceable`** — no check that `path`
  actually names a real field in some profile, no confidence scoring, no
  automatic downgrade when evidence looks thin. `isTraceable` draws exactly
  one line: evidence present or absent matching what's claimed.
- **No dependency on `midi-core`** — same stance as the evidence model and
  generation pipeline: this repo doesn't import `midi-core`'s types.
  `path`'s notation lines up with `ProfileDiagnostic.path` by convention.
- **No CLI or tooling surface** — ECS-46 is what will actually drive this
  against real evidence and a real generated profile.
