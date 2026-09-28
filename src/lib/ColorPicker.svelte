<script lang="ts">
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
</script>

<div class="cromia-color-picker" {id}>
  <div class="color-main-row">
    <!-- Visual Preview Swatch with Aura -->
    <div class="swatch-wrap">
      <div
        class="color-swatch"
        style:background-color={activeColor}
        style:box-shadow="0 0 16px {activeColor}55"
      >
        <input
          type="color"
          class="hidden-native-picker"
          value={activeColor}
          oninput={(e) => {
            const target = e.target as HTMLInputElement;
            updateColor(target.value);
          }}
          aria-label="Choose color visually"
        />
      </div>
    </div>

    <!-- Inputs & Mode Toggle -->
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

      <!-- Actions: Switch mode & Copy -->
      <div class="action-buttons">
        <button
          type="button"
          class="picker-btn mode-switch-btn"
          onclick={() => (mode = mode === "hex" ? "rgb" : "hex")}
          title="Toggle HEX/RGB input format"
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

  <!-- Presets row -->
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

<style>
  .cromia-color-picker {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
    background: var(--surface, rgba(255, 255, 255, 0.04));
    border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
    border-radius: 14px;
    box-sizing: border-box;
    width: 100%;
    max-width: 380px;
  }

  .color-main-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .swatch-wrap {
    flex-shrink: 0;
  }

  .color-swatch {
    position: relative;
    width: 38px;
    height: 38px;
    border-radius: 10px;
    border: 2px solid rgba(255, 255, 255, 0.25);
    cursor: pointer;
    overflow: hidden;
    transition: transform 0.15s ease, box-shadow 0.2s ease;
  }

  .color-swatch:hover {
    transform: scale(1.05);
  }

  .hidden-native-picker {
    position: absolute;
    inset: -10px;
    width: 60px;
    height: 60px;
    opacity: 0;
    cursor: pointer;
  }

  .color-controls {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
  }

  .hex-input-wrap {
    display: flex;
    align-items: center;
    background: var(--surface-elevated, rgba(255, 255, 255, 0.08));
    border: 1px solid var(--border, rgba(255, 255, 255, 0.15));
    border-radius: 8px;
    padding: 0 10px;
    height: 34px;
    flex: 1;
  }

  .hash-symbol {
    color: var(--text-muted, #94a3b8);
    font-size: 13px;
    font-weight: 600;
    margin-right: 4px;
  }

  .hex-text-input {
    background: transparent;
    border: none;
    color: var(--text, #f8fafc);
    font-size: 13.5px;
    font-weight: 600;
    font-family: monospace;
    width: 100%;
    outline: none;
    letter-spacing: 0.5px;
  }

  .rgb-inputs-wrap {
    display: flex;
    gap: 6px;
    flex: 1;
  }

  .rgb-input-field {
    display: flex;
    align-items: center;
    background: var(--surface-elevated, rgba(255, 255, 255, 0.08));
    border: 1px solid var(--border, rgba(255, 255, 255, 0.15));
    border-radius: 8px;
    padding: 0 6px;
    height: 34px;
    flex: 1;
  }

  .rgb-input-field span {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted, #94a3b8);
    margin-right: 4px;
  }

  .rgb-input-field input {
    width: 100%;
    background: transparent;
    border: none;
    color: var(--text, #f8fafc);
    font-size: 12px;
    font-weight: 600;
    outline: none;
    appearance: textfield;
    -moz-appearance: textfield;
  }

  .rgb-input-field input::-webkit-outer-spin-button,
  .rgb-input-field input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .action-buttons {
    display: flex;
    gap: 4px;
  }

  .picker-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 34px;
    padding: 0 10px;
    background: var(--surface-elevated, rgba(255, 255, 255, 0.08));
    border: 1px solid var(--border, rgba(255, 255, 255, 0.15));
    border-radius: 8px;
    color: var(--text, #f8fafc);
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .picker-btn:hover {
    background: rgba(255, 255, 255, 0.14);
    border-color: var(--accent, #6366f1);
  }

  .btn-icon {
    width: 14px;
    height: 14px;
  }

  .btn-icon.check {
    color: var(--success, #10b981);
  }

  .swatches-strip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding-top: 4px;
    border-top: 1px solid var(--border, rgba(255, 255, 255, 0.08));
    overflow-x: auto;
  }

  .preset-bubble {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    cursor: pointer;
    padding: 0;
    flex-shrink: 0;
    transition: transform 0.12s ease, box-shadow 0.12s ease;
  }

  .preset-bubble:hover {
    transform: scale(1.15);
  }

  .preset-bubble.active {
    box-shadow: 0 0 0 2px var(--surface, #121826), 0 0 0 4px var(--accent, #6366f1);
  }
</style>
