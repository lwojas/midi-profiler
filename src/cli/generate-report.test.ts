import { describe, expect, it } from "vitest";
import type { Diagnostic } from "../generation/index.js";
import { buildGenerateReport, isCliReportReady } from "./generate-report.js";
import type { GenerateInput } from "./types/generate-input.js";

const KNOWN_EVIDENCE_IDS = new Set(["evidence.one", "evidence.two"]);

function noDiagnostics(): readonly Diagnostic[] {
  return [];
}

describe("buildGenerateReport", () => {
  it("reports clean when every evidence id is known and every field provenance is traceable", () => {
    const input: GenerateInput = {
      profile: { identity: { id: "fixture" } },
      evidenceIds: ["evidence.one"],
      fieldProvenance: [{ path: "identity.id", confidence: "manufacturer-documented", evidenceIds: ["evidence.two"] }],
    };

    const report = buildGenerateReport({ input, knownEvidenceIds: KNOWN_EVIDENCE_IDS, validate: noDiagnostics });

    expect(report.unknownEvidenceIds).toEqual([]);
    expect(report.untraceableFieldProvenance).toEqual([]);
    expect(isCliReportReady(report)).toBe(true);
  });

  it("flags a whole-profile evidence id that doesn't match the known catalogue", () => {
    const input: GenerateInput = { profile: {}, evidenceIds: ["evidence.unknown"] };

    const report = buildGenerateReport({ input, knownEvidenceIds: KNOWN_EVIDENCE_IDS, validate: noDiagnostics });

    expect(report.unknownEvidenceIds).toEqual(["evidence.unknown"]);
    expect(isCliReportReady(report)).toBe(false);
  });

  it("flags a field provenance evidence id that doesn't match the known catalogue", () => {
    const input: GenerateInput = {
      profile: {},
      evidenceIds: ["evidence.one"],
      fieldProvenance: [{ path: "x", confidence: "inferred", evidenceIds: ["evidence.unknown"] }],
    };

    const report = buildGenerateReport({ input, knownEvidenceIds: KNOWN_EVIDENCE_IDS, validate: noDiagnostics });

    expect(report.unknownEvidenceIds).toEqual(["evidence.unknown"]);
    expect(isCliReportReady(report)).toBe(false);
  });

  it("flags field provenance that fails isTraceable", () => {
    const input: GenerateInput = {
      profile: {},
      evidenceIds: ["evidence.one"],
      fieldProvenance: [{ path: "handshake.sysex", confidence: "manufacturer-documented" }],
    };

    const report = buildGenerateReport({ input, knownEvidenceIds: KNOWN_EVIDENCE_IDS, validate: noDiagnostics });

    expect(report.untraceableFieldProvenance).toEqual(["handshake.sysex"]);
    expect(isCliReportReady(report)).toBe(false);
  });

  it("stays ready with warnings or unresolved fields, same as isReadyForRuntime", () => {
    const input: GenerateInput = {
      profile: {},
      evidenceIds: ["evidence.one"],
      unresolved: [{ path: "sysex", reason: "not yet researched" }],
    };
    const withWarning = (): readonly Diagnostic[] => [
      { severity: "warning", path: "controls", message: "No controls declared." },
    ];

    const report = buildGenerateReport({ input, knownEvidenceIds: KNOWN_EVIDENCE_IDS, validate: withWarning });

    expect(isCliReportReady(report)).toBe(true);
  });

  it("is not ready when the injected validator reports an error", () => {
    const input: GenerateInput = { profile: {}, evidenceIds: ["evidence.one"] };
    const withError = (): readonly Diagnostic[] => [
      { severity: "error", path: "identity", message: "identity must be an object." },
    ];

    const report = buildGenerateReport({ input, knownEvidenceIds: KNOWN_EVIDENCE_IDS, validate: withError });

    expect(isCliReportReady(report)).toBe(false);
  });
});
