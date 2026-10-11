<script lang="ts">
  import { errorStore } from "$lib/errors/store.svelte";
  import type { AppError } from "$lib/errors/types";

  let { reducedMotion = false }: { reducedMotion?: boolean } = $props();

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

  function handleWindowKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape" && errorStore.activeErrors.length > 0) {
      // Dismiss the latest active error on Escape
      const latest = errorStore.activeErrors[errorStore.activeErrors.length - 1];
      if (latest) {
        handleDismiss(latest);
      }
    }
  }
</script>

<svelte:window onkeydown={handleWindowKeyDown} />

{#if errorStore.activeErrors.length > 0}
  <aside
    class="error-island-container"
    aria-label="Application notifications"
    class:reduced-motion={reducedMotion}
  >
    {#each errorStore.activeErrors as error (error.id)}
      <div
        class="error-island severity-{error.severity}"
        role="alert"
        aria-live="assertive"
      >
        <div class="island-header">
          <!-- Native SVG Severity Icon -->
          <div class="island-icon-badge" aria-hidden="true">
            {#if error.severity === "warning"}
              <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
                <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
              </svg>
            {:else}
              <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
              </svg>
            {/if}
          </div>

          <div class="island-body">
            <h4 class="island-title">{error.title}</h4>
            <p class="island-message">{error.message}</p>
            {#if error.suggestion}
              <p class="island-suggestion">{error.suggestion}</p>
            {/if}
          </div>

          <button
            type="button"
            class="island-close-btn"
            aria-label="Dismiss error notification"
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

            <!-- Always accessible View Details button -->
            <button
              type="button"
              class="action-btn secondary-btn"
              onclick={() => handleInspect(error)}
            >
              View Details
            </button>
          </div>

          <button
            type="button"
            class="action-btn dismiss-btn"
            onclick={() => handleDismiss(error)}
          >
            Dismiss
          </button>
        </div>
      </div>
    {/each}
  </aside>
{/if}

<style>
  .error-island-container {
    position: fixed;
    bottom: 24px;
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
    pointer-events: auto;
    background: var(--surface-elevated, #1c2233);
    border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
    border-radius: 12px;
    padding: 14px 16px;
    color: var(--text-primary, #f8fafc);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.28);
    display: flex;
    flex-direction: column;
    gap: 12px;
    transform-origin: bottom right;
    animation: island-enter 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .error-island:focus-visible {
    outline: 2px solid var(--accent, #ff5c00);
    outline-offset: 2px;
  }

  .error-island.severity-warning {
    border-left: 3px solid var(--warning, #f59e0b);
  }

  .error-island.severity-error {
    border-left: 3px solid var(--danger, #ef4444);
  }

  .error-island.severity-fatal {
    border-left: 4px solid var(--danger, #ef4444);
    background: var(--surface, #131722);
  }

  .island-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .island-icon-badge {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .severity-warning .island-icon-badge {
    background: var(--warning-bg, rgba(245, 158, 11, 0.14));
    color: var(--warning, #f59e0b);
  }

  .severity-error .island-icon-badge,
  .severity-fatal .island-icon-badge {
    background: var(--danger-bg, rgba(239, 68, 68, 0.14));
    color: var(--danger, #ef4444);
  }

  .island-body {
    flex: 1;
    min-width: 0;
  }

  .island-title {
    margin: 0 0 4px 0;
    font-size: 0.875rem;
    font-weight: 600;
    line-height: 1.25;
    color: var(--text-primary, #f8fafc);
  }

  .island-message {
    margin: 0;
    font-size: 0.8125rem;
    line-height: 1.4;
    color: var(--text-secondary, #cbd5e1);
  }

  .island-suggestion {
    margin: 4px 0 0 0;
    font-size: 0.75rem;
    line-height: 1.35;
    color: var(--text-muted, #94a3b8);
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
    transition: color 0.15s ease, background-color 0.15s ease;
  }

  .island-close-btn:hover {
    color: var(--text-primary, #f8fafc);
    background: var(--surface-hover, rgba(255, 255, 255, 0.08));
  }

  .island-close-btn:focus-visible {
    outline: 2px solid var(--accent, #ff5c00);
    outline-offset: 1px;
  }

  .island-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding-top: 4px;
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
    padding: 5px 10px;
    border-radius: 6px;
    cursor: pointer;
    background: transparent;
    border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
    color: var(--text-primary, #f8fafc);
    transition: background-color 0.15s ease, border-color 0.15s ease;
    white-space: nowrap;
  }

  .action-btn:hover {
    background: var(--surface-hover, rgba(255, 255, 255, 0.08));
    border-color: var(--border-strong, rgba(255, 255, 255, 0.2));
  }

  .action-btn:focus-visible {
    outline: 2px solid var(--accent, #ff5c00);
    outline-offset: 1px;
  }

  .action-btn.primary {
    background: var(--accent, #ff5c00);
    border-color: var(--accent, #ff5c00);
    color: var(--accent-fg, #ffffff);
  }

  .action-btn.primary:hover {
    background: var(--accent-hover, #e05200);
    border-color: var(--accent-hover, #e05200);
  }

  .action-btn.dismiss-btn {
    color: var(--text-muted, #94a3b8);
    border-color: transparent;
  }

  .action-btn.dismiss-btn:hover {
    color: var(--text-primary, #f8fafc);
    background: transparent;
  }

  @keyframes island-enter {
    0% {
      opacity: 0;
      transform: translateY(10px) scale(0.97);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  /* Accessibility: Prefers Reduced Motion & Reduced Motion Settings */
  @media (prefers-reduced-motion: reduce) {
    .error-island {
      animation: none !important;
      transition: none !important;
      transform: none !important;
    }
  }

  .reduced-motion .error-island {
    animation: none !important;
    transition: none !important;
    transform: none !important;
  }
</style>
