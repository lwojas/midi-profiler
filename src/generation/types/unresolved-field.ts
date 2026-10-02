/**
 * One aspect of a device profile that current evidence doesn't resolve —
 * named explicitly rather than filled in with an assumed value. Per the
 * ticket: "do not fill undocumented behavior by guesswork." `path` uses
 * the same dotted/indexed notation midi-core's own `ProfileDiagnostic.path`
 * does (e.g. "controls[2].feedback"), so a human reviewer — or whatever
 * eventually drives ECS-46's CLI — can find exactly what's still missing.
 */
export interface UnresolvedField {
  readonly path: string;
  readonly reason: string;
}
