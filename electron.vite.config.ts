import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: "out/main",
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: "out/preload",
    },
  },
  renderer: {
    plugins: [react()],
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer"),
      },
    },
    build: {
      outDir: "out/renderer",
    },
  },
});
