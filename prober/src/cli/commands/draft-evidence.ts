import { readFile, writeFile } from "node:fs/promises";
import { draftEvidenceFromSession, type EvidenceCaptureKind, type EvidenceDraft } from "../../draft-evidence.js";
import { parseProbeSession } from "../../types/probe-session.js";

export interface RunDraftEvidenceResult {
  readonly draft: EvidenceDraft;
  readonly output: string;
}

function isEvidenceCaptureKind(value: string): value is EvidenceCaptureKind {
  return value === "captured-traffic" || value === "experiment-note";
}

/**
 * The `draft-evidence` command's I/O shell: reads a completed `ProbeSession`
 * file off disk and prints (or writes) a draft `Evidence` object for a
 * human to review and paste into midi-profiler's `src/evidence/manifest.ts`
 * -- see docs/probe-capture-bridge.md. Never writes to that manifest, or
 * anywhere under midi-profiler's own `src/`, itself.
 */
export async function runDraftEvidenceCommand(args: {
  sessionPath: string;
  kind?: string;
  researchPath?: string;
  outPath?: string;
}): Promise<RunDraftEvidenceResult> {
  if (args.kind !== undefined && !isEvidenceCaptureKind(args.kind)) {
    throw new Error('--kind must be "captured-traffic" or "experiment-note".');
  }

  const raw: unknown = JSON.parse(await readFile(args.sessionPath, "utf8"));
  const session = parseProbeSession(raw);

  const draft = draftEvidenceFromSession(session, {
    kind: args.kind,
    researchPath: args.researchPath,
  });

  const output = JSON.stringify(draft, null, 2);
  if (args.outPath) {
    await writeFile(args.outPath, `${output}\n`, "utf8");
  }

  return { draft, output };
}
