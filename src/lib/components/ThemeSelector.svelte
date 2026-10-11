<script lang="ts">
  import { THEMES, type ThemeId } from "$lib/themes";
  import { t } from "$lib/i18n";

  let {
    selectedTheme = "promotor-wow",
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
        <div class="title-family-wrap">
          <span class="theme-card-title">{t('theme.' + theme.id + '.name') || theme.name}</span>
          <span class="theme-family-tag">{theme.familyLabel}</span>
        </div>
        {#if isActive}
          <span class="theme-active-pill">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="tiny-check">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Active
          </span>
        {/if}
      </div>

      <p class="theme-card-desc">{t('theme.' + theme.id + '.desc') || theme.description}</p>

      <!-- Mini UI Token Preview -->
      <div
        class="theme-mini-preview"
        style="background: {theme.colors.background}; border: 1px solid {theme.colors.border};"
        aria-hidden="true"
      >
        <div
          class="theme-preview-panel"
          style="background: {theme.colors.surface}; border: 1px solid {theme.colors.border}; box-shadow: 0 0 8px {theme.glowPalette[0]}40;"
        >
          <div class="preview-row">
            <span class="preview-dot" style="background: {theme.colors.accent}; box-shadow: 0 0 6px {theme.colors.accent};"></span>
            <span class="preview-bar accent" style="background: {theme.colors.accent};"></span>
          </div>
          <span class="preview-bar text" style="background: {theme.colors.text}; opacity: 0.85;"></span>
        </div>
      </div>

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
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 13px 14px;
    border-radius: 11px;
    background: var(--surface-elevated, rgba(255, 255, 255, 0.03));
    border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
    cursor: pointer;
    text-align: left;
    transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1),
                border-color 0.15s ease,
                background-color 0.15s ease,
                box-shadow 0.15s ease;
    outline: none;
    font-family: inherit;
    gap: 7px;
    box-sizing: border-box;
  }

  .theme-card:hover {
    background: var(--surface-hover, rgba(255, 255, 255, 0.06));
    border-color: var(--border-strong, rgba(255, 255, 255, 0.18));
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }

  .theme-card:active {
    transform: scale(0.985);
  }

  .theme-card:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--bg, #0c0e14), 0 0 0 4px var(--accent, #6366f1);
  }

  .theme-card.active {
    background: var(--surface-elevated, rgba(255, 255, 255, 0.05));
    border-color: var(--accent, #6366f1);
    box-shadow: 0 0 0 1px var(--accent, #6366f1), 0 3px 12px rgba(0, 0, 0, 0.16);
  }

  .theme-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    width: 100%;
    gap: 6px;
  }

  .title-family-wrap {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .theme-card-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-primary, #f8fafc);
    letter-spacing: -0.01em;
  }

  .theme-family-tag {
    font-size: 0.62rem;
    font-weight: 500;
    color: var(--text-muted, #94a3b8);
    opacity: 0.85;
    letter-spacing: 0.01em;
  }

  .theme-active-pill {
    display: inline-flex;
    align-items: center;
    gap: 3.5px;
    font-size: 0.65rem;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 5px;
    background: var(--accent, #6366f1);
    color: var(--accent-fg, #ffffff);
    line-height: 1.1;
    flex-shrink: 0;
  }

  .tiny-check {
    width: 9px;
    height: 9px;
  }

  .theme-card-desc {
    margin: 0;
    font-size: 0.72rem;
    color: var(--text-muted, #94a3b8);
    line-height: 1.35;
    flex-grow: 1;
    min-height: 28px;
  }

  .theme-mini-preview {
    width: 100%;
    border-radius: 7px;
    padding: 5px;
    margin: 3px 0;
    box-sizing: border-box;
  }

  .theme-preview-panel {
    border-radius: 5px;
    padding: 5px 7px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .preview-row {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .preview-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .preview-bar {
    height: 4px;
    border-radius: 2px;
  }

  .preview-bar.accent {
    width: 45%;
  }

  .preview-bar.text {
    width: 75%;
    height: 3px;
  }

  .theme-swatches {
    display: flex;
    align-items: center;
    gap: 5px;
    padding-top: 2px;
  }

  .swatch-circle {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  }

  @media (prefers-reduced-motion: reduce) {
    .theme-card {
      transition: none !important;
      transform: none !important;
    }
  }
</style>
