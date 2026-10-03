import { runDraftEvidenceCommand } from "./commands/draft-evidence.js";
import { runProbeCommand } from "./commands/probe.js";
import { extractFlag } from "./parse-args.js";

const USAGE = `Usage:
  midi-prober probe <plan.json> --transport <module> [--out <file>]
  midi-prober draft-evidence <session.json> [--kind captured-traffic|experiment-note] [--research-path <path>] [--out <file>]`;

export interface RunIO {
  readonly log: (message: string) => void;
  readonly error: (message: string) => void;
}

const DEFAULT_IO: RunIO = {
  log: (message) => console.log(message),
  error: (message) => console.error(message),
};

/**
 * The CLI's command dispatcher -- the one place this app's single command
 * (run a probe plan against a live transport) gets wired to argv. `io` is
 * injectable so tests can capture output without stubbing `console`
 * globally, the same shape midi-profiler's own `run` already takes.
 */
export async function run(argv: readonly string[], io: RunIO = DEFAULT_IO): Promise<number> {
  const [command, ...rest] = argv;

  if (command === undefined || command === "--help" || command === "-h") {
    io.log(USAGE);
    return 0;
  }

  if (command === "probe") {
    const [planPath, ...flags] = rest;
    const transportPath = extractFlag(flags, "transport");
    if (planPath === undefined || transportPath === undefined) {
      io.error(USAGE);
      return 1;
    }
    try {
      const { output } = await runProbeCommand({
        planPath,
        transportPath,
        outPath: extractFlag(flags, "out"),
      });
      io.log(output);
      return 0;
    } catch (error) {
      io.error(error instanceof Error ? error.message : String(error));
      return 1;
    }
  }

  if (command === "draft-evidence") {
    const [sessionPath, ...flags] = rest;
    if (sessionPath === undefined) {
      io.error(USAGE);
      return 1;
    }
    try {
      const { output } = await runDraftEvidenceCommand({
        sessionPath,
        kind: extractFlag(flags, "kind"),
        researchPath: extractFlag(flags, "research-path"),
        outPath: extractFlag(flags, "out"),
      });
      io.log(output);
      return 0;
    } catch (error) {
      io.error(error instanceof Error ? error.message : String(error));
      return 1;
    }
  }

  io.error(USAGE);
  return 1;
}
