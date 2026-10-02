import { describe, expect, it } from "vitest";
import { composeFieldProvenance } from "./compose.js";

describe("composeFieldProvenance", () => {
  it("assembles exactly what it's given, defaulting evidenceIds to empty", () => {
    const result = composeFieldProvenance({ path: "handshake.sysex", confidence: "unknown" });

    expect(result).toEqual({
      path: "handshake.sysex",
      confidence: "unknown",
      evidenceIds: [],
    });
  });

  it("carries evidenceIds and notes through unchanged", () => {
    const result = composeFieldProvenance({
      path: "identity.manufacturer",
      confidence: "manufacturer-documented",
      evidenceIds: ["novation.launch-control-3.programmers-reference-guide"],
      notes: "Stated directly on the cover page.",
    });

    expect(result).toEqual({
      path: "identity.manufacturer",
      confidence: "manufacturer-documented",
      evidenceIds: ["novation.launch-control-3.programmers-reference-guide"],
      notes: "Stated directly on the cover page.",
    });
  });

  it("is deterministic: the same arguments always produce an equal result", () => {
    const args = { path: "sysex.handshake", confidence: "inferred" as const, evidenceIds: ["e1"] };

    expect(composeFieldProvenance(args)).toEqual(composeFieldProvenance(args));
  });
});
