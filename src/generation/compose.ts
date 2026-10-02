import type { GeneratedDeviceProfile } from "./types/generated-profile.js";
import type { UnresolvedField } from "./types/unresolved-field.js";

/**
 * Assembles a `GeneratedDeviceProfile` from facts a human (optionally
 * AI-assisted) has already resolved from evidence — see
 * docs/generation-pipeline.md for why extraction itself stays outside this
 * function. Pure and deterministic: the same arguments always produce the
 * same result, nothing here reads a file, calls a model, or depends on
 * wall-clock time — the "deterministic" half of the ticket's own title.
 * `evidenceIds` is required, not optional: per the ticket, a generated
 * profile that cites no evidence at all would be a guess wearing this
 * pipeline's shape, not a real output of it.
 *
 * Mirrors midi-core's own `composeDeviceProfile` in spirit: assembly only,
 * no validation. Whether `profile` is actually well-formed is
 * `toValidatedProfile`'s job, the next stage.
 */
export function composeGeneratedProfile(args: {
  profile: Readonly<Record<string, unknown>>;
  evidenceIds: readonly string[];
  unresolved?: readonly UnresolvedField[];
}): GeneratedDeviceProfile {
  return {
    profile: args.profile,
    evidenceIds: args.evidenceIds,
    unresolved: args.unresolved ?? [],
  };
}
