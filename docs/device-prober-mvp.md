# Device Prober MVP: Connect, Send One Probe, Capture the Response

Status: Draft
Linear: [ECS-60](https://linear.app/ecs3d/issue/ECS-60/build-device-prober-app-mvp-connect-send-one-probe-capture-the)
Depends on: [docs/device-prober.md](./device-prober.md) (ECS-58),
[docs/probe-capture-bridge.md](./probe-capture-bridge.md) (ECS-59)
Source of truth: [`../prober/demo/`](../prober/demo)

## Scope

Every other piece of `prober/` so far — `runProbeSession`, the `probe` CLI
command, `draft-evidence` — is proven against fakes or a mock transport.
This ticket is the first thing in `prober/` that actually talks to a real,
physically present device: a minimal, interactive tool to connect, send one
operator-specified probe (a Control Change, a Note, or a raw SysEx
message), and record exactly what comes back. Per the ticket, this is
"test this now" during a profiling session, not an automated sweep —
explicitly not in scope: automated probe sequences (that's already `probe
<plan.json>`), profile completeness scoring, or writing back into
midi-core.

## Why a browser page, not a new CLI command

midi-core's only real-hardware-capable transport is its Web MIDI adapter
(`src/adapters/web-midi/`), built against `navigator.requestMIDIAccess` —
a browser API, not something Node has. That's exactly why midi-core's own
real-hardware proof (ECS-31) is a static HTML page (`midi-core/demo/`), not
a CLI. Building a *new* Node-native MIDI transport (wrapping some native
binding library) would be a new midi-core adapter — real, separate work,
not this ticket, and not something `prober/` would be allowed to depend on
anyway (its own package.json carries no midi-core dependency, per
`docs/device-prober.md`).

So `prober/demo/` mirrors `midi-core/demo/`'s pattern exactly: a plain HTML
page plus a zero-dependency static server (`demo/serve.mjs`), run with Node
and viewed in a browser, importing both packages' already-built,
already-tested `dist/` output directly as native ES modules — no bundler,
no new dependency, and nothing added to `prober/src/`'s own deterministic
core.

## How it works

```sh
# once, in each checkout:
cd midi-core && npm run build
cd prober && npm run build

# then:
cd prober && npm run demo
# -> http://localhost:4174/demo/index.html
```

1. **Request MIDI access** — the browser's Web MIDI permission prompt, with
   `sysex: true` (probing routinely needs raw SysEx — mode switches, device
   inquiry — unlike midi-core's own ECS-31 demo, which never sends it).
2. **Pick the real device's input and output port, Connect** — this calls
   `connect()` directly on the `RawMidiInput`/`RawMidiOutput` objects
   `WebMidiAccess.getInput()`/`getOutput()` return. No `createMidiInput`/
   `createMidiOutput` wrapping needed: those raw transports already expose
   `sendRaw`/`onRawMessage` directly, which is exactly `ProbeTransport`'s
   shape (`prober/src/transport/types.ts`) — the glue is a two-line object
   literal, not a new adapter.
3. **Fill in one probe** — device identity, a session/step id, the message
   (CC/Note On/Note Off: channel+controller/note+value/velocity fields; raw
   SysEx: space/comma-separated hex, e.g. `F0 00 20 29 02 0D 0E 01 F7`), and
   how long to listen afterward.
4. **Send probe** builds a one-step `ProbePlan` from the form, validated
   with prober's own `parseProbePlan` (`prober/dist/types/probe-plan.js`) —
   the same check a hand-authored plan file already gets — then runs it
   through prober's real `runProbeSession` (`prober/dist/run-probe-session.js`)
   against the real connected device, using the system clock. This is the
   *exact same code path* `prober probe --transport <module>` already uses;
   the only difference is a form filling in one step instead of a JSON
   plan file naming several.
5. The resulting one-step `ProbeSession` is logged in the page (sent bytes
   and every observed response, hex-formatted, with elapsed ms) and
   downloadable as `<session-id>.json` — from there it's the same shape
   `prober probe --out` would have written, so it drops straight into
   [`docs/probe-capture-bridge.md`](./probe-capture-bridge.md)'s
   `draft-evidence` step unchanged.

## Why this isn't a "transport module" in the `--transport <module>` sense

`docs/device-prober.md` reserves `--transport <module>` as the CLI's one
seam for midi-core, loaded by path, never statically imported. This demo
doesn't use that seam at all — it's a different, browser-only entry point
into the same deterministic core (`runProbeSession`/`parseProbePlan`),
the same way midi-core's own `demo/` is a different entry point into its
`core`/`adapters` than its Vitest suite is. `prober/src/`'s own
`package.json` still carries no midi-core dependency; the import lives in
`demo/main.js`, which is never compiled into `prober/dist/` or published.

## What this is deliberately not

- **Not an automated sweep.** One probe per click, by design — the
  ticket's own scope line. Running several known messages in sequence is
  what `probe <plan.json>` is already for.
- **Not profile completeness scoring.** The page has no notion of a
  `DeviceProfile` or which fields remain unresolved — see
  `docs/generation-pipeline.md` for where that judgment actually happens.
- **Not a write path into midi-core.** The only calls made are
  `requestWebMidiAccess`, `connect`/`disconnect`, `sendRaw`, and
  `onRawMessage` — the same read/write-raw-bytes surface `ProbeTransport`
  already defines. Nothing here changes midi-core's own code, state, or
  persisted anything.
- **Not a new midi-core adapter.** It's wiring, in a demo page, of the
  adapter midi-core already ships — the same arm's-length relationship
  `docs/device-prober.md` already drew around every other midi-core touch
  point in this repo.
- **Not automatic evidence registration.** Downloading `session.json` is as
  far as this tool goes; moving the file under `research/.../captured-traffic/`
  and running `draft-evidence` (let alone pasting the result into
  `src/evidence/manifest.ts`) are still the same manual, human steps
  `docs/device-prober.md` and `docs/probe-capture-bridge.md` already
  describe.
