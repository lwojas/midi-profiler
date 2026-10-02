import type { UnresolvedField } from "../../generation/index.js";
import { isProvenanceConfidence, type ProvenanceConfidence } from "../../provenance/index.js";

/**
 * One `fieldProvenance` entry as authored in a generate-input JSON file --
 * the same shape `composeFieldProvenance` takes, minus the default-to-empty
 * `evidenceIds` handling, which stays `composeFieldProvenance`'s job.
 */
export interface GenerateFieldProvenanceInput {
  readonly path: string;
  readonly confidence: ProvenanceConfidence;
  readonly evidenceIds?: readonly string[];
  readonly notes?: string;
}

/**
 * What a human (optionally AI-assisted, per the generation pipeline's own
 * constraint -- see docs/generation-pipeline.md) authors by hand once
 * they've resolved facts from evidence: the candidate profile itself, the
 * whole-profile evidence behind it, any aspects left unresolved, and the
 * per-field provenance behind whatever values *are* filled in.
 *
 * This is the CLI's one boundary with untrusted external input --
 * everywhere else in this repo either authors data directly in TypeScript
 * (`src/evidence/manifest.ts`) or takes already-resolved arguments
 * (`composeGeneratedProfile`, `composeFieldProvenance`). A JSON file on
 * disk is neither, so `parseGenerateInput` is where its shape actually
 * gets checked, the same relationship `toValidatedProfile` has to a
 * `profile`'s shape.
 */
export interface GenerateInput {
  readonly profile: Readonly<Record<string, unknown>>;
  readonly evidenceIds: readonly string[];
  readonly unresolved?: readonly UnresolvedField[];
  readonly fieldProvenance?: readonly GenerateFieldProvenanceInput[];
}

export function parseGenerateInput(value: unknown): GenerateInput {
  if (typeof value !== "object" || value === null) {
    throw new Error("Generate input must be a JSON object.");
  }
  const record = value as Record<string, unknown>;

  if (typeof record.profile !== "object" || record.profile === null) {
    throw new Error('Generate input must have a "profile" object.');
  }
  if (!Array.isArray(record.evidenceIds) || !record.evidenceIds.every((id) => typeof id === "string")) {
    throw new Error('Generate input must have an "evidenceIds" array of strings.');
  }
  if (record.unresolved !== undefined && !Array.isArray(record.unresolved)) {
    throw new Error('"unresolved", if present, must be an array.');
  }
  if (record.fieldProvenance !== undefined) {
    if (!Array.isArray(record.fieldProvenance)) {
      throw new Error('"fieldProvenance", if present, must be an array.');
    }
    for (const entry of record.fieldProvenance as readonly unknown[]) {
      if (typeof entry !== "object" || entry === null) {
        throw new Error('Every "fieldProvenance" entry must be an object.');
      }
      const field = entry as Record<string, unknown>;
      if (typeof field.path !== "string" || !isProvenanceConfidence(field.confidence)) {
        throw new Error('Every "fieldProvenance" entry needs a string "path" and a valid "confidence".');
      }
    }
  }

  return {
    profile: record.profile as Readonly<Record<string, unknown>>,
    evidenceIds: record.evidenceIds as readonly string[],
    unresolved: record.unresolved as readonly UnresolvedField[] | undefined,
    fieldProvenance: record.fieldProvenance as readonly GenerateFieldProvenanceInput[] | undefined,
  };
}
