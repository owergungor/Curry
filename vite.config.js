// @ts-nocheck
import { defineConfig } from "vite";
import { sveltekit } from "@sveltejs/kit/vite";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [
    sveltekit(),
    {
      name: "tauri-html-rewrite",
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url) {
            if (req.url === "/glow.html" || req.url.startsWith("/glow.html?")) {
              req.url = req.url.replace("/glow.html", "/glow");
            } else if (req.url === "/index.html" || req.url.startsWith("/index.html?")) {
              req.url = req.url.replace("/index.html", "/");
            }
          }
          next();
        });
      },
    },
  ],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
