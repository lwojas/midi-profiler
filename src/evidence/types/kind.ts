/**
 * What kind of research material a piece of evidence is, named directly
 * after the categories ECS-43 lists: manufacturer documentation and
 * manuals (one category — a manual *is* manufacturer documentation),
 * implementation charts, DAW scripts/integrations (one category — both
 * are "how a DAW talks to this device"), mapping references, captured
 * traffic, hands-on experiment notes, and SysEx references.
 */
export type EvidenceKind =
  | "manufacturer-documentation"
  | "implementation-chart"
  | "daw-integration"
  | "mapping-reference"
  | "captured-traffic"
  | "experiment-note"
  | "sysex-reference";

export const EVIDENCE_KINDS: readonly EvidenceKind[] = [
  "manufacturer-documentation",
  "implementation-chart",
  "daw-integration",
  "mapping-reference",
  "captured-traffic",
  "experiment-note",
  "sysex-reference",
];

export function isEvidenceKind(value: unknown): value is EvidenceKind {
  return typeof value === "string" && (EVIDENCE_KINDS as readonly string[]).includes(value);
}
