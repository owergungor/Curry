<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    open = $bindable(false),
    title = undefined,
    description = undefined,
    maxWidth = "480px",
    onclose = undefined,
    children,
    footer,
  }: {
    open: boolean;
    title?: string;
    description?: string;
    maxWidth?: string;
    onclose?: () => void;
    children?: Snippet;
    footer?: Snippet;
  } = $props();

  function close() {
    open = false;
    if (onclose) onclose();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape" && open) {
      e.stopPropagation();
      close();
    }
  }

  const titleId = "modal-title-" + Math.random().toString(36).substring(2, 9);
  const descId = "modal-desc-" + Math.random().toString(36).substring(2, 9);
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <div class="modal-backdrop" role="presentation">
    <button
      type="button"
      class="modal-backdrop-dismiss"
      onclick={close}
      aria-label="Dismiss modal"
    ></button>
    <div
      class="modal-card"
      style:max-width={maxWidth}
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descId : undefined}
    >
      <div class="modal-header">
        <div class="modal-header-text">
          {#if title}
            <h3 id={titleId} class="modal-title">{title}</h3>
          {/if}
          {#if description}
            <p id={descId} class="modal-desc">{description}</p>
          {/if}
        </div>
        <button
          type="button"
          class="modal-close-btn"
          onclick={close}
          aria-label="Close dialog"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      {#if children}
        <div class="modal-body">
          {@render children()}
        </div>
      {/if}

      {#if footer}
        <div class="modal-footer">
          {@render footer()}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    padding: 16px;
    animation: fadeIn 0.18s ease-out forwards;
  }

  .modal-backdrop-dismiss {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    background: transparent;
    border: none;
    cursor: default;
    padding: 0;
    margin: 0;
    outline: none;
  }

  .modal-card {
    position: relative;
    width: 100%;
    background: var(--surface, #0f172a);
    border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
    border-radius: 14px;
    box-shadow: 0 20px 48px rgba(0, 0, 0, 0.6), 0 0 1px 1px rgba(255, 255, 255, 0.05);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    z-index: 1;
    outline: none;
    animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 18px 20px 14px;
    border-bottom: 1px solid var(--border, rgba(255, 255, 255, 0.06));
    gap: 12px;
  }

  .modal-header-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .modal-title {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--text, #f8fafc);
  }

  .modal-desc {
    margin: 0;
    font-size: 0.82rem;
    color: var(--text-muted, #94a3b8);
    line-height: 1.4;
  }

  .modal-close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 7px;
    background: transparent;
    border: 1px solid transparent;
    color: var(--text-muted, #94a3b8);
    cursor: pointer;
    transition: all 0.15s ease;
    padding: 0;
  }

  .modal-close-btn svg {
    width: 14px;
    height: 14px;
  }

  .modal-close-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    color: var(--text, #f8fafc);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .modal-close-btn:focus-visible {
    outline: 2px solid var(--accent, #6366f1);
  }

  .modal-body {
    padding: 20px;
    overflow-y: auto;
    max-height: calc(85vh - 120px);
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
    padding: 14px 20px 18px;
    border-top: 1px solid var(--border, rgba(255, 255, 255, 0.06));
    background: rgba(0, 0, 0, 0.15);
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95) translateY(4px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    .modal-backdrop, .modal-card {
      animation: none !important;
      transform: none !important;
    }
  }
</style>
