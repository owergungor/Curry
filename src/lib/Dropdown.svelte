<script lang="ts">
  import { onMount } from "svelte";

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
  let containerRef: HTMLDivElement | null = $state(null);
  let triggerRef: HTMLButtonElement | null = $state(null);
  let highlightedIndex = $state(-1);

  let selectedItem = $derived(items.find((item) => item.value === value) || items[0]);

  function toggleOpen() {
    if (disabled) return;
    isOpen = !isOpen;
    if (isOpen) {
      highlightedIndex = items.findIndex((i) => i.value === value);
      if (highlightedIndex === -1) highlightedIndex = 0;
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
        isOpen = true;
        highlightedIndex = items.findIndex((i) => i.value === value);
        if (highlightedIndex === -1) highlightedIndex = 0;
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

  onMount(() => {
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
      class="r-dropdown-menu"
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
              stroke-width="2.5"
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
    padding: 8px 14px;
    background: var(--surface, rgba(255, 255, 255, 0.04));
    border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
    border-radius: 10px;
    color: var(--text, #f8fafc);
    font-size: 13.5px;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
    box-sizing: border-box;
    text-align: left;
  }

  .r-dropdown-trigger:hover:not(.disabled) {
    background: var(--surface-elevated, rgba(255, 255, 255, 0.07));
    border-color: var(--accent, #6366f1);
  }

  .r-dropdown-trigger:focus-visible {
    outline: none;
    border-color: var(--accent, #6366f1);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
  }

  .r-dropdown-trigger.open {
    border-color: var(--accent, #6366f1);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
  }

  .r-dropdown-trigger.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .trigger-label-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow: hidden;
    padding-right: 8px;
  }

  .trigger-label {
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .trigger-desc {
    font-size: 11.5px;
    color: var(--text-muted, #94a3b8);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .chevron-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    color: var(--text-muted, #94a3b8);
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .chevron-icon.rotated {
    transform: rotate(180deg);
    color: var(--accent, #6366f1);
  }

  .r-dropdown-menu {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    z-index: 999;
    max-height: 260px;
    overflow-y: auto;
    background: var(--surface, #121826);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--border, rgba(255, 255, 255, 0.15));
    border-radius: 12px;
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.05);
    margin: 0;
    padding: 6px;
    list-style: none;
    box-sizing: border-box;
    animation: menu-slide-in 0.15s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes menu-slide-in {
    from {
      opacity: 0;
      transform: translateY(-6px) scale(0.98);
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
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
    color: var(--text, #f8fafc);
    font-size: 13px;
    transition: background 0.12s ease, color 0.12s ease;
  }

  .r-dropdown-item.highlighted,
  .r-dropdown-item:hover {
    background: var(--surface-elevated, rgba(255, 255, 255, 0.08));
  }

  .r-dropdown-item.selected {
    color: var(--accent, #6366f1);
    font-weight: 600;
    background: rgba(99, 102, 241, 0.12);
  }

  .item-text-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .item-title {
    font-weight: inherit;
  }

  .item-desc {
    font-size: 11.5px;
    color: var(--text-muted, #94a3b8);
  }

  .check-icon {
    width: 15px;
    height: 15px;
    color: var(--accent, #6366f1);
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
