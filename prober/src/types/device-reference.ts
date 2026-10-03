/**
 * Loosely identifies which device a probe session is about. Same shape and
 * same reasoning as midi-profiler's own `DeviceReference`
 * (src/evidence/types/device-reference.ts): mirrors midi-core's
 * `DeviceIdentity.manufacturer`/`model` fields by convention, not by a
 * shared import, since this app stays decoupled from both midi-profiler's
 * own `src/` (see docs/device-prober.md) and midi-core's types everywhere
 * except the transport edge.
 */
export interface DeviceReference {
  readonly manufacturer: string;
  readonly model: string;
}
