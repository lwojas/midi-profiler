import type { DeviceReference } from "./types/device-reference.js";
import type { Evidence } from "./types/evidence.js";

/**
 * The evidence actually gathered so far, cataloguing what's under
 * `research/`. Proves the model against real material rather than a
 * fictional fixture, and is itself a useful index of what's been
 * collected per device.
 */

const NOVATION_LAUNCH_CONTROL_3: DeviceReference = { manufacturer: "Novation", model: "Launch Control 3" };
const NOVATION_LAUNCHPAD_MINI_MK3: DeviceReference = { manufacturer: "Novation", model: "Launchpad Mini [MK3]" };

export const EVIDENCE: readonly Evidence[] = [
  {
    id: "novation.launch-control-3.programmers-reference-guide",
    device: NOVATION_LAUNCH_CONTROL_3,
    kind: "manufacturer-documentation",
    source: { type: "file", path: "research/novation-launch-control-3/programmers-reference-guide.pdf" },
    title: "Launch Control 3 programmer's reference guide (v1.1)",
    notes:
      "Covers standalone MIDI mode, DAW mode (control, colouring the surface, controlling the screen), " +
      "SysEx message format, and feature controls.",
  },
  {
    id: "novation.launchpad-mini-mk3.programmers-reference-manual",
    device: NOVATION_LAUNCHPAD_MINI_MK3,
    kind: "manufacturer-documentation",
    source: { type: "file", path: "research/novation-launchpad-mini-mk3/programmers-reference-manual.pdf" },
    title: "Launchpad Mini [MK3] Programmer's reference manual",
    notes:
      "Covers Device Inquiry, SysEx message format, layout selection, Programmer/Live mode switch, " +
      "LED lighting SysEx, DAW In/Out interface, DAW faders, and configuration messages.",
  },
  {
    id: "novation.launchpad-mini-mk3.launchpad95-remote-script",
    device: NOVATION_LAUNCHPAD_MINI_MK3,
    kind: "daw-integration",
    source: { type: "file", path: "research/novation-launchpad-mini-mk3/Launchpad95/Launchpad.py" },
    title: "Launchpad95 — community Ableton Live Remote Script, Launchpad Mini MK3/X support (Launchpad.py)",
    notes:
      "Third-party (not Novation's own) Python Remote Script for Ableton Live. Its MK3-specific branch " +
      "(`_mk3_rgb`) confirms, by how it actually talks to the device: the Device Inquiry family code/id used " +
      "to identify a Launchpad Mini MK3 (`LP_MINI_MK3_FAMILY_CODE = (19, 1)`, `LP_MINI_MK3_ID = 13`, matching " +
      "the manual's SysEx inquiry reply bytes 13h 01h), the Novation SysEx manufacturer id " +
      "(`NOVATION_MANUFACTURER_ID = (0, 32, 41)`), and that pad/top-row/side-column buttons all send and " +
      "receive on MIDI channel 1 (`ButtonElement(..., channel=0, ...)`) — a fact the manual itself never pins " +
      "down explicitly for plain button-press reporting.",
  },
  {
    id: "novation.launchpad-mini-mk3.captured-traffic.manual-probe",
    device: NOVATION_LAUNCHPAD_MINI_MK3,
    kind: "captured-traffic",
    source: { type: "file", path: "research/novation-launchpad-mini-mk3/captured-traffic/manual-probe.json" },
    title: 'Novation Launchpad Mini [MK3] probe session "manual-probe" (1 step)',
    notes:
      "Captured via midi-prober's single-probe MVP (ECS-60) against a real, physically connected unit: sent the " +
      "standard MIDI Universal Device Inquiry SysEx (`F0 7E 7F 06 01 F7`); the device replied in 4ms with an " +
      "Identity Reply (`F0 7E 00 06 02 00 20 29 13 01 00 00 00 04 06 07 F7`) confirming Novation's manufacturer " +
      "id (`00 20 29`) and the Launchpad Mini MK3 family code (`13 01` = `(19, 1)`) — matching the family code " +
      "already on record from the Launchpad95 remote-script evidence above.",
    collectedAt: "2026-10-03T22:19:51.061Z",
  },
  {
    id: "ableton.live-object-model-map",
    // No `device`: this is about how Ableton's Remote Scripts map a controller into Live in
    // general, not research about any one controller.
    kind: "mapping-reference",
    source: { type: "url", url: "https://midiremotescripts.structure-void.com/guides/lom-map/" },
    title: "Ableton Live Object Model map (community guide to Remote Scripts)",
    notes: "Background on how a DAW remote script exposes/maps a controller into Live.",
  },
];
