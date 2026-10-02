/**
 * The minimal shape of a validation finding this pipeline needs to carry
 * through `toValidatedProfile`. Deliberately not midi-core's own
 * `ProfileDiagnostic` — this repo has no code dependency on midi-core (see
 * docs/evidence-model.md's "No dependency on midi-core"), and a structural
 * subset is all the pipeline itself inspects (whether anything is severity
 * "error"). `validateDeviceProfile`'s real result is still structurally
 * assignable wherever a `Diagnostic` is expected — it has every field this
 * type does, plus a `code` this pipeline has no use for.
 */
export type DiagnosticSeverity = "error" | "warning";

export interface Diagnostic {
  readonly severity: DiagnosticSeverity;
  readonly path: string;
  readonly message: string;
}
