import { describe, expect, it } from "vitest";
import { collectLeafPaths, isCoveredBy, resolveFieldPath } from "./field-path.js";

describe("resolveFieldPath", () => {
  it("resolves a simple dotted path", () => {
    expect(resolveFieldPath({ identity: { id: "x" } }, "identity.id")).toBe(true);
  });

  it("resolves a concrete index", () => {
    expect(resolveFieldPath({ ports: [{ id: "a" }, { id: "b" }] }, "ports[1].id")).toBe(true);
  });

  it("fails on an out-of-bounds index", () => {
    expect(resolveFieldPath({ ports: [{ id: "a" }] }, "ports[1]")).toBe(false);
  });

  it("fails on a typo'd property", () => {
    expect(resolveFieldPath({ identity: { id: "x" } }, "idenity.id")).toBe(false);
  });

  it("fails on a stale path left after an edit", () => {
    expect(resolveFieldPath({ handshake: { required: false } }, "handshake.sysex")).toBe(false);
  });

  it("resolves a wildcard over a non-empty array", () => {
    expect(resolveFieldPath({ ports: [{ required: true }, { required: false }] }, "ports[*].required")).toBe(true);
  });

  it("resolves a wildcard over an empty array (vacuously fine)", () => {
    expect(resolveFieldPath({ ports: [] }, "ports[*].required")).toBe(true);
  });

  it("resolves a wildcard that only matches some array elements", () => {
    const profile = { controls: [{ id: "a", input: { channel: 0 } }, { id: "b" }] };
    expect(resolveFieldPath(profile, "controls[*].input.channel")).toBe(true);
  });

  it("fails a wildcard against a non-array", () => {
    expect(resolveFieldPath({ ports: { not: "an array" } }, "ports[*].required")).toBe(false);
  });

  it("fails on a malformed path", () => {
    expect(resolveFieldPath({}, "controls[")).toBe(false);
    expect(resolveFieldPath({}, "")).toBe(false);
  });
});

describe("collectLeafPaths", () => {
  it("returns no leaves for an entirely empty profile", () => {
    expect(collectLeafPaths({})).toEqual([]);
  });

  it("collects dotted and indexed leaf paths", () => {
    const profile = {
      identity: { id: "x" },
      ports: [{ id: "a" }, { id: "b" }],
    };
    expect(collectLeafPaths(profile)).toEqual(["identity.id", "ports[0].id", "ports[1].id"]);
  });

  it("treats an empty nested object or array as its own leaf", () => {
    const profile = { sysex: {}, grids: [] };
    expect(collectLeafPaths(profile)).toEqual(["sysex", "grids"]);
  });
});

describe("isCoveredBy", () => {
  it("covers an exact match", () => {
    expect(isCoveredBy("identity.id", "identity.id")).toBe(true);
  });

  it("covers a descendant via an ancestor path", () => {
    expect(isCoveredBy("controls[2].input.channel", "controls")).toBe(true);
  });

  it("covers a descendant via a wildcard ancestor path", () => {
    expect(isCoveredBy("controls[2].input.channel", "controls[*].input")).toBe(true);
  });

  it("does not cover a sibling field", () => {
    expect(isCoveredBy("controls[2].feedback", "controls[*].input")).toBe(false);
  });

  it("does not cover when the provenance path is longer than the leaf", () => {
    expect(isCoveredBy("identity", "identity.id")).toBe(false);
  });

  it("does not match a concrete index against a different concrete index", () => {
    expect(isCoveredBy("ports[1].id", "ports[0]")).toBe(false);
  });
});
