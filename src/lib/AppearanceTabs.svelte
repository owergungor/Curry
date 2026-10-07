<script lang="ts">
  export type Appearance = "system" | "light" | "dark";

  let {
    value = $bindable<Appearance>("system"),
    selected = undefined,
    onchange = undefined,
    onChange = undefined,
  }: {
    value?: Appearance;
    selected?: Appearance;
    onchange?: (val: Appearance) => void;
    onChange?: (val: Appearance) => void;
  } = $props();

  let activeValue = $derived(selected ?? value);

  const options: { id: Appearance; label: string; icon: "monitor" | "sun" | "moon" }[] = [
    { id: "system", label: "System", icon: "monitor" },
    { id: "light", label: "Light", icon: "sun" },
    { id: "dark", label: "Dark", icon: "moon" },
  ];

  let activeIndex = $derived(options.findIndex((o) => o.id === activeValue));

  function selectTab(id: Appearance) {
    if (activeValue === id) return;
    value = id;
    onchange?.(id);
    onChange?.(id);
  }

  function handleKeyDown(event: KeyboardEvent, currentIndex: number) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      const nextIndex = (currentIndex + 1) % options.length;
      selectTab(options[nextIndex].id);
      document.getElementById(`appearance-tab-${options[nextIndex].id}`)?.focus();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      const prevIndex = (currentIndex - 1 + options.length) % options.length;
      selectTab(options[prevIndex].id);
      document.getElementById(`appearance-tab-${options[prevIndex].id}`)?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      selectTab(options[0].id);
      document.getElementById(`appearance-tab-${options[0].id}`)?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      selectTab(options[options.length - 1].id);
      document.getElementById(`appearance-tab-${options[options.length - 1].id}`)?.focus();
    }
  }
</script>

<div class="appearance-tabs-wrap" role="tablist" aria-label="Appearance Mode">
  <!-- Apple Segmented Control Animated Active Pill -->
  <div
    class="animated-indicator"
    style:transform="translateX({(activeIndex >= 0 ? activeIndex : 0) * 100}%)"
    aria-hidden="true"
  ></div>

  {#each options as opt, idx}
    <button
      type="button"
      id="appearance-tab-{opt.id}"
      class="appearance-tab {activeValue === opt.id ? 'active' : ''}"
      role="tab"
      aria-selected={activeValue === opt.id}
      tabindex={activeValue === opt.id ? 0 : -1}
      onclick={() => selectTab(opt.id)}
      onkeydown={(e) => handleKeyDown(e, idx)}
    >
      {#if opt.icon === "monitor"}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tab-icon">
          <rect x="2" y="3" width="20" height="14" rx="2"></rect>
          <line x1="8" y1="21" x2="16" y2="21"></line>
          <line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>
      {:else if opt.icon === "sun"}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tab-icon sun-icon">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      {:else if opt.icon === "moon"}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tab-icon moon-icon">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      {/if}
      <span class="tab-label">{opt.label}</span>
    </button>
  {/each}
</div>

<style>
  .appearance-tabs-wrap {
    position: relative;
    display: inline-grid;
    grid-template-columns: repeat(3, 1fr);
    align-items: center;
    background: var(--surface-elevated, rgba(255, 255, 255, 0.05));
    border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
    border-radius: 10px;
    padding: 3px;
    user-select: none;
    box-sizing: border-box;
    backdrop-filter: blur(12px);
    height: 36px;
  }

  .animated-indicator {
    position: absolute;
    top: 3px;
    bottom: 3px;
    left: 3px;
    width: calc((100% - 6px) / 3);
    background: var(--surface, rgba(255, 255, 255, 0.12));
    border: 1px solid var(--border-strong, rgba(255, 255, 255, 0.16));
    border-radius: 7px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(0, 0, 0, 0.12);
    pointer-events: none;
    transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 1;
  }

  .appearance-tab {
    position: relative;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 0 14px;
    height: 28px;
    min-width: 78px;
    white-space: nowrap;
    border-radius: 7px;
    background: transparent;
    border: none;
    color: var(--text-muted, #94a3b8);
    font-size: 12.5px;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    transition: color 0.15s ease, transform 0.12s ease;
  }

  .appearance-tab:hover:not(.active) {
    color: var(--text-primary, #f8fafc);
  }

  .appearance-tab:active {
    transform: scale(0.97);
  }

  .appearance-tab.active {
    color: var(--text-primary, #f8fafc);
    font-weight: 600;
  }

  .appearance-tab:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--bg, #0c0e14), 0 0 0 4px var(--accent, #6366f1);
  }

  .tab-icon {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), color 0.2s ease;
  }

  .appearance-tab.active .sun-icon {
    transform: rotate(15deg);
    color: #f59e0b;
  }

  .appearance-tab.active .moon-icon {
    transform: rotate(-8deg);
    color: var(--accent, #818cf8);
  }

  .tab-label {
    line-height: 1;
    letter-spacing: -0.01em;
  }

  @media (max-width: 600px) {
    .appearance-tab {
      padding: 0 8px;
      font-size: 11.5px;
      gap: 4px;
      min-width: 62px;
    }
  }

  @media (max-width: 480px) {
    .appearance-tab {
      padding: 0 6px;
      font-size: 11px;
      gap: 3px;
      min-width: 50px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .animated-indicator,
    .tab-icon,
    .appearance-tab {
      transition: none !important;
      transform: none !important;
    }
  }
</style>
