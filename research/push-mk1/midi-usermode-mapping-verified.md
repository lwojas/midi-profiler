# Ableton Push 1 (Mk1) User Mode MIDI Map — Verified

Supersedes `midi-usermode-mapping.md` and `sysex-mapping.md`'s button-label
claims. Base diagram: `AbletonPushUserModeHack.png` — *"What does the PUSH
send in User Mode?"*, an unofficial document by **Julien Bayle**, stored
alongside this file. All CC/Note numbers below match the diagram; several
of the original `midi-usermode-mapping.md` doc's *labels* for the bottom
button row turned out to be wrong (it looks like it was written against, or
conflated with, the Push 2 layout) and are corrected here from hands-on
testing against a real, physically connected Push 1 (2026-10-08) — see
`verification/VERIFICATION.md`.

All messages are on MIDI Channel 1, over the **User Port**, same as before.

## Encoders

8 parameter encoders + Master, left to right, per Julien Bayle's diagram:

| Encoder | Rotary (CC) | Touch (Note) |
| :------ | :---------- | :----------- |
| 1 (leftmost) | CC 71 | Note 0 |
| 2 | CC 72 | Note 1 |
| 3 | CC 73 | Note 2 |
| 4 | CC 74 | Note 3 |
| 5 | CC 75 | Note 4 |
| 6 | CC 76 | Note 5 |
| 7 | CC 77 | Note 6 |
| 8 | CC 78 | Note 7 |
| Master (rightmost) | CC 79 | Note 8 |
| Tempo | CC 14 | Note 10 |
| Swing | CC 15 | Note 9 |

**Relative encoding, per the diagram's own annotation**: a clockwise turn
sends CC value `1`, counter-clockwise sends `127` — not an absolute
position. Touching an encoder sends its Note with velocity 127; releasing
sends the same note with velocity 0. All of the above matches the original
doc and was independently confirmed for Encoder 1, Tempo and Swing.

## Left column

- **Tap Tempo**: CC 3 (confirmed)
- **Metronome**: CC 9 (confirmed)
- **Play**: CC 85 (confirmed)
- **Record**: CC 86 (confirmed)
- **New**: CC 87
- **Duplicate**: CC 88
- **Automation**: CC 89
- **Fixed Length**: CC 90

(New/Duplicate/Automation/Fixed Length match the original doc and the
diagram's own CC sequence; not individually re-confirmed by label today,
only that *some* button lights at each CC in the original full sweep.)

## Display row & upper control row (above/below the screen)

- **Display row 1-8** (above screen): CC 20-27
- **Upper control row 1-8** (below screen, above grid): CC 102-109

No printed label for either row in Julien Bayle's diagram or ours; each CC
confirmed to light a distinct, real button in the original full sweep.

## Right-side utility buttons — CORRECTED

The original doc's labels for this group were wrong about half the time.
Confirmed by reading the actual hardware's printed labels, one at a time:

| CC | Original doc said | Actually is |
| :-- | :----------------- | :---------- |
| 28 | Master | **Master** (correct) |
| 29 | Stop Clip | **Stop** (correct, shorter print) |
| 49 | Mute | **Shift** (wrong) |
| 50 | Solo | **Note** (wrong) |
| 51 | Record Arm | **Session** (wrong) |
| 58 | Note | **Scales** (wrong) |
| 59 | Session | **User** — this is the hardcoded Live/User mode toggle, not a normal mappable button (wrong: it's not "Session," and it's the same control the original doc separately and correctly called "hardcoded, unmappable" without realizing it was CC 59) |
| 110 | Device | **Devices** (correct, close) |
| 111 | Browse | **Browse** (correct) |
| 112 | Clip | **Track** (wrong) |
| 114 | Volume | **Volume** (correct) |
| 115 | Pan / Send | **Pan / Send** (correct) |

So the real Note/Session pair is **CC 50 / CC 51**, not CC 58/59 — and CC 58
is a real, ordinary button ("Scales") the original doc mislabeled, while
CC 59 is the system-reserved User-mode toggle, confirmed never to mean
"Session."

## Unresolved — not independently confirmed, don't trust either source

- **CC 113**: present in Julien Bayle's diagram as part of the Devices/
  Browse/Track/Volume/Pan-Send block, but unlabeled there too, and not
  tested against the hardware.
- **CC 116**: the original doc's third claimed label in that block
  ("Track") — now known wrong, since the real Track button is CC 112.
  What CC 116 actually is, or whether it's a real distinct control at all,
  is unknown.
- **A block of paired buttons right of the pad grid** (Julien Bayle's
  diagram shows roughly CC 48-57 and 60-63, unlabeled): likely where the
  real Mute/Solo/Clip-equivalent buttons actually live, given Mute(49) and
  Solo(50) turned out to be wrong. Not tested.

## Unchanged from the original docs (re-confirmed or never in doubt)

- **Arrows**: Up 46, Down 47, Left 44, Right 45 (confirmed)
- **Touch strip**: 14-bit Pitch Bend while moved; Note 12 on tap/release
  (confirmed)
- **8x8 pad matrix**: notes 36-99, bottom-left origin, row-major (confirmed
  for several pads; matches Julien Bayle's diagram's explicit grid labels).
  The diagram also states pads send **pitch, velocity and aftertouch** —
  matches our own finding that pads send Poly Pressure by default.
- **All buttons send CC value 127 when pushed, 0 when released** — stated
  outright in Julien Bayle's diagram, matches everything tested.
- SysEx (display, aftertouch mode) — from `sysex-mapping.md`, confirmed
  separately, unaffected by this button-label correction.
