import type { DeviceReference } from "./device-reference.js";
import type { EvidenceKind } from "./kind.js";
import type { EvidenceSource } from "./source.js";

/**
 * One piece of offline research: a document, link or observation gathered
 * about a device (or, for something like a general DAW-mapping guide, not
 * tied to any one device at all — hence `device` is optional). Deliberately
 * data only, same as midi-core's `DeviceProfile`: no behavior, no parsing
 * of `source`'s content, nothing that reaches into a live device or DAW.
 *
 * What this evidence actually *supports* about a future profile (which
 * fields, with how much confidence) is out of scope here — that's ECS-45
 * ("profile confidence/provenance model"), which depends on this existing
 * first. This ticket only has to define what a piece of evidence *is*.
 */
export interface Evidence {
  readonly id: string;
  readonly device?: DeviceReference;
  readonly kind: EvidenceKind;
  readonly source: EvidenceSource;
  readonly title: string;
  /** Free-text context: what this evidence shows, or why it was collected. */
  readonly notes?: string;
  /** ISO date, when known. Omitted rather than guessed when it isn't. */
  readonly collectedAt?: string;
}
