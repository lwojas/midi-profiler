/**
 * Pulls a `--name value` flag's value out of an argv slice. Deliberately
 * minimal -- this CLI has exactly two commands and a handful of flags
 * between them, not enough surface to justify an argument-parsing
 * dependency.
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
