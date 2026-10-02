/**
 * How confident a device profile field's value is, and where that
 * confidence comes from — named directly after the categories ECS-45
 * lists: stated outright in manufacturer documentation
 * (`manufacturer-documented`), observed by watching a DAW's own
 * integration talk to the device (`daw-discovered`), reasoned from related
 * evidence rather than stated outright (`inferred`), confirmed by hands-on
 * testing against a real device (`experimentally-verified`), or
 * `unknown` — investigated but not actually resolved by any of the above,
 * as opposed to guessed. `unknown` exists specifically so a proprietary,
 * undocumented handshake can be represented honestly instead of invented
 * (per the ticket: "allow unresolved proprietary handshakes rather than
 * inventing them").
 */
export type ProvenanceConfidence =
  | "manufacturer-documented"
  | "daw-discovered"
  | "inferred"
  | "experimentally-verified"
  | "unknown";

export const PROVENANCE_CONFIDENCE_LEVELS: readonly ProvenanceConfidence[] = [
  "manufacturer-documented",
  "daw-discovered",
  "inferred",
  "experimentally-verified",
  "unknown",
];

export function isProvenanceConfidence(value: unknown): value is ProvenanceConfidence {
  return typeof value === "string" && (PROVENANCE_CONFIDENCE_LEVELS as readonly string[]).includes(value);
}
