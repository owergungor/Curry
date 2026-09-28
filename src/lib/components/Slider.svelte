<script lang="ts">
  let {
    value = $bindable(0),
    min = 0,
    max = 100,
    step = 1,
    label = undefined,
    unit = "",
    disabled = false,
    id = undefined,
    className = "",
    onchange = undefined,
  }: {
    value: number;
    min?: number;
    max?: number;
    step?: number;
    label?: string;
    unit?: string;
    disabled?: boolean;
    id?: string;
    className?: string;
    onchange?: (val: number) => void;
  } = $props();

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    const val = parseFloat(target.value);
    value = val;
    if (onchange) {
      onchange(val);
    }
  }

  let percentage = $derived(
    max > min ? Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100)) : 0
  );
</script>

<div class="curry-slider-group {className} {disabled ? 'disabled' : ''}">
  {#if label}
    <div class="slider-header">
      <label for={id} class="slider-label">{label}</label>
      <span class="slider-badge" aria-hidden="true">{value}{unit}</span>
    </div>
  {/if}
  <div class="slider-track-wrap">
    <div
      class="slider-fill"
      style:width="{percentage}%"
      aria-hidden="true"
    ></div>
    <input
      type="range"
      {id}
      {min}
      {max}
      {step}
      {disabled}
      value={value}
      oninput={handleInput}
      class="curry-native-slider"
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-label={label}
    />
  </div>
</div>

<style>
  .curry-slider-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  .curry-slider-group.disabled {
    opacity: 0.45;
    pointer-events: none;
  }

  .slider-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.82rem;
  }

  .slider-label {
    color: var(--text-secondary, #94a3b8);
    font-weight: 500;
  }

  .slider-badge {
    background: var(--surface-elevated, rgba(255, 255, 255, 0.08));
    border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
    padding: 2px 7px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    color: var(--accent, #6366f1);
    font-weight: 600;
  }

  .slider-track-wrap {
    position: relative;
    display: flex;
    align-items: center;
    height: 20px;
  }

  .slider-fill {
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    height: 4px;
    background: linear-gradient(90deg, var(--accent, #6366f1), #818cf8);
    border-radius: 4px;
    pointer-events: none;
    z-index: 1;
  }

  .curry-native-slider {
    position: relative;
    width: 100%;
    height: 4px;
    background: var(--surface-elevated, rgba(255, 255, 255, 0.1));
    border-radius: 4px;
    outline: none;
    cursor: pointer;
    -webkit-appearance: none;
    appearance: none;
    margin: 0;
    z-index: 2;
  }

  .curry-native-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #ffffff;
    border: 2px solid var(--accent, #6366f1);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
    cursor: pointer;
    transition: transform 0.12s ease, box-shadow 0.12s ease;
  }

  .curry-native-slider::-webkit-slider-thumb:hover {
    transform: scale(1.15);
    box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
  }

  .curry-native-slider:focus-visible::-webkit-slider-thumb {
    outline: 2px solid #ffffff;
    outline-offset: 2px;
    box-shadow: 0 0 12px var(--accent, #6366f1);
  }

  .curry-native-slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #ffffff;
    border: 2px solid var(--accent, #6366f1);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
    cursor: pointer;
    transition: transform 0.12s ease, box-shadow 0.12s ease;
  }

  @media (prefers-reduced-motion: reduce) {
    .curry-native-slider::-webkit-slider-thumb,
    .curry-native-slider::-moz-range-thumb {
      transition: none !important;
    }
  }
</style>
