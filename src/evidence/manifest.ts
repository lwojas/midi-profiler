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
const ABLETON_PUSH_MK1: DeviceReference = { manufacturer: "Ableton", model: "Push" };

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
    id: "ableton.push-mk1.midi-usermode-mapping",
    device: ABLETON_PUSH_MK1,
    kind: "implementation-chart",
    source: { type: "file", path: "research/push-mk1/midi-usermode-mapping.md" },
    title: "Ableton Push 1 (Mk1) User Mode MIDI reference map",
    notes:
      "Community-compiled implementation chart for Push 1's standalone User Mode: encoder/knob CC and touch-note " +
      "addresses, utility/navigation/mode button CCs, the 8x8 pad matrix's note numbering, the touch strip's " +
      "pitch-bend/tap behavior, and the pad RGB-indexed velocity-color table. No manufacturer byline or citation — " +
      "not Ableton's own documentation, so treated as third-party pending verification, not manufacturer-documented. " +
      "ERRATUM (round 2 of hands-on verification, see `ableton.push-mk1.verification-notes`): its labels for CC " +
      "58/59/112/49/50/51 are wrong (looks conflated with Push 2's layout in places) — see " +
      "`ableton.push-mk1.midi-usermode-mapping-verified` for the corrected labels. Everything outside that one " +
      "section (encoders, arrows, touch strip, pad grid, display/upper-control rows) checked out.",
  },
  {
    id: "ableton.push-mk1.midi-usermode-mapping-verified",
    device: ABLETON_PUSH_MK1,
    kind: "implementation-chart",
    source: { type: "file", path: "research/push-mk1/midi-usermode-mapping-verified.md" },
    title: "Ableton Push 1 (Mk1) User Mode MIDI map — verified",
    notes:
      "Supersedes the button-label claims in `ableton.push-mk1.midi-usermode-mapping`. Cross-references Julien " +
      "Bayle's diagram (`ableton.push-mk1.julien-bayle-diagram`) against hands-on readings of the actual printed " +
      "hardware labels, one button at a time: CC 28/29/110/111/114/115 confirmed correct (Master/Stop/Devices/" +
      "Browse/Volume/Pan-Send); CC 49/50/51/58/59/112 corrected (really Shift/Note/Session/Scales/the hardcoded " +
      "User-mode toggle/Track, not Mute/Solo/Record Arm/Note/Session/Clip). CC 113/116 and a block of paired " +
      "buttons right of the pad grid (roughly CC 48-57, 60-63) are named as unresolved rather than guessed at.",
    collectedAt: "2026-10-08",
  },
  {
    id: "ableton.push-mk1.julien-bayle-diagram",
    device: ABLETON_PUSH_MK1,
    kind: "implementation-chart",
    source: { type: "file", path: "research/push-mk1/AbletonPushUserModeHack.png" },
    title: 'Julien Bayle, "What does the PUSH send in User Mode?" (unofficial)',
    notes:
      "A named, credited diagram (unlike the two anonymous community docs above), covering encoders (including the " +
      "1/127 relative-encoding convention and that touch sends the encoder's note at velocity 127/0), the pad grid " +
      "(with its own note-numbering formula, and that pads send pitch/velocity/aftertouch), the touch strip, and " +
      "that every button sends CC 127 on press / 0 on release. Leaves several button groups unlabeled rather than " +
      "guessing at their function (the CC 110-115 block, and a block of paired buttons right of the grid) — those " +
      "gaps, where they overlap the original mapping doc's (wrong) claims, are what prompted the round-2 hands-on " +
      "recheck. Matches everything independently tested for the parts it does label.",
    collectedAt: "2026-10-08",
  },
  {
    id: "ableton.push-mk1.sysex-mapping",
    device: ABLETON_PUSH_MK1,
    kind: "sysex-reference",
    source: { type: "file", path: "research/push-mk1/sysex-mapping.md" },
    title: "Ableton Push 1 (Mk1) display & global SysEx reference",
    notes:
      "Community-compiled SysEx reference: the 4-line, 68-char LCD text display message formula and padding rule, " +
      "and global configuration SysEx (aftertouch pressure mode force, Live/User mode force). Same provenance caveat " +
      "as the MIDI mapping doc above — no manufacturer byline, treated as third-party pending verification. " +
      "Display and aftertouch-mode sections cross-checked hands-on; see `ableton.push-mk1.verification-notes`.",
  },
  {
    id: "ableton.push-mk1.verification-notes",
    device: ABLETON_PUSH_MK1,
    kind: "experiment-note",
    source: { type: "file", path: "research/push-mk1/verification/VERIFICATION.md" },
    title: 'Push mk1 User Mode hands-on verification (ad hoc Node scripts, @julusian/midi)',
    notes:
      "Hands-on verification against a real, physically connected Push 1 in User Mode, run with ad hoc Node scripts " +
      "(not the prober pipeline) directly against CoreMIDI's 'Ableton Push User Port'. Confirmed: Encoder 1 " +
      "(touch note 0 / rotate CC 71), Tempo Encoder (note 10 / CC 14), Swing Encoder (note 9 / CC 15), Arrow Up " +
      "(CC 46), Arrow Right (CC 45), Tap Tempo (CC 3), Metronome (CC 9), every other documented utility/nav/mode " +
      "button CC (lit its button in a full sweep), the 8x8 pad matrix's bottom-left note numbering (36-38, plus " +
      "46), the pad velocity-color table (8 colors, visually confirmed), the touch strip (pitch bend + note-12 " +
      "tap), the LCD text display SysEx (all 4 lines, 68-char blank-padding), and the aftertouch-mode SysEx " +
      "(pads default to Poly Pressure; the 'force mono' message switched them to Channel Pressure as documented). " +
      "Not tested: Encoders 2-8 and the Master Encoder, the remaining ~60 pads, pad LED bright/dim/pulse " +
      "velocities, and the Live/User mode-forcing SysEx (skipped deliberately to avoid dropping the User Port " +
      "mid-session). No contradictions found between the two mapping docs and actual hardware behavior. ROUND 2 " +
      "(same day, prompted by a live hardware check surfacing a wrong label): read the actual printed label off " +
      "12 buttons the original mapping doc claimed, one at a time (light it, ask what's printed) — see " +
      "`ableton.push-mk1.midi-usermode-mapping-verified` for the full corrected table.",
    collectedAt: "2026-10-08",
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
