import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { EVIDENCE } from "./manifest.js";

const repoRoot = fileURLToPath(new URL("../../", import.meta.url));

describe("EVIDENCE manifest", () => {
  it("has unique ids", () => {
    const ids = EVIDENCE.map((evidence) => evidence.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every file-sourced entry points at a file that actually exists", () => {
    for (const evidence of EVIDENCE) {
      if (evidence.source.type !== "file") continue;
      expect(existsSync(`${repoRoot}${evidence.source.path}`), `missing file for ${evidence.id}: ${evidence.source.path}`).toBe(true);
    }
  });

  it("every url-sourced entry looks like a real URL", () => {
    for (const evidence of EVIDENCE) {
      if (evidence.source.type !== "url") continue;
      const { url } = evidence.source;
      expect(() => new URL(url)).not.toThrow();
    }
  });
});
