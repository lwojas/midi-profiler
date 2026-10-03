import { readFile, writeFile } from "node:fs/promises";
import { runProbeSession } from "../../run-probe-session.js";
import { parseProbePlan } from "../../types/probe-plan.js";
import type { ProbeSession } from "../../types/probe-session.js";
import { loadTransport } from "./load-transport.js";

export interface RunProbeResult {
  readonly session: ProbeSession;
  readonly output: string;
}

/**
 * The `probe` command's I/O shell: reads a plan file and an injected
 * transport module off disk, runs the deterministic `runProbeSession`
 * against them, and (optionally) writes the result where
 * docs/device-prober.md's workflow expects captured-traffic evidence to
 * live. Unlike midi-profiler's `generate`, there's no pass/fail readiness
 * concept here -- a probe session is a record of what happened, not
 * something to validate; registering it as `Evidence` and deciding what it
 * supports is a human's next step, done outside this tool.
 */
export async function runProbeCommand(args: { planPath: string; transportPath: string; outPath?: string }): Promise<RunProbeResult> {
  const raw: unknown = JSON.parse(await readFile(args.planPath, "utf8"));
  const plan = parseProbePlan(raw);
  const transport = await loadTransport(args.transportPath);

  const session = await runProbeSession(transport, plan);

  const output = JSON.stringify(session, null, 2);
  if (args.outPath) {
    await writeFile(args.outPath, `${output}\n`, "utf8");
  }

  return { session, output };
}
