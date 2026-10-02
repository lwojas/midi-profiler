import { describe, expect, it } from "vitest";
import { EVIDENCE_KINDS, isEvidenceKind } from "./kind.js";

describe("isEvidenceKind", () => {
  it("accepts every declared kind", () => {
    for (const kind of EVIDENCE_KINDS) {
      expect(isEvidenceKind(kind)).toBe(true);
    }
  });

  it("rejects unknown values", () => {
    expect(isEvidenceKind("forum-post")).toBe(false);
    expect(isEvidenceKind(undefined)).toBe(false);
  });
});
