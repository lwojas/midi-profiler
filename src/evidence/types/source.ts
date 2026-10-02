/**
 * Where a piece of evidence actually lives — the "input" half of the
 * evidence/input model. Three kinds, matching the research gathered so
 * far: a local file (a manufacturer PDF), a URL (a community reference
 * like a DAW mapping guide), or a free-text note (a hands-on experiment
 * observation with no separate document of its own).
 */

export interface EvidenceFileSource {
  readonly type: "file";
  /** Path relative to this repo's root, e.g. "research/launchpad-mini-programmers-reference-manual.pdf". */
  readonly path: string;
}

export interface EvidenceUrlSource {
  readonly type: "url";
  readonly url: string;
}

export interface EvidenceNoteSource {
  readonly type: "note";
  readonly text: string;
}

export type EvidenceSource = EvidenceFileSource | EvidenceUrlSource | EvidenceNoteSource;

export type EvidenceSourceType = EvidenceSource["type"];

export const EVIDENCE_SOURCE_TYPES: readonly EvidenceSourceType[] = ["file", "url", "note"];

export function isEvidenceSourceType(value: unknown): value is EvidenceSourceType {
  return typeof value === "string" && (EVIDENCE_SOURCE_TYPES as readonly string[]).includes(value);
}
