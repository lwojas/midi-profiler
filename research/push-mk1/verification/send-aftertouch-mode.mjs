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

const mode = process.argv[2];
if (mode !== "mono" && mode !== "poly") {
  console.error("Usage: node send-aftertouch-mode.mjs <mono|poly>");
  process.exit(1);
}

const msg =
  mode === "mono"
    ? [0xf0, 0x47, 0x7f, 0x15, 0x5c, 0x00, 0x01, 0x01, 0xf7]
    : [0xf0, 0x47, 0x7f, 0x15, 0x5c, 0x00, 0x01, 0x00, 0xf7];

output.sendMessage(msg);
console.log(`Sent "Force ${mode === "mono" ? "Monophonic (Channel) Pressure" : "Polyphonic Pressure"}": ${msg.map((b) => b.toString(16).padStart(2, "0")).join(" ")}`);
output.closePort();
