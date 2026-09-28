<script lang="ts">
  let {
    width = "100%",
    height = "16px",
    rounded = "8px",
    borderRadius = undefined,
    variant = "text",
    className = "",
  }: {
    width?: string;
    height?: string;
    rounded?: string;
    borderRadius?: string;
    variant?: "text" | "rect" | "circle" | "card";
    className?: string;
  } = $props();

  let effectiveRadius = $derived(
    variant === "circle" ? "50%" : variant === "card" ? "14px" : (borderRadius ?? rounded)
  );
</script>

<div
  class="skeleton-shimmer {variant} {className}"
  style:width={width}
  style:height={height}
  style:border-radius={effectiveRadius}
  aria-hidden="true"
></div>

<style>
  .skeleton-shimmer {
    display: inline-block;
    position: relative;
    overflow: hidden;
    background: var(--surface-elevated, rgba(255, 255, 255, 0.06));
    border: 1px solid var(--border, rgba(255, 255, 255, 0.05));
    box-sizing: border-box;
    vertical-align: middle;
  }

  .skeleton-shimmer::after {
    position: absolute;
    inset: 0;
    transform: translateX(-100%);
    background-image: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0,
      rgba(255, 255, 255, 0.08) 20%,
      rgba(255, 255, 255, 0.16) 60%,
      rgba(255, 255, 255, 0)
    );
    animation: shimmer 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    content: "";
  }

  @keyframes shimmer {
    100% {
      transform: translateX(100%);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .skeleton-shimmer::after {
      animation: none !important;
      background: none !important;
    }
    .skeleton-shimmer {
      opacity: 0.6;
    }
  }
</style>
