# Push mk1 User Mode: Hands-On Verification

Ad hoc verification of `research/push-mk1/midi-usermode-mapping.md` and
`research/push-mk1/sysex-mapping.md` against a real, physically connected
Push 1, run 2026-10-08. This is **not** the `prober`/`Evidence` pipeline
(`docs/device-prober.md`, `docs/profiling-workflow.md`) — those two docs
were sourced from a generic online reference with no citation, so before
spending effort on that formal pipeline this was a quick sanity pass: do a
handful of Node scripts, using `@julusian/midi` directly against the
device's CoreMIDI ports, confirm the documented bytes actually match what
the hardware sends and responds to.

Device exposes two duplex ports: `Ableton Push Live Port` and
`Ableton Push User Port`. All tests below used the **User Port**, with the
hardware already switched into User Mode (physical User button held).

Scripts live in this folder:

- `decode.mjs` — shared raw-MIDI-byte decoder
- `list-ports.mjs` — lists CoreMIDI input/output ports
- `listen.mjs <portNameSubstring> <durationMs>` — logs every decoded
  message received for a fixed window, for interactive verification
  (turn a knob / hit a pad while it runs)
- `send-display.mjs` — writes 4 distinct test strings to the LCD's 4
  lines via the display SysEx formula
- `send-pad-leds.mjs [clear]` — lights the bottom pad row with 8 colors
  from the velocity-color table
- `send-button-leds.mjs [clear]` — lights 6 sample utility buttons
- `sweep-button-leds.mjs` — flashes every documented utility/nav/mode CC
  one at a time, in order, for visual confirmation
- `send-aftertouch-mode.mjs <mono|poly>` — sends the two aftertouch-mode
  SysEx messages

Run with `npm install && node <script>.mjs` from this folder.

## Findings

### Confirmed (experimentally verified, matches doc exactly)

- **Encoder 1**: touch → Note 0 (`90 00 7f` / `80 00 00`); rotate → CC 71.
  Matches `midi-usermode-mapping.md` §1.
- **Tempo Encoder**: touch → Note 10; rotate → CC 14. Matches §1.
- **Swing Encoder**: touch → Note 9; rotate → CC 15. Matches §1.
- **Arrow Up**: CC 46. **Arrow Right**: CC 45. Matches §2 (right-side nav
  pad).
- **Tap Tempo**: CC 3. **Metronome**: CC 9. Matches §2 (left column
  utilities).
- **8x8 pad matrix**: pressing the three bottom-left pads produced Note On
  for notes 36, 37, 38 in sequence; a stray touch one row up produced note
  46. Both consistent with the documented bottom-left-origin, row-major
  layout in §3 (row 1 = 36–43, row 2 = 44–51).
- **Pad LED colors**: sent the 8 "standard velocity" values from §5's
  color table to notes 36–43 (bottom row) — visually confirmed left-to-
  right: white, red, orange, yellow, green, cyan, blue, purple.
- **Touch strip**: swiping it produced a long run of Pitch Bend messages
  (14-bit, centering back to 8192 on release) plus Note On/Off on Note 12
  for the capacitive tap. Matches §4.
