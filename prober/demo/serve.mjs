// Zero-dependency static file server for the demo page -- same reason
// midi-core's own demo/serve.mjs exists: Web MIDI + native ESM imports need
// to be served over http(s), not file://, and this one page doesn't justify
// a bundler/dev-server dependency.
//
// Also mounts midi-core's built dist/ under /midi-core/, since
// demo/main.js imports midi-core's real requestWebMidiAccess directly from
// it. Adjust MIDI_CORE_DIST if your midi-core checkout isn't a sibling
// directory of midi-profiler -- same "point this at your checkout"
// convention as ../examples/midi-core-mock-transport.mjs and
// midi-profiler's own docs/profiling-workflow.md (--validator).
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const midiCoreDist = resolve(process.env.MIDI_CORE_DIST ?? join(root, "../../midi-core/dist"));
const port = Number(process.env.PORT ?? 4174);

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

function resolveRequestPath(pathname) {
  if (pathname.startsWith("/midi-core/")) {
    const rest = pathname.slice("/midi-core/".length);
    return { base: midiCoreDist, filePath: normalize(join(midiCoreDist, rest)) };
  }
  const path = pathname === "/" ? "/demo/index.html" : pathname;
  return { base: root, filePath: normalize(join(root, path)) };
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", "http://localhost");
    const { base, filePath } = resolveRequestPath(decodeURIComponent(url.pathname));
    if (!filePath.startsWith(base)) {
      res.writeHead(403).end("Forbidden");
      return;
    }

    const info = await stat(filePath);
    if (!info.isFile()) {
      res.writeHead(404).end("Not found");
      return;
    }

    const body = await readFile(filePath);
    const contentType = CONTENT_TYPES[extname(filePath)] ?? "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    res.end(body);
  } catch (err) {
    if (err && err.code === "ENOENT") {
      res.writeHead(404).end("Not found");
    } else {
      res.writeHead(500).end("Internal error");
    }
  }
});

server.listen(port, () => {
  console.log(`Demo running at http://localhost:${port}/demo/index.html`);
  console.log(`Serving midi-core's dist/ from ${midiCoreDist} (set MIDI_CORE_DIST to override).`);
  console.log("Web MIDI requires a secure context -- localhost is fine, no HTTPS needed.");
});
