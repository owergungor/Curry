<script lang="ts">
  import { onMount } from "svelte";

  let {
    value = $bindable("#6366F1"),
    color = undefined,
    presets = [
      "#6366F1",
      "#38BDF8",
      "#10B981",
      "#F59E0B",
      "#EF4444",
      "#EC4899",
      "#8B5CF6",
      "#06B6D4",
      "#F97316",
      "#84CC16",
      "#14B8A6",
      "#A855F7",
    ],
    id = "color-picker",
    format = "hex",
    dropper = true,
    copyable = true,
    disabled = false,
    onchange = undefined,
    onChange = undefined,
  }: {
    value?: string;
    color?: string;
    presets?: string[];
    id?: string;
    format?: "hex" | "rgb" | "hsl";
    dropper?: boolean;
    copyable?: boolean;
    disabled?: boolean;
    onchange?: (val: string) => void;
    onChange?: (val: string) => void;
  } = $props();

  let isOpen = $state(false);
  let containerRef: HTMLDivElement | null = $state(null);
  let triggerRef: HTMLButtonElement | null = $state(null);
  let satValAreaRef: HTMLDivElement | null = $state(null);
  let isDraggingSatVal = $state(false);
  let currentFormat = $state<"hex" | "rgb" | "hsl">("hex");
  let copied = $state(false);

  // Active color string derived
  let activeColor = $derived((color ?? value).toUpperCase());

  // Internal HSV representation
  let hsv = $state({ h: 239, s: 59, v: 95 });
  let hexInput = $state("#6366F1");

  $effect(() => {
    currentFormat = format;
  });

  // Synchronize when value changes externally
  $effect(() => {
    const cur = (color ?? value).toUpperCase();
    hexInput = cur;
    const parsed = hexToHsv(cur);
    if (parsed) {
      hsv = parsed;
    }
  });

  // Color conversion helpers
  function hexToHsv(hex: string): { h: number; s: number; v: number } | null {
    let clean = hex.replace("#", "").trim();
    if (clean.length === 3) {
      clean = clean.split("").map((c) => c + c).join("");
    }
    if (!/^[0-9A-Fa-f]{6}$/.test(clean)) return null;

    const r = parseInt(clean.substring(0, 2), 16) / 255;
    const g = parseInt(clean.substring(2, 4), 16) / 255;
    const b = parseInt(clean.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    const s = max === 0 ? 0 : d / max;
    const v = max;

    if (max !== min) {
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      v: Math.round(v * 100),
    };
  }

  function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
    h = h / 360;
    s = s / 100;
    v = v / 100;

    let r = 0, g = 0, b = 0;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    switch (i % 6) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  }

  function hsvToHex(h: number, s: number, v: number): string {
    const { r, g, b } = hsvToRgb(h, s, v);
    const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }

  function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  }

  let currentRgb = $derived(hsvToRgb(hsv.h, hsv.s, hsv.v));
  let currentHsl = $derived(rgbToHsl(currentRgb.r, currentRgb.g, currentRgb.b));

  function emitColor(newHex: string) {
    value = newHex.toUpperCase();
    hexInput = value;
    onchange?.(value);
    onChange?.(value);
  }

  function handleSatValPointer(event: MouseEvent | TouchEvent) {
    if (!satValAreaRef) return;
    const rect = satValAreaRef.getBoundingClientRect();
    const clientX = "touches" in event ? event.touches[0].clientX : event.clientX;
    const clientY = "touches" in event ? event.touches[0].clientY : event.clientY;

    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));

    const s = Math.round((x / rect.width) * 100);
    const v = Math.round((1 - y / rect.height) * 100);

    hsv = { ...hsv, s, v };
    const newHex = hsvToHex(hsv.h, s, v);
    emitColor(newHex);
  }

  function startSatValDrag(e: MouseEvent | TouchEvent) {
    if (disabled) return;
    isDraggingSatVal = true;
    handleSatValPointer(e);

    function onPointerMove(ev: MouseEvent | TouchEvent) {
      if (isDraggingSatVal) {
        handleSatValPointer(ev);
      }
    }

    function onPointerUp() {
      isDraggingSatVal = false;
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);
    }

    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);
    window.addEventListener("touchmove", onPointerMove);
    window.addEventListener("touchend", onPointerUp);
  }

  function handleHueChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const h = parseInt(input.value, 10);
    hsv = { ...hsv, h };
    const newHex = hsvToHex(h, hsv.s, hsv.v);
    emitColor(newHex);
  }

  function handleHexInput(e: Event) {
    const target = e.target as HTMLInputElement;
    let raw = target.value.trim().toUpperCase();
    if (!raw.startsWith("#")) raw = "#" + raw;
    hexInput = raw;

    if (/^#[0-9A-F]{6}$/.test(raw)) {
      const parsed = hexToHsv(raw);
      if (parsed) {
        hsv = parsed;
        emitColor(raw);
      }
    }
  }

  function handleRgbInput(channel: "r" | "g" | "b", val: number) {
    const safe = Math.max(0, Math.min(255, isNaN(val) ? 0 : val));
    const nextRgb = { ...currentRgb, [channel]: safe };
    const toHex = (n: number) => n.toString(16).padStart(2, "0");
    const newHex = `#${toHex(nextRgb.r)}${toHex(nextRgb.g)}${toHex(nextRgb.b)}`.toUpperCase();
    const parsed = hexToHsv(newHex);
    if (parsed) {
      hsv = parsed;
      emitColor(newHex);
    }
  }

  async function useEyeDropper() {
    if (typeof window !== "undefined" && "EyeDropper" in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          const hex = result.sRGBHex.toUpperCase();
          const parsed = hexToHsv(hex);
          if (parsed) {
            hsv = parsed;
            emitColor(hex);
          }
        }
      } catch (e) {
        // User canceled eye dropper selection, ignore
      }
    }
  }

  function copyToClipboard() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(activeColor);
      copied = true;
      setTimeout(() => (copied = false), 1500);
    }
  }

  function toggleOpen() {
    if (disabled) return;
    isOpen = !isOpen;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape" && isOpen) {
      e.preventDefault();
      isOpen = false;
      triggerRef?.focus();
    }
  }

  onMount(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef && !containerRef.contains(e.target as Node)) {
        isOpen = false;
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="flux-color-picker" {id} bind:this={containerRef}>
  <!-- Flux UI Trigger Button -->
  <button
    type="button"
    bind:this={triggerRef}
    class="flux-color-trigger {isOpen ? 'open' : ''} {disabled ? 'disabled' : ''}"
    onclick={toggleOpen}
    aria-haspopup="dialog"
    aria-expanded={isOpen}
    aria-label="Pick color, current value {activeColor}"
    {disabled}
  >
    <span
      class="trigger-swatch-box"
      style:background-color={activeColor}
      style:box-shadow="0 0 10px {activeColor}66"
    ></span>
    <span class="trigger-color-value">{activeColor}</span>
    <svg
      class="trigger-chevron {isOpen ? 'rotated' : ''}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  </button>

  <!-- Flux UI Popover Canvas -->
  {#if isOpen}
    <div
      class="flux-color-popover"
      role="dialog"
      aria-modal="true"
      aria-label="Flux Color Picker"
    >
      <!-- flux:color-picker.area (Saturation / Value Canvas) -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="flux-sv-area"
        bind:this={satValAreaRef}
        style:background-color="hsl({hsv.h}, 100%, 50%)"
        onmousedown={startSatValDrag}
        ontouchstart={startSatValDrag}
      >
        <div class="sv-gradient-white"></div>
        <div class="sv-gradient-black"></div>
        <div
          class="sv-handle"
          style:left="{hsv.s}%"
          style:top="{100 - hsv.v}%"
          style:background-color={activeColor}
          aria-hidden="true"
        ></div>
      </div>

      <!-- Hue Slider & Dropper Row -->
      <div class="flux-slider-row">
        <!-- Eyedropper Button (if supported) -->
        {#if dropper}
          <button
            type="button"
            class="flux-dropper-btn"
            onclick={useEyeDropper}
            title="Pick color from screen"
            aria-label="Pick color from screen"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="dropper-icon">
              <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
              <path d="M2 2l7.586 7.586"></path>
              <circle cx="11" cy="11" r="2"></circle>
            </svg>
          </button>
        {/if}

        <!-- Hue Spectrum Slider -->
        <div class="flux-hue-slider-wrap">
          <input
            type="range"
            min="0"
            max="360"
            value={hsv.h}
            class="flux-hue-slider"
            oninput={handleHueChange}
            aria-label="Hue spectrum"
          />
        </div>

        <!-- Copy Value Button -->
        {#if copyable}
          <button
            type="button"
            class="flux-copy-btn {copied ? 'copied' : ''}"
            onclick={copyToClipboard}
            title={copied ? "Copied!" : "Copy color hex"}
            aria-label={copied ? "Color copied" : "Copy color hex"}
          >
            {#if copied}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="icon-tiny">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            {:else}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-tiny">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            {/if}
          </button>
        {/if}
      </div>

      <!-- Format Inputs Row -->
      <div class="flux-inputs-row">
        <!-- Format Selector Toggle Button -->
        <button
          type="button"
          class="format-toggle-btn"
          onclick={() => {
            if (currentFormat === "hex") currentFormat = "rgb";
            else if (currentFormat === "rgb") currentFormat = "hsl";
            else currentFormat = "hex";
          }}
          title="Switch color format (HEX / RGB / HSL)"
        >
          {currentFormat.toUpperCase()}
        </button>

        {#if currentFormat === "hex"}
          <div class="input-hex-wrap">
            <span class="hash-tag">#</span>
            <input
              type="text"
              class="flux-hex-input"
              value={hexInput.replace("#", "")}
              maxlength="6"
              spellcheck="false"
              oninput={handleHexInput}
              aria-label="Hex color value"
            />
          </div>
        {:else if currentFormat === "rgb"}
          <div class="input-rgb-row">
            <div class="channel-col">
              <input
                type="number"
                min="0"
                max="255"
                value={currentRgb.r}
                oninput={(e) => handleRgbInput("r", +(e.target as HTMLInputElement).value)}
                aria-label="Red"
              />
              <span class="channel-lbl">R</span>
            </div>
            <div class="channel-col">
              <input
                type="number"
                min="0"
                max="255"
                value={currentRgb.g}
                oninput={(e) => handleRgbInput("g", +(e.target as HTMLInputElement).value)}
                aria-label="Green"
              />
              <span class="channel-lbl">G</span>
            </div>
            <div class="channel-col">
              <input
                type="number"
                min="0"
                max="255"
                value={currentRgb.b}
                oninput={(e) => handleRgbInput("b", +(e.target as HTMLInputElement).value)}
                aria-label="Blue"
              />
              <span class="channel-lbl">B</span>
            </div>
          </div>
        {:else}
          <div class="input-rgb-row">
            <div class="channel-col">
              <span class="hsl-val">{currentHsl.h}°</span>
              <span class="channel-lbl">H</span>
            </div>
            <div class="channel-col">
              <span class="hsl-val">{currentHsl.s}%</span>
              <span class="channel-lbl">S</span>
            </div>
            <div class="channel-col">
              <span class="hsl-val">{currentHsl.l}%</span>
              <span class="channel-lbl">L</span>
            </div>
          </div>
        {/if}
      </div>

      <!-- flux:color-picker.swatches (Preset Swatches) -->
      {#if presets && presets.length > 0}
        <div class="flux-swatches-grid" role="group" aria-label="Color swatches">
          {#each presets as swatch}
            {@const isSelected = activeColor.toUpperCase() === swatch.toUpperCase()}
            <button
              type="button"
              class="swatch-btn {isSelected ? 'selected' : ''}"
              style:background-color={swatch}
              onclick={() => {
                const parsed = hexToHsv(swatch);
                if (parsed) {
                  hsv = parsed;
                  emitColor(swatch);
                }
              }}
              title="Select {swatch}"
              aria-label="Color preset {swatch}"
            ></button>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .flux-color-picker {
    position: relative;
    display: inline-block;
    user-select: none;
    font-family: inherit;
  }

  /* Flux UI Trigger */
  .flux-color-trigger {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    padding: 6px 12px;
    background: var(--surface-elevated, rgba(255, 255, 255, 0.05));
    border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
    border-radius: 9px;
    cursor: pointer;
    backdrop-filter: blur(12px);
    transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .flux-color-trigger:hover:not(.disabled) {
    background: var(--surface-hover, rgba(255, 255, 255, 0.09));
    border-color: var(--border-strong, rgba(255, 255, 255, 0.22));
  }

  .flux-color-trigger.open {
    border-color: var(--accent, #6366f1);
    box-shadow: 0 0 0 2px var(--glow-surface, rgba(99, 102, 241, 0.22));
  }

  .flux-color-trigger:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--bg, #0c0e14), 0 0 0 4px var(--accent, #6366f1);
  }

  .flux-color-trigger.disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .trigger-swatch-box {
    width: 16px;
    height: 16px;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.35);
    flex-shrink: 0;
  }

  .trigger-color-value {
    font-size: 12px;
    font-weight: 600;
    font-family: monospace;
    color: var(--text-primary, #f8fafc);
    letter-spacing: 0.03em;
  }

  .trigger-chevron {
    width: 14px;
    height: 14px;
    color: var(--text-muted, #94a3b8);
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .trigger-chevron.rotated {
    transform: rotate(180deg);
  }

  /* Flux UI Popover */
  .flux-color-popover {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    z-index: 1050;
    width: 260px;
    padding: 12px;
    background: var(--surface-elevated, rgba(19, 23, 34, 0.96));
    border: 1px solid var(--border-strong, rgba(255, 255, 255, 0.18));
    border-radius: 14px;
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.42),
                0 0 0 1px var(--border, rgba(255, 255, 255, 0.08));
    backdrop-filter: blur(20px);
    display: flex;
    flex-direction: column;
    gap: 10px;
    box-sizing: border-box;
    animation: flux-popover-enter 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes flux-popover-enter {
    from {
      opacity: 0;
      transform: translateY(-6px) scale(0.97);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  /* Saturation / Value Area */
  .flux-sv-area {
    position: relative;
    width: 100%;
    height: 140px;
    border-radius: 9px;
    overflow: hidden;
    cursor: crosshair;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .sv-gradient-white {
    position: absolute;
    inset: 0;
    background: linear-gradient(to right, #ffffff, transparent);
  }

  .sv-gradient-black {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, #000000, transparent);
  }

  .sv-handle {
    position: absolute;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid #ffffff;
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.7);
    transform: translate(-50%, -50%);
    pointer-events: none;
  }

  /* Slider Row */
  .flux-slider-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .flux-dropper-btn,
  .flux-copy-btn,
  .format-toggle-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface, rgba(255, 255, 255, 0.06));
    border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
    border-radius: 7px;
    color: var(--text-muted, #94a3b8);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .flux-dropper-btn,
  .flux-copy-btn {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
  }

  .flux-dropper-btn:hover,
  .flux-copy-btn:hover,
  .format-toggle-btn:hover {
    background: var(--surface-hover, rgba(255, 255, 255, 0.1));
    color: var(--text-primary, #f8fafc);
    border-color: var(--border-strong, rgba(255, 255, 255, 0.22));
  }

  .flux-copy-btn.copied {
    color: var(--success, #10b981);
    border-color: var(--success, #10b981);
  }

  .dropper-icon,
  .icon-tiny {
    width: 13px;
    height: 13px;
  }

  .flux-hue-slider-wrap {
    flex: 1;
    display: flex;
    align-items: center;
  }

  .flux-hue-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 12px;
    border-radius: 6px;
    background: linear-gradient(
      to right,
      #ff0000 0%,
      #ffff00 17%,
      #00ff00 33%,
      #00ffff 50%,
      #0000ff 67%,
      #ff00ff 83%,
      #ff0000 100%
    );
    outline: none;
    cursor: pointer;
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  .flux-hue-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 0 3px rgba(0, 0, 0, 0.6);
    border: 1px solid rgba(0, 0, 0, 0.2);
    cursor: pointer;
  }

  /* Inputs Row */
  .flux-inputs-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .format-toggle-btn {
    padding: 0 8px;
    height: 28px;
    font-size: 10px;
    font-weight: 700;
    flex-shrink: 0;
  }

  .input-hex-wrap {
    display: flex;
    align-items: center;
    background: var(--surface, rgba(255, 255, 255, 0.06));
    border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
    border-radius: 7px;
    padding: 0 8px;
    height: 28px;
    flex: 1;
  }

  .hash-tag {
    font-size: 11px;
    font-weight: 700;
    color: var(--text-muted, #94a3b8);
    margin-right: 4px;
  }

  .flux-hex-input {
    background: transparent;
    border: none;
    outline: none;
    color: var(--text-primary, #f8fafc);
    font-size: 12px;
    font-family: monospace;
    font-weight: 600;
    width: 100%;
  }

  .input-rgb-row {
    display: flex;
    align-items: center;
    gap: 5px;
    flex: 1;
  }

  .channel-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    background: var(--surface, rgba(255, 255, 255, 0.06));
    border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
    border-radius: 6px;
    padding: 2px 0;
  }

  .channel-col input {
    background: transparent;
    border: none;
    outline: none;
    color: var(--text-primary, #f8fafc);
    font-size: 11px;
    font-family: monospace;
    text-align: center;
    width: 100%;
    padding: 0;
  }

  .channel-lbl {
    font-size: 8px;
    font-weight: 700;
    color: var(--text-muted, #94a3b8);
    line-height: 1;
  }

  .hsl-val {
    font-size: 10px;
    font-family: monospace;
    color: var(--text-primary, #f8fafc);
    padding: 1px 0;
  }

  /* Preset Swatches Grid */
  .flux-swatches-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 6px;
    padding-top: 8px;
    border-top: 1px solid var(--border, rgba(255, 255, 255, 0.08));
  }

  .swatch-btn {
    aspect-ratio: 1;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    cursor: pointer;
    transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .swatch-btn:hover {
    transform: scale(1.15);
    border-color: #ffffff;
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.35);
  }

  .swatch-btn.selected {
    border-color: #ffffff;
    box-shadow: 0 0 0 2px var(--bg, #0c0e14), 0 0 0 3px #ffffff;
    transform: scale(1.08);
  }

  @media (prefers-reduced-motion: reduce) {
    .flux-color-popover,
    .trigger-chevron,
    .swatch-btn {
      transition: none !important;
      animation: none !important;
      transform: none !important;
    }
  }
</style>
