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
