import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { EVIDENCE } from "../../evidence/index.js";
import type { Diagnostic } from "../../generation/index.js";
import { buildGenerateReport, isCliReportReady, type CliGenerateReport } from "../generate-report.js";
import { parseGenerateInput } from "../types/generate-input.js";

export interface RunGenerateResult {
  readonly exitCode: number;
  readonly report: CliGenerateReport;
  readonly output: string;
}

/**
 * The `generate` command's I/O shell: reads the input file and an optional
 * validator module off disk, then hands everything to the pure
 * `buildGenerateReport`. The validator is loaded by path, not imported, for
 * the same reason `toValidatedProfile` takes one as an argument: this repo
 * has no code dependency on `midi-core`, so whoever runs this command is
 * the one who points it at `midi-core`'s real `validateDeviceProfile` (or a
 * fixture, in a test). No AI, no network call, nothing non-reproducible --
 * "No LLM dependency at runtime" per the ticket.
 */
export async function runGenerateCommand(args: {
  inputPath: string;
  validatorPath?: string;
  outPath?: string;
}): Promise<RunGenerateResult> {
  const raw: unknown = JSON.parse(await readFile(args.inputPath, "utf8"));
  const input = parseGenerateInput(raw);
  const validate = args.validatorPath ? await loadValidator(args.validatorPath) : (): readonly Diagnostic[] => [];

  const report = buildGenerateReport({
    input,
    knownEvidenceIds: new Set(EVIDENCE.map((entry) => entry.id)),
    validate,
  });

  const output = JSON.stringify(report, null, 2);
  if (args.outPath) {
    await writeFile(args.outPath, `${output}\n`, "utf8");
  }

  return { exitCode: isCliReportReady(report) ? 0 : 1, report, output };
}

async function loadValidator(validatorPath: string): Promise<(profile: unknown) => readonly Diagnostic[]> {
  const module = (await import(/* @vite-ignore */ pathToFileURL(resolve(validatorPath)).href)) as Record<
    string,
    unknown
  >;
  const candidate = module.validateDeviceProfile ?? module.default;
  if (typeof candidate !== "function") {
    throw new Error(`${validatorPath} must export a "validateDeviceProfile" function (or export one as default).`);
  }
  return candidate as (profile: unknown) => readonly Diagnostic[];
}
