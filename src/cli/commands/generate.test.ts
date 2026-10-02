import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runGenerateCommand } from "./generate.js";

// A scratch dir under the repo root, not the OS tmpdir: Vite's dev server
// (which vitest's module runner uses even for a dynamic `import()` of a
// plain .mjs file, per the "loads an injected validator module" case
// below) refuses to serve files outside its project root.
const scratchRoot = fileURLToPath(new URL("../../../.tmp/", import.meta.url));

let dir: string;

beforeEach(async () => {
  await mkdir(scratchRoot, { recursive: true });
  dir = await mkdtemp(join(scratchRoot, "midi-profiler-cli-"));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("runGenerateCommand", () => {
  it("reads input, runs it through the pipeline, and reports not-ready for an unrecognised evidence id", async () => {
    const inputPath = join(dir, "input.json");
    await writeFile(
      inputPath,
      JSON.stringify({ profile: { identity: { id: "fixture" } }, evidenceIds: ["not-a-real-evidence-id"] }),
      "utf8",
    );

    const result = await runGenerateCommand({ inputPath });

    expect(result.exitCode).toBe(1);
    expect(result.report.unknownEvidenceIds).toEqual(["not-a-real-evidence-id"]);
  });

  it("loads an injected validator module by path", async () => {
    const inputPath = join(dir, "input.json");
    await writeFile(inputPath, JSON.stringify({ profile: {}, evidenceIds: [] }), "utf8");

    const validatorPath = join(dir, "validator.mjs");
    await writeFile(
      validatorPath,
      `export function validateDeviceProfile(profile) {
        return [{ severity: "error", path: "identity", message: "identity must be an object." }];
      }`,
      "utf8",
    );

    const result = await runGenerateCommand({ inputPath, validatorPath });

    expect(result.exitCode).toBe(1);
    expect(result.report.diagnostics).toEqual([
      { severity: "error", path: "identity", message: "identity must be an object." },
    ]);
  });

  it("writes the report to --out when given", async () => {
    const inputPath = join(dir, "input.json");
    await writeFile(inputPath, JSON.stringify({ profile: {}, evidenceIds: [] }), "utf8");
    const outPath = join(dir, "report.json");

    const result = await runGenerateCommand({ inputPath, outPath });

    expect(result.exitCode).toBe(0);
    const written = await readFile(outPath, "utf8");
    expect(JSON.parse(written)).toMatchObject({ evidenceIds: [] });
  });

  it("rejects when the input file doesn't exist", async () => {
    await expect(runGenerateCommand({ inputPath: join(dir, "missing.json") })).rejects.toThrow();
  });
});
