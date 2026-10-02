import type { FieldProvenance } from "./types/field-provenance.js";

/**
 * Whether a `FieldProvenance`'s claimed confidence is actually backed by
 * real evidence, not invented. Per the ticket's "allow unresolved
 * proprietary handshakes rather than inventing them": a claimed confidence
 * of anything other than `"unknown"` requires at least one cited
 * `Evidence.id` — a confidence with nothing behind it is a guess wearing
 * this model's shape. Conversely, `"unknown"` requires *no* cited
 * evidence — citing evidence while also saying "unknown" would contradict
 * itself, claiming support for a field that's honestly unresolved.
 */
export function isTraceable(provenance: FieldProvenance): boolean {
  return provenance.confidence === "unknown"
    ? provenance.evidenceIds.length === 0
    : provenance.evidenceIds.length > 0;
}
