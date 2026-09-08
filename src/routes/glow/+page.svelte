<script lang="ts">
  import { onMount } from "svelte";
  import { listen } from "@tauri-apps/api/event";

  interface GlowPayload {
    color: string;
    duration_ms: number;
    intensity: number;
    thickness: number;
    corner_radius: number;
    animation_style: "pulse" | "sweep" | "ambient" | "comet" | "ripple" | "breathing" | "solid";
    oled_mode?: boolean;
  }

  let isGlowing = $state(false);
  let payload = $state<GlowPayload>({
    color: "#6366f1",
    duration_ms: 2500,
    intensity: 0.8,
    thickness: 8,
    corner_radius: 24,
    animation_style: "pulse",
    oled_mode: false,
  });
  let timer: ReturnType<typeof setTimeout> | null = null;

  onMount(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.add("glow-window");
      document.body.classList.add("glow-window");
    }

    const unlistenPromise = listen<GlowPayload>("trigger-glow", (event) => {
      payload = event.payload;
      isGlowing = true;

      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        isGlowing = false;
      }, payload.duration_ms);
    });

    return () => {
      if (timer) clearTimeout(timer);
      unlistenPromise.then((unlisten) => unlisten());
      if (typeof document !== "undefined") {
        document.documentElement.classList.remove("glow-window");
        document.body.classList.remove("glow-window");
      }
    };
  });
</script>

<div
  class="glow-viewport {isGlowing ? 'active' : ''} {payload.animation_style} {payload.oled_mode ? 'oled' : ''}"
  style:--glow-color={payload.color}
  style:--glow-thickness="{payload.thickness}px"
  style:--glow-radius="{payload.corner_radius}px"
  style:--glow-intensity={payload.intensity}
  style:--glow-duration="{payload.duration_ms}ms"
>
  <div class="glow-edge-inner"></div>
  <div class="glow-edge-accent"></div>
</div>

