<script lang="ts">
  import { errorStore } from "$lib/errors/store.svelte";
  import type { AppError } from "$lib/errors/types";
  import { t } from "$lib/i18n";
  import { onMount } from "svelte";

  let { reducedMotion = false }: { reducedMotion?: boolean } = $props();

  let expandedErrors = $state<Record<string, boolean>>({});

  function handleDismiss(error: AppError) {
    errorStore.dismiss(error.id);
  }

  function handleAction(error: AppError, actionFn?: () => void | Promise<void>) {
    if (actionFn) {
      try {
        const res = actionFn();
        if (res && typeof (res as Promise<void>).then === "function") {
          (res as Promise<void>).catch((err) => {
            console.warn("Error action execution rejected:", err);
          });
        }
      } catch (err) {
        console.warn("Error action execution threw:", err);
      }
    }
    errorStore.dismiss(error.id);
  }

  function handleInspect(error: AppError) {
    errorStore.inspect(error);
  }

  function toggleExpand(id: string) {
    expandedErrors[id] = !expandedErrors[id];
  }

  function handleWindowKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape" && errorStore.activeErrors.length > 0) {
      // Dismiss the latest active error on Escape
      const latest = errorStore.activeErrors[errorStore.activeErrors.length - 1];
      if (latest) {
        handleDismiss(latest);
      }
    }
  }

  $effect(() => {
    if (errorStore.activeErrors.length === 0 || typeof window === "undefined") return;
    window.addEventListener("keydown", handleWindowKeyDown);
    return () => {
      window.removeEventListener("keydown", handleWindowKeyDown);
    };
  });
</script>

