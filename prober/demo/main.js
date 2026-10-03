// Wires this MVP's form straight to midi-core's real Web MIDI adapter and
// this app's own real, tested `runProbeSession`/`parseProbePlan` -- both
// imported from their built `dist/` output, no bundler, same pattern as
// midi-core's own `demo/main.js` (ECS-31). See ../../docs/device-prober-mvp.md.
import { requestWebMidiAccess } from "/midi-core/adapters/web-midi/index.js";
import { runProbeSession } from "../dist/run-probe-session.js";
import { parseProbePlan } from "../dist/types/probe-plan.js";

const $ = (id) => document.getElementById(id);
const log = (line) => {
  const el = $("log");
  el.textContent += `[${new Date().toLocaleTimeString()}] ${line}\n`;
  el.scrollTop = el.scrollHeight;
};

let access; // WebMidiAccess
let rawInput; // RawMidiInput
let rawOutput; // RawMidiOutput
let lastSession; // the most recently completed ProbeSession, for download

function refreshPortOptions() {
  const ports = access.discovery.listPorts();
  for (const [select, type] of [[$("input-select"), "input"], [$("output-select"), "output"]]) {
    const previous = select.value;
    select.innerHTML = "";
    for (const port of ports.filter((p) => p.type === type)) {
      const option = document.createElement("option");
      option.value = port.id;
      option.textContent = `${port.name ?? port.id}${port.manufacturer ? ` (${port.manufacturer})` : ""}`;
      select.appendChild(option);
    }
    if ([...select.options].some((o) => o.value === previous)) select.value = previous;
  }
  $("connect").disabled = access.discovery.listPorts().length === 0;
}

$("request").addEventListener("click", async () => {
  try {
    // sysex: true -- probing routinely needs raw SysEx (mode switches,
    // device inquiry), unlike midi-core's own ECS-31 demo which never sends it.
    access = await requestWebMidiAccess({ sysex: true });
    $("access-status").textContent = "Access granted (SysEx enabled).";
    refreshPortOptions();
    access.discovery.onChange((change) => {
      log(`discovery: ${change.type} ${change.port.type} "${change.port.name ?? change.port.id}"`);
      refreshPortOptions();
    });
  } catch (err) {
    $("access-status").textContent = `Failed: ${err.message}`;
    log(`access error: ${err.message}`);
  }
});

$("connect").addEventListener("click", async () => {
  const inputId = $("input-select").value;
  const outputId = $("output-select").value;
  rawInput = access.getInput(inputId);
  rawOutput = access.getOutput(outputId);
  if (!rawInput || !rawOutput) {
    log("select both an input and an output port first");
    return;
  }

  rawInput.onStateChange((state) => ($("input-state").textContent = state));
  rawOutput.onStateChange((state) => ($("output-state").textContent = state));
  rawInput.onError((err) => log(`input error: ${err.code} ${err.message}`));
  rawOutput.onError((err) => log(`output error: ${err.code} ${err.message}`));

  await Promise.all([rawInput.connect(), rawOutput.connect()]);

  $("input-state").textContent = rawInput.state;
  $("output-state").textContent = rawOutput.state;
  $("disconnect").disabled = false;
  $("send").disabled = false;
  $("connect").disabled = true;
});

$("disconnect").addEventListener("click", async () => {
  await Promise.all([rawInput?.disconnect(), rawOutput?.disconnect()]);
  $("disconnect").disabled = true;
  $("send").disabled = true;
  $("connect").disabled = false;
});

$("kind").addEventListener("change", () => {
  const kind = $("kind").value;
  $("cc-fields").style.display = kind === "cc" ? "" : "none";
  $("note-fields").style.display = kind === "cc" ? "none" : kind === "sysex" ? "none" : "";
  $("channel-row").style.display = kind === "sysex" ? "none" : "flex";
  $("sysex-field").style.display = kind === "sysex" ? "" : "none";
});

function hexToBytes(text) {
  const tokens = text.trim().split(/[\s,]+/).filter(Boolean);
  if (tokens.length === 0) throw new Error("Enter at least one hex byte.");
  return tokens.map((token) => {
    const byte = parseInt(token, 16);
    if (Number.isNaN(byte) || byte < 0 || byte > 255) throw new Error(`Invalid hex byte: "${token}"`);
    return byte;
  });
}

// Builds this probe's raw wire bytes plus a human-readable default
// description, straight from the form -- no message codec, same "author
// known bytes directly" level of abstraction prober/src/types/probe-step.ts
// already documents.
function buildMessage() {
  const kind = $("kind").value;
  const channel = (Number($("channel").value) - 1) & 0x0f;

  if (kind === "cc") {
    const controller = Number($("controller").value) & 0x7f;
    const value = Number($("value").value) & 0x7f;
    return { send: [0xb0 | channel, controller, value], description: `CC ${controller} = ${value} on channel ${channel + 1}` };
  }
  if (kind === "note-on" || kind === "note-off") {
    const note = Number($("note").value) & 0x7f;
    const velocity = Number($("velocity").value) & 0x7f;
    const status = kind === "note-on" ? 0x90 : 0x80;
    const label = kind === "note-on" ? "Note On" : "Note Off";
    return { send: [status | channel, note, velocity], description: `${label} ${note} velocity ${velocity} on channel ${channel + 1}` };
  }
  return { send: hexToBytes($("sysex").value), description: "Raw SysEx" };
}

$("send").addEventListener("click", async () => {
  $("send").disabled = true;
  try {
    const { send, description: autoDescription } = buildMessage();
    const description = $("description").value.trim() || autoDescription;

    const plan = parseProbePlan({
      id: $("session-id").value.trim(),
      device: { manufacturer: $("manufacturer").value.trim(), model: $("model").value.trim() },
      steps: [{ id: $("step-id").value.trim(), description, send, listenMs: Number($("listen-ms").value) }],
    });

    log(`out: ${description} — [${send.map((b) => b.toString(16).padStart(2, "0")).join(" ")}]`);

    const transport = {
      output: { sendRaw: (bytes) => rawOutput.sendRaw(bytes) },
      input: { onRawMessage: (listener) => rawInput.onRawMessage(listener) },
    };
    const session = await runProbeSession(transport, plan);
    lastSession = session;

    const observations = session.steps[0]?.observations ?? [];
    if (observations.length === 0) {
      log("in:  (no response within listen window)");
    }
    for (const observation of observations) {
      const hex = observation.raw.map((b) => b.toString(16).padStart(2, "0")).join(" ");
      log(`in:  [${hex}] (+${observation.receivedAtMs}ms)`);
    }

    $("download").disabled = false;
  } catch (err) {
    log(`error: ${err.message}`);
  } finally {
    $("send").disabled = false;
  }
});

$("download").addEventListener("click", () => {
  if (!lastSession) return;
  const blob = new Blob([JSON.stringify(lastSession, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${lastSession.id}.json`;
  a.click();
  URL.revokeObjectURL(url);
});
