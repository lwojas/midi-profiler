# Ableton Push 1 (Mk1) Display & Global SysEx Reference

The original Ableton Push 1 character display consists of 4 distinct lines, with each line holding exactly **68 ASCII characters**. Outside of Ableton Live, you can update this screen and control global hardware options by sending **System Exclusive (SysEx)** message packets to the **User MIDI Output Port**.

---

## 1. Text Display SysEx Formula

A single **77-byte** SysEx string completely rewrites one horizontal line on the LCD screen. The structure remains identical for all four lines—only the `{Line ID}` byte changes.

### Hexadecimal Format

```text
F0 47 7F 15 {Line ID} 00 45 00 [68 Bytes of ASCII Characters] F7
```

### Decimal Format (Commonly used in Max/MSP or PureData)

```text
240 71 127 21 {Line ID} 0 69 0 [68 Bytes of ASCII Characters] 247
```

### 📋 Line ID Lookup Table

The **fifth byte** determines which line receives the text string:

| Target Line             | Hex Value | Decimal Value |
| :---------------------- | :-------: | :-----------: |
| **Line 1** (Topmost)    |   `18`    |     `24`      |
| **Line 2**              |   `19`    |     `25`      |
| **Line 3**              |   `1A`    |     `26`      |
| **Line 4** (Bottommost) |   `1B`    |     `27`      |

---

## 2. Formatting Rules & Text Padding

- **Exact Length Requirement:** You **must** provide exactly **68 character bytes** between the header and the `F7` (247) termination byte. If your text string is shorter than 68 characters, fill the remaining spaces with empty whitespace padding characters (`0x20` / `32`). If you send fewer than 68 text bytes, the Push will ignore the command entirely.
- **Character Set:** The Push natively renders standard printable ASCII ranges between **32 and 126** (A-Z, numbers, brackets, punctuation).
- **Encoder Alignment:** The display layout naturally splits into 8 structural blocks (matching the 8 knobs above/below it). Each knob section aligns directly to a block of **8 characters**, separated by an implied single blank column space.

---

## 3. Global Configuration SysEx Options

You can send these individual standalone strings to explicitly control hardware operational state overrides:

### Aftertouch Pressure Modes

By default, some applications will force the Push 1 matrix into polyphonic aftertouch or monophonic channel pressure. You can force the hardware state manually via SysEx:

- **Force Polyphonic Aftertouch (Poly Pressure):** `F0 47 7F 15 5C 00 01 00 F7`
- **Force Monophonic Aftertouch (Channel Pressure):** `F0 47 7F 15 5C 00 01 01 F7`

### Mode Forcing

If the hardware needs to be toggled into its raw state manually without pressing the physical User button:

- **Force Push 1 to User Mode:** `F0 47 7F 15 62 00 01 01 F7`
- **Force Push 1 to Native Live Mode:** `F0 47 7F 15 62 00 01 00 F7`
