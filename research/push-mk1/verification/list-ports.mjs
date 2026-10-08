import midi from "@julusian/midi";

const input = new midi.Input();
const output = new midi.Output();

console.log("--- MIDI INPUT ports ---");
for (let i = 0; i < input.getPortCount(); i++) {
  console.log(`[${i}] ${input.getPortName(i)}`);
}

console.log("--- MIDI OUTPUT ports ---");
for (let i = 0; i < output.getPortCount(); i++) {
  console.log(`[${i}] ${output.getPortName(i)}`);
}
