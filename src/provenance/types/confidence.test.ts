import { describe, expect, it } from "vitest";
import { PROVENANCE_CONFIDENCE_LEVELS, isProvenanceConfidence } from "./confidence.js";

describe("isProvenanceConfidence", () => {
  it("accepts every declared confidence level", () => {
    for (const level of PROVENANCE_CONFIDENCE_LEVELS) {
      expect(isProvenanceConfidence(level)).toBe(true);
    }
  });

  it("rejects unknown values", () => {
    expect(isProvenanceConfidence("confirmed")).toBe(false);
    expect(isProvenanceConfidence(undefined)).toBe(false);
  });
});
