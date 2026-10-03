/**
 * Parses and resolves the dotted/indexed path notation `FieldProvenance.path`
 * (and `UnresolvedField.path`/`Diagnostic.path`) use — e.g. "controls[2].feedback",
 * "ports[*].required" — against a real `profile` document. Exists so
 * `generate-report.ts` can check two things neither the generation nor the
 * provenance module does on its own (ECS-62): that every field actually
 * present in `profile` has *some* covering `fieldProvenance` entry, and that
 * a `fieldProvenance.path` isn't a typo or stale reference. A bare string
 * like this project's paths have always been is otherwise unverifiable.
 *
 * `[*]` is a wildcard index, matching every element of an array — the
 * notation the real authored profiles already use (see
 * profiles/novation-launchpad-mini-mk3/generate-input.json's
 * "ports[*].required"/"controls[*].input.channel") to cite one piece of
 * evidence as covering an entire array of otherwise-identical fields,
 * without repeating the citation per index.
 */

type PathSegment = { readonly kind: "prop"; readonly name: string } | { readonly kind: "index"; readonly value: number } | { readonly kind: "wildcard" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Parses a path string into segments, or `null` if it isn't well-formed. */
function parseFieldPath(path: string): readonly PathSegment[] | null {
  if (path === "") return null;

  const segments: PathSegment[] = [];
  let i = 0;
  while (i < path.length) {
    const ch = path[i];
    if (ch === ".") {
      i++;
      continue;
    }
    if (ch === "[") {
      const end = path.indexOf("]", i);
      if (end === -1) return null;
      const inner = path.slice(i + 1, end);
      if (inner === "*") {
        segments.push({ kind: "wildcard" });
      } else if (/^\d+$/.test(inner)) {
        segments.push({ kind: "index", value: Number(inner) });
      } else {
        return null;
      }
      i = end + 1;
      continue;
    }
    const match = /^[A-Za-z_][A-Za-z0-9_]*/.exec(path.slice(i));
    if (!match) return null;
    segments.push({ kind: "prop", name: match[0] });
    i += match[0].length;
  }
  return segments.length > 0 ? segments : null;
}

/**
 * Whether `path` structurally resolves against `profile`: every segment
 * finds something to land on. A property segment matches if at least one
 * node in the current set has it; a `[*]` wildcard matches if the current
 * node is an array, even an empty one (citing "all of an empty array" isn't
 * a typo, it's vacuously fine) — only a missing property or an
 * out-of-bounds/non-array index is a hard failure.
 */
export function resolveFieldPath(profile: unknown, path: string): boolean {
  const segments = parseFieldPath(path);
  if (segments === null) return false;

  let current: readonly unknown[] = [profile];
  for (const segment of segments) {
    const next: unknown[] = [];
    let anyEligible = false;
    let anyMatched = false;

    for (const node of current) {
      if (segment.kind === "prop") {
        if (isRecord(node)) {
          anyEligible = true;
          if (Object.prototype.hasOwnProperty.call(node, segment.name)) {
            next.push(node[segment.name]);
            anyMatched = true;
          }
        }
      } else if (segment.kind === "index") {
        if (Array.isArray(node)) {
          anyEligible = true;
          if (segment.value >= 0 && segment.value < node.length) {
            next.push(node[segment.value]);
            anyMatched = true;
          }
        }
      } else {
        if (Array.isArray(node)) {
          anyEligible = true;
          anyMatched = true;
          next.push(...node);
        }
      }
    }

    if (current.length > 0 && (!anyEligible || !anyMatched)) return false;
    current = next;
  }
  return true;
}

/**
 * Every leaf path actually present in `profile`: a primitive value, or an
 * empty object/array (nothing further to descend into). Used to check
 * `fieldProvenance` *coverage* — whether every real field has some citation
 * behind it, not just whether every citation is internally consistent
 * (that's `isTraceable`'s job). An entirely empty `profile` has no leaves at
 * all, not one leaf named "" — there's nothing yet to require provenance for.
 */
export function collectLeafPaths(profile: Readonly<Record<string, unknown>>): readonly string[] {
  const leaves: string[] = [];

  function walk(node: unknown, path: string): void {
    if (isRecord(node)) {
      const keys = Object.keys(node);
      if (keys.length === 0) {
        leaves.push(path);
        return;
      }
      for (const key of keys) walk(node[key], `${path}.${key}`);
      return;
    }
    if (Array.isArray(node)) {
      if (node.length === 0) {
        leaves.push(path);
        return;
      }
      node.forEach((item, index) => walk(item, `${path}[${index}]`));
      return;
    }
    leaves.push(path);
  }

  for (const key of Object.keys(profile)) walk(profile[key], key);
  return leaves;
}

/**
 * Whether `provenancePath` (which may use `[*]` wildcards) names `leafPath`
 * itself or an ancestor of it — e.g. "controls" or "controls[*].input"
 * covers "controls[2].input.channel", but "controls[*].feedback" doesn't.
 * `leafPath` always has concrete indices (it comes from `collectLeafPaths`,
 * walking real data); `provenancePath` is the free-text citation being
 * checked against it.
 */
export function isCoveredBy(leafPath: string, provenancePath: string): boolean {
  const leafSegments = parseFieldPath(leafPath);
  const provenanceSegments = parseFieldPath(provenancePath);
  if (leafSegments === null || provenanceSegments === null) return false;
  if (provenanceSegments.length > leafSegments.length) return false;

  return provenanceSegments.every((p, i) => {
    const l = leafSegments[i];
    if (l === undefined) return false;
    if (p.kind === "wildcard") return l.kind === "index";
    if (p.kind === "index") return l.kind === "index" && l.value === p.value;
    return l.kind === "prop" && l.name === p.name;
  });
}
