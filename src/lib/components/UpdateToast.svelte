<script lang="ts">
  import { t } from "$lib/i18n";

  let {
    visible = false,
    version = "",
    statusMessage = "",
    isInstalling = false,
    progress = null,
    isRestartRequired = false,
    onUpdate = () => {},
    onDismiss = () => {},
    onRestart = () => {},
  }: {
    visible: boolean;
    version?: string;
    statusMessage?: string;
    isInstalling?: boolean;
    progress?: number | null;
    isRestartRequired?: boolean;
    onUpdate?: () => void;
    onDismiss?: () => void;
    onRestart?: () => void;
  } = $props();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape" && visible) {
      e.stopPropagation();
      onDismiss();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if visible}
  <aside
    class="curry-update-toast"
    role="alert"
    aria-live="polite"
    aria-label={t("updater.toast_title", undefined, "Update Available")}
  >
    <div class="toast-header">
      <div class="toast-title-row">
        <span class="toast-badge-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </span>
        <span class="toast-title">{t("updater.toast_title", undefined, "Update Available")}</span>
        {#if version}
          <span class="toast-version-tag">v{version}</span>
        {/if}
      </div>

      <button
        type="button"
        class="toast-close-btn"
        onclick={onDismiss}
        aria-label={t("updater.toast_dismiss", undefined, "Dismiss")}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>

    <p class="toast-message">
      {statusMessage || t("updater.update_available", { version: version || "3.0" }, "Update ready to install.")}
    </p>

    {#if isInstalling && progress !== null}
      <div class="toast-progress-container" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div class="toast-progress-bar" style:width="{progress}%"></div>
      </div>
    {/if}

    <div class="toast-actions">
      {#if isRestartRequired}
        <button
          type="button"
          class="toast-btn primary"
          onclick={onRestart}
          aria-label={t("updater.restart_now", undefined, "Restart Now")}
        >
          {t("updater.restart_now", undefined, "Restart Now")}
        </button>
      {:else}
        <button
          type="button"
          class="toast-btn primary"
          onclick={onUpdate}
          disabled={isInstalling}
          aria-label={t("updater.toast_update", undefined, "Update")}
        >
          {#if isInstalling}
            <span class="toast-spinner" aria-hidden="true"></span>
            <span>{progress !== null ? `${progress}%` : t("updater.installing", undefined, "Installing...")}</span>
          {:else}
            <span>{t("updater.toast_update", undefined, "Update")}</span>
          {/if}
        </button>
      {/if}

      <button
        type="button"
        class="toast-btn secondary"
        onclick={onDismiss}
        aria-label={t("updater.toast_dismiss", undefined, "Dismiss")}
      >
        {t("updater.toast_dismiss", undefined, "Dismiss")}
      </button>
    </div>
  </aside>
{/if}

<style>
  :global(.curry-update-toast) {
    position: fixed !important;
    top: 16px !important;
    right: 16px !important;
    z-index: 99999 !important;
    width: 320px;
    max-width: calc(100vw - 32px);
    background: var(--surface-elevated, #161a23);
    border: 1px solid var(--border-strong, rgba(255, 255, 255, 0.16));
    border-radius: 14px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35), 0 2px 6px rgba(0, 0, 0, 0.2);
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    color: var(--text-primary, #f1f5f9);
    animation: toastSlideIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes toastSlideIn {
    from {
      opacity: 0;
      transform: translateY(-8px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .curry-update-toast {
      animation: none;
    }
  }

  .toast-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .toast-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .toast-badge-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 6px;
    background: var(--accent-subtle, rgba(56, 189, 248, 0.15));
    color: var(--accent, #38bdf8);
    flex-shrink: 0;
  }

  .toast-badge-icon svg {
    width: 13px;
    height: 13px;
  }

  .toast-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary, #f8fafc);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .toast-version-tag {
    font-size: 11px;
    font-weight: 600;
    padding: 1px 6px;
    border-radius: 6px;
    background: var(--accent-subtle, rgba(56, 189, 248, 0.15));
    color: var(--accent, #38bdf8);
    flex-shrink: 0;
  }

  .toast-close-btn {
    background: transparent;
    border: none;
    color: var(--text-muted, #94a3b8);
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: color 0.15s ease, background 0.15s ease;
  }

  .toast-close-btn:hover {
    color: var(--text-primary, #f8fafc);
    background: var(--surface-hover, rgba(255, 255, 255, 0.08));
  }

  .toast-close-btn:focus-visible {
    outline: 2px solid var(--accent, #38bdf8);
    outline-offset: 1px;
  }

  .toast-close-btn svg {
    width: 14px;
    height: 14px;
  }

  .toast-message {
    margin: 0;
    font-size: 12px;
    line-height: 1.45;
    color: var(--text-secondary, #cbd5e1);
    word-break: break-word;
  }

  .toast-progress-container {
    height: 4px;
    width: 100%;
    background: var(--border, rgba(255, 255, 255, 0.1));
    border-radius: 2px;
    overflow: hidden;
  }

  .toast-progress-bar {
    height: 100%;
    background: var(--accent, #38bdf8);
    transition: width 0.2s ease;
  }

  .toast-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 2px;
  }

  .toast-btn {
    font-size: 12px;
    font-weight: 600;
    padding: 6px 12px;
    border-radius: 8px;
    cursor: pointer;
    border: none;
    transition: all 0.15s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .toast-btn:focus-visible {
    outline: 2px solid var(--accent, #38bdf8);
    outline-offset: 2px;
  }

  .toast-btn.primary {
    background: var(--accent, #38bdf8);
    color: var(--accent-contrast, #090d16);
    flex: 1;
  }

  .toast-btn.primary:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  .toast-btn.primary:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .toast-btn.secondary {
    background: var(--surface-hover, rgba(255, 255, 255, 0.08));
    color: var(--text-primary, #f1f5f9);
    border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
  }

  .toast-btn.secondary:hover {
    background: var(--surface-active, rgba(255, 255, 255, 0.14));
  }

  .toast-spinner {
    width: 12px;
    height: 12px;
    border: 2px solid rgba(0, 0, 0, 0.25);
    border-top-color: currentColor;
    border-radius: 50%;
    animation: toastSpin 0.7s linear infinite;
  }

  @keyframes toastSpin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
