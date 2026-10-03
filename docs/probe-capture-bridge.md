# Probe Capture Format and Evidence Bridge

Status: Draft
Linear: [ECS-59](https://linear.app/ecs3d/issue/ECS-59/define-probe-capture-format-and-evidence-bridge)
Depends on: [docs/evidence-model.md](./evidence-model.md) (ECS-43),
[docs/device-prober.md](./device-prober.md) (ECS-58)
Source of truth: [`../prober/src/types/probe-session.ts`](../prober/src/types/probe-session.ts) (format),
[`../prober/src/draft-evidence.ts`](../prober/src/draft-evidence.ts) (bridge)

## Scope

`docs/device-prober.md` (ECS-58) already defined the probe capture format
itself (`ProbeStep`/`ProbeObservation`/`ProbeStepResult`/`ProbeSession`) as
part of designing the prober's own architecture, and already decided *in
principle* how a capture becomes `Evidence`: a human moves the written
session file under `research/<device-slug>/captured-traffic/` and adds a
`captured-traffic` entry to `src/evidence/manifest.ts` by hand — "both
manual steps, on purpose."

This ticket is the concrete follow-through on that decision: a
field-by-field mapping from a completed `ProbeSession` to an `Evidence`
entry, and a small bridging command — `midi-prober draft-evidence` — that
formats that mapping so a human doesn't hand-transcribe it. The decision
itself doesn't change: registering a capture stays manual. What this adds
is a script that removes the *typing*, not the *judgment*.

## The capture format, restated

```ts
interface ProbeObservation {
  readonly raw: readonly number[];
  readonly receivedAtMs: number;
}

interface ProbeStepResult {
  readonly step: ProbeStep; // id, description, send (raw bytes), listenMs
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

This is exactly ECS-58's shape, unchanged — `prober probe` already writes
it to disk as plain JSON. `parseProbeSession`
([`../prober/src/types/probe-session.ts`](../prober/src/types/probe-session.ts))
is new here: the same "validate at the boundary" discipline
`parseProbePlan` already applies to a hand-authored plan file, applied to a
session file read back off disk (possibly hand-edited, not just one this
app just produced in-process).

## The mapping: `ProbeSession` → draft `Evidence`

| `Evidence` field | Derived from | Notes |
| --- | --- | --- |
| `id` | `<manufacturer-slug>.<model-slug>.<kind>.<session.id>` | Slugs follow `docs/profiling-workflow.md`'s folder convention (lowercase, non-alphanumeric runs collapsed to one hyphen). |
| `device` | `session.device` | Copied as-is. |
| `kind` | `"captured-traffic"` by default, `--kind experiment-note` to override | Both already exist in `EvidenceKind` (ECS-43) — no new kind needed. `experiment-note` fits a one-off, exploratory capture; `captured-traffic` fits a plan run against known bytes. |
| `source` | `{ type: "file", path: "research/<device-slug>/captured-traffic/<session.id>.json" }` | The *assumed* destination once the session file is moved per `docs/device-prober.md`'s workflow — override with `--research-path` if it lands somewhere else. |
| `title` | Manufacturer, model, session id, step count | e.g. `"Novation Launchpad Mini [MK3] probe session \"sysex-handshake-probe\" (2 steps)"`. |
| `notes` | Step ids and total observation count | A pointer back into the session file, not a claim about what any observation *means*. |
| `collectedAt` | `session.completedAt` | Already a real ISO timestamp from the session itself — never guessed. |

`fieldProvenance`/`confidence` are deliberately **not** part of this
mapping — recognizing that a specific observation confirms a specific
`DeviceProfile` field (and at what confidence, almost always
`"experimentally-verified"`) is the human judgment call
`docs/provenance-model.md` already reserves for whoever authors
`generate-input.json`, not something derivable from the capture alone.

## The bridge: `midi-prober draft-evidence`

```sh
node dist/cli/index.js draft-evidence session.json --out draft.json
```

Reads a `ProbeSession` file, applies the mapping above, and prints (or
writes to `--out`) the resulting draft as JSON — valid as a `src/evidence/manifest.ts`
object literal as-is, so pasting it in is copy-paste, not re-typing. A
human still:

1. Reviews the draft (edit the `title`/`notes`, or swap `kind` by hand if
   neither default fits).
2. Moves the session file to where `source.path` says it should be (or
   edits `source.path` to match wherever it actually went).
3. Pastes the (possibly edited) object into `EVIDENCE` in
   `src/evidence/manifest.ts` themselves.

`draft-evidence` never writes to `src/evidence/manifest.ts`, never moves
the session file, and — same as `prober/` as a whole — never imports
anything from midi-profiler's own `src/`. It's linked to the `Evidence`
shape purely by convention, the same arm's-length relationship
`docs/device-prober.md` already keeps.

## What this is deliberately not

- **Not automatic evidence registration.** `docs/device-prober.md`'s
  decision stands: moving the file and editing the manifest are still
  manual, human steps. This only drafts the text that goes into the
  second one.
- **Not a new `EvidenceKind`.** `captured-traffic` and `experiment-note`
  both already existed (ECS-43); this just picks between them.
- **Not a confidence or `fieldProvenance` assignment.** See above — that's
  still authored by hand, same as any other evidence, when a real
  `generate-input.json` cites this entry.
- **Not validation of the captured bytes' meaning.** `parseProbeSession`
  checks shape (every field present, right type), not content — it has no
  opinion on whether a `raw` byte sequence makes sense for the device probed.
