<script lang="ts">
  import { THEMES, type ThemeId, type ThemeDefinition } from "$lib/themes";
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

  let isLight = $derived(appearance === "light");

  // Group themes by family for structured, gorgeous layout
  const families: { key: string; label: string; themes: ThemeDefinition[] }[] = $derived.by(() => {
    const map = new Map<string, { label: string; themes: ThemeDefinition[] }>();
    for (const theme of THEMES) {
      if (!map.has(theme.colorFamily)) {
        map.set(theme.colorFamily, { label: theme.familyLabel, themes: [] });
      }
      map.get(theme.colorFamily)!.themes.push(theme);
    }
    return Array.from(map.entries()).map(([key, data]) => ({
      key,
      label: data.label,
      themes: data.themes,
    }));
  });

  function choose(id: ThemeId) {
    selectedTheme = id;
    if (onselect) {
      onselect(id);
    }
  }

  function handleKeydown(e: KeyboardEvent, currentId: ThemeId) {
    const allIds = THEMES.map((t) => t.id);
    const idx = allIds.indexOf(currentId);
    let nextIdx = -1;

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      nextIdx = (idx + 1) % allIds.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      nextIdx = (idx - 1 + allIds.length) % allIds.length;
    } else if (e.key === "Home") {
      nextIdx = 0;
    } else if (e.key === "End") {
      nextIdx = allIds.length - 1;
    }

    if (nextIdx >= 0) {
      e.preventDefault();
      const targetId = allIds[nextIdx];
      choose(targetId);
      document.getElementById(`theme-card-${targetId}`)?.focus();
    }
  }
</script>

