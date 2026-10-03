import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { ProbeTransport } from "../../transport/types.js";

/**
 * Loads a `ProbeTransport` from a module by path, rather than importing one
 * statically -- the same reason midi-profiler's `generate` command loads
 * `--validator` by path instead of importing midi-core's real
 * `validateDeviceProfile` directly (see midi-profiler's docs/cli.md):
 * this app has no code dependency on midi-core, so whoever actually wants
 * to talk to real hardware (or midi-core's mock device) writes a small glue
 * module that imports midi-core itself and exports a factory matching this
 * shape. `examples/midi-core-mock-transport.mjs` in this app is exactly
 * such a glue module, wired against midi-core's real mock device.
 *
 * The exported factory may be async and may return a promise of a
 * `ProbeTransport`, since wiring a real transport typically means opening a
 * connection first.
 */
export async function loadTransport(transportPath: string): Promise<ProbeTransport> {
  const module = (await import(/* @vite-ignore */ pathToFileURL(resolve(transportPath)).href)) as Record<
    string,
    unknown
  >;
  const candidate = module.createProbeTransport ?? module.default;
  if (typeof candidate !== "function") {
    throw new Error(`${transportPath} must export a "createProbeTransport" function (or export one as default).`);
  }
  return (await (candidate as () => ProbeTransport | Promise<ProbeTransport>)()) as ProbeTransport;
}
