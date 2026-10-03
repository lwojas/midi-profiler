import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runDraftEvidenceCommand } from "./draft-evidence.js";

const scratchRoot = fileURLToPath(new URL("../../../.tmp/", import.meta.url));

let dir: string;

beforeEach(async () => {
  await mkdir(scratchRoot, { recursive: true });
  dir = await mkdtemp(join(scratchRoot, "midi-prober-draft-evidence-"));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const sessionFixture = {
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

describe("runDraftEvidenceCommand", () => {
  it("reads a session file and returns a draft Evidence object", async () => {
    const sessionPath = join(dir, "session.json");
    await writeFile(sessionPath, JSON.stringify(sessionFixture), "utf8");

    const result = await runDraftEvidenceCommand({ sessionPath });

    expect(result.draft.kind).toBe("captured-traffic");
    expect(result.draft.id).toBe("fixture.device.captured-traffic.fixture.session");
  });

  it("writes the draft to --out when given", async () => {
    const sessionPath = join(dir, "session.json");
    await writeFile(sessionPath, JSON.stringify(sessionFixture), "utf8");
    const outPath = join(dir, "draft.json");

    await runDraftEvidenceCommand({ sessionPath, outPath });

    const written = JSON.parse(await readFile(outPath, "utf8"));
    expect(written.kind).toBe("captured-traffic");
  });

  it("honours --kind experiment-note", async () => {
    const sessionPath = join(dir, "session.json");
    await writeFile(sessionPath, JSON.stringify(sessionFixture), "utf8");

    const result = await runDraftEvidenceCommand({ sessionPath, kind: "experiment-note" });

    expect(result.draft.kind).toBe("experiment-note");
  });

  it("rejects an unrecognised --kind", async () => {
    const sessionPath = join(dir, "session.json");
    await writeFile(sessionPath, JSON.stringify(sessionFixture), "utf8");

    await expect(runDraftEvidenceCommand({ sessionPath, kind: "bogus" })).rejects.toThrow(/--kind/);
  });

  it("rejects when the session file doesn't exist", async () => {
    await expect(runDraftEvidenceCommand({ sessionPath: join(dir, "missing.json") })).rejects.toThrow();
  });

  it("rejects a session file that fails validation", async () => {
    const sessionPath = join(dir, "session.json");
    await writeFile(sessionPath, JSON.stringify({ ...sessionFixture, device: undefined }), "utf8");

    await expect(runDraftEvidenceCommand({ sessionPath })).rejects.toThrow(/"device" object/);
  });
});