<div class="theme-selector-root {className}" role="radiogroup" aria-label="Curated Design Themes">
  {#each families as family}
    <div class="family-section">
      <div class="family-header">
        <span class="family-badge">{family.label}</span>
      </div>

      <div class="family-grid">
        {#each family.themes as theme}
          {@const isActive = selectedTheme === theme.id}
          {@const activePalette = (isLight && theme.lightColors) ? theme.lightColors : theme.colors}
          <button
            type="button"
            role="radio"
            aria-checked={isActive}
            id="theme-card-{theme.id}"
            class="theme-card {isActive ? 'active' : ''}"
            onclick={() => choose(theme.id)}
            onkeydown={(e) => handleKeydown(e, theme.id)}
          >
            <!-- Card Header -->
            <div class="theme-card-top">
              <div class="theme-meta">
                <span class="theme-name">{t('theme.' + theme.id + '.name') || theme.name}</span>
                <span class="theme-desc">{t('theme.' + theme.id + '.desc') || theme.description}</span>
              </div>
              {#if isActive}
                <span class="theme-active-tag">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="check-icon">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {t('common.active') || 'Active'}
                </span>
              {/if}
            </div>

            <!-- Mini Responsive Preview Window (respects current dark/light mode) -->
            <div
              class="theme-mock-window"
              style:background-color={activePalette.background}
              style:border-color={activePalette.border}
              aria-hidden="true"
            >
              <div class="mock-header" style:border-color={activePalette.border}>
                <div class="mock-dots">
                  <span class="mock-dot" style:background-color={activePalette.danger}></span>
                  <span class="mock-dot" style:background-color={activePalette.warning}></span>
                  <span class="mock-dot" style:background-color={activePalette.success}></span>
                </div>
                <span
                  class="mock-accent-bar"
                  style:background-color={activePalette.accent}
                  style:box-shadow="0 0 6px {activePalette.accent}66"
                ></span>
              </div>
              <div class="mock-body">
                <div class="mock-row">
                  <span class="mock-pill" style:background-color={activePalette.surfaceElevated}></span>
                  <span class="mock-line" style:background-color={activePalette.textMuted} style:width="40%"></span>
                </div>
                <div class="mock-row">
                  <span class="mock-card-box" style:background-color={activePalette.surface} style:border-color={activePalette.border}></span>
                  <span class="mock-card-box" style:background-color={activePalette.surface} style:border-color={activePalette.border}></span>
                </div>
              </div>
            </div>

            <!-- Swatches Strip -->
            <div class="swatches-row" aria-hidden="true">
              {#each theme.swatches as swatch}
                <span class="swatch-circle" style:background-color={swatch}></span>
              {/each}
            </div>
          </button>
        {/each}
      </div>
    </div>
  {/each}
</div>

<style>
  .theme-selector-root {
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
    font-family: inherit;
  }

  .family-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .family-header {
    display: flex;
    align-items: center;
  }

  .family-badge {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted, #94a3b8);
    background: var(--surface-elevated, rgba(255, 255, 255, 0.04));
    border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
    padding: 3px 9px;
    border-radius: 6px;
  }

  .family-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 12px;
  }

  .theme-card {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 13px 15px;
    border-radius: 12px;
    background: var(--surface-elevated, rgba(255, 255, 255, 0.04));
    border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
    cursor: pointer;
    text-align: left;
    transition: transform 0.16s cubic-bezier(0.16, 1, 0.3, 1),
                border-color 0.16s ease,
                background-color 0.16s ease,
                box-shadow 0.16s ease;
    outline: none;
    box-sizing: border-box;
  }

  .theme-card:hover {
    background: var(--surface-hover, rgba(255, 255, 255, 0.08));
    border-color: var(--border-strong, rgba(255, 255, 255, 0.22));
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
  }

  .theme-card:active {
    transform: scale(0.985);
  }

  .theme-card.active {
    background: var(--surface-elevated, rgba(255, 255, 255, 0.06));
    border-color: var(--accent, #6366f1);
    box-shadow: 0 0 0 1px var(--accent, #6366f1), 0 8px 24px var(--glow-surface, rgba(99, 102, 241, 0.2));
  }

  .theme-card:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--bg, #0c0e14), 0 0 0 4px var(--accent, #6366f1);
  }

  .theme-card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }

  .theme-meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .theme-name {
    font-size: 0.88rem;
    font-weight: 700;
    color: var(--text-primary, #f8fafc);
    letter-spacing: -0.01em;
  }

  .theme-desc {
    font-size: 0.72rem;
    color: var(--text-muted, #94a3b8);
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .theme-active-tag {
    display: inline-flex;
    align-items: center;
    gap: 3.5px;
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    padding: 2px 7px;
    border-radius: 5px;
    background: var(--accent, #6366f1);
    color: var(--accent-fg, #ffffff);
    line-height: 1.1;
    flex-shrink: 0;
    box-shadow: 0 0 8px var(--glow-surface, rgba(99, 102, 241, 0.4));
  }

  .check-icon {
    width: 10px;
    height: 10px;
  }

  /* Mock Window Preview */
  .theme-mock-window {
    width: 100%;
    height: 64px;
    border-radius: 8px;
    border-width: 1px;
    border-style: solid;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  }

  .mock-header {
    height: 16px;
    padding: 0 6px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom-width: 1px;
    border-bottom-style: solid;
    background: rgba(0, 0, 0, 0.1);
  }

  .mock-dots {
    display: flex;
    align-items: center;
    gap: 3px;
  }

  .mock-dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
  }

  .mock-accent-bar {
    width: 24px;
    height: 4px;
    border-radius: 2px;
  }

  .mock-body {
    padding: 6px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
  }

  .mock-row {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .mock-pill {
    width: 18px;
    height: 6px;
    border-radius: 3px;
  }

  .mock-line {
    height: 3px;
    border-radius: 2px;
    opacity: 0.6;
  }

  .mock-card-box {
    flex: 1;
    height: 18px;
    border-radius: 4px;
    border-width: 1px;
    border-style: solid;
  }

  /* Swatches Row */
  .swatches-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding-top: 2px;
  }

  .swatch-circle {
    width: 13px;
    height: 13px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.18);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
  }

  @media (prefers-reduced-motion: reduce) {
    .theme-card {
      transition: none !important;
      transform: none !important;
    }
  }
</style>
