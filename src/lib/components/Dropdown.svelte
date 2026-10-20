<script lang="ts">
  export interface DropdownItem {
    value: string;
    label: string;
    description?: string;
  }

  let {
    items = [],
    value = $bindable(""),
    disabled = false,
    id = "",
    ariaLabel = "Select option",
    onchange = undefined,
    onSelect = undefined,
  }: {
    items: DropdownItem[];
    value?: string;
    disabled?: boolean;
    id?: string;
    ariaLabel?: string;
    onchange?: (val: string) => void;
    onSelect?: (val: string) => void;
  } = $props();

  let isOpen = $state(false);
  let openUpward = $state(false);
  let containerRef: HTMLDivElement | null = $state(null);
  let triggerRef: HTMLButtonElement | null = $state(null);
  let highlightedIndex = $state(-1);

  let selectedItem = $derived(items.find((item) => item.value === value) || items[0]);

  function computePosition() {
    if (typeof window === "undefined" || !triggerRef) {
      openUpward = false;
      return;
    }
    const rect = triggerRef.getBoundingClientRect();
    const hasDescriptions = items.some((i) => Boolean(i.description));
    const estimatedHeight = items.length * (hasDescriptions ? 50 : 38) + 16;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    openUpward = spaceBelow < estimatedHeight + 12 && spaceAbove > spaceBelow;
  }

  function openMenu() {
    if (disabled) return;
    computePosition();
    isOpen = true;
    highlightedIndex = items.findIndex((i) => i.value === value);
    if (highlightedIndex === -1) highlightedIndex = 0;
  }

  function toggleOpen() {
    if (disabled) return;
    if (isOpen) {
      isOpen = false;
    } else {
      openMenu();
    }
  }

  function selectItem(item: DropdownItem) {
    value = item.value;
    isOpen = false;
    triggerRef?.focus();
    onchange?.(item.value);
    onSelect?.(item.value);
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (disabled) return;

    if (!isOpen) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openMenu();
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        highlightedIndex = (highlightedIndex + 1) % items.length;
        break;
      case "ArrowUp":
        event.preventDefault();
        highlightedIndex = (highlightedIndex - 1 + items.length) % items.length;
        break;
      case "Home":
        event.preventDefault();
        highlightedIndex = 0;
        break;
      case "End":
        event.preventDefault();
        highlightedIndex = items.length - 1;
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < items.length) {
          selectItem(items[highlightedIndex]);
        }
        break;
      case "Escape":
        event.preventDefault();
        isOpen = false;
        triggerRef?.focus();
        break;
      case "Tab":
        isOpen = false;
        break;
    }
  }

  $effect(() => {
    if (!isOpen || typeof document === "undefined") return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef && !containerRef.contains(event.target as Node)) {
        isOpen = false;
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  });
</script>

