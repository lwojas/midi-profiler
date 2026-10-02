import { describe, expect, it } from "vitest";
import { composeGeneratedProfile } from "./compose.js";

describe("composeGeneratedProfile", () => {
  it("assembles exactly what it's given, defaulting unresolved to empty", () => {
    const profile = { identity: { id: "fixture.device" } };
    const result = composeGeneratedProfile({ profile, evidenceIds: ["fixture.evidence"] });

    expect(result).toEqual({
      profile,
      evidenceIds: ["fixture.evidence"],
      unresolved: [],
    });
  });

  it("carries unresolved fields through unchanged", () => {
    const unresolved = [{ path: "controls[0].feedback", reason: "no documentation covers LED behavior" }];
    const result = composeGeneratedProfile({ profile: {}, evidenceIds: ["fixture.evidence"], unresolved });

    expect(result.unresolved).toBe(unresolved);
  });

  it("is deterministic: the same arguments always produce an equal result", () => {
    const args = { profile: { a: 1 }, evidenceIds: ["e1", "e2"] };

    expect(composeGeneratedProfile(args)).toEqual(composeGeneratedProfile(args));
  });
});
