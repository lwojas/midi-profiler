# MIDI Profiler — Evidence/Input Model

Status: Draft
Linear: [ECS-43](https://linear.app/ecs3d/issue/ECS-43/design-midi-profiler-evidenceinput-model)
Depends on: [midi-core's device-profile schema](https://github.com/lwojas/midi-core/blob/main/docs/contracts/device-profile.md) (ECS-39)
Source of truth: [`src/evidence/`](../src/evidence)

## Scope

`midi-profiler` is offline tooling: it researches real devices and
eventually produces profiles consumable by `midi-core`
(`DeviceProfile`, per `midi-core`'s own schema). Before any of that
generation can happen, the research itself — manufacturer PDFs, DAW
mapping references, captured traffic, hands-on experiments — needs a
shape. This defines that shape: `Evidence`, what kind of material it can
be, and where it actually lives.

Per the ticket, this keeps research inputs **separate from runtime
behavior**: `Evidence` has no notion of a live device, a MIDI port, or a
`DeviceProfile`'s actual field values — it only describes *material
someone gathered*. Turning evidence into an authored profile, with some
confidence per field, is separate work: see
[`docs/provenance-model.md`](./provenance-model.md) (ECS-45, "profile
confidence/provenance model").
`midi-core`'s schema is a *dependency* in the sense that `DeviceReference`
below is deliberately shaped to line up with it, not in the sense of an
actual code dependency — this repo imports nothing from `midi-core`.

## `Evidence`

```ts
interface Evidence {
  readonly id: string;
  readonly device?: DeviceReference;
  readonly kind: EvidenceKind;
  readonly source: EvidenceSource;
  readonly title: string;
  readonly notes?: string;
  readonly collectedAt?: string; // ISO date
}
```

- **`device`** — `{ manufacturer, model }`, optional. Mirrors
  `DeviceIdentity`'s `manufacturer`/`model` from `midi-core`'s schema
  (not imported — see above), so evidence for a device naturally lines up
  with that device's eventual profile. Optional because not all evidence
  is about one specific device — e.g. a general guide to how Ableton's
  Remote Scripts map a controller into Live applies across many devices,
  not one.
- **`kind`** — `EvidenceKind`, one of:
  `"manufacturer-documentation" | "implementation-chart" |
  "daw-integration" | "mapping-reference" | "captured-traffic" |
  "experiment-note" | "sysex-reference"`. Named directly after the
  ticket's own list, collapsing only true synonyms: "manuals" into
  `manufacturer-documentation` (a manual *is* manufacturer
  documentation), and "DAW scripts"/"integrations" into
  `daw-integration` (both are "how a DAW talks to this device"). Each
  other noun in the ticket — implementation charts, mappings, captured
  traffic, experiments, SysEx references — got its own value.
- **`source`** — `EvidenceSource`, one of three shapes:
  - `{ type: "file", path }` — a local file, path relative to this
    repo's root (e.g. a manufacturer PDF under `research/`).
  - `{ type: "url", url }` — an external reference (e.g. a community
    mapping guide).
  - `{ type: "note", text }` — a free-text observation with no separate
    document (e.g. an experiment's result, typed directly).
- **`title`**/**`notes`**/**`collectedAt`** — human-facing context.
  `collectedAt` is optional and left out rather than guessed when the
  actual collection date isn't known — the same "report, don't invent"
  stance `midi-core`'s profile validation (ECS-42) takes.

## The real evidence gathered so far

[`src/evidence/manifest.ts`](../src/evidence/manifest.ts) catalogues
`research/`'s current contents as real `Evidence` entries, rather than
leaving the model proven only against a fictional fixture:

- Two `manufacturer-documentation` entries — Novation's own Launch
  Control 3 and Launchpad Mini [MK3] programmer's reference
  guides/manuals, one per-device folder each
  (`research/novation-launch-control-3/`, `research/novation-launchpad-mini-mk3/`
  — see [`docs/profiling-workflow.md`](./profiling-workflow.md) for the
  folder convention).
- One `mapping-reference` entry with no `device` — a community guide to
  Ableton's Live Object Model map, background on how DAW remote scripts
  map a controller in general, not specific to either device above
  (`research/general/useful-mapping-repos.md`'s link).

`src/evidence/manifest.test.ts` checks the manifest stays honest: every
`file`-sourced entry's `path` must actually exist on disk, and every
`url`-sourced entry must parse as a real URL — so a renamed or removed
research file breaks the test suite instead of silently going stale.

## What's deliberately not here

- **No parsing of `source`'s content** — nothing here reads a PDF, fetches
  a URL, or extracts structured data (SysEx tables, control lists) from
  evidence. Evidence is a pointer to material and a human-readable
  description of it, not an extraction pipeline.
- **No confidence or provenance linking to specific profile fields** — an
  `Evidence` record doesn't say "this supports `DeviceProfile.controls[3]`
  with high confidence." See [`docs/provenance-model.md`](./provenance-model.md)
  (ECS-45), which depends on `Evidence` existing here first.
- **No deterministic generation** — nothing here turns `Evidence` into a
  `DeviceProfile`. That's ECS-44 ("deterministic profile generation
  pipeline"), also blocked on this ticket.
- **No validation function** — unlike `midi-core`'s
  `validateDeviceProfile`, there's no `validateEvidence(unknown)` here.
  Nothing yet produces or loads `Evidence` from untrusted external input
  (it's authored directly in this repo, in TypeScript); if that changes,
  validation is new, separate work, not assumed speculatively now.
- **No dependency on `midi-core`** — this repo doesn't install or import
  it. `DeviceReference`'s field names are chosen to line up with
  `DeviceIdentity`, deliberately, but by convention, not by a shared type.
