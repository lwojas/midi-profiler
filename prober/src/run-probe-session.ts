import { systemClock, type ProbeClock } from "./clock.js";
import type { ProbeTransport } from "./transport/types.js";
import type { ProbePlan } from "./types/probe-plan.js";
import type { ProbeObservation, ProbeSession, ProbeStepResult } from "./types/probe-session.js";

/**
 * Runs a probe plan's steps against an already-connected `ProbeTransport`,
 * in order: send a step's bytes, listen for whatever comes back for
 * `listenMs`, record it, move on. Deterministic given a deterministic
 * transport and clock — the same arguments always produce the same
 * `ProbeSession` — the same discipline every other pipeline stage in this
 * project (and midi-core's own codec) already holds itself to. No decoding,
 * no judgment about what a response *means*: that's a human's job once the
 * session is reviewed, per docs/device-prober.md.
 */
export async function runProbeSession(
  transport: ProbeTransport,
  plan: ProbePlan,
  clock: ProbeClock = systemClock,
): Promise<ProbeSession> {
  const startedAt = clock.now();
  const steps: ProbeStepResult[] = [];

  for (const step of plan.steps) {
    const observations: ProbeObservation[] = [];
    const sentAt = clock.now();

    const unsubscribe = transport.input.onRawMessage((bytes) => {
      observations.push({ raw: Array.from(bytes), receivedAtMs: clock.now() - sentAt });
    });

    transport.output.sendRaw(new Uint8Array(step.send));
    await clock.wait(step.listenMs);
    unsubscribe();

    steps.push({ step, sentAt: new Date(sentAt).toISOString(), observations });
  }

  return {
    id: plan.id,
    device: plan.device,
    startedAt: new Date(startedAt).toISOString(),
    completedAt: new Date(clock.now()).toISOString(),
    steps,
  };
}
