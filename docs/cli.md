# MIDI Profiler CLI/Tooling

Status: Draft
Linear: [ECS-46](https://linear.app/ecs3d/issue/ECS-46/build-midi-profiler-clitooling)
Depends on: [docs/evidence-model.md](./evidence-model.md) (ECS-43), [docs/generation-pipeline.md](./generation-pipeline.md) (ECS-44), [docs/provenance-model.md](./provenance-model.md) (ECS-45)
Source of truth: [`src/cli/`](../src/cli)

## Scope

Three prior tickets each defined a sibling piece on its own: what evidence
is, how evidence becomes a candidate profile and gets validated, and how a
profile's individual fields link back to confidence and evidence. None of
them wire the pieces together into something runnable — each doc explicitly
named this as later work ("ECS-46's CLI, most likely"). This ticket is that
CLI: an offline command-line tool that ingests the evidence catalogue and
runs an authored candidate profile through generation, validation, and
field-provenance checking in one pass, deterministically.

Per the ticket, **no LLM dependency at runtime**: this module makes no AI
or network call anywhere. That was already true of `composeGeneratedProfile`,
`toValidatedProfile`, `composeFieldProvenance` and `isTraceable`
individually; the CLI composes them without adding one of its own. Reading
a manufacturer PDF and drafting candidate field values with AI assistance,
per the generation pipeline's own stance, still happens entirely outside
this tool, before a human runs it.

## Commands

```
midi-profiler evidence list [--device <model>] [--kind <kind>]
midi-profiler generate <input.json> [--validator <module>] [--out <file>]
```

### `evidence list`

Prints the real [`EVIDENCE`](../src/evidence/manifest.ts) catalogue as
JSON, optionally narrowed by device model and/or
[`EvidenceKind`](../src/evidence/types/kind.ts) — the "ingest evidence"
half of the ticket. Pure filtering ([`filterEvidence`](../src/cli/commands/evidence-list.ts)):
no parsing of `source` content, same stance the evidence model itself
takes.

### `generate`

Reads a **generate-input** JSON file — the one new shape this ticket
defines, in [`src/cli/types/generate-input.ts`](../src/cli/types/generate-input.ts):

```ts
interface GenerateInput {
  profile: Record<string, unknown>;
  evidenceIds: string[];
  unresolved?: UnresolvedField[];
  fieldProvenance?: { path: string; confidence: ProvenanceConfidence; evidenceIds?: string[]; notes?: string }[];
}
```

This is what a human (optionally AI-assisted, entirely outside this tool)
authors by hand once they've resolved facts from evidence: a candidate
`DeviceProfile`-shaped document, the evidence behind it, anything left
unresolved, and the per-field provenance behind whatever values are
actually filled in. It is this CLI's one boundary with untrusted external
input — a JSON file on disk — so `parseGenerateInput` is where its shape
gets checked, the same relationship `toValidatedProfile` has to a
`profile`'s own shape.

`generate` then, in [`src/cli/generate-report.ts`](../src/cli/generate-report.ts)'s
pure `buildGenerateReport`:

1. Runs `profile`/`evidenceIds`/`unresolved` through `composeGeneratedProfile`
   and `toValidatedProfile` (ECS-44), validated by whatever `--validator`
   points at (see below), or no diagnostics at all if omitted.
2. Runs each `fieldProvenance` entry through `composeFieldProvenance` (ECS-45).
3. Cross-checks every cited evidence id — whole-profile and per-field —
   against the real `EVIDENCE` catalogue, flagging any that don't exist as
   `unknownEvidenceIds`.
4. Runs every `fieldProvenance` entry through `isTraceable`, flagging
   failures as `untraceableFieldProvenance`.
5. Walks `profile` itself (via [`src/cli/field-path.ts`](../src/cli/field-path.ts))
   to find every leaf field with no `fieldProvenance` entry covering it,
   flagging them as `uncoveredFields` (ECS-62) — citation *coverage*, not
   just citation consistency. `schemaVersion` is exempt: it's a fixed
   constant, not a fact the evidence resolved.
6. Checks that every `fieldProvenance.path` (other than `confidence:
   "unknown"` entries, which may legitimately name something not yet in
   `profile` at all) actually resolves against `profile`'s real shape,
   flagging ones that don't as `unresolvableFieldProvenance` (ECS-62) — a
   typo, or a path left stale after a profile edit.

The result is a `CliGenerateReport`: a `GenerationReport` plus
`fieldProvenance`, `unknownEvidenceIds`, `untraceableFieldProvenance`,
`uncoveredFields`, and `unresolvableFieldProvenance`. `isCliReportReady` is
true only when `isReadyForRuntime` holds **and** all four new lists are
empty — citing evidence that doesn't exist, claiming a confidence with
nothing (or a contradiction) behind it, leaving a real field uncited, or
citing a field that isn't really there, are all the same kind of
invented-rather-than-reported fact every prior ticket already refuses to
allow. The command's exit code is `0` exactly when the printed report is
ready, `1` otherwise — scriptable in CI without parsing the report body.

Crucially, neither cross-check lives inside `src/generation/` or
`src/provenance/` themselves — both docs deliberately keep those modules
decoupled from each other (see provenance-model.md's "No cross-check
against `GeneratedDeviceProfile.evidenceIds`"). The CLI is the caller both
docs anticipated: it's allowed to know about all three sibling modules at
once, precisely so neither has to know about the others. `field-path.ts`'s
path parsing/resolution is itself a fourth piece the CLI owns for the same
reason: it depends only on `profile`'s runtime shape, not on either
sibling module's types.

### `--validator <module>`

This repo has no code dependency on `midi-core` (see evidence-model.md's
"No dependency on `midi-core`"), so `toValidatedProfile`'s `validate`
function has to come from somewhere outside it. `--validator` points at a
JS module (an absolute or cwd-relative path) exporting a
`validateDeviceProfile` function (named or default) matching
`(profile: unknown) => readonly Diagnostic[]` — in practice, `midi-core`'s
own real validator, imported by whatever glue script the caller writes, or
a fixture in a test. Omitting it runs generation and provenance checks
with no structural diagnostics at all, which is still useful (field
provenance is checked regardless) but not sufficient on its own to call a
profile ready.

## What's deliberately not here

- **No schema for `profile`** — same as the generation pipeline itself:
  `profile` stays `Record<string, unknown>`, checked only by whatever
  `--validator` is supplied, never duplicated locally.
- **No evidence extraction** — `generate-input.json` is authored by a
  human; this tool never reads a PDF, calls an AI model, or infers a field
  value from `Evidence.source`. Per the ticket, no LLM dependency at
  runtime.
- **No mutation of `research/` or the evidence catalogue** — `evidence
  list` is read-only; there's no `evidence add` command. Cataloguing new
  research is still done directly in `src/evidence/manifest.ts`, in
  TypeScript, per evidence-model.md's own stance on authored-not-loaded
  evidence.
- **No bundled `midi-core` validator** — `--validator` is required for
  structural diagnostics; this tool ships no default one, to avoid the
  code dependency every prior doc explicitly avoided.
- **No interactive mode, watch mode, or project scaffolding** — one-shot
  commands only, matching every other piece of this pipeline's
  determinism: the same arguments always produce the same report.
