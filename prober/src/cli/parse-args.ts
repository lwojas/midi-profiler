/**
 * Pulls a `--name value` flag's value out of an argv slice. Deliberately
 * minimal, the same call midi-profiler's own `extractFlag` already makes --
 * this CLI has exactly one command, not enough surface to justify an
 * argument-parsing dependency.
 */
export function extractFlag(argv: readonly string[], name: string): string | undefined {
  const index = argv.indexOf(`--${name}`);
  if (index === -1) return undefined;

  const value = argv[index + 1];
  if (value === undefined) {
    throw new Error(`--${name} requires a value.`);
  }
  return value;
}
