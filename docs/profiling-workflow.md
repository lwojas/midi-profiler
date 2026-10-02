# Profiling Workflow: Research → Evidence → Generate → Validate

Status: Draft
Context: preparation for [ECS-47](https://linear.app/ecs3d/issue/ECS-47/create-first-real-device-profile-as-profiler-validation-exercise)
("Create first real device profile as profiler validation exercise")
Depends on: [docs/evidence-model.md](./evidence-model.md) (ECS-43),
[docs/generation-pipeline.md](./generation-pipeline.md) (ECS-44),
[docs/provenance-model.md](./provenance-model.md) (ECS-45),
[docs/cli.md](./cli.md) (ECS-46)

This is the practical, step-by-step guide the other four docs each
describe in the abstract: how a real device actually gets from "some PDFs
and a controller on the desk" to a `DeviceProfile` document `midi-core`
will accept. It doesn't define any new types or commands — everything
here is already built; this just says where files go and how to use an AI
assistant for the one step that's still manual (reading evidence and
drafting candidate field values) without breaking this project's central
rule: **report what the evidence says, never invent what it doesn't.**

## Overview

```
1. Gather research        → research/<device-slug>/
2. Register it            → src/evidence/manifest.ts (Evidence entries)
3. Draft a candidate       → profiles/<device-slug>/generate-input.json
   profile (AI-assisted,     (human- or AI-drafted, human-reviewed)
   reviewed by a human)
4. Run it through the CLI → `midi-profiler generate`, against midi-core's
                             real validator
5. Read the report,       → add evidence, fix citations, or accept an
   iterate                   honest `unresolved`/`unknown`
6. Commit                 → research/, manifest.ts, generate-input.json,
                             and the latest report.json
```

Nothing in steps 1–3 is deterministic or enforced by code — a human (or an
AI assistant) can write anything into `generate-input.json`. Step 4 is
where the project's actual guarantees kick in: `midi-profiler generate`
(ECS-46) won't call a profile ready unless every claimed confidence cites
real evidence and every structural requirement `midi-core`'s validator
checks actually holds.

## 1. Where research lives

One folder per device under `research/`, named
`<manufacturer-slug>-<model-slug>` (lowercase, spaces and bracket/paren
decorations collapsed to hyphens — `"Launchpad Mini [MK3]"` becomes
`launchpad-mini-mk3`). Research that isn't about one specific device (a
general DAW-integration guide, a cross-device SysEx primer) goes in
`research/general/` instead, the same `device`-less case
[`Evidence.device`](./evidence-model.md) already allows for.

```
research/
  novation-launch-control-3/
    programmers-reference-guide.pdf
  novation-launchpad-mini-mk3/
    programmers-reference-manual.pdf
  general/
    useful-mapping-repos.md
```

This is a convention, not something code enforces — `Evidence.source`'s
`path` can point anywhere under the repo root. It exists so research for
one device doesn't get lost in a growing flat pile the moment a third or
fourth device shows up.

## 2. Register it as `Evidence`

Add an entry per piece of research to
[`src/evidence/manifest.ts`](../src/evidence/manifest.ts), following the
existing entries' shape and id convention
(`<manufacturer-slug>.<model-slug>.<short-name>`, e.g.
`novation.launch-control-3.programmers-reference-guide`). This is the
step that actually makes a piece of research usable by anything
downstream — a PDF sitting in `research/` that isn't in the manifest
doesn't exist as far as the generation pipeline or CLI are concerned.
`npm test` (`src/evidence/manifest.test.ts`) checks every `file`-sourced
entry's path actually resolves, so a typo here fails loudly.

## 3. Draft the candidate profile

