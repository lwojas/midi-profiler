import type { DeviceReference } from "./device-reference.js";
import type { ProbeStep } from "./probe-step.js";

/**
 * What a human authors by hand to describe a probe run: the device it's
 * against and the ordered steps to run. This is this app's one boundary
 * with untrusted external input — a JSON file on disk — so `parseProbePlan`
 * is where its shape actually gets checked, the same relationship
 * midi-profiler's own `parseGenerateInput` has to a generate-input file.
 */
export interface ProbePlan {
  readonly id: string;
  readonly device: DeviceReference;
  readonly steps: readonly ProbeStep[];
}

export function parseProbePlan(value: unknown): ProbePlan {
  if (typeof value !== "object" || value === null) {
    throw new Error("Probe plan must be a JSON object.");
  }
  const record = value as Record<string, unknown>;

  if (typeof record.id !== "string" || record.id.length === 0) {
    throw new Error('Probe plan must have a non-empty string "id".');
  }

  if (typeof record.device !== "object" || record.device === null) {
    throw new Error('Probe plan must have a "device" object.');
  }
  const device = record.device as Record<string, unknown>;
  if (typeof device.manufacturer !== "string" || typeof device.model !== "string") {
    throw new Error('"device" must have string "manufacturer" and "model" fields.');
  }

  if (!Array.isArray(record.steps) || record.steps.length === 0) {
    throw new Error('Probe plan must have a non-empty "steps" array.');
  }
  for (const entry of record.steps as readonly unknown[]) {
    if (typeof entry !== "object" || entry === null) {
      throw new Error("Every probe step must be an object.");
    }
    const step = entry as Record<string, unknown>;
    if (typeof step.id !== "string" || step.id.length === 0) {
      throw new Error('Every probe step must have a non-empty string "id".');
    }
    if (typeof step.description !== "string") {
      throw new Error(`Probe step "${step.id}" must have a string "description".`);
    }
    if (!Array.isArray(step.send) || !step.send.every((byte) => typeof byte === "number")) {
      throw new Error(`Probe step "${step.id}" must have a "send" array of numbers.`);
    }
    if (typeof step.listenMs !== "number" || step.listenMs < 0) {
      throw new Error(`Probe step "${step.id}" must have a non-negative number "listenMs".`);
    }
  }

  return {
    id: record.id,
    device: device as unknown as DeviceReference,
    steps: record.steps as readonly ProbeStep[],
  };
}
