import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runProbeCommand } from "./probe.js";

// A scratch dir under this package's root, not the OS tmpdir -- same reason
// midi-profiler's own generate.test.ts uses one: vitest's module runner
// refuses to serve a dynamically-`import()`ed .mjs file from outside its
// project root, and a transport module is loaded exactly that way.
const scratchRoot = fileURLToPath(new URL("../../../.tmp/", import.meta.url));

let dir: string;

beforeEach(async () => {
  await mkdir(scratchRoot, { recursive: true });
  dir = await mkdtemp(join(scratchRoot, "midi-prober-cli-"));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const planFixture = {
  id: "fixture.session",
  device: { manufacturer: "Fixture", model: "Device" },
  steps: [{ id: "step-1", description: "CC1=127", send: [0xb0, 1, 127], listenMs: 1 }],
};

async function writeEchoTransport(path: string): Promise<void> {
  await writeFile(
    path,
    `export function createProbeTransport() {
      const listeners = new Set();
      return {
        output: {
          sendRaw(bytes) {
            for (const listener of listeners) listener(new Uint8Array([...bytes, 0x7f]));
          },
        },
        input: {
          onRawMessage(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
          },
        },
      };
    }`,
    "utf8",
  );
}

describe("runProbeCommand", () => {
  it("runs a plan against an injected transport module and returns the session", async () => {
    const planPath = join(dir, "plan.json");
    await writeFile(planPath, JSON.stringify(planFixture), "utf8");
    const transportPath = join(dir, "transport.mjs");
    await writeEchoTransport(transportPath);

    const result = await runProbeCommand({ planPath, transportPath });

    expect(result.session.id).toBe("fixture.session");
    expect(result.session.steps[0]?.observations).toEqual([{ raw: [0xb0, 1, 127, 0x7f], receivedAtMs: 0 }]);
  });

  it("writes the session to --out when given", async () => {
    const planPath = join(dir, "plan.json");
    await writeFile(planPath, JSON.stringify(planFixture), "utf8");
    const transportPath = join(dir, "transport.mjs");
    await writeEchoTransport(transportPath);
    const outPath = join(dir, "session.json");

    await runProbeCommand({ planPath, transportPath, outPath });

    const written = JSON.parse(await readFile(outPath, "utf8"));
    expect(written.id).toBe("fixture.session");
  });

  it("rejects a transport module with no createProbeTransport/default export", async () => {
    const planPath = join(dir, "plan.json");
    await writeFile(planPath, JSON.stringify(planFixture), "utf8");
    const transportPath = join(dir, "bad-transport.mjs");
    await writeFile(transportPath, "export const notAFactory = 42;", "utf8");

    await expect(runProbeCommand({ planPath, transportPath })).rejects.toThrow(/createProbeTransport/);
  });

  it("rejects when the plan file doesn't exist", async () => {
    const transportPath = join(dir, "transport.mjs");
    await writeEchoTransport(transportPath);

    await expect(runProbeCommand({ planPath: join(dir, "missing.json"), transportPath })).rejects.toThrow();
  });
});
