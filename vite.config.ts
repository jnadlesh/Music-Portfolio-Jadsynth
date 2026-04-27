import { defineConfig } from "vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  base: "/",
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    TanStackRouterVite({ autoCodeSplitting: true }),
    viteReact(),
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
