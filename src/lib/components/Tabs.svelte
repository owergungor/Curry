<script lang="ts">
  import type { Snippet } from "svelte";

  export interface TabItem {
    id: string;
    label: string;
    badge?: string | number;
    icon?: Snippet;
  }

  let {
    items = [],
    activeId = $bindable(""),
    variant = "glow",
    size = "md",
    className = "",
    onchange = undefined,
  }: {
    items: TabItem[];
    activeId: string;
    variant?: "pill" | "glow" | "underline";
    size?: "sm" | "md" | "lg";
    className?: string;
    onchange?: (id: string) => void;
  } = $props();

  function selectTab(id: string) {
    activeId = id;
    if (onchange) {
      onchange(id);
    }
  }

  function handleKeydown(e: KeyboardEvent, currentIndex: number) {
    let nextIndex = -1;
    if (e.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % items.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + items.length) % items.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = items.length - 1;
    }

    if (nextIndex >= 0) {
      e.preventDefault();
      const targetId = items[nextIndex].id;
      selectTab(targetId);
      const btn = document.getElementById(`tab-btn-${targetId}`);
      btn?.focus();
    }
  }
</script>

<div
  class="curry-tabs {variant} {size} {className}"
  role="tablist"
  aria-orientation="horizontal"
>
  {#each items as item, idx}
    {@const isActive = activeId === item.id}
    <button
      type="button"
      id="tab-btn-{item.id}"
      role="tab"
      aria-selected={isActive}
      tabindex={isActive ? 0 : -1}
      class="curry-tab-btn {isActive ? 'active' : ''}"
      onclick={() => selectTab(item.id)}
      onkeydown={(e) => handleKeydown(e, idx)}
    >
      {#if item.icon}
        <span class="tab-icon">
          {@render item.icon()}
        </span>
      {/if}
      <span class="tab-label">{item.label}</span>
      {#if item.badge !== undefined}
        <span class="tab-badge">{item.badge}</span>
      {/if}
      {#if isActive && variant === "glow"}
        <div class="active-glow-pill" aria-hidden="true"></div>
      {/if}
    </button>
  {/each}
</div>

<style>
  .curry-tabs {
    display: inline-flex;
    align-items: center;
    background: var(--surface-elevated, rgba(255, 255, 255, 0.04));
    border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
    border-radius: 12px;
    padding: 3px;
    gap: 3px;
    user-select: none;
  }

  .curry-tab-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    background: transparent;
    border: none;
    color: var(--text-muted, #94a3b8);
    font-family: inherit;
    font-size: 0.84rem;
    font-weight: 500;
    border-radius: 9px;
    cursor: pointer;
    transition: color 0.14s ease, background 0.14s ease;
    outline: none;
    white-space: nowrap;
    z-index: 1;
  }

  /* Sizes */
  .curry-tabs.sm .curry-tab-btn {
    height: 28px;
    padding: 0 10px;
    font-size: 0.76rem;
  }

  .curry-tabs.md .curry-tab-btn {
    height: 34px;
    padding: 0 14px;
    font-size: 0.84rem;
  }

  .curry-tabs.lg .curry-tab-btn {
    height: 40px;
    padding: 0 18px;
    font-size: 0.92rem;
  }

  .curry-tab-btn:hover:not(.active) {
    color: var(--text, #f8fafc);
    background: rgba(255, 255, 255, 0.04);
  }

  .curry-tab-btn:focus-visible {
    outline: 2px solid var(--accent, #6366f1);
    outline-offset: -2px;
  }

  .curry-tab-btn.active {
    color: #ffffff;
    font-weight: 600;
  }

  .active-glow-pill {
    position: absolute;
    inset: 0;
    border-radius: 9px;
    background: rgba(99, 102, 241, 0.18);
    border: 1px solid rgba(99, 102, 241, 0.4);
    box-shadow: 0 0 14px rgba(99, 102, 241, 0.28);
    pointer-events: none;
    z-index: -1;
  }

  .tab-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 700;
    min-width: 17px;
    height: 17px;
    padding: 0 5px;
    border-radius: 10px;
    background: var(--accent, #6366f1);
    color: #ffffff;
    line-height: 1;
  }

  .tab-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 15px;
    height: 15px;
  }

  @media (prefers-reduced-motion: reduce) {
    .curry-tab-btn {
      transition: none !important;
    }
    .active-glow-pill {
      box-shadow: none !important;
    }
  }
</style>
