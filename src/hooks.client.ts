import type { Reroute } from "@sveltejs/kit";

/**
 * Normalizes static HTML entry point URLs (e.g. /glow.html) to SvelteKit route paths (/glow)
 * to prevent 404 client-side routing errors inside Tauri transparent overlay windows.
 */
export const reroute: Reroute = ({ url }) => {
  const p = url.pathname;
  if (p === "/glow.html" || p.endsWith("/glow.html")) {
    return "/glow";
  }
  if (p === "/index.html" || p.endsWith("/index.html")) {
    return "/";
  }
};
