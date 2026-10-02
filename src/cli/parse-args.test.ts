import { describe, expect, it } from "vitest";
import { extractFlag } from "./parse-args.js";

describe("extractFlag", () => {
  it("returns the value following the named flag", () => {
    expect(extractFlag(["--out", "report.json"], "out")).toBe("report.json");
  });

  it("returns undefined when the flag isn't present", () => {
    expect(extractFlag(["--out", "report.json"], "validator")).toBeUndefined();
  });

  it("throws when the flag is present but has no value", () => {
    expect(() => extractFlag(["--out"], "out")).toThrow("--out requires a value.");
  });
});
