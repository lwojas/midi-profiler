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
    id: "ableton.live-object-model-map",
    // No `device`: this is about how Ableton's Remote Scripts map a controller into Live in
    // general, not research about any one controller.
    kind: "mapping-reference",
    source: { type: "url", url: "https://midiremotescripts.structure-void.com/guides/lom-map/" },
    title: "Ableton Live Object Model map (community guide to Remote Scripts)",
    notes: "Background on how a DAW remote script exposes/maps a controller into Live.",
  },
];
