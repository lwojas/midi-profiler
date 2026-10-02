import { EVIDENCE } from "../evidence/index.js";
import { filterEvidence } from "./commands/evidence-list.js";
import { runGenerateCommand } from "./commands/generate.js";
import { extractFlag } from "./parse-args.js";

const USAGE = `Usage:
  midi-profiler evidence list [--device <model>] [--kind <kind>]
  midi-profiler generate <input.json> [--validator <module>] [--out <file>]`;

export interface RunIO {
  readonly log: (message: string) => void;
  readonly error: (message: string) => void;
}

const DEFAULT_IO: RunIO = {
  log: (message) => console.log(message),
  error: (message) => console.error(message),
};

/**
 * The CLI's command dispatcher -- the one place this ticket's two commands
 * (ingest evidence, generate+validate a profile) actually get wired to
 * argv. `io` is injectable so tests can capture output without stubbing
 * `console` globally; the real bin entry (`index.ts`) uses the default.
 */
export async function run(argv: readonly string[], io: RunIO = DEFAULT_IO): Promise<number> {
  const [command, ...rest] = argv;

  if (command === undefined || command === "--help" || command === "-h") {
    io.log(USAGE);
    return 0;
  }

  if (command === "evidence" && rest[0] === "list") {
    const flags = rest.slice(1);
    const filtered = filterEvidence(EVIDENCE, {
      device: extractFlag(flags, "device"),
      kind: extractFlag(flags, "kind"),
    });
    io.log(JSON.stringify(filtered, null, 2));
    return 0;
  }

  if (command === "generate") {
    const [inputPath, ...flags] = rest;
    if (inputPath === undefined) {
      io.error(USAGE);
      return 1;
    }
    try {
      const { exitCode, output } = await runGenerateCommand({
        inputPath,
        validatorPath: extractFlag(flags, "validator"),
        outPath: extractFlag(flags, "out"),
      });
      io.log(output);
      return exitCode;
    } catch (error) {
      io.error(error instanceof Error ? error.message : String(error));
      return 1;
    }
  }

  io.error(USAGE);
  return 1;
}
