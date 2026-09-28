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
    }
  }
</script>

<div class="appearance-tabs-wrap" role="tablist" aria-label="Appearance Mode">
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
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tab-icon">
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
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tab-icon">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      {/if}
      <span class="tab-label">{opt.label}</span>
    </button>
  {/each}
</div>

<style>
  .appearance-tabs-wrap {
    display: inline-flex;
    align-items: center;
    background: var(--surface, rgba(255, 255, 255, 0.04));
    border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
    border-radius: 12px;
    padding: 3px;
    gap: 2px;
    user-select: none;
    box-sizing: border-box;
  }

  .appearance-tab {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 7px 16px;
    border-radius: 9px;
    background: transparent;
    border: none;
    color: var(--text-muted, #94a3b8);
    font-size: 13px;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .appearance-tab:hover:not(.active) {
    color: var(--text, #f8fafc);
    background: rgba(255, 255, 255, 0.04);
  }

  .appearance-tab.active {
    background: var(--surface-elevated, rgba(255, 255, 255, 0.12));
    color: var(--text, #f8fafc);
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1);
  }

  .appearance-tab:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--accent, #6366f1);
  }

  .tab-icon {
    width: 15px;
    height: 15px;
    flex-shrink: 0;
  }

  .tab-label {
    line-height: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    .appearance-tab {
      transition: none !important;
    }
  }
</style>
