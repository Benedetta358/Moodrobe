import { build } from "vite";
await build({
  configFile: false,
  publicDir: false,
  build: {
    emptyOutDir: false,
    outDir: "public/application",
    lib: {
      entry: "src/research-entry.js",
      formats: ["es"],
      fileName: () => "research.js",
    },
    minify: true,
  },
});
