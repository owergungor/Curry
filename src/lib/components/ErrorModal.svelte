<script lang="ts">
  import { errorStore } from "$lib/errors/store.svelte";
  import { formatDiagnosticsForExport } from "$lib/errors/sanitizer";
  import { t } from "$lib/i18n";

  let copied = $state(false);
  let copyTimeout: ReturnType<typeof setTimeout> | null = null;
  let modalCardEl: HTMLElement | null = $state(null);
  let previousActiveElement: HTMLElement | null = null;

  const currentError = $derived(errorStore.inspectedError);

  function getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
      (el) => el.offsetParent !== null || el.getClientRects().length > 0
    );
  }

  function handleClose() {
    errorStore.closeInspection();
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!currentError) return;

    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      handleClose();
      return;
    }

    if (e.key === "Tab" && modalCardEl) {
      const focusables = getFocusableElements(modalCardEl);
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const activeEl = typeof document !== "undefined" ? document.activeElement : null;

      if (e.shiftKey) {
        if (activeEl === first || !modalCardEl.contains(activeEl)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (activeEl === last || !modalCardEl.contains(activeEl)) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }

  $effect(() => {
    if (currentError) {
      if (typeof document !== "undefined") {
        previousActiveElement = document.activeElement as HTMLElement | null;
      }
      if (typeof window !== "undefined") {
        const frameId = window.requestAnimationFrame(() => {
          if (modalCardEl) {
            const focusables = getFocusableElements(modalCardEl);
            if (focusables.length > 0) {
              focusables[0].focus();
            } else {
              modalCardEl.focus();
            }
          }
        });
        return () => window.cancelAnimationFrame(frameId);
      }
    } else if (previousActiveElement) {
      const el = previousActiveElement;
      previousActiveElement = null;
      if (typeof el.focus === "function") {
        el.focus();
      }
    }
  });

  $effect(() => {
    return () => {
      if (copyTimeout) clearTimeout(copyTimeout);
      if (previousActiveElement && typeof previousActiveElement.focus === "function") {
        previousActiveElement.focus();
      }
    };
  });

  async function handleCopyDiagnostics() {
    if (!currentError) return;
    const text = formatDiagnosticsForExport(currentError.diagnostics);
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      copied = true;
      if (copyTimeout) clearTimeout(copyTimeout);
      copyTimeout = setTimeout(() => {
        copied = false;
      }, 2500);
    } catch (err) {
      console.warn("Could not copy diagnostics to clipboard:", err);
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if currentError}
  <div
    class="modal-backdrop"
    role="presentation"
    onclick={(e) => {
      if (e.target === e.currentTarget) handleClose();
    }}
  >
    <div
      bind:this={modalCardEl}
      class="modal-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      tabindex="-1"
    >
      <div class="modal-header">
        <div class="title-group">
          <span class="error-badge severity-{currentError.severity}">{currentError.code}</span>
          <h3 id="modal-title" class="modal-title">{currentError.title}</h3>
        </div>
        <button
          type="button"
          class="close-btn"
          aria-label="Close error details dialog"
          onclick={handleClose}
        >
          <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
            <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <div class="section-block">
          <div class="section-label">{t("errors.what_happened")}</div>
          <p class="section-text">{currentError.message}</p>
        </div>

        {#if currentError.suggestion}
          <div class="section-block">
            <div class="section-label">{t("errors.recommended_action")}</div>
            <p class="section-text">{currentError.suggestion}</p>
          </div>
        {/if}

        <div class="section-block">
          <div class="section-label">{t("errors.sanitized_diagnostics")}</div>
          <div class="diagnostics-box">
            <div class="diag-row"><span class="diag-key">Timestamp:</span> <span class="diag-val">{currentError.diagnostics.timestamp}</span></div>
            <div class="diag-row"><span class="diag-key">Category:</span> <span class="diag-val">{currentError.category}</span></div>
            <div class="diag-row"><span class="diag-key">Severity:</span> <span class="diag-val">{currentError.severity}</span></div>
            {#if currentError.diagnostics.technicalDetails}
              <div class="diag-details-block">
                <span class="diag-key">Details:</span>
                <pre class="diag-pre">{currentError.diagnostics.technicalDetails}</pre>
              </div>
            {/if}
          </div>
          <p class="redaction-note">
            {t("errors.redaction_note")}
          </p>
        </div>
      </div>

      <div class="modal-footer">
        <button
          type="button"
          class="btn copy-btn"
          onclick={handleCopyDiagnostics}
        >
          {#if copied}
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M12.416 3.376a.75.75 0 01.208 1.04l-5 7.5a.75.75 0 01-1.154.114l-3-3a.75.75 0 011.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 011.04-.207z" clip-rule="evenodd" />
            </svg>
            {t("errors.copied")}
          {:else}
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
              <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z" />
              <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z" />
            </svg>
            {t("errors.copy_diagnostics")}
          {/if}
        </button>

        <button
          type="button"
          class="btn close-modal-btn"
          onclick={handleClose}
        >
          {t("errors.close")}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(4px);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: fade-in 0.15s ease-out;
  }

  .modal-card {
    background: var(--surface, #131722);
    border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
    border-radius: 14px;
    width: 100%;
    max-width: 520px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    animation: scale-in 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 20px;
    border-bottom: 1px solid var(--border, rgba(255, 255, 255, 0.08));
  }

  .title-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .error-badge {
    font-size: 0.6875rem;
    font-weight: 600;
    font-family: monospace;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 2px 6px;
    border-radius: 4px;
    width: fit-content;
  }

  .error-badge.severity-warning {
    background: var(--warning-bg, rgba(245, 158, 11, 0.14));
    color: var(--warning, #f59e0b);
  }

  .error-badge.severity-error,
  .error-badge.severity-fatal {
    background: var(--danger-bg, rgba(239, 68, 68, 0.14));
    color: var(--danger, #ef4444);
  }

  .modal-title {
    margin: 0;
    font-size: 1.0625rem;
    font-weight: 600;
    color: var(--text-primary, #f8fafc);
  }

  .close-btn {
    background: transparent;
    border: none;
    color: var(--text-muted, #94a3b8);
    cursor: pointer;
    padding: 6px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.15s ease, background-color 0.15s ease;
  }

  .close-btn:hover {
    color: var(--text-primary, #f8fafc);
    background: var(--surface-hover, rgba(255, 255, 255, 0.08));
  }

  .close-btn:focus-visible {
    outline: 2px solid var(--accent, #ff5c00);
  }

  .modal-body {
    padding: 20px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .section-block {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .section-label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted, #94a3b8);
  }

  .section-text {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.5;
    color: var(--text-primary, #f8fafc);
  }

  .diagnostics-box {
    background: var(--surface-elevated, #1c2233);
    border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
    border-radius: 8px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 0.8125rem;
  }

  .diag-row {
    display: flex;
    gap: 8px;
  }

  .diag-key {
    font-weight: 500;
    color: var(--text-muted, #94a3b8);
    min-width: 80px;
  }

  .diag-val {
    color: var(--text-primary, #f8fafc);
    font-family: monospace;
    font-size: 0.75rem;
  }

  .diag-details-block {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 4px;
  }

  .diag-pre {
    margin: 0;
    padding: 8px 10px;
    background: rgba(0, 0, 0, 0.35);
    border-radius: 6px;
    color: var(--text-secondary, #cbd5e1);
    font-family: monospace;
    font-size: 0.75rem;
    line-height: 1.4;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 140px;
    overflow-y: auto;
  }

  .redaction-note {
    margin: 4px 0 0 0;
    font-size: 0.6875rem;
    color: var(--text-muted, #94a3b8);
    font-style: italic;
  }

  .modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    padding: 14px 20px;
    border-top: 1px solid var(--border, rgba(255, 255, 255, 0.08));
    background: var(--surface-elevated, #1c2233);
  }

  .btn {
    font-size: 0.8125rem;
    font-weight: 500;
    padding: 7px 14px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  }

  .btn:focus-visible {
    outline: 2px solid var(--accent, #ff5c00);
    outline-offset: 1px;
  }

  .copy-btn {
    background: transparent;
    border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
    color: var(--text-primary, #f8fafc);
  }

  .copy-btn:hover {
    background: var(--surface-hover, rgba(255, 255, 255, 0.08));
    border-color: var(--border-strong, rgba(255, 255, 255, 0.2));
  }

  .close-modal-btn {
    background: var(--accent, #ff5c00);
    border: 1px solid var(--accent, #ff5c00);
    color: var(--accent-fg, #ffffff);
  }

  .close-modal-btn:hover {
    background: var(--accent-hover, #e05200);
    border-color: var(--accent-hover, #e05200);
  }

  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes scale-in {
    from { opacity: 0; transform: scale(0.96); }
    to { opacity: 1; transform: scale(1); }
  }

  @media (prefers-reduced-motion: reduce) {
    .modal-backdrop, .modal-card {
      animation: none !important;
      transition: none !important;
    }
  }
</style>
