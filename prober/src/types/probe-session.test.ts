import { describe, expect, it } from "vitest";
import { parseProbeSession } from "./probe-session.js";

const validSession = {
  id: "fixture.session",
  device: { manufacturer: "Fixture", model: "Device" },
  startedAt: "2026-10-03T10:00:00.000Z",
  completedAt: "2026-10-03T10:00:01.000Z",
  steps: [
    {
      step: { id: "step-1", description: "CC1=127", send: [0xb0, 1, 127], listenMs: 50 },
      sentAt: "2026-10-03T10:00:00.000Z",
      observations: [{ raw: [0xb0, 1, 127], receivedAtMs: 5 }],
    },
  ],
};

describe("parseProbeSession", () => {
  it("accepts a well-formed session", () => {
    expect(parseProbeSession(validSession)).toEqual(validSession);
  });

  it.each([null, "not an object", 42])("rejects a non-object session (%s)", (value) => {
    expect(() => parseProbeSession(value)).toThrow(/JSON object/);
  });

  it("rejects a session with no id", () => {
    expect(() => parseProbeSession({ ...validSession, id: "" })).toThrow(/non-empty string "id"/);
  });

  it("rejects a session with no device", () => {
    const { device, ...rest } = validSession;
    expect(() => parseProbeSession(rest)).toThrow(/"device" object/);
  });

  it("rejects a device missing manufacturer/model", () => {
    expect(() => parseProbeSession({ ...validSession, device: { manufacturer: "Fixture" } })).toThrow(
      /string "manufacturer" and "model"/,
    );
  });

  it("rejects a session with no startedAt", () => {
    const { startedAt, ...rest } = validSession;
    expect(() => parseProbeSession(rest)).toThrow(/non-empty string "startedAt"/);
  });

  it("rejects a session with no completedAt", () => {
    const { completedAt, ...rest } = validSession;
    expect(() => parseProbeSession(rest)).toThrow(/non-empty string "completedAt"/);
  });

  it("rejects a session with no steps array", () => {
    const { steps, ...rest } = validSession;
    expect(() => parseProbeSession(rest)).toThrow(/"steps" array/);
  });

  it("accepts a session with no steps run", () => {
    expect(parseProbeSession({ ...validSession, steps: [] }).steps).toEqual([]);
  });

  it("rejects a step result with no step object", () => {
    const steps = [{ ...validSession.steps[0], step: undefined }];
    expect(() => parseProbeSession({ ...validSession, steps })).toThrow(/"step" object/);
  });

  it("rejects a step result with no sentAt", () => {
    const steps = [{ ...validSession.steps[0], sentAt: "" }];
    expect(() => parseProbeSession({ ...validSession, steps })).toThrow(/non-empty string "sentAt"/);
  });

  it("rejects a step result with no observations array", () => {
    const steps = [{ ...validSession.steps[0], observations: undefined }];
    expect(() => parseProbeSession({ ...validSession, steps })).toThrow(/"observations" array/);
  });

  it("rejects an observation with a non-numeric raw array", () => {
    const steps = [{ ...validSession.steps[0], observations: [{ raw: ["nope"], receivedAtMs: 0 }] }];
    expect(() => parseProbeSession({ ...validSession, steps })).toThrow(/"raw" array of numbers/);
  });

  it("rejects an observation with a non-numeric receivedAtMs", () => {
    const steps = [{ ...validSession.steps[0], observations: [{ raw: [1], receivedAtMs: "soon" }] }];
    expect(() => parseProbeSession({ ...validSession, steps })).toThrow(/number "receivedAtMs"/);
  });
});
