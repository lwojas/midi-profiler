import type { Diagnostic } from "./types/diagnostic.js";
import type { GeneratedDeviceProfile } from "./types/generated-profile.js";
import type { GenerationReport } from "./types/report.js";

/**
 * Runs a `GeneratedDeviceProfile` through a validator and returns the
 * combined report — the pipeline's Offline Profiler → Validated Device
 * Profile boundary. `validate` is supplied by the caller, not imported:
 * this repo has no code dependency on midi-core (see
 * docs/evidence-model.md), so the actual `validateDeviceProfile` midi-core
 * ships is wired in by whatever eventually calls this (ECS-46's CLI, or a
 * test using a fixture validator) — this function only defines the
 * boundary's shape.
 */
export function toValidatedProfile(
  generated: GeneratedDeviceProfile,
  validate: (profile: unknown) => readonly Diagnostic[],
): GenerationReport {
  return { ...generated, diagnostics: validate(generated.profile) };
}

/**
 * Whether a report's `profile` is fit to reach Deterministic Runtime
 * Behaviour: no error-severity diagnostic. A profile can still have
 * `unresolved` entries and pass this — those name facts research didn't
 * settle, not a structural problem; only `diagnostics` (an independent
 * validator's findings) gates runtime readiness, the same "warning vs.
 * error" split midi-core's own validation layer draws.
 */
export function isReadyForRuntime(report: GenerationReport): boolean {
  return report.diagnostics.every((diagnostic) => diagnostic.severity !== "error");
}
