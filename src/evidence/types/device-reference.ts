/**
 * Loosely identifies which device a piece of evidence is about. Mirrors
 * `DeviceIdentity`'s `manufacturer`/`model` fields from midi-core's
 * device-profile schema (docs/contracts/device-profile.md there) — not
 * imported, since this repo's research inputs are kept independent of
 * midi-core's runtime types (per the ticket: "keep research inputs
 * separate from runtime behavior"), and evidence is routinely gathered
 * for a device long before any `DeviceProfile` exists for it. The field
 * names matching is what lets evidence for a device line up with that
 * device's eventual profile once one is authored.
 */
export interface DeviceReference {
  readonly manufacturer: string;
  readonly model: string;
}