<div class="r-dropdown-container" bind:this={containerRef}>
  <button
    type="button"
    {id}
    bind:this={triggerRef}
    class="r-dropdown-trigger {isOpen ? 'open' : ''} {disabled ? 'disabled' : ''}"
    onclick={toggleOpen}
    onkeydown={handleKeyDown}
    aria-haspopup="listbox"
    aria-expanded={isOpen}
    aria-label={ariaLabel}
    {disabled}
  >
    <div class="trigger-label-group">
      <span class="trigger-label">{selectedItem?.label ?? "Select an option"}</span>
      {#if selectedItem?.description}
        <span class="trigger-desc">{selectedItem.description}</span>
      {/if}
    </div>
    <svg
      class="chevron-icon {isOpen ? 'rotated' : ''}"
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

  {#if isOpen}
    <ul
      class="r-dropdown-menu {openUpward ? 'open-upward' : ''}"
      role="listbox"
      aria-label={ariaLabel}
      tabindex="-1"
    >
      {#each items as item, idx}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <li
          role="option"
          aria-selected={item.value === value}
          class="r-dropdown-item {item.value === value ? 'selected' : ''} {highlightedIndex === idx ? 'highlighted' : ''}"
          onclick={() => selectItem(item)}
          onmouseenter={() => (highlightedIndex = idx)}
        >
          <div class="item-text-group">
            <span class="item-title">{item.label}</span>
            {#if item.description}
              <span class="item-desc">{item.description}</span>
            {/if}
          </div>
          {#if item.value === value}
            <svg
              class="check-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.25"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .r-dropdown-container {
    position: relative;
    width: 100%;
    user-select: none;
  }

  .r-dropdown-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    min-height: 40px;
    padding: 8px 13px;
    background: var(--surface-elevated, rgba(255, 255, 255, 0.04));
    border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
    border-radius: 10px;
    color: var(--text-primary, #f8fafc);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    box-sizing: border-box;
    transition: background-color 0.16s ease,
                border-color 0.16s ease,
                box-shadow 0.16s ease;
  }

  .r-dropdown-trigger:hover:not(.disabled) {
    background: var(--surface-hover, rgba(255, 255, 255, 0.07));
    border-color: var(--border-strong, rgba(255, 255, 255, 0.18));
  }

  .r-dropdown-trigger.open {
    border-color: var(--accent, #6366f1);
    box-shadow: 0 0 0 1px var(--accent, #6366f1);
  }

  .r-dropdown-trigger:focus-visible {
    outline: none;
    border-color: var(--accent, #6366f1);
    box-shadow: 0 0 0 2px var(--bg, #0c0e14), 0 0 0 4px var(--accent, #6366f1);
  }

  .r-dropdown-trigger.disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .trigger-label-group {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    text-align: left;
    overflow: hidden;
  }

  .trigger-label {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif;
    font-weight: 600;
    color: var(--text-primary, #f8fafc);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .trigger-desc {
    font-size: 11px;
    color: var(--text-muted, #94a3b8);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .chevron-icon {
    width: 15px;
    height: 15px;
    margin-left: 8px;
    color: var(--text-muted, #94a3b8);
    flex-shrink: 0;
    transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .chevron-icon.rotated {
    transform: rotate(180deg);
  }

  .r-dropdown-menu {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    z-index: 1000;
    margin: 0;
    padding: 5px;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 2px;
    background: var(--surface-dropdown, var(--surface-elevated, rgba(24, 24, 28, 0.98)));
    border: 1px solid var(--border-strong, rgba(255, 255, 255, 0.14));
    border-radius: 12px;
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    height: auto;
    max-height: calc(100vh - 32px);
    overflow-y: visible;
    box-sizing: border-box;
    animation: menu-slide-in 0.15s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .r-dropdown-menu.open-upward {
    top: auto;
    bottom: calc(100% + 6px);
  }

  @keyframes menu-slide-in {
    from {
      opacity: 0;
      transform: translateY(-3px) scale(0.99);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .r-dropdown-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 11px;
    border-radius: 8px;
    cursor: pointer;
    color: var(--text-primary);
    transition: background-color 0.12s ease, color 0.12s ease;
  }

  .r-dropdown-item.highlighted,
  .r-dropdown-item:hover {
    background: var(--surface-hover, rgba(255, 255, 255, 0.07));
    color: var(--text-primary);
  }

  .r-dropdown-item.selected {
    background: var(--surface-active, rgba(99, 102, 241, 0.12));
    color: var(--text-primary);
  }

  .r-dropdown-item.selected.highlighted {
    background: var(--surface-hover, rgba(99, 102, 241, 0.18));
  }

  .item-text-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .item-title {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary, #f8fafc);
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .r-dropdown-item.selected .item-title {
    font-weight: 600;
    color: var(--text-primary, #f8fafc);
  }

  .item-desc {
    font-size: 11px;
    line-height: 1.35;
    color: var(--text-muted, #94a3b8);
  }

  .r-dropdown-item.selected .item-desc {
    color: var(--text-secondary, #cbd5e1);
  }

  .check-icon {
    width: 15px;
    height: 15px;
    color: var(--accent, #6366f1);
    margin-left: 8px;
    flex-shrink: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .r-dropdown-trigger,
    .chevron-icon,
    .r-dropdown-menu,
    .r-dropdown-item {
      transition: none !important;
      animation: none !important;
    }
  }
</style>
