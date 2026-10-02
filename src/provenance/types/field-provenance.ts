import type { ProvenanceConfidence } from "./confidence.js";

/**
 * Links one field of a candidate device profile to the confidence behind
 * its value and the evidence that confidence rests on. `path` uses the
 * same dotted/indexed notation as the generation pipeline's own
 * `UnresolvedField.path`/`Diagnostic.path` (e.g. "controls[2].feedback"),
 * so provenance for a field lines up with that same field elsewhere in the
 * pipeline's output. Deliberately per-field, not whole-profile — that's
 * what distinguishes this from `GeneratedDeviceProfile.evidenceIds` (see
 * docs/generation-pipeline.md), which only says *some* evidence informed
 * the document as a whole.
 */
export interface FieldProvenance {
  readonly path: string;
  readonly confidence: ProvenanceConfidence;
  /** `Evidence.id`s (from `src/evidence/`) this confidence actually rests on. Empty only when `confidence` is `"unknown"` — see `isTraceable`. */
  readonly evidenceIds: readonly string[];
  /** Free-text context: how the evidence supports this field, or why it doesn't. */
  readonly notes?: string;
}
