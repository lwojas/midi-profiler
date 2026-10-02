import { describe, expect, it } from "vitest";
import { composeFieldProvenance } from "./compose.js";
import { isTraceable } from "./is-traceable.js";

describe("isTraceable", () => {
  it("is true for a documented field citing real evidence", () => {
    const provenance = composeFieldProvenance({
      path: "identity.manufacturer",
      confidence: "manufacturer-documented",
      evidenceIds: ["novation.launch-control-3.programmers-reference-guide"],
    });

    expect(isTraceable(provenance)).toBe(true);
  });

  it("is false for a claimed confidence citing no evidence -- nothing to trace it to", () => {
    const provenance = composeFieldProvenance({ path: "identity.manufacturer", confidence: "manufacturer-documented" });

    expect(isTraceable(provenance)).toBe(false);
  });

  it("is true for an unknown field citing no evidence -- honestly unresolved, not invented", () => {
    const provenance = composeFieldProvenance({ path: "handshake.sysex", confidence: "unknown" });

    expect(isTraceable(provenance)).toBe(true);
  });

  it("is false for an unknown field that cites evidence -- unknown means nothing actually backs it", () => {
    const provenance = composeFieldProvenance({
      path: "handshake.sysex",
      confidence: "unknown",
      evidenceIds: ["some.evidence"],
    });

    expect(isTraceable(provenance)).toBe(false);
  });
});
