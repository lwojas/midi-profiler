import { describe, expect, it } from "vitest";
import { parseProbePlan } from "./probe-plan.js";

const validPlan = {
  id: "fixture.session",
  device: { manufacturer: "Fixture", model: "Device" },
  steps: [{ id: "step-1", description: "CC1=127", send: [0xb0, 1, 127], listenMs: 50 }],
};

describe("parseProbePlan", () => {
  it("accepts a well-formed plan", () => {
    expect(parseProbePlan(validPlan)).toEqual(validPlan);
  });

  it.each([null, "not an object", 42])("rejects a non-object plan (%s)", (value) => {
    expect(() => parseProbePlan(value)).toThrow(/JSON object/);
  });

  it("rejects a plan with no id", () => {
    expect(() => parseProbePlan({ ...validPlan, id: "" })).toThrow(/non-empty string "id"/);
  });

  it("rejects a plan with no device", () => {
    const { device, ...rest } = validPlan;
    expect(() => parseProbePlan(rest)).toThrow(/"device" object/);
  });

  it("rejects a device missing manufacturer/model", () => {
    expect(() => parseProbePlan({ ...validPlan, device: { manufacturer: "Fixture" } })).toThrow(
      /string "manufacturer" and "model"/,
    );
  });

  it("rejects a plan with no steps", () => {
    expect(() => parseProbePlan({ ...validPlan, steps: [] })).toThrow(/non-empty "steps" array/);
  });

  it("rejects a step with a non-numeric send array", () => {
    const steps = [{ ...validPlan.steps[0], send: ["not", "numbers"] }];
    expect(() => parseProbePlan({ ...validPlan, steps })).toThrow(/"send" array of numbers/);
  });

  it("rejects a step with a negative listenMs", () => {
    const steps = [{ ...validPlan.steps[0], listenMs: -1 }];
    expect(() => parseProbePlan({ ...validPlan, steps })).toThrow(/non-negative number "listenMs"/);
  });
});
