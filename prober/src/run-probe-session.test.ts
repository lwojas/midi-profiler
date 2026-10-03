import { describe, expect, it } from "vitest";
import type { ProbeClock } from "./clock.js";
import { runProbeSession } from "./run-probe-session.js";
import type { ProbeTransport } from "./transport/types.js";
import type { ProbePlan } from "./types/probe-plan.js";

// Echoes every sent message back to every currently-subscribed listener,
// tagged with an extra 0x7f byte so a test can tell which step's echo it's
// looking at. Supports multiple simultaneous listeners (a real device could
// have more than one thing listening) so a step whose `unsubscribe` didn't
// actually detach still shows up as a bug: its stale listener would also
// catch the *next* step's echo.
function createEchoTransport(): { transport: ProbeTransport; sent: readonly number[][] } {
  const listeners = new Set<(bytes: Uint8Array) => void>();
  const sent: number[][] = [];
  return {
    transport: {
      output: {
        sendRaw(bytes) {
          sent.push(Array.from(bytes));
          for (const listener of listeners) listener(new Uint8Array([...bytes, 0x7f]));
        },
      },
      input: {
        onRawMessage(listener) {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
      },
    },
    sent,
  };
}

function createSilentTransport(): ProbeTransport {
  return {
    output: { sendRaw: () => {} },
    input: { onRawMessage: () => () => {} },
  };
}

function createFakeClock(start: number): ProbeClock {
  let current = start;
  return {
    now: () => current,
    wait: async (ms) => {
      current += ms;
    },
  };
}

const plan: ProbePlan = {
  id: "fixture.session",
  device: { manufacturer: "Fixture", model: "Device" },
  steps: [
    { id: "step-1", description: "CC1=127 on channel 1", send: [0xb0, 1, 127], listenMs: 50 },
    { id: "step-2", description: "Note on 60", send: [0x90, 60, 100], listenMs: 50 },
  ],
};

describe("runProbeSession", () => {
  it("records each step's own observation and keeps them separate", async () => {
    const { transport } = createEchoTransport();
    const clock = createFakeClock(1_000);

    const session = await runProbeSession(transport, plan, clock);

    expect(session.steps).toHaveLength(2);
    expect(session.steps[0]?.observations).toEqual([{ raw: [0xb0, 1, 127, 0x7f], receivedAtMs: 0 }]);
    expect(session.steps[1]?.observations).toEqual([{ raw: [0x90, 60, 100, 0x7f], receivedAtMs: 0 }]);
  });

  it("unsubscribes a step's listener before moving to the next step", async () => {
    const { transport } = createEchoTransport();
    const clock = createFakeClock(0);

    const session = await runProbeSession(transport, plan, clock);

    // Each step's echo only reaches that step's own observations, not an
    // earlier step's -- proof the earlier step's listener was really
    // detached, not just logically ignored.
    expect(session.steps[0]?.observations).toHaveLength(1);
    expect(session.steps[1]?.observations).toHaveLength(1);
  });

  it("records no observations when the device never responds", async () => {
    const transport = createSilentTransport();
    const clock = createFakeClock(0);

    const session = await runProbeSession(transport, plan, clock);

    expect(session.steps[0]?.observations).toEqual([]);
    expect(session.steps[1]?.observations).toEqual([]);
  });

  it("derives sentAt/startedAt/completedAt from the injected clock, not wall-clock time", async () => {
    const transport = createSilentTransport();
    const clock = createFakeClock(10_000);

    const session = await runProbeSession(transport, plan, clock);

    expect(session.startedAt).toBe(new Date(10_000).toISOString());
    expect(session.steps[0]?.sentAt).toBe(new Date(10_000).toISOString());
    // step-1 waits 50ms before step-2 sends.
    expect(session.steps[1]?.sentAt).toBe(new Date(10_050).toISOString());
    expect(session.completedAt).toBe(new Date(10_100).toISOString());
  });

  it("carries the plan's id and device through unchanged", async () => {
    const transport = createSilentTransport();
    const session = await runProbeSession(transport, plan, createFakeClock(0));

    expect(session.id).toBe(plan.id);
    expect(session.device).toEqual(plan.device);
  });

  it("sends each step's bytes on the output port, in order", async () => {
    const { transport, sent } = createEchoTransport();
    await runProbeSession(transport, plan, createFakeClock(0));

    expect(sent).toEqual([
      [0xb0, 1, 127],
      [0x90, 60, 100],
    ]);
  });
});
