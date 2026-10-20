import { mkdir, copyFile, readdir } from "node:fs/promises";
const src = new URL("../node_modules/onnxruntime-web/dist/", import.meta.url),
  dst = new URL("../public/ort/", import.meta.url);
await mkdir(dst, { recursive: true });
for (const file of await readdir(src)) {
  if (/^ort-wasm-simd-threaded\.(wasm|mjs)$/.test(file))
    await copyFile(new URL(file, src), new URL(file, dst));
}
