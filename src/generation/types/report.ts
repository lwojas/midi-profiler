import type { Diagnostic } from "./diagnostic.js";
import type { GeneratedDeviceProfile } from "./generated-profile.js";

/**
 * A `GeneratedDeviceProfile` run through a validator (see
 * `toValidatedProfile`), carrying both halves of what's still outstanding:
 * `unresolved` (what the generation stage itself knew it couldn't resolve)
 * and `diagnostics` (what an independent structural validator found wrong
 * or unresolved in `profile`). Deliberately two separate lists, not merged
 * — they come from different authorities, and one isn't a substitute for
 * the other: `unresolved` is self-reported by whoever ran the offline
 * profiler, `diagnostics` is the one source midi-core's own consumer will
 * actually trust.
 */
export interface GenerationReport extends GeneratedDeviceProfile {
  readonly diagnostics: readonly Diagnostic[];
}
