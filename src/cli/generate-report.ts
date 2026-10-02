import {
  composeGeneratedProfile,
  isReadyForRuntime,
  toValidatedProfile,
  type Diagnostic,
  type GenerationReport,
} from "../generation/index.js";
import { composeFieldProvenance, isTraceable, type FieldProvenance } from "../provenance/index.js";
import type { GenerateInput } from "./types/generate-input.js";

/**
 * The CLI's own report shape: a `GenerationReport` (generation pipeline,
 * ECS-44) plus the per-field provenance (ECS-45) authored alongside it,
 * plus two checks neither sibling module makes on its own -- making either
 * one check the other's ids would couple two modules both docs explicitly
 * keep decoupled (see docs/provenance-model.md's "What's deliberately not
 * here"). This CLI is exactly the caller both docs describe as the thing
 * that ties generation and provenance together.
 */
export interface CliGenerateReport extends GenerationReport {
  readonly fieldProvenance: readonly FieldProvenance[];
  /** `evidenceIds` (whole-profile or per-field) that don't match any known `Evidence.id`. */
  readonly unknownEvidenceIds: readonly string[];
  /** Paths of `fieldProvenance` entries that fail `isTraceable`. */
  readonly untraceableFieldProvenance: readonly string[];
}

/**
 * Runs a `GenerateInput` through the generation pipeline and attaches its
 * field provenance, cross-checking both against a known set of evidence
 * ids. Pure and deterministic given a deterministic `validate` -- the same
 * contract `toValidatedProfile` already has, just with the two sibling
 * modules composed on top of it.
 */
export function buildGenerateReport(args: {
  input: GenerateInput;
  knownEvidenceIds: ReadonlySet<string>;
  validate: (profile: unknown) => readonly Diagnostic[];
}): CliGenerateReport {
  const generated = composeGeneratedProfile({
    profile: args.input.profile,
    evidenceIds: args.input.evidenceIds,
    unresolved: args.input.unresolved,
  });
  const report = toValidatedProfile(generated, args.validate);

  const fieldProvenance = (args.input.fieldProvenance ?? []).map((entry) => composeFieldProvenance(entry));

  const citedEvidenceIds = [...report.evidenceIds, ...fieldProvenance.flatMap((entry) => entry.evidenceIds)];
  const unknownEvidenceIds = [...new Set(citedEvidenceIds.filter((id) => !args.knownEvidenceIds.has(id)))];

  const untraceableFieldProvenance = fieldProvenance.filter((entry) => !isTraceable(entry)).map((entry) => entry.path);

  return { ...report, fieldProvenance, unknownEvidenceIds, untraceableFieldProvenance };
}

/**
 * Whether a `CliGenerateReport` is actually fit to reach Deterministic
 * Runtime Behaviour: `isReadyForRuntime` (no error-severity diagnostic),
 * no evidence id that doesn't actually exist, and no field provenance that
 * contradicts itself. Any one of the three failing means something in this
 * document isn't traceable to real research.
 */
export function isCliReportReady(report: CliGenerateReport): boolean {
  return (
    isReadyForRuntime(report) &&
    report.unknownEvidenceIds.length === 0 &&
    report.untraceableFieldProvenance.length === 0
  );
}
