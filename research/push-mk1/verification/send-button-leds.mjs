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

// A handful of CCs from research/push-mk1/midi-usermode-mapping.md section 2,
// labelled so a visual check can confirm which physical button lit up.
const BUTTONS = [
  ["Upper control row button 1", 102],
  ["Play", 85],
  ["Record", 86],
  ["Master", 28],
  ["Mute", 49],
  ["Solo", 50],
];

const mode = process.argv[2] || "light";
const value = mode === "clear" ? 0 : 127;

for (const [label, cc] of BUTTONS) {
  output.sendMessage([0xb0, cc, value]);
  console.log(`CC ${cc} (${label}) -> ${value}`);
}

if (mode !== "clear") {
  console.log("\nCheck each labelled button lit up. Run again with `clear` to turn them off.");
}

output.closePort();
