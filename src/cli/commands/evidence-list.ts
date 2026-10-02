import type { Evidence } from "../../evidence/index.js";

/**
 * Narrows the evidence catalogue by device model and/or kind -- the
 * "ingest evidence" half of this ticket's tooling. Pure filtering, no
 * parsing of `source` content (see docs/evidence-model.md's own "What's
 * deliberately not here"): this just lets a human browse what's already
 * been gathered, by the same fields `Evidence` already exposes.
 */
export function filterEvidence(
  evidence: readonly Evidence[],
  filters: { device?: string; kind?: string },
): readonly Evidence[] {
  return evidence.filter((entry) => {
    if (filters.device !== undefined && entry.device?.model !== filters.device) return false;
    if (filters.kind !== undefined && entry.kind !== filters.kind) return false;
    return true;
  });
}
