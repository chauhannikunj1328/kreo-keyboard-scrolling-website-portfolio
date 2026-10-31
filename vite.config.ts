import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/", // real page paths: on a host, send every path to index.html
  plugins: [react()],
  build: { target: "es2022", chunkSizeWarningLimit: 1200 },
});