{#if errorStore.activeErrors.length > 0}
  <aside
    class="error-island-container"
    aria-label="Application notifications"
    class:reduced-motion={reducedMotion}
  >
    {#each errorStore.activeErrors as error (error.id)}
      {@const isExpanded = !!expandedErrors[error.id]}
      <div
        class="error-island severity-{error.severity}"
        role="alert"
        aria-live="assertive"
      >
        <!-- 21st.dev Ambient Glowing Backdrop Edge -->
        <div class="island-glow-edge" aria-hidden="true"></div>

        <div class="island-header">
          <!-- 21st.dev Sonar Ripple Animated Badge -->
          <div class="island-icon-badge" aria-hidden="true">
            <span class="sonar-ring"></span>
            {#if error.severity === "warning"}
              <svg viewBox="0 0 20 20" width="17" height="17" fill="currentColor">
                <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
              </svg>
            {:else}
              <svg viewBox="0 0 20 20" width="17" height="17" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
              </svg>
            {/if}
          </div>

          <div class="island-body">
            <div class="island-title-row">
              <h4 class="island-title">{error.title}</h4>
              <span class="severity-pill">{error.severity}</span>
            </div>
            <p class="island-message">{error.message}</p>
            {#if error.suggestion}
              <p class="island-suggestion">{error.suggestion}</p>
            {/if}

            <!-- Expandable Technical Details (Never thrown directly at the user) -->
            {#if error.diagnostics?.technicalDetails}
              <button
                type="button"
                class="details-toggle-btn"
                onclick={() => toggleExpand(error.id)}
                aria-expanded={isExpanded}
              >
                <span>{isExpanded ? t("errors.close") : t("errors.view_details")}</span>
                <svg
                  class="chevron-icon {isExpanded ? 'rotated' : ''}"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {#if isExpanded}
                <div class="collapsible-details">
                  <pre class="technical-code">{error.diagnostics.technicalDetails}</pre>
                </div>
              {/if}
            {/if}
          </div>

          <button
            type="button"
            class="island-close-btn"
            aria-label={t("errors.dismiss")}
            onclick={() => handleDismiss(error)}
          >
            <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden="true">
              <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
            </svg>
          </button>
        </div>

        <!-- Action Options -->
        <div class="island-actions">
          <div class="action-buttons-group">
            {#each error.actions as action}
              {#if action.type !== "dismiss"}
                <button
                  type="button"
                  class="action-btn"
                  class:primary={action.primary}
                  onclick={() => handleAction(error, action.action)}
                >
                  {action.label}
                </button>
              {/if}
            {/each}

            <!-- Modal Inspector Option -->
            <button
              type="button"
              class="action-btn secondary-btn"
              onclick={() => handleInspect(error)}
            >
              {t("errors.view_details")}
            </button>
          </div>

          <button
            type="button"
            class="action-btn dismiss-btn"
            onclick={() => handleDismiss(error)}
          >
            {t("errors.dismiss")}
          </button>
        </div>

        <!-- 21st.dev Subtle Bottom Progress Bar -->
        <div class="island-progress-bar" aria-hidden="true">
          <div class="progress-fill"></div>
        </div>
      </div>
    {/each}
  </aside>
{/if}

<style>
  .error-island-container {
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 420px;
    width: calc(100vw - 48px);
    pointer-events: none;
  }

  .error-island {
    position: relative;
    pointer-events: auto;
    background: var(--surface-elevated, rgba(19, 23, 34, 0.94));
    border: 1px solid var(--border-strong, rgba(255, 255, 255, 0.16));
    border-radius: 14px;
    padding: 14px 16px;
    color: var(--text-primary, #f8fafc);
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.4),
                0 0 0 1px var(--border, rgba(255, 255, 255, 0.08));
    display: flex;
    flex-direction: column;
    gap: 12px;
    transform-origin: top right;
    animation: island-enter 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards,
               attention-shake 0.4s ease 0.15s;
    overflow: hidden;
  }

  .error-island:focus-visible {
    outline: 2px solid var(--accent, #6366f1);
    outline-offset: 2px;
  }

  /* 21st.dev Ambient Glowing Edge */
  .island-glow-edge {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--border-strong, rgba(255, 255, 255, 0.4)), transparent);
    opacity: 0.8;
  }

  .error-island.severity-warning {
    border-left: 3.5px solid var(--warning, #f59e0b);
  }
  .error-island.severity-warning .island-glow-edge {
    background: linear-gradient(90deg, transparent, var(--warning, #f59e0b), transparent);
  }

  .error-island.severity-error {
    border-left: 3.5px solid var(--danger, #ef4444);
  }
  .error-island.severity-error .island-glow-edge {
    background: linear-gradient(90deg, transparent, var(--danger, #ef4444), transparent);
  }

  .error-island.severity-fatal {
    border-left: 4.5px solid var(--danger, #ef4444);
    background: var(--surface, #131722);
  }
  .error-island.severity-fatal .island-glow-edge {
    background: linear-gradient(90deg, transparent, #ff2222, transparent);
  }

  .island-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  /* 21st.dev Animated Sonar Ripple Icon Badge */
  .island-icon-badge {
    position: relative;
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface-hover, rgba(255, 255, 255, 0.08));
    border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
  }

  .sonar-ring {
    position: absolute;
    inset: -3px;
    border-radius: 12px;
    border: 1.5px solid currentColor;
    opacity: 0.6;
    animation: sonar-pulse 2.4s cubic-bezier(0.16, 1, 0.3, 1) infinite;
    pointer-events: none;
  }

  @keyframes sonar-pulse {
    0% {
      transform: scale(0.92);
      opacity: 0.7;
    }
    50% {
      transform: scale(1.18);
      opacity: 0;
    }
    100% {
      transform: scale(1.18);
      opacity: 0;
    }
  }

  .severity-warning .island-icon-badge {
    background: var(--warning-bg, rgba(245, 158, 11, 0.16));
    color: var(--warning, #f59e0b);
    border-color: rgba(245, 158, 11, 0.3);
  }

  .severity-error .island-icon-badge,
  .severity-fatal .island-icon-badge {
    background: var(--danger-bg, rgba(239, 68, 68, 0.16));
    color: var(--danger, #ef4444);
    border-color: rgba(239, 68, 68, 0.3);
  }

  .island-body {
    flex: 1;
    min-width: 0;
  }

  .island-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 4px;
  }

  .island-title {
    margin: 0;
    font-size: 0.88rem;
    font-weight: 600;
    line-height: 1.25;
    color: var(--text-primary, #f8fafc);
  }

  .severity-pill {
    font-size: 0.65rem;
    text-transform: uppercase;
    font-weight: 700;
    letter-spacing: 0.04em;
    padding: 1px 6px;
    border-radius: 4px;
    background: var(--surface-hover, rgba(255, 255, 255, 0.08));
    color: var(--text-muted, #94a3b8);
  }

  .severity-warning .severity-pill {
    background: rgba(245, 158, 11, 0.18);
    color: #fbbf24;
  }

  .severity-error .severity-pill,
  .severity-fatal .severity-pill {
    background: rgba(239, 68, 68, 0.18);
    color: #fca5a5;
  }

  .island-message {
    margin: 0;
    font-size: 0.8125rem;
    line-height: 1.4;
    color: var(--text-secondary, #cbd5e1);
  }

  .island-suggestion {
    margin: 5px 0 0 0;
    font-size: 0.75rem;
    line-height: 1.35;
    color: var(--text-muted, #94a3b8);
  }

  /* Collapsible technical details */
  .details-toggle-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-top: 6px;
    padding: 2px 0;
    background: transparent;
    border: none;
    color: var(--text-muted, #94a3b8);
    font-size: 0.72rem;
    font-weight: 500;
    cursor: pointer;
    transition: color 0.15s ease;
  }

  .details-toggle-btn:hover {
    color: var(--text-primary, #f8fafc);
  }

  .chevron-icon {
    width: 12px;
    height: 12px;
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .chevron-icon.rotated {
    transform: rotate(180deg);
  }

  .collapsible-details {
    margin-top: 6px;
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
    border-radius: 6px;
    padding: 6px 8px;
    max-height: 120px;
    overflow-y: auto;
  }

  .technical-code {
    margin: 0;
    font-size: 0.68rem;
    font-family: monospace;
    color: var(--text-muted, #cbd5e1);
    white-space: pre-wrap;
    word-break: break-all;
  }

  .island-close-btn {
    flex-shrink: 0;
    background: transparent;
    border: none;
    color: var(--text-muted, #94a3b8);
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.15s ease, background-color 0.15s ease, transform 0.15s ease;
  }

  .island-close-btn:hover {
    color: var(--text-primary, #f8fafc);
    background: var(--surface-hover, rgba(255, 255, 255, 0.08));
    transform: scale(1.08);
  }

  .island-close-btn:focus-visible {
    outline: 2px solid var(--accent, #6366f1);
    outline-offset: 1px;
  }

  .island-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding-top: 6px;
    border-top: 1px solid var(--border, rgba(255, 255, 255, 0.06));
  }

  .action-buttons-group {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .action-btn {
    font-size: 0.75rem;
    font-weight: 500;
    padding: 5px 11px;
    border-radius: 7px;
    cursor: pointer;
    background: transparent;
    border: 1px solid var(--border, rgba(255, 255, 255, 0.14));
    color: var(--text-primary, #f8fafc);
    transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
    white-space: nowrap;
  }

  .action-btn:hover {
    background: var(--surface-hover, rgba(255, 255, 255, 0.1));
    border-color: var(--border-strong, rgba(255, 255, 255, 0.25));
    transform: translateY(-0.5px);
  }

  .action-btn:focus-visible {
    outline: 2px solid var(--accent, #6366f1);
    outline-offset: 1px;
  }

  .action-btn.primary {
    background: var(--accent, #6366f1);
    border-color: var(--accent, #6366f1);
    color: var(--accent-fg, #ffffff);
  }

  .action-btn.primary:hover {
    background: var(--accent-hover, #4f46e5);
    border-color: var(--accent-hover, #4f46e5);
  }

  .action-btn.dismiss-btn {
    color: var(--text-muted, #94a3b8);
    border-color: transparent;
  }

  .action-btn.dismiss-btn:hover {
    color: var(--text-primary, #f8fafc);
    background: transparent;
  }

  /* 21st.dev Ambient Progress Bar */
  .island-progress-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: rgba(255, 255, 255, 0.06);
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    width: 100%;
    background: currentColor;
    opacity: 0.45;
    animation: progress-shrink 6s linear forwards;
  }

  .error-island:hover .progress-fill {
    animation-play-state: paused;
  }

  @keyframes progress-shrink {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }

  @keyframes island-enter {
    0% {
      opacity: 0;
      transform: translateY(-14px) scale(0.96);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes attention-shake {
    0%, 100% {
      transform: translateX(0);
    }
    20%, 60% {
      transform: translateX(-3px);
    }
    40%, 80% {
      transform: translateX(3px);
    }
  }

  /* Accessibility: Prefers Reduced Motion */
  @media (prefers-reduced-motion: reduce) {
    .error-island,
    .sonar-ring,
    .progress-fill {
      animation: none !important;
      transition: none !important;
      transform: none !important;
    }
  }

  .reduced-motion .error-island,
  .reduced-motion .sonar-ring,
  .reduced-motion .progress-fill {
    animation: none !important;
    transition: none !important;
    transform: none !important;
  }
</style>
