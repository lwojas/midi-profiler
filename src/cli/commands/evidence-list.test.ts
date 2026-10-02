import { describe, expect, it } from "vitest";
import type { Evidence } from "../../evidence/index.js";
import { filterEvidence } from "./evidence-list.js";

const LAUNCH_CONTROL: Evidence = {
  id: "fixture.launch-control",
  device: { manufacturer: "Novation", model: "Launch Control 3" },
  kind: "manufacturer-documentation",
  source: { type: "note", text: "fixture" },
  title: "Launch Control 3 fixture",
};
const LAUNCHPAD: Evidence = {
  id: "fixture.launchpad",
  device: { manufacturer: "Novation", model: "Launchpad Mini [MK3]" },
  kind: "manufacturer-documentation",
  source: { type: "note", text: "fixture" },
  title: "Launchpad fixture",
};
const GENERAL: Evidence = {
  id: "fixture.general",
  kind: "mapping-reference",
  source: { type: "note", text: "fixture" },
  title: "General mapping fixture",
};
const ALL = [LAUNCH_CONTROL, LAUNCHPAD, GENERAL];

describe("filterEvidence", () => {
  it("returns everything when no filters are given", () => {
    expect(filterEvidence(ALL, {})).toEqual(ALL);
  });

  it("filters by device model, excluding device-less entries", () => {
    expect(filterEvidence(ALL, { device: "Launch Control 3" })).toEqual([LAUNCH_CONTROL]);
  });

  it("filters by kind", () => {
    expect(filterEvidence(ALL, { kind: "mapping-reference" })).toEqual([GENERAL]);
  });

  it("combines device and kind filters", () => {
    expect(filterEvidence(ALL, { device: "Launch Control 3", kind: "mapping-reference" })).toEqual([]);
  });
});
