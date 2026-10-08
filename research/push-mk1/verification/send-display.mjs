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

const LINE_IDS = { 1: 0x18, 2: 0x19, 3: 0x1a, 4: 0x1b };

function buildLineSysex(lineNumber, text) {
  const lineId = LINE_IDS[lineNumber];
  if (lineId === undefined) throw new Error(`bad line number ${lineNumber}`);
  if (text.length > 68) throw new Error(`text too long (${text.length} > 68)`);
  const chars = Array.from({ length: 68 }, (_, i) =>
    i < text.length ? text.charCodeAt(i) : 0x20,
  );
  return [0xf0, 0x47, 0x7f, 0x15, lineId, 0x00, 0x45, 0x00, ...chars, 0xf7];
}

const lines = [
  "LINE1 68-CHAR TEST 0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmn",
  "LINE2 abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789",
  "LINE3 short string - rest of line should be blank-padded",
  "LINE4 punctuation: !@#$%^&*()_+-=[]{}|;:,.<>?/~`",
];

for (const [i, text] of lines.entries()) {
  const lineNumber = i + 1;
  const msg = buildLineSysex(lineNumber, text.slice(0, 68));
  output.sendMessage(msg);
  console.log(`Sent line ${lineNumber} (${msg.length} bytes, expect 77): "${text.slice(0, 68)}"`);
}

output.closePort();
console.log("\nCheck the Push's LCD: 4 lines of text should now be visible.");
