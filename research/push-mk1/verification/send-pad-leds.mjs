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

// Standard-brightness velocities from research/push-mk1/midi-usermode-mapping.md section 5
const COLORS = [
  ["white", 2],
  ["red", 6],
  ["orange", 10],
  ["yellow", 14],
  ["green", 22],
  ["cyan", 34],
  ["blue", 46],
  ["purple", 50],
];

// Row 1 (bottom row), notes 36-43 left to right
const BOTTOM_ROW_NOTES = [36, 37, 38, 39, 40, 41, 42, 43];

const mode = process.argv[2] || "light";

if (mode === "clear") {
  for (const note of BOTTOM_ROW_NOTES) {
    output.sendMessage([0x90, note, 0]);
    console.log(`Cleared note ${note}`);
  }
} else {
  BOTTOM_ROW_NOTES.forEach((note, i) => {
    const [name, velocity] = COLORS[i];
    output.sendMessage([0x90, note, velocity]);
    console.log(`Note ${note} -> ${name} (velocity ${velocity})`);
  });
  console.log("\nCheck the bottom pad row: left-to-right should read");
  console.log(COLORS.map(([name]) => name).join(", "));
  console.log("Run again with `clear` as the argument to turn them off.");
}

output.closePort();