<style>
  :global(html.glow-window, body.glow-window) {
    margin: 0 !important;
    padding: 0 !important;
    background: transparent !important;
    overflow: hidden !important;
    user-select: none !important;
    width: 100vw;
    height: 100vh;
  }

  .glow-viewport {
    position: fixed;
    inset: 0;
    pointer-events: none;
    opacity: 0;
    visibility: hidden;
    content-visibility: hidden;
    transition: opacity 0.25s ease-out;
    box-sizing: border-box;
  }

  .glow-viewport.active {
    opacity: 1;
    visibility: visible;
    content-visibility: visible;
    will-change: opacity;
  }

  .glow-edge-inner {
    position: absolute;
    inset: 0;
    border-radius: var(--glow-radius);
    pointer-events: none;
    box-sizing: border-box;
    border: calc(var(--glow-thickness) * 0.5) solid var(--glow-color);
    box-shadow:
      inset 0 0 calc(var(--glow-thickness) * 1.5) var(--glow-color),
      inset 0 0 calc(var(--glow-thickness) * 3) var(--glow-color),
      0 0 calc(var(--glow-thickness) * 2) var(--glow-color);
    opacity: var(--glow-intensity);
  }

  .glow-viewport.active .glow-edge-inner {
    will-change: opacity, transform, filter;
  }

  .glow-edge-accent {
    position: absolute;
    inset: 0;
    border-radius: var(--glow-radius);
    pointer-events: none;
    box-sizing: border-box;
    opacity: 0;
  }

  .glow-viewport.active .glow-edge-accent {
    will-change: opacity, transform;
  }

  /* OLED Mode Optimization: tighten spread, no excessive blur, energy saving */
  .glow-viewport.oled .glow-edge-inner {
    border-width: calc(var(--glow-thickness) * 0.35);
    box-shadow:
      inset 0 0 calc(var(--glow-thickness) * 0.75) var(--glow-color),
      0 0 calc(var(--glow-thickness) * 0.75) var(--glow-color);
    opacity: calc(var(--glow-intensity) * 0.75);
  }

  /* =========================================================================
     1. Pulse Animation: Rhythmic pulse with smooth intensity modulation
     ========================================================================= */
  .glow-viewport.pulse.active .glow-edge-inner {
    animation: pulse-glow 0.85s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }

  @keyframes pulse-glow {
    0% {
      opacity: calc(var(--glow-intensity) * 0.25);
      transform: scale(0.996);
      filter: brightness(0.85) blur(0.5px);
    }
    30% {
      opacity: var(--glow-intensity);
      transform: scale(1);
      filter: brightness(1.35) blur(1.5px);
    }
    60% {
      opacity: calc(var(--glow-intensity) * 0.35);
      transform: scale(0.998);
      filter: brightness(0.9) blur(0.5px);
    }
    100% {
      opacity: calc(var(--glow-intensity) * 0.25);
      transform: scale(0.996);
      filter: brightness(0.85) blur(0.5px);
    }
  }

  /* =========================================================================
     2. Sweep Animation: Illumination sweeping continuously around screen edges
     ========================================================================= */
  .glow-viewport.sweep.active .glow-edge-inner {
    opacity: calc(var(--glow-intensity) * 0.35);
  }
  .glow-viewport.sweep.active .glow-edge-accent {
    opacity: var(--glow-intensity);
    border: calc(var(--glow-thickness) * 0.8) solid transparent;
    border-radius: var(--glow-radius);
    animation: sweep-perimeter 2.0s linear infinite;
    filter: drop-shadow(0 0 calc(var(--glow-thickness) * 2.5) var(--glow-color));
  }

  @keyframes sweep-perimeter {
    0%, 100% {
      border-top-color: var(--glow-color);
      border-right-color: transparent;
      border-bottom-color: transparent;
      border-left-color: transparent;
    }
    25% {
      border-top-color: transparent;
      border-right-color: var(--glow-color);
      border-bottom-color: transparent;
      border-left-color: transparent;
    }
    50% {
      border-top-color: transparent;
      border-right-color: transparent;
      border-bottom-color: var(--glow-color);
      border-left-color: transparent;
    }
    75% {
      border-top-color: transparent;
      border-right-color: transparent;
      border-bottom-color: transparent;
      border-left-color: var(--glow-color);
    }
  }

  /* =========================================================================
     3. Ambient & Legacy Breathing: Soft, harmonic, low-frequency ambient light
     ========================================================================= */
  .glow-viewport.ambient.active .glow-edge-inner,
  .glow-viewport.breathing.active .glow-edge-inner {
    animation: ambient-glow 3.0s ease-in-out infinite;
  }

  @keyframes ambient-glow {
    0% {
      opacity: calc(var(--glow-intensity) * 0.35);
      transform: scale(0.998);
      filter: brightness(0.85) blur(0.5px);
    }
    50% {
      opacity: var(--glow-intensity);
      transform: scale(1.001);
      filter: brightness(1.15) blur(2px);
    }
    100% {
      opacity: calc(var(--glow-intensity) * 0.35);
      transform: scale(0.998);
      filter: brightness(0.85) blur(0.5px);
    }
  }

  /* =========================================================================
     4. Comet Animation: High-intensity traveling segment with a fading tail
     ========================================================================= */
  .glow-viewport.comet.active .glow-edge-inner {
    animation: comet-fade 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
  }
  .glow-viewport.comet.active .glow-edge-accent {
    opacity: 1;
    border: calc(var(--glow-thickness) * 0.6) solid transparent;
    border-top-color: var(--glow-color);
    border-right-color: var(--glow-color);
    animation: comet-spin 1.5s linear infinite;
    filter: drop-shadow(0 0 calc(var(--glow-thickness) * 2) var(--glow-color));
  }

  @keyframes comet-fade {
    0%, 100% {
      opacity: calc(var(--glow-intensity) * 0.3);
      filter: brightness(0.85);
    }
    50% {
      opacity: calc(var(--glow-intensity) * 0.7);
      filter: brightness(1.2);
    }
  }

  @keyframes comet-spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  /* =========================================================================
     5. Ripple Animation: Light wave expanding outward along screen borders
     ========================================================================= */
  .glow-viewport.ripple.active .glow-edge-inner {
    animation: ripple-wave 1.2s cubic-bezier(0.1, 0.6, 0.3, 1) infinite;
  }

  @keyframes ripple-wave {
    0% {
      opacity: var(--glow-intensity);
      transform: scale(0.99);
      box-shadow:
        inset 0 0 calc(var(--glow-thickness) * 1) var(--glow-color),
        0 0 calc(var(--glow-thickness) * 0.5) var(--glow-color);
    }
    60% {
      opacity: calc(var(--glow-intensity) * 0.8);
      transform: scale(1.002);
      box-shadow:
        inset 0 0 calc(var(--glow-thickness) * 3) var(--glow-color),
        0 0 calc(var(--glow-thickness) * 3) var(--glow-color);
    }
    100% {
      opacity: calc(var(--glow-intensity) * 0.2);
      transform: scale(1.005);
      box-shadow:
        inset 0 0 calc(var(--glow-thickness) * 4) var(--glow-color),
        0 0 calc(var(--glow-thickness) * 4.5) var(--glow-color);
    }
  }

  /* Solid Animation (Legacy fallback) */
  .glow-viewport.solid.active .glow-edge-inner {
    animation: none !important;
    opacity: var(--glow-intensity) !important;
    transform: none !important;
    filter: brightness(1.05) !important;
  }

  /* Accessibility: Reduced Motion */
  @media (prefers-reduced-motion: reduce) {
    .glow-viewport {
      transition: none !important;
    }
    .glow-viewport.active .glow-edge-inner,
    .glow-viewport.active .glow-edge-accent {
      animation: none !important;
    }
    .glow-edge-inner {
      opacity: calc(var(--glow-intensity) * 0.5) !important;
      filter: none !important;
    }
  }
</style>
