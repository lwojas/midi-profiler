/**
 * Time, injected rather than called directly — the same "inject the
 * dependency" stance midi-profiler's own `toValidatedProfile` takes toward
 * a validator. `runProbeSession` never calls `Date.now()`/`setTimeout`
 * itself, so tests can run a multi-step plan instantly and deterministically
 * against a fake clock, rather than actually waiting out every step's
 * `listenMs`.
 */
export interface ProbeClock {
  /** Milliseconds since epoch. */
  readonly now: () => number;
  /** Resolves after (at least) `ms` have passed. */
  readonly wait: (ms: number) => Promise<void>;
}

export const systemClock: ProbeClock = {
  now: () => Date.now(),
  wait: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};
