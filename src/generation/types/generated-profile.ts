import type { UnresolvedField } from "./unresolved-field.js";

/**
 * The offline profiler's output: a candidate document shaped like
 * midi-core's `DeviceProfile` schema (by convention, not an imported type —
 * see docs/generation-pipeline.md), built only from facts resolved during
 * research, plus a record of what that research couldn't resolve. Not yet
 * a "Validated Device Profile" — that's `toValidatedProfile`'s job, the
 * next pipeline stage.
 */
export interface GeneratedDeviceProfile {
  readonly profile: Readonly<Record<string, unknown>>;
  /** `Evidence.id`s that informed this profile. Every generated document traces back to real research, never to inference alone. */
  readonly evidenceIds: readonly string[];
  readonly unresolved: readonly UnresolvedField[];
}
