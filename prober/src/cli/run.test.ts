import { describe, expect, it } from "vitest";
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

  it("exits 1 for probe with no plan path", async () => {
    const { io, errors } = captureIo();
    expect(await run(["probe"], io)).toBe(1);
    expect(errors[0]).toContain("Usage:");
  });

  it("exits 1 for probe with no --transport", async () => {
    const { io, errors } = captureIo();
    expect(await run(["probe", "plan.json"], io)).toBe(1);
    expect(errors[0]).toContain("Usage:");
  });

  it("exits 1 and reports the error when the plan file doesn't exist", async () => {
    const { io, errors } = captureIo();
    expect(await run(["probe", "/nonexistent/plan.json", "--transport", "/nonexistent/transport.mjs"], io)).toBe(1);
    expect(errors.length).toBe(1);
  });

  it("exits 1 for draft-evidence with no session path", async () => {
    const { io, errors } = captureIo();
    expect(await run(["draft-evidence"], io)).toBe(1);
    expect(errors[0]).toContain("Usage:");
  });

  it("exits 1 and reports the error when the session file doesn't exist", async () => {
    const { io, errors } = captureIo();
    expect(await run(["draft-evidence", "/nonexistent/session.json"], io)).toBe(1);
    expect(errors.length).toBe(1);
  });
});
