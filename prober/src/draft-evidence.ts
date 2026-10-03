import type { ProbeSession } from "./types/probe-session.js";

/**
 * The two `EvidenceKind` values (see midi-profiler's
 * `src/evidence/types/kind.ts`) a probe session can become. Named locally
 * rather than imported -- `prober/` stays decoupled from midi-profiler's
 * own `src/` entirely, same stance docs/device-prober.md already takes
 * toward `DeviceReference`.
 */
export type EvidenceCaptureKind = "captured-traffic" | "experiment-note";

export interface EvidenceDraft {
  readonly id: string;
  readonly device: { readonly manufacturer: string; readonly model: string };
  readonly kind: EvidenceCaptureKind;
  readonly source: { readonly type: "file"; readonly path: string };
  readonly title: string;
  readonly notes: string;
  readonly collectedAt: string;
}

export interface DraftEvidenceOptions {
  readonly kind?: EvidenceCaptureKind;
  readonly researchPath?: string;
}

/** Lowercase, non-alphanumeric runs collapsed to one hyphen, trimmed -- the same folder-naming convention docs/profiling-workflow.md already defines (`"Launchpad Mini [MK3]"` -> `"launchpad-mini-mk3"`). */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Turns a completed `ProbeSession` into a draft `Evidence`-shaped object --
 * the "small bridging script" half of docs/probe-capture-bridge.md (ECS-59).
 * It only formats what the session already states (device, step ids,
 * observation counts, timestamps); it never decides what a captured
 * response *means* for a `DeviceProfile` field, and it never touches
 * `src/evidence/manifest.ts` itself. A human still reviews this draft,
 * moves the session file under `research/<device-slug>/captured-traffic/`,
 * and pastes a (possibly edited) version of this object into the manifest
 * by hand -- the same manual, on-purpose registration step
 * docs/device-prober.md already describes.
 */
export function draftEvidenceFromSession(session: ProbeSession, options: DraftEvidenceOptions = {}): EvidenceDraft {
  const kind = options.kind ?? "captured-traffic";
  const manufacturerSlug = slugify(session.device.manufacturer);
  const modelSlug = slugify(session.device.model);

  const path = options.researchPath ?? `research/${manufacturerSlug}-${modelSlug}/captured-traffic/${session.id}.json`;

  const stepIds = session.steps.map((result) => result.step.id);
  const observationCount = session.steps.reduce((total, result) => total + result.observations.length, 0);

  return {
    id: `${manufacturerSlug}.${modelSlug}.${kind}.${session.id}`,
    device: { manufacturer: session.device.manufacturer, model: session.device.model },
    kind,
    source: { type: "file", path },
    title:
      `${session.device.manufacturer} ${session.device.model} probe session "${session.id}" ` +
      `(${stepIds.length} step${stepIds.length === 1 ? "" : "s"})`,
    notes:
      `Captured via midi-prober. Step(s): ${stepIds.join(", ")}; ${observationCount} observation${observationCount === 1 ? "" : "s"} total. ` +
      "Review the raw bytes in the session file before citing this in a fieldProvenance entry.",
    collectedAt: session.completedAt,
  };
}
