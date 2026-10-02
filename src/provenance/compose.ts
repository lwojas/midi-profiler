import type { ProvenanceConfidence } from "./types/confidence.js";
import type { FieldProvenance } from "./types/field-provenance.js";

/**
 * Assembles a `FieldProvenance` from a confidence level and the evidence a
 * human has already determined backs it. Deliberately as thin as the
 * generation pipeline's own `composeGeneratedProfile`: assembly only, no
 * validation, no inference, no guessing which evidence applies. Whether
 * the result is actually traceable (real evidence behind a claimed
 * confidence, none invented for `"unknown"`) is `isTraceable`'s job, kept
 * separate so this function can stay pure assembly.
 */
export function composeFieldProvenance(args: {
  path: string;
  confidence: ProvenanceConfidence;
  evidenceIds?: readonly string[];
  notes?: string;
}): FieldProvenance {
  return {
    path: args.path,
    confidence: args.confidence,
    evidenceIds: args.evidenceIds ?? [],
    notes: args.notes,
  };
}
