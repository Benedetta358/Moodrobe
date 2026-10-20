import { readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
// The worker explicitly uses /ort/ standard WASM. Vite also emits an unused
// asyncify fallback referenced inside ONNX Runtime; omit that unused binary.
for (const f of await readdir("dist/assets"))
  if (/^ort-wasm-.*\.wasm$/.test(f)) await rm(path.join("dist/assets", f));
async function inspect(dir) {
  for (const f of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) await inspect(p);
    else if ((await stat(p)).size > 25 * 1024 * 1024)
      throw Error(`Static asset exceeds 25 MiB: ${p}`);
  }
}
await inspect("dist");
