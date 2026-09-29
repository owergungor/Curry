<script lang="ts">
  import { onMount } from "svelte";

  let {
    value = $bindable("#6366f1"),
    color = undefined,
    presets = [
      "#6366f1",
      "#38bdf8",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#ec4899",
      "#8b5cf6",
      "#06b6d4",
    ],
    id = "color-picker",
    onchange = undefined,
    onChange = undefined,
  }: {
    value?: string;
    color?: string;
    presets?: string[];
    id?: string;
    onchange?: (val: string) => void;
    onChange?: (val: string) => void;
  } = $props();

  let isOpen = $state(false);
  let containerRef: HTMLDivElement | null = $state(null);
  let triggerRef: HTMLButtonElement | null = $state(null);
  let mode = $state<"hex" | "rgb">("hex");
  let copied = $state(false);
  let activeColor = $derived(color ?? value);
  let hexInput = $state(value.toUpperCase());

  // Keep hexInput in sync if value updates externally
  $effect(() => {
    hexInput = (color ?? value).toUpperCase();
  });

  // Convert HEX to RGB
  function hexToRgb(hex: string): { r: number; g: number; b: number } {
    let cleanHex = hex.replace("#", "");
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split("").map((c) => c + c).join("");
    }
    const num = parseInt(cleanHex, 16);
    if (isNaN(num)) return { r: 99, g: 102, b: 241 };
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  }

  // Convert RGB to HEX
  function rgbToHex(r: number, g: number, b: number): string {
    const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
    const toHex = (v: number) => clamp(v).toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }

  let rgb = $derived(hexToRgb(activeColor));

  function updateColor(newHex: string) {
    let normalized = newHex.trim();
    if (!normalized.startsWith("#")) {
      normalized = "#" + normalized;
    }
    if (/^#[0-9A-Fa-f]{6}$/.test(normalized)) {
      value = normalized.toUpperCase();
      hexInput = value;
      onchange?.(value);
      onChange?.(value);
    }
  }

  function handleHexInput(e: Event) {
    const target = e.target as HTMLInputElement;
    hexInput = target.value.toUpperCase();
    if (/^#?[0-9A-Fa-f]{6}$/.test(hexInput)) {
      updateColor(hexInput);
    }
  }

  function handleRgbChange(channel: "r" | "g" | "b", val: number) {
    const current = { ...rgb, [channel]: val };
    const newHex = rgbToHex(current.r, current.g, current.b);
    updateColor(newHex);
  }

  function copyToClipboard() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(value);
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 1500);
    }
  }

  function toggleOpen() {
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

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="cromia-picker-root" {id} bind:this={containerRef} onkeydown={handleKeydown}>
  <!-- Compact Trigger Pill -->
  <button
    type="button"
    bind:this={triggerRef}
    class="cromia-trigger-btn {isOpen ? 'open' : ''}"
    onclick={toggleOpen}
    aria-haspopup="dialog"
    aria-expanded={isOpen}
    aria-label="Select glow color ({activeColor})"
  >
    <span
      class="trigger-swatch-dot"
      style:background-color={activeColor}
      style:box-shadow="0 0 10px {activeColor}88"
    ></span>
    <span class="trigger-hex-code">{activeColor}</span>
    <svg
      class="trigger-chevron {isOpen ? 'rotated' : ''}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  </button>

  <!-- 21st.dev Cromia Floating Glass Popover -->
  {#if isOpen}
    <div
      class="cromia-popover"
      role="dialog"
      aria-modal="true"
      aria-label="Cromia Color Picker"
    >
      <div class="color-main-row">
        <!-- Visual Swatch with Hidden Native Picker Canvas -->
        <div class="swatch-wrap">
          <label
            class="color-swatch-box"
            style:background-color={activeColor}
            style:box-shadow="0 0 20px {activeColor}66, inset 0 0 0 1px rgba(255,255,255,0.25)"
            title="Click to open visual color palette"
          >
            <input
              type="color"
              class="hidden-native-picker"
              value={activeColor}
              oninput={(e) => {
                const target = e.target as HTMLInputElement;
                updateColor(target.value);
              }}
              aria-label="Pick color visually"
            />
            <span class="swatch-hover-hint">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="pipette-icon">
                <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                <path d="M2 2l7.586 7.586"></path>
                <circle cx="11" cy="11" r="2"></circle>
              </svg>
            </span>
          </label>
        </div>

        <!-- Controls: HEX / RGB Inputs -->
        <div class="color-controls">
          {#if mode === "hex"}
            <div class="hex-input-wrap">
              <span class="hash-symbol" aria-hidden="true">#</span>
              <input
                type="text"
                class="hex-text-input"
                value={hexInput.replace("#", "")}
                oninput={(e) => {
                  const target = e.target as HTMLInputElement;
                  handleHexInput({ target: { value: "#" + target.value } } as any);
                }}
                maxlength={6}
                spellcheck="false"
                aria-label="Hex color value"
              />
            </div>
          {:else}
            <div class="rgb-inputs-wrap">
              <label class="rgb-input-field">
                <span>R</span>
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={rgb.r}
                  oninput={(e) => handleRgbChange("r", +(e.target as HTMLInputElement).value)}
                />
              </label>
              <label class="rgb-input-field">
                <span>G</span>
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={rgb.g}
                  oninput={(e) => handleRgbChange("g", +(e.target as HTMLInputElement).value)}
                />
              </label>
              <label class="rgb-input-field">
                <span>B</span>
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={rgb.b}
                  oninput={(e) => handleRgbChange("b", +(e.target as HTMLInputElement).value)}
                />
              </label>
            </div>
          {/if}

          <!-- Format Switch & Copy Buttons -->
          <div class="action-buttons">
            <button
              type="button"
              class="picker-btn mode-switch-btn"
              onclick={() => (mode = mode === "hex" ? "rgb" : "hex")}
              title="Toggle HEX/RGB format"
              aria-label="Toggle HEX/RGB format"
            >
              {mode === "hex" ? "RGB" : "HEX"}
            </button>

            <button
              type="button"
              class="picker-btn copy-btn {copied ? 'copied' : ''}"
              onclick={copyToClipboard}
              title={copied ? "Copied!" : "Copy color code"}
              aria-label={copied ? "Color code copied" : "Copy color code"}
            >
              {#if copied}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="btn-icon check">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              {:else}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              {/if}
            </button>
          </div>
        </div>
      </div>

      <!-- Presets Row -->
      {#if presets && presets.length > 0}
        <div class="swatches-strip" role="group" aria-label="Color presets">
          {#each presets as preset}
            <button
              type="button"
              class="preset-bubble {activeColor.toUpperCase() === preset.toUpperCase() ? 'active' : ''}"
              style:background-color={preset}
              onclick={() => updateColor(preset)}
              title="Select {preset}"
              aria-label="Preset color {preset}"
            ></button>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .cromia-picker-root {
    position: relative;
    display: inline-block;
    user-select: none;
  }

  .cromia-trigger-btn {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    padding: 6px 12px;
    background: var(--surface-elevated, rgba(255, 255, 255, 0.05));
    border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
    border-radius: 9px;
    cursor: pointer;
    backdrop-filter: blur(8px);
    transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .cromia-trigger-btn:hover {
    background: var(--surface-hover, rgba(255, 255, 255, 0.09));
    border-color: var(--border-strong, rgba(255, 255, 255, 0.22));
  }

  .cromia-trigger-btn.open {
    border-color: var(--accent, #6366f1);
    box-shadow: 0 0 0 2px var(--glow-surface, rgba(99, 102, 241, 0.2));
  }

  .cromia-trigger-btn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--accent, #6366f1);
  }

  .trigger-swatch-dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    flex-shrink: 0;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .trigger-hex-code {
    font-size: 12px;
    font-weight: 600;
    font-family: monospace;
    color: var(--text-primary, #f8fafc);
    letter-spacing: 0.02em;
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

  /* Floating Glassmorphic Popover */
  .cromia-popover {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    z-index: 1050;
    width: 320px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px;
    background: var(--surface-elevated, rgba(30, 41, 59, 0.95));
    border: 1px solid var(--border-strong, rgba(255, 255, 255, 0.18));
    border-radius: 14px;
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.4),
                0 0 0 1px var(--border, rgba(255, 255, 255, 0.08));
    backdrop-filter: blur(20px);
    box-sizing: border-box;
    animation: popover-enter 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes popover-enter {
    from {
      opacity: 0;
      transform: translateY(-6px) scale(0.97);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .color-main-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .swatch-wrap {
    flex-shrink: 0;
  }

  .color-swatch-box {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border-radius: 10px;
    cursor: pointer;
    overflow: hidden;
    transition: transform 0.15s ease;
  }

  .color-swatch-box:hover {
    transform: scale(1.05);
  }

  .hidden-native-picker {
    position: absolute;
    inset: -10px;
    width: 70px;
    height: 70px;
    opacity: 0;
    cursor: pointer;
  }

  .swatch-hover-hint {
    opacity: 0;
    transition: opacity 0.15s ease;
    color: white;
    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.6));
    pointer-events: none;
  }

  .color-swatch-box:hover .swatch-hover-hint {
    opacity: 1;
  }

  .pipette-icon {
    width: 16px;
    height: 16px;
  }

  .color-controls {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
  }

  .hex-input-wrap {
    display: flex;
    align-items: center;
    background: var(--surface, rgba(255, 255, 255, 0.06));
    border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
    border-radius: 8px;
    padding: 0 8px;
    height: 34px;
    flex: 1;
  }

  .hash-symbol {
    color: var(--text-muted, #94a3b8);
    font-size: 13px;
    font-weight: 600;
    margin-right: 3px;
  }

  .hex-text-input {
    background: transparent;
    border: none;
    outline: none;
    color: var(--text-primary, #f8fafc);
    font-size: 13px;
    font-weight: 600;
    font-family: monospace;
    width: 100%;
  }

  .rgb-inputs-wrap {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: 1;
  }

  .rgb-input-field {
    display: flex;
    align-items: center;
    background: var(--surface, rgba(255, 255, 255, 0.06));
    border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
    border-radius: 6px;
    padding: 0 4px;
    height: 34px;
    flex: 1;
  }

  .rgb-input-field span {
    font-size: 10px;
    font-weight: 700;
    color: var(--text-muted, #94a3b8);
    margin-right: 2px;
  }

  .rgb-input-field input {
    width: 100%;
    background: transparent;
    border: none;
    outline: none;
    color: var(--text-primary, #f8fafc);
    font-size: 11px;
    font-family: monospace;
    text-align: center;
    padding: 0;
    appearance: textfield;
    -moz-appearance: textfield;
  }

  .rgb-input-field input::-webkit-inner-spin-button,
  .rgb-input-field input::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .action-buttons {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .picker-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 34px;
    padding: 0 9px;
    background: var(--surface, rgba(255, 255, 255, 0.06));
    border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
    border-radius: 8px;
    color: var(--text-muted, #94a3b8);
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .picker-btn:hover {
    background: var(--surface-hover, rgba(255, 255, 255, 0.1));
    color: var(--text-primary, #f8fafc);
    border-color: var(--border-strong, rgba(255, 255, 255, 0.2));
  }

  .copy-btn {
    width: 34px;
    padding: 0;
  }

  .copy-btn.copied {
    color: var(--success, #10b981);
    border-color: var(--success, #10b981);
  }

  .btn-icon {
    width: 14px;
    height: 14px;
  }

  .swatches-strip {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    padding-top: 4px;
    border-top: 1px solid var(--border, rgba(255, 255, 255, 0.08));
  }

  .preset-bubble {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    transition: transform 0.15s ease, border-color 0.15s ease;
  }

  .preset-bubble:hover {
    transform: scale(1.18);
  }

  .preset-bubble.active {
    border-color: #ffffff;
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.4);
    transform: scale(1.12);
  }

  @media (prefers-reduced-motion: reduce) {
    .cromia-popover,
    .trigger-chevron,
    .preset-bubble,
    .color-swatch-box {
      transition: none !important;
      animation: none !important;
      transform: none !important;
    }
  }
</style>
