# Ableton Push 1 (Mk1) User Mode MIDI Reference Map

> **Erratum (2026-10-08):** Hands-on testing against a real unit found this
> doc's labels for section 2's "Bottom & Layout Selection Blocks" and
> "Right Column Master Utilities" are wrong about half the time (it looks
> conflated with Push 2's layout in places) — e.g. CC 58/59 are not
> "Note"/"Session" (those are actually CC 50/51; CC 59 is the hardcoded
> User-mode toggle), CC 112 is "Track" not "Clip", CC 49/50/51 are
> "Shift"/"Note"/"Session" not "Mute"/"Solo"/"Record Arm". See
> [`midi-usermode-mapping-verified.md`](./midi-usermode-mapping-verified.md)
> for the corrected reference. Everything outside that one section
> (encoders, arrows, touch strip, pad grid, display/upper-control rows)
> checked out and is unaffected.

This document outlines the complete MIDI layout mapping for the Ableton Push 1 hardware when decoupled from Ableton Live (User Mode). All messages are transmitted and received on **MIDI Channel 1** via the **User MIDI Port**.

---

## 1. 🎛️ Encoders & Knobs (CC & Notes)

- **Rotary Turns:** Transmit continuous relative MIDI CC values.
- **Capacitive Touches:** Transmit a MIDI Note On message when touched, and a Note Off message when released.

| Hardware Encoder           | Rotary Control (CC) | Capacitive Touch (MIDI Note) |
| :------------------------- | :------------------ | :--------------------------- |
| **Encoder 1** (Leftmost)   | CC 71               | Note 0 (C-2)                 |
| **Encoder 2**              | CC 72               | Note 1 (C#-2)                |
| **Encoder 3**              | CC 73               | Note 2 (D-2)                 |
| **Encoder 4**              | CC 74               | Note 3 (D#-2)                |
| **Encoder 5**              | CC 75               | Note 4 (E-2)                 |
| **Encoder 6**              | CC 76               | Note 5 (F-2)                 |
| **Encoder 7**              | CC 77               | Note 6 (F#-2)                |
| **Encoder 8**              | CC 78               | Note 7 (G-2)                 |
| **Master Encoder** (Right) | CC 79               | Note 8 (G#-2)                |
| **Swing Encoder**          | CC 15               | Note 9 (A-2)                 |
| **Tempo Encoder**          | CC 14               | Note 10 (A#-2)               |

---

## 2. 🔲 Utility & Navigation Buttons (CC Map)

Every rubber button surrounding the pad matrix maps strictly to a **MIDI CC**. Sending a CC value back to these assignments controls their integrated LED state.

### Display Row Buttons (Above the Screen)

- **Button 1 to 8 (Left to Right):** CC 20, CC 21, CC 22, CC 23, CC 24, CC 25, CC 26, CC 27

### Upper Control Row Buttons (Below the Screen, Above the Grid)

- **Button 1 to 8 (Left to Right):** CC 102, CC 103, CC 104, CC 105, CC 106, CC 107, CC 108, CC 109

### Left Column Utilities

- **Tap Tempo:** CC 3
- **Metronome:** CC 9

### Right Column Master Utilities

- **Master:** CC 28
- **Stop Clip:** CC 29
- **Mute:** CC 49
- **Solo:** CC 50
- **Record Arm:** CC 51

### Right Side Navigation Pad

- **Arrow Up:** CC 46
- **Arrow Down:** CC 47
- **Arrow Left:** CC 44
- **Arrow Right:** CC 45
- **Select:** CC 34
- **Shift:** CC 35

### Left Column Modes & Sequencing

- **Play:** CC 85
- **Record:** CC 86
- **New:** CC 87
- **Duplicate:** CC 88
- **Automation:** CC 89
- **Fixed Length:** CC 90

### Bottom & Layout Selection Blocks

- **Volume:** CC 114
- **Pan / Send:** CC 115
- **Track:** CC 116
- **Device:** CC 110
- **Browse:** CC 111
- **Clip:** CC 112
- **Note:** CC 58
- **Session:** CC 59
- **User Button:** _Hardcoded system button. Unmappable._

---

## 3. ⌨️ 8x8 Pad Matrix (MIDI Notes)

The 64 pad matrix maps sequentially from **bottom-left to top-right** using standard **MIDI Note On/Off** messages.

- Sending notes back to the grid controls the RGB LEDs.
- Velocities `0-127` correspond to internal Push indexed colors.

```text
 [92] [93] [94] [95] [96] [97] [98] [99]  - Row 8 (Top)
 [84] [85] [86] [87] [88] [89] [90] [91]  - Row 7
 [76] [77] [78] [79] [80] [81] [82] [83]  - Row 6
 [68] [69] [70] [71] [72] [73] [74] [75]  - Row 5
 [60] [61] [62] [63] [64] [65] [66] [67]  - Row 4
 [52] [53] [54] [55] [56] [57] [58] [59]  - Row 3
 [44] [45] [46] [47] [48] [49] [50] [51]  - Row 2
 [36] [37] [38] [39] [40] [41] [42] [43]  - Row 1 (Bottom)
```

---

## 4. 🎚️ Touch Strip & Expression

- **Touch Strip Data:** Transmits generic 14-bit **Pitch Bend** data by default.
- **Touch Strip Tap (Capacitive):** Sends a **MIDI Note On/Off** on **Note 12 (C-1)** when interacting with the physical strip area.

## 5. 🎨 RGB Pad LED Velocity Color Table

To turn a pad LED on or change its color, send a **MIDI Note On** message to the target pad's Note number. The **Velocity value (0–127)** determines the specific color and brightness index.

| Color               | Bright Velocity | Standard Velocity | Dim / Animated Velocity |
| :------------------ | :-------------: | :---------------: | :---------------------: |
| **Off / Black**     |        —        |       **0**       |            —            |
| **White / Gray**    |        3        |         2         |            1            |
| **Red**             |        5        |         6         |     7 (Slow Pulse)      |
| **Orange**          |        9        |        10         |           11            |
| **Yellow**          |       13        |        14         |     15 (Slow Pulse)     |
| **Green**           |       21        |        22         |           23            |
| **Cyan / Teal**     |       33        |        34         |           35            |
| **Blue**            |       45        |        46         |     47 (Slow Pulse)     |
| **Purple / Violet** |       49        |        50         |           51            |
| **Pink / Magenta**  |       57        |        58         |           59            |

### Direct LED Control Examples:

- **Turn Pad C1 (Bottom-Left) solid Bright Green:** Send `Note On` -> Note: `36`, Velocity: `21`
- **Turn Pad C1 off completely:** Send `Note On` -> Note: `36`, Velocity: `0` (or a standard `Note Off` message).
