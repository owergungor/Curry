<script lang="ts">
  import { THEMES, type ThemeId } from "$lib/themes";

  let {
    selectedTheme = "perpetuity",
    onselect = undefined,
    className = "",
  }: {
    selectedTheme: ThemeId;
    onselect?: (id: ThemeId) => void;
    className?: string;
  } = $props();

  function choose(id: ThemeId) {
    if (onselect) {
      onselect(id);
    }
  }
</script>

<div
  class="curry-theme-grid {className}"
  role="radiogroup"
  aria-label="Curated Design Themes"
>
  {#each THEMES as theme}
    {@const isActive = selectedTheme === theme.id}
    <button
      type="button"
      role="radio"
      aria-checked={isActive}
      class="theme-card {isActive ? 'active' : ''}"
      onclick={() => choose(theme.id)}
      id="theme-card-{theme.id}"
    >
      <div class="theme-card-header">
        <span class="theme-card-title">{theme.label}</span>
        {#if isActive}
          <span class="theme-active-pill">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="tiny-check">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Active
          </span>
        {/if}
      </div>

      <p class="theme-card-desc">{theme.description}</p>

      <div class="theme-swatches" aria-hidden="true">
        {#each theme.swatches as swatch}
          <span class="swatch-circle" style:background={swatch}></span>
        {/each}
      </div>
    </button>
  {/each}
</div>

<style>
  .curry-theme-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 12px;
    width: 100%;
  }

  .theme-card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 14px;
    border-radius: 12px;
    background: var(--surface-elevated, rgba(255, 255, 255, 0.03));
    border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
    cursor: pointer;
    text-align: left;
    transition: all 0.16s ease;
    outline: none;
    font-family: inherit;
    gap: 8px;
  }

  .theme-card:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: var(--border-hover, rgba(255, 255, 255, 0.15));
    transform: translateY(-1px);
  }

  .theme-card:focus-visible {
    outline: 2px solid var(--accent, #6366f1);
    outline-offset: 2px;
  }

  .theme-card.active {
    background: rgba(99, 102, 241, 0.08);
    border-color: var(--accent, #6366f1);
    box-shadow: 0 0 16px rgba(99, 102, 241, 0.18);
  }

  .theme-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .theme-card-title {
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--text, #f8fafc);
  }

  .theme-active-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.68rem;
    font-weight: 600;
    padding: 2px 7px;
    border-radius: 6px;
    background: rgba(99, 102, 241, 0.25);
    color: var(--accent, #818cf8);
    border: 1px solid rgba(99, 102, 241, 0.4);
  }

  .tiny-check {
    width: 10px;
    height: 10px;
  }

  .theme-card-desc {
    margin: 0;
    font-size: 0.74rem;
    color: var(--text-muted, #94a3b8);
    line-height: 1.35;
    flex-grow: 1;
  }

  .theme-swatches {
    display: flex;
    align-items: center;
    gap: 6px;
    padding-top: 4px;
  }

  .swatch-circle {
    width: 13px;
    height: 13px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  @media (prefers-reduced-motion: reduce) {
    .theme-card {
      transition: none !important;
      transform: none !important;
    }
  }
</style>
