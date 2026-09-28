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
    gap: 8px;
    font-family: inherit;
    font-weight: 500;
    line-height: 1.2;
    border-radius: 9px;
    border: 1px solid transparent;
    cursor: pointer;
    user-select: none;
    transition: all 0.16s cubic-bezier(0.16, 1, 0.3, 1);
    outline: none;
    box-sizing: border-box;
    white-space: nowrap;
    text-decoration: none;
  }

  .curry-btn:focus-visible {
    outline: 2px solid var(--accent, #6366f1);
    outline-offset: 2px;
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
    color: #ffffff;
    border-color: rgba(255, 255, 255, 0.12);
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
  }

  .curry-btn.primary:hover:not(:disabled) {
    filter: brightness(1.08);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
  }

  .curry-btn.primary:active:not(:disabled) {
    transform: translateY(0);
    filter: brightness(0.95);
  }

  .curry-btn.secondary {
    background: var(--surface-elevated, rgba(255, 255, 255, 0.06));
    color: var(--text, #e2e8f0);
    border-color: var(--border, rgba(255, 255, 255, 0.08));
    backdrop-filter: blur(12px);
  }

  .curry-btn.secondary:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    border-color: var(--border-hover, rgba(255, 255, 255, 0.15));
    transform: translateY(-1px);
  }

  .curry-btn.secondary:active:not(:disabled) {
    transform: translateY(0);
    background: rgba(255, 255, 255, 0.05);
  }

  .curry-btn.danger {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.3);
  }

  .curry-btn.danger:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.25);
    border-color: rgba(239, 68, 68, 0.5);
    transform: translateY(-1px);
  }

  .curry-btn.ghost {
    background: transparent;
    color: var(--text-muted, #94a3b8);
    border-color: transparent;
  }

  .curry-btn.ghost:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.06);
    color: var(--text, #f8fafc);
  }

  .curry-btn.outline {
    background: transparent;
    color: var(--text, #e2e8f0);
    border-color: var(--border, rgba(255, 255, 255, 0.15));
  }

  .curry-btn.outline:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.06);
    border-color: var(--accent, #6366f1);
  }

  .curry-btn:disabled {
    opacity: 0.5;
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
