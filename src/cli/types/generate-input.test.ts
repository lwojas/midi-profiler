import { describe, expect, it } from "vitest";
import { parseGenerateInput } from "./generate-input.js";

describe("parseGenerateInput", () => {
  it("accepts a minimal valid input, leaving optional fields undefined", () => {
    const result = parseGenerateInput({ profile: { identity: { id: "fixture" } }, evidenceIds: ["fixture.evidence"] });

    expect(result).toEqual({
      profile: { identity: { id: "fixture" } },
      evidenceIds: ["fixture.evidence"],
      unresolved: undefined,
      fieldProvenance: undefined,
    });
  });

  it("carries unresolved and fieldProvenance through unchanged", () => {
    const input = {
      profile: {},
      evidenceIds: ["fixture.evidence"],
      unresolved: [{ path: "controls", reason: "no chart found" }],
      fieldProvenance: [
        { path: "identity.manufacturer", confidence: "manufacturer-documented", evidenceIds: ["fixture.evidence"] },
      ],
    };

    expect(parseGenerateInput(input)).toEqual(input);
  });

  it("rejects a non-object input", () => {
    expect(() => parseGenerateInput("not an object")).toThrow("Generate input must be a JSON object.");
  });

  it("rejects input missing a profile", () => {
    expect(() => parseGenerateInput({ evidenceIds: [] })).toThrow(/"profile"/);
  });

  it("rejects input missing evidenceIds", () => {
    expect(() => parseGenerateInput({ profile: {} })).toThrow(/"evidenceIds"/);
  });

  it("rejects a fieldProvenance entry with an invalid confidence", () => {
    expect(() =>
      parseGenerateInput({
        profile: {},
        evidenceIds: [],
        fieldProvenance: [{ path: "x", confidence: "definitely" }],
      }),
    ).toThrow(/fieldProvenance/);
  });
});
