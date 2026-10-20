<script lang="ts">
  import { THEMES, type ThemeId } from "$lib/themes";
  import { t } from "$lib/i18n";

  let {
    selectedTheme = $bindable<ThemeId>("perpetuity"),
    appearance = "dark",
    onselect = undefined,
    className = "",
  }: {
    selectedTheme: ThemeId;
    appearance?: "dark" | "light" | "system";
    onselect?: (id: ThemeId) => void;
    className?: string;
  } = $props();

  const ALL_THEME_IDS: ThemeId[] = THEMES.map((item) => item.id);

  function choose(id: ThemeId) {
    selectedTheme = id;
    if (onselect) {
      onselect(id);
    }
  }

  function handleKeydown(e: KeyboardEvent, currentId: ThemeId) {
    const idx = ALL_THEME_IDS.indexOf(currentId);
    let nextIdx = -1;

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      nextIdx = (idx + 1) % ALL_THEME_IDS.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      nextIdx = (idx - 1 + ALL_THEME_IDS.length) % ALL_THEME_IDS.length;
    } else if (e.key === "Home") {
      nextIdx = 0;
    } else if (e.key === "End") {
      nextIdx = ALL_THEME_IDS.length - 1;
    }

    if (nextIdx >= 0) {
      e.preventDefault();
      const targetId = ALL_THEME_IDS[nextIdx];
      choose(targetId);
      document.getElementById(`theme-card-${targetId}`)?.focus();
    }
  }
</script>

<div class="theme-selector-root {className}" role="radiogroup" aria-label={t('settings.themes')}>
  <div class="themes-grid">
    {#each THEMES as theme}
      {@const isActive = selectedTheme === theme.id}
      <button
        type="button"
        role="radio"
        aria-checked={isActive}
        id="theme-card-{theme.id}"
        class="theme-item {isActive ? 'active' : ''}"
        onclick={() => choose(theme.id)}
        onkeydown={(e) => handleKeydown(e, theme.id)}
      >
        <div class="theme-item-header">
          <span class="theme-name">{t('theme.' + theme.id + '.name', undefined, theme.name)}</span>
          {#if isActive}
            <span class="check-icon-wrap" aria-hidden="true">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="check-icon">
                <polyline points="3.5 8.5 6.5 11.5 12.5 4.5" />
              </svg>
            </span>
          {/if}
        </div>

        <div class="swatches-row" aria-hidden="true">
          {#each theme.swatches as swatch}
            <span class="swatch-circle" style:background-color={swatch}></span>
          {/each}
        </div>
      </button>
    {/each}
  </div>
</div>

<style>
  .theme-selector-root {
    display: flex;
    flex-direction: column;
    width: 100%;
    font-family: inherit;
  }

  .themes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 10px;
    width: 100%;
  }

  .theme-item {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 10px;
    background: var(--surface-elevated, rgba(255, 255, 255, 0.03));
    border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
    cursor: pointer;
    text-align: left;
    transition: background-color 0.15s ease,
                border-color 0.15s ease,
                box-shadow 0.15s ease,
                transform 0.12s ease;
    outline: none;
    box-sizing: border-box;
    -webkit-appearance: none;
    appearance: none;
  }

  .theme-item:hover {
    background: var(--surface-hover, rgba(255, 255, 255, 0.06));
    border-color: var(--border-strong, rgba(255, 255, 255, 0.18));
  }

  .theme-item:active {
    transform: scale(0.985);
  }

  .theme-item.active {
    background: var(--surface-elevated, rgba(255, 255, 255, 0.07));
    border-color: var(--accent, #6366f1);
    box-shadow: 0 0 0 1px var(--accent, #6366f1);
  }

  .theme-item:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--bg, #0c0e14), 0 0 0 4px var(--accent, #6366f1);
  }

  .theme-item-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-width: 0;
  }

  .theme-name {
    font-size: 0.86rem;
    font-weight: 600;
    color: var(--text-primary, #f8fafc);
    letter-spacing: -0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .check-icon-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    color: var(--accent, #6366f1);
    flex-shrink: 0;
  }

  .check-icon {
    width: 12px;
    height: 12px;
  }

  .swatches-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .swatch-circle {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.18);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.22);
    flex-shrink: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .theme-item {
      transition: none !important;
      transform: none !important;
    }
  }
</style>
