import midi from "@julusian/midi";
import { findPort } from "./decode.mjs";

const PORT_NAME = "Ableton Push User Port";
const output = new midi.Output();
const portIndex = findPort(output, PORT_NAME);
if (portIndex === -1) {
  console.error(`No output port matching "${PORT_NAME}" found.`);
  process.exit(1);
}
output.openPort(portIndex);

// Every non-pad, non-encoder-touch CC from research/push-mk1/midi-usermode-mapping.md
// section 2, in on-screen reading order, flashed one at a time.
const BUTTONS = [
  // Display row (above screen), left to right
  ["Display row 1", 20], ["Display row 2", 21], ["Display row 3", 22], ["Display row 4", 23],
  ["Display row 5", 24], ["Display row 6", 25], ["Display row 7", 26], ["Display row 8", 27],
  // Upper control row (below screen, above grid), left to right
  ["Upper row 1", 102], ["Upper row 2", 103], ["Upper row 3", 104], ["Upper row 4", 105],
  ["Upper row 5", 106], ["Upper row 6", 107], ["Upper row 7", 108], ["Upper row 8", 109],
  // Left column utilities
  ["Tap Tempo", 3], ["Metronome", 9],
  // Right column master utilities
  ["Master", 28], ["Stop Clip", 29], ["Mute", 49], ["Solo", 50], ["Record Arm", 51],
  // Right side nav pad
  ["Arrow Up", 46], ["Arrow Down", 47], ["Arrow Left", 44], ["Arrow Right", 45],
  ["Select", 34], ["Shift", 35],
  // Left column modes & sequencing
  ["Play", 85], ["Record", 86], ["New", 87], ["Duplicate", 88], ["Automation", 89], ["Fixed Length", 90],
  // Bottom & layout selection blocks
  ["Volume", 114], ["Pan/Send", 115], ["Track", 116], ["Device", 110], ["Browse", 111], ["Clip", 112],
  ["Note", 58], ["Session", 59],
];

const ON_MS = 900;
const GAP_MS = 350;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

for (const [label, cc] of BUTTONS) {
  console.log(`--> ${label} (CC ${cc})`);
  output.sendMessage([0xb0, cc, 127]);
  await sleep(ON_MS);
  output.sendMessage([0xb0, cc, 0]);
  await sleep(GAP_MS);
}

console.log("\nSweep done. Flag any label whose button didn't light, or where a different button lit instead.");
output.closePort();
