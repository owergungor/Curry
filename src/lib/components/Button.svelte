<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    variant = "primary",
    size = "md",
    disabled = false,
    loading = false,
    type = "button",
    id = undefined,
    ariaLabel = undefined,
    className = "",
    onclick = undefined,
    children,
  }: {
    variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
    size?: "sm" | "md" | "lg";
    disabled?: boolean;
    loading?: boolean;
    type?: "button" | "submit" | "reset";
    id?: string;
    ariaLabel?: string;
    className?: string;
    onclick?: (e: MouseEvent) => void;
    children?: Snippet;
  } = $props();
</script>

<button
  {type}
  {id}
  class="curry-btn {variant} {size} {loading ? 'is-loading' : ''} {className}"
  disabled={disabled || loading}
  aria-label={ariaLabel}
  aria-busy={loading}
  onclick={onclick}
>
  {#if loading}
    <svg class="btn-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12" />
    </svg>
  {/if}
  {#if children}
    {@render children()}
  {/if}
</button>

<style>
  .curry-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    font-family: inherit;
    font-weight: 500;
    line-height: 1.2;
    border-radius: 9px;
    border: 1px solid transparent;
    cursor: pointer;
    user-select: none;
    transition: background-color 0.15s ease,
                border-color 0.15s ease,
                color 0.15s ease,
                transform 0.12s cubic-bezier(0.16, 1, 0.3, 1),
                box-shadow 0.15s ease;
    outline: none;
    box-sizing: border-box;
    white-space: nowrap;
    text-decoration: none;
    letter-spacing: -0.01em;
  }

  .curry-btn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--bg, #0c0e14), 0 0 0 4px var(--accent, #6366f1);
  }

  .curry-btn:active:not(:disabled) {
    transform: scale(0.97) !important;
  }

  /* Sizes */
  .curry-btn.sm {
    height: 30px;
    padding: 0 10px;
    font-size: 0.78rem;
    border-radius: 7px;
  }

  .curry-btn.md {
    height: 36px;
    padding: 0 14px;
    font-size: 0.85rem;
    border-radius: 9px;
  }

  .curry-btn.lg {
    height: 42px;
    padding: 0 18px;
    font-size: 0.92rem;
    border-radius: 10px;
  }

  /* Variants */
  .curry-btn.primary {
    background: var(--accent, #6366f1);
    color: var(--accent-fg, #ffffff);
    border-color: rgba(255, 255, 255, 0.12);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .curry-btn.primary:hover:not(:disabled) {
    filter: brightness(1.07);
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.22);
  }

  .curry-btn.secondary {
    background: var(--surface-elevated, rgba(255, 255, 255, 0.06));
    color: var(--text-primary, #e2e8f0);
    border-color: var(--border, rgba(255, 255, 255, 0.08));
    backdrop-filter: blur(12px);
  }

  .curry-btn.secondary:hover:not(:disabled) {
    background: var(--surface-hover, rgba(255, 255, 255, 0.1));
    border-color: var(--border-strong, rgba(255, 255, 255, 0.16));
    transform: translateY(-1px);
  }

  .curry-btn.danger {
    background: var(--danger-bg, rgba(239, 68, 68, 0.15));
    color: var(--danger-text, #ef4444);
    border-color: var(--danger-border, rgba(239, 68, 68, 0.3));
  }

  .curry-btn.danger:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.22);
    border-color: rgba(239, 68, 68, 0.45);
    transform: translateY(-1px);
  }

  .curry-btn.ghost {
    background: transparent;
    color: var(--text-muted, #94a3b8);
    border-color: transparent;
  }

  .curry-btn.ghost:hover:not(:disabled) {
    background: var(--surface-hover, rgba(255, 255, 255, 0.06));
    color: var(--text-primary, #f8fafc);
  }

  .curry-btn.outline {
    background: transparent;
    color: var(--text-primary, #e2e8f0);
    border-color: var(--border-strong, rgba(255, 255, 255, 0.18));
  }

  .curry-btn.outline:hover:not(:disabled) {
    background: var(--surface-hover, rgba(255, 255, 255, 0.06));
    border-color: var(--accent, #6366f1);
  }

  .curry-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }

  /* Spinner */
  .btn-spinner {
    width: 14px;
    height: 14px;
    animation: spin 0.8s linear infinite;
    flex-shrink: 0;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @media (prefers-reduced-motion: reduce) {
    .curry-btn {
      transition: none !important;
      transform: none !important;
    }
    .btn-spinner {
      animation: none !important;
    }
  }
</style>
