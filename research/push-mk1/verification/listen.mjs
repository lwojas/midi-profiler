import midi from "@julusian/midi";
import { decode, findPort } from "./decode.mjs";

const PORT_NAME = process.argv[2] || "Ableton Push User Port";
const DURATION_MS = Number(process.argv[3] || 45000);

const input = new midi.Input();
input.ignoreTypes(false, false, false);

const portIndex = findPort(input, PORT_NAME);
if (portIndex === -1) {
  console.error(`No input port matching "${PORT_NAME}" found.`);
  process.exit(1);
}

console.log(`Listening on input [${portIndex}] "${input.getPortName(portIndex)}" for ${DURATION_MS}ms.`);
console.log("Interact with the hardware now.\n");

input.on("message", (_deltaTime, message) => {
  const ts = new Date().toISOString().split("T")[1].replace("Z", "");
  console.log(`[${ts}] ${decode(message)}`);
});

input.openPort(portIndex);

setTimeout(() => {
  console.log("\nDone listening.");
  input.closePort();
  process.exit(0);
}, DURATION_MS);
