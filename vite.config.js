import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  optimizeDeps: { include: ["@huggingface/transformers"] },
  build: { target: "es2022" },
});