- **Utility/nav/mode button LEDs**: every CC in `sweep-button-leds.mjs`'s
  list (all of §2 except the encoders' own CCs) lit a button when sent
  value 127 and went dark at 0; visually confirmed as a full sweep with no
  flagged mismatches.
- **LCD text display SysEx** (`sysex-mapping.md` §1): sending the 77-byte
  `F0 47 7F 15 {lineId} 00 45 00 [68 chars] F7` string for all 4 line ids
  (`18`–`1b`) displayed the expected text on the corresponding physical
  line, including a shorter string on lines 3–4 correctly blank-padded to
  the full line width rather than leaving stale characters.
- **Aftertouch mode SysEx** (`sysex-mapping.md` §3): pads send Poly
  Pressure (`Ax`) by default. Sending `F0 47 7F 15 5C 00 01 01 F7` ("force
  monophonic") switched pad pressure to Channel Pressure (`Dx`) messages
  on the next several pad hits. Sent back `...01 00 F7` to restore the
  (apparently default) polyphonic behavior afterward.

### Not independently tested

- **Encoders 2–8 and the Master Encoder** (CC 72–79, touch notes 1–8) —
  only Encoder 1, Tempo, and Swing were exercised; no reason to expect the
  sequential CC/note numbering breaks partway through, but it wasn't
  observed directly.
- **Full 8x8 pad grid** — only 4 of 64 pads were pressed. The row-major,
  bottom-left-origin layout is consistent with what was pressed, not
  exhaustively confirmed per-pad.
- **Encoder-touch → LED feedback semantics**, and pad LED "dim/animated"
  (pulse) velocities from §5's third column — colors were only checked at
  "standard" brightness, not the bright/dim/pulse variants.
- **Mode-forcing SysEx** (`sysex-mapping.md` §3, "Force Push 1 to
  User/Native Live Mode") — deliberately not sent, since forcing native
  mode would have dropped the User Port mid-session with no easy way back
  without touching the physical hardware; the User-button-triggered mode
  switch itself was also not tested for the same reason.
- **"User Button: hardcoded, unmappable"** claim in §2 — not falsified,
  but also not actively tested (would require pressing it, which risks
  the same mode switch as above).

No contradictions between the two docs and the hardware's actual behavior
were found in anything tested.

## Round 2: the "Bottom & Layout Selection Blocks" section was wrong

Prompted by `midi-core`'s live hardware check (`scripts/push-mk1-live.mjs`):
the transport mode had no button to reach it, which was a real layout bug
caught and fixed first — but fixing it meant lighting the "Note"/"Session"
buttons (CC 58/59) to confirm the fix worked, and the physically lit button
read **"Scales"**, not "Note". That didn't match, so every button the
original `midi-usermode-mapping.md` named in this section got re-checked
the same way: light exactly one CC's button, ask what's actually printed
on it, compare to the doc's claim.

A better source turned up at the same time: `AbletonPushUserModeHack.png`
("What does the PUSH send in User Mode?", unofficial, by Julien Bayle) —
named author, clear diagram, matches everything already independently
confirmed (encoders, arrows, touch strip, pad grid, "all buttons send CC
127/0"). It doesn't print labels for this specific button group either, so
hardware was still the only way to resolve it.

Checked 12 buttons from the original doc's claims, one at a time:

| CC | Doc claimed | Actually printed | Match? |
| :-- | :----------- | :----------------- | :----: |
| 28 | Master | Master | yes |
| 29 | Stop Clip | Stop | yes (shorter print) |
| 49 | Mute | Shift | **no** |
| 50 | Solo | Note | **no** |
| 51 | Record Arm | Session | **no** |
| 58 | Note | Scales | **no** |
| 59 | Session | User (the hardcoded mode-toggle button) | **no** |
| 110 | Device | Devices | yes (close) |
| 111 | Browse | Browse | yes |
| 112 | Clip | Track | **no** |
| 114 | Volume | Volume | yes |
| 115 | Pan / Send | Pan / Send | yes |

6 of 12 wrong. The real Note/Session pair is CC 50/51, not 58/59; CC 59 is
the system-reserved User-mode toggle (the same control the doc separately
and correctly called "hardcoded, unmappable," without realizing it was the
same CC it had just labeled "Session" a few lines above). See
`research/push-mk1/midi-usermode-mapping-verified.md` for the corrected
reference and what's still unresolved (CC 113, CC 116, and an unlabeled
block of paired buttons right of the pad grid, likely where the real
Mute/Solo/Clip-equivalent buttons actually live).

**Consequence for the profile**: `midi-core/src/profile/devices/push-mk1.ts`
used CC 58/59 ("button-note"/"button-session") for the steps/mixer mode
switch — both wrong. Fixed to use the real CC 50/51, and the transport-mode
switch moved off the never-reachable gap onto CC 29 ("Stop"). Re-verified
live on hardware after the fix.
