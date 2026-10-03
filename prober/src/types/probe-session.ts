import type { DeviceReference } from "./device-reference.js";
import type { ProbeStep } from "./probe-step.js";

/**
 * One message actually observed coming back from the device while a step
 * was listening. `raw` is the exact bytes received — no decoding, no
 * interpretation of what they mean, the same "report, don't invent" stance
 * every other module in this project's pipeline takes, applied to a live
 * device's response instead of a document.
 */
export interface ProbeObservation {
  readonly raw: readonly number[];
  /** Milliseconds elapsed between sending the step's message and this observation. */
  readonly receivedAtMs: number;
}

export interface ProbeStepResult {
  readonly step: ProbeStep;
  /** ISO timestamp of when this step's message was actually sent. */
  readonly sentAt: string;
  readonly observations: readonly ProbeObservation[];
}

/**
 * A completed probe run against one real device: what was sent, in what
 * order, and exactly what came back for each step. Plain, JSON-serializable
 * data — the same shape discipline `GeneratedDeviceProfile`/`FieldProvenance`
 * already follow — so it can be written straight to disk as a
 * `captured-traffic` evidence file (see docs/device-prober.md) without any
 * serializer of its own.
 */
export interface ProbeSession {
  readonly id: string;
  readonly device: DeviceReference;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly steps: readonly ProbeStepResult[];
}

/**
 * Validates a `ProbeSession` read back off disk -- the boundary
 * `draft-evidence` reads across (a session file, possibly hand-edited,
 * rather than one this app just produced itself in-process). Mirrors
 * `parseProbePlan`'s shape and strictness: every field required, nothing
 * guessed or defaulted.
 */
export function parseProbeSession(value: unknown): ProbeSession {
  if (typeof value !== "object" || value === null) {
    throw new Error("Probe session must be a JSON object.");
  }
  const record = value as Record<string, unknown>;

  if (typeof record.id !== "string" || record.id.length === 0) {
    throw new Error('Probe session must have a non-empty string "id".');
  }

  if (typeof record.device !== "object" || record.device === null) {
    throw new Error('Probe session must have a "device" object.');
  }
  const device = record.device as Record<string, unknown>;
  if (typeof device.manufacturer !== "string" || typeof device.model !== "string") {
    throw new Error('"device" must have string "manufacturer" and "model" fields.');
  }

  if (typeof record.startedAt !== "string" || record.startedAt.length === 0) {
    throw new Error('Probe session must have a non-empty string "startedAt".');
  }
  if (typeof record.completedAt !== "string" || record.completedAt.length === 0) {
    throw new Error('Probe session must have a non-empty string "completedAt".');
  }

  if (!Array.isArray(record.steps)) {
    throw new Error('Probe session must have a "steps" array.');
  }
  for (const entry of record.steps as readonly unknown[]) {
    if (typeof entry !== "object" || entry === null) {
      throw new Error("Every probe session step result must be an object.");
    }
    const result = entry as Record<string, unknown>;
    if (typeof result.step !== "object" || result.step === null) {
      throw new Error('Every probe session step result must have a "step" object.');
    }
    if (typeof result.sentAt !== "string" || result.sentAt.length === 0) {
      throw new Error('Every probe session step result must have a non-empty string "sentAt".');
    }
    if (!Array.isArray(result.observations)) {
      throw new Error('Every probe session step result must have an "observations" array.');
    }
    for (const observation of result.observations as readonly unknown[]) {
      if (typeof observation !== "object" || observation === null) {
        throw new Error("Every observation must be an object.");
      }
      const obs = observation as Record<string, unknown>;
      if (!Array.isArray(obs.raw) || !obs.raw.every((byte) => typeof byte === "number")) {
        throw new Error('Every observation must have a "raw" array of numbers.');
      }
      if (typeof obs.receivedAtMs !== "number") {
        throw new Error('Every observation must have a number "receivedAtMs".');
      }
    }
  }

  return value as ProbeSession;
}
