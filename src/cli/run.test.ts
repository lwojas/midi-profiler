import { describe, expect, it } from "vitest";
import { EVIDENCE } from "../evidence/index.js";
import { run } from "./run.js";

function captureIo() {
  const logs: string[] = [];
  const errors: string[] = [];
  return { io: { log: (m: string) => logs.push(m), error: (m: string) => errors.push(m) }, logs, errors };
}

describe("run", () => {
  it("prints usage and exits 0 for --help", async () => {
    const { io, logs } = captureIo();
    expect(await run(["--help"], io)).toBe(0);
    expect(logs[0]).toContain("Usage:");
  });

  it("prints usage and exits 0 when given no arguments", async () => {
    const { io, logs } = captureIo();
    expect(await run([], io)).toBe(0);
    expect(logs[0]).toContain("Usage:");
  });

  it("exits 1 for an unrecognised command", async () => {
    const { io, errors } = captureIo();
    expect(await run(["bogus"], io)).toBe(1);
    expect(errors[0]).toContain("Usage:");
  });

  it("lists the real evidence catalogue", async () => {
    const { io, logs } = captureIo();
    expect(await run(["evidence", "list"], io)).toBe(0);
    expect(JSON.parse(logs[0] as string)).toEqual(EVIDENCE);
  });

  it("filters the evidence catalogue by device", async () => {
    const { io, logs } = captureIo();
    const device = EVIDENCE[0]?.device?.model;
    if (!device) throw new Error("fixture assumption failed: expected EVIDENCE[0] to have a device");

    expect(await run(["evidence", "list", "--device", device], io)).toBe(0);
    const result = JSON.parse(logs[0] as string) as readonly { device?: { model: string } }[];
    expect(result.every((entry) => entry.device?.model === device)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("exits 1 for generate with no input path", async () => {
    const { io, errors } = captureIo();
    expect(await run(["generate"], io)).toBe(1);
    expect(errors[0]).toContain("Usage:");
  });

  it("exits 1 and reports the error when the generate input file doesn't exist", async () => {
    const { io, errors } = captureIo();
    expect(await run(["generate", "/nonexistent/input.json"], io)).toBe(1);
    expect(errors.length).toBe(1);
  });
});
