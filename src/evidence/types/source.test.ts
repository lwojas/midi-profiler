import { describe, expect, it } from "vitest";
import { EVIDENCE_SOURCE_TYPES, isEvidenceSourceType } from "./source.js";

describe("isEvidenceSourceType", () => {
  it("accepts every declared source type", () => {
    for (const type of EVIDENCE_SOURCE_TYPES) {
      expect(isEvidenceSourceType(type)).toBe(true);
    }
  });

  it("rejects unknown values", () => {
    expect(isEvidenceSourceType("video")).toBe(false);
    expect(isEvidenceSourceType(1)).toBe(false);
  });
});