Create `profiles/<device-slug>/generate-input.json` — the
[`GenerateInput`](./cli.md) shape `midi-profiler generate` reads. This is
the one step in the whole pipeline that isn't deterministic: a human reads
the registered evidence and decides what the profile actually says. AI
assistance is explicitly allowed here (per ECS-44's own "AI may assist
offline analysis but must never be a runtime dependency") — it's drafting
that happens entirely before this tool runs, not code this project ships.

### The extraction prompt

Use this as a starting prompt for an AI assistant with access to the
registered evidence (the PDFs/files themselves, not just their titles).
Fill in the bracketed parts; the rest is deliberately specific about the
real schema and the real discipline this project enforces, since a vaguer
prompt tends to produce a document that *looks* complete but states things
the evidence never actually said.

> I'm drafting a `generate-input.json` file for `midi-profiler`'s
> `generate` command, for the device **[manufacturer] [model]**, from the
> evidence below. Read the attached material and produce **only** the
> JSON document — no commentary, no markdown fences.
>
> Evidence available (cite these `Evidence.id`s, exactly, in
> `evidenceIds`/`fieldProvenance[].evidenceIds` — never invent an id that
> isn't in this list):
> - `[evidence.id.one]` — [title/one-line description]
> - `[evidence.id.two]` — [title/one-line description]
>
> Produce a JSON object matching this shape:
> ```ts
> interface GenerateInput {
>   profile: {
>     schemaVersion: "1.0";
>     identity: { id: string; manufacturer: string; model: string };
>     ports: { id: string; type: "input" | "output"; role: string; required: boolean; messageTypes: string[] }[];
>     controls: {
>       id: string; label: string;
>       kind: "button" | "pad" | "knob" | "encoder" | "fader" | "wheel";
>       portId: string;
>       input?: { address: { type: "control-change" | "note" | "pitch-bend" | "program-change" | "channel-pressure" | "poly-pressure"; controller?: number; note?: number; program?: number }; channel: number };
>       feedback?: { kind: "monochrome-led" | "velocity-color-led" | "rgb-led" | "motorized"; address: { ... same as input.address ... }; paletteSize?: number };
>       valueMode?: "absolute" | "relative"; // omit for "absolute"
>     }[];
>     grids?: { id: string; label: string; rows: number; columns: number; cells: { row: number; column: number; controlId: string }[] }[];
>     sysex?: { manufacturerId: number[]; required: boolean; notes?: string };
>     handshake?: { required: boolean; steps: { id: string; description: string; direction: "send" | "expect" }[] };
>   };
>   evidenceIds: string[]; // every Evidence.id that informed this document, whole-profile
>   unresolved?: { path: string; reason: string }[];
>   fieldProvenance?: {
>     path: string; // e.g. "controls[2].feedback", dotted/indexed, matching `profile`'s actual structure
>     confidence: "manufacturer-documented" | "daw-discovered" | "inferred" | "experimentally-verified" | "unknown";
>     evidenceIds?: string[]; // required (non-empty) unless confidence is "unknown"
>     notes?: string;
>   }[];
> }
> ```
>
> Rules, non-negotiable:
> 1. **Every value in `profile` must come from something the evidence
>    actually states.** If the evidence doesn't say it, leave the field
>    out of `profile` entirely and add it to `unresolved` instead — do not
>    fill in a plausible-sounding default (a channel number, a SysEx
>    manufacturer id, a handshake step) that isn't written down somewhere.
> 2. **Every field you do include needs a matching `fieldProvenance`
>    entry** citing the specific `Evidence.id`(s) that actually support it
>    — not just "the manual" in general, the id of the evidence entry that
>    states that specific fact. Use `"manufacturer-documented"` for
>    something the manufacturer's own reference states outright,
>    `"daw-discovered"` for something only evident from how a DAW
>    integration talks to the device, `"inferred"` for something reasoned
>    from related evidence rather than stated outright, and
>    `"experimentally-verified"` only if the evidence describes actual
>    hands-on testing against the device.
> 3. **A proprietary or undocumented behavior (e.g. a mode-switch SysEx
>    handshake the manual doesn't fully specify) must be represented as
>    `confidence: "unknown"` with no `evidenceIds`, and named in
>    `unresolved`** — never invented to make the document look complete.
>    This is the whole point of this project's provenance model.
> 4. Quote or closely paraphrase the exact evidence passage you're relying
>    on in that `fieldProvenance` entry's `notes`, so a human reviewer
>    doesn't have to re-find it in the source PDF.
> 5. If you're not sure whether something counts as resolved, treat it as
>    unresolved. The CLI will reject an unsupported claim; it can't catch
>    one that's merely unconvincing.

Save the result to `profiles/<device-slug>/generate-input.json`, then
**read it against the actual source material yourself** before running
anything — the CLI's checks (next section) catch an invented evidence id
or a confidence with nothing behind it, but they can't catch a citation
that's real but still wrong (evidence id exists, just doesn't actually say
what the draft claims).

## 4. Run it through the CLI

`--validator` needs `midi-core`'s real `validateDeviceProfile`. Build
`midi-core` once, then point at its built `profile` entry directly (it
already exports `validateDeviceProfile` by name — no wrapper module
needed):

```sh
# from this repo, once:
npm run build

# adjust the path to wherever your midi-core checkout actually is
node dist/cli/index.js generate \
  profiles/<device-slug>/generate-input.json \
  --validator ../midi-core/dist/profile/index.js \
  --out profiles/<device-slug>/report.json
```

Exit code `0` means the report is ready for Deterministic Runtime
Behaviour; `1` means something still needs attention.

## 5. Read the report, iterate

The printed `CliGenerateReport` separates findings by where they came
from — react to each differently:

- **`unresolved`** — aspects the draft itself flagged as not determinable.
  Not a failure; an honest list of what still needs more research (or
  will stay unknown, e.g. a proprietary handshake).
- **`diagnostics`** — `midi-core`'s own structural findings (dangling
  `portId`/`controlId` references, unknown enum values, a `handshake`
  marked `required` with no `steps`, etc.). An `"error"` here blocks
  readiness and needs a real fix to `profile`, not a provenance change.
- **`unknownEvidenceIds`** — a cited id (whole-profile or per-field) that
  doesn't exist in `src/evidence/manifest.ts`. Usually a typo, or evidence
  that still needs registering (step 2).
- **`untraceableFieldProvenance`** — a `fieldProvenance` entry whose
  confidence and `evidenceIds` contradict each other (a claimed confidence
  with nothing cited, or `"unknown"` with something cited anyway). Fix the
  entry, don't suppress the check.

Re-run step 4 after each change — the whole pipeline is deterministic, so
the same input always reproduces the same report.

## 6. Commit

Commit `research/<device-slug>/`, the `src/evidence/manifest.ts` entries,
`profiles/<device-slug>/generate-input.json`, and the latest
`profiles/<device-slug>/report.json`. The report is regenerable (re-run
step 4 any time `generate-input.json`, the evidence manifest, or
`midi-core`'s validator changes), but committing it gives anyone reading
the repo a reviewable, point-in-time answer to "is this profile actually
ready" without needing a `midi-core` checkout on hand. `unresolved`
entries in a committed report are fine — they're the honest state of the
research, not a blocker to merging.

## What this guide is deliberately not

- **Not a new contract** — no new types, fields, or CLI flags. Every piece
  named here already exists; this is purely "how to actually use them."
- **Not a substitute for reading the evidence yourself** — the extraction
  prompt drafts; a human still has to confirm the draft against the real
  source before trusting it. The CLI's checks catch invented evidence and
  self-contradictory confidence, not a citation that's merely incorrect.
- **Not device-specific** — this guide doesn't pick a device or carry any
  of its facts. Selecting the actual first device, and authoring its real
  `generate-input.json`, is ECS-47 itself.
