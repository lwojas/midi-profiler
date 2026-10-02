import { describe, expect, it } from "vitest";
import { composeGeneratedProfile } from "./compose.js";
import { isReadyForRuntime, toValidatedProfile } from "./to-validated-profile.js";
import type { Diagnostic } from "./types/diagnostic.js";

// Stands in for midi-core's `validateDeviceProfile`, proving this pipeline's
// boundary against a validator shaped the same way without importing one —
// this repo has no code dependency on midi-core (see docs/evidence-model.md).
function fakeValidate(profile: unknown): readonly Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const record = profile as Record<string, unknown>;

  if (typeof record.identity !== "object" || record.identity === null) {
    diagnostics.push({ severity: "error", path: "identity", message: "identity must be an object." });
  }
  if (!Array.isArray(record.controls) || record.controls.length === 0) {
    diagnostics.push({ severity: "warning", path: "controls", message: "No controls declared." });
  }
  return diagnostics;
}

describe("toValidatedProfile", () => {
  it("runs the injected validator against the generated profile and attaches its findings", () => {
    const generated = composeGeneratedProfile({
      profile: { identity: { id: "fixture.device" }, controls: [] },
      evidenceIds: ["fixture.evidence"],
    });

    const report = toValidatedProfile(generated, fakeValidate);

    expect(report.profile).toBe(generated.profile);
    expect(report.evidenceIds).toBe(generated.evidenceIds);
    expect(report.diagnostics).toEqual([{ severity: "warning", path: "controls", message: "No controls declared." }]);
  });

  it("surfaces unresolved and diagnostics as independent lists", () => {
    const generated = composeGeneratedProfile({
      profile: {},
      evidenceIds: ["fixture.evidence"],
      unresolved: [{ path: "controls", reason: "no implementation chart found for this device" }],
    });

    const report = toValidatedProfile(generated, fakeValidate);

    expect(report.unresolved).toEqual([{ path: "controls", reason: "no implementation chart found for this device" }]);
    expect(report.diagnostics).toEqual([
      { severity: "error", path: "identity", message: "identity must be an object." },
      { severity: "warning", path: "controls", message: "No controls declared." },
    ]);
  });
});

describe("isReadyForRuntime", () => {
  it("is true when no diagnostic is an error, even with warnings or unresolved fields", () => {
    const generated = composeGeneratedProfile({
      profile: { identity: { id: "fixture.device" }, controls: [] },
      evidenceIds: ["fixture.evidence"],
      unresolved: [{ path: "sysex", reason: "not yet researched" }],
    });

    expect(isReadyForRuntime(toValidatedProfile(generated, fakeValidate))).toBe(true);
  });

  it("is false when any diagnostic is an error", () => {
    const generated = composeGeneratedProfile({ profile: {}, evidenceIds: ["fixture.evidence"] });

    expect(isReadyForRuntime(toValidatedProfile(generated, fakeValidate))).toBe(false);
  });
});
