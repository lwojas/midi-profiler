import { describe, expect, it } from "vitest";
import { draftEvidenceFromSession } from "./draft-evidence.js";
import type { ProbeSession } from "./types/probe-session.js";

const session: ProbeSession = {
  id: "sysex-handshake-probe",
  device: { manufacturer: "Novation", model: "Launchpad Mini [MK3]" },
  startedAt: "2026-10-03T10:00:00.000Z",
  completedAt: "2026-10-03T10:00:01.000Z",
  steps: [
    {
      step: { id: "step-1", description: "Enter Programmer mode", send: [240, 0, 32, 41, 2, 13, 14, 1, 247], listenMs: 200 },
      sentAt: "2026-10-03T10:00:00.000Z",
      observations: [{ raw: [240, 0, 32, 41, 2, 13, 14, 247], receivedAtMs: 5 }],
    },
    {
      step: { id: "step-2", description: "Device Inquiry", send: [240, 126, 127, 6, 1, 247], listenMs: 200 },
      sentAt: "2026-10-03T10:00:00.500Z",
      observations: [],
    },
  ],
};

describe("draftEvidenceFromSession", () => {
  it("defaults to captured-traffic and derives id/device/path from the session", () => {
    const draft = draftEvidenceFromSession(session);

    expect(draft.kind).toBe("captured-traffic");
    expect(draft.id).toBe("novation.launchpad-mini-mk3.captured-traffic.sysex-handshake-probe");
    expect(draft.device).toEqual({ manufacturer: "Novation", model: "Launchpad Mini [MK3]" });
    expect(draft.source).toEqual({
      type: "file",
      path: "research/novation-launchpad-mini-mk3/captured-traffic/sysex-handshake-probe.json",
    });
    expect(draft.collectedAt).toBe(session.completedAt);
  });

  it("names every step and the total observation count in notes", () => {
    const draft = draftEvidenceFromSession(session);

    expect(draft.notes).toContain("step-1, step-2");
    expect(draft.notes).toContain("1 observation total");
  });

  it("includes the step count and session id in the title", () => {
    const draft = draftEvidenceFromSession(session);

    expect(draft.title).toContain("sysex-handshake-probe");
    expect(draft.title).toContain("2 steps");
  });

  it("honours an explicit kind override", () => {
    const draft = draftEvidenceFromSession(session, { kind: "experiment-note" });

    expect(draft.kind).toBe("experiment-note");
    expect(draft.id).toBe("novation.launchpad-mini-mk3.experiment-note.sysex-handshake-probe");
  });

  it("honours an explicit research path override", () => {
    const draft = draftEvidenceFromSession(session, { researchPath: "research/custom/path.json" });

    expect(draft.source).toEqual({ type: "file", path: "research/custom/path.json" });
  });

  it("uses singular wording for exactly one step/observation", () => {
    const oneStepSession: ProbeSession = { ...session, steps: [session.steps[0]!] };

    const draft = draftEvidenceFromSession(oneStepSession);

    expect(draft.title).toContain("1 step)");
    expect(draft.notes).toContain("1 observation total");
  });
});
