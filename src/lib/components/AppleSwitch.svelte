<script lang="ts">
  let {
    checked = $bindable(false),
    disabled = false,
    id = undefined,
    name = undefined,
    ariaLabel = undefined,
    ariaLabelledby = undefined,
    size = "md",
    className = "",
    onchange = undefined,
    onChange = undefined,
  }: {
    checked?: boolean | null;
    disabled?: boolean;
    id?: string;
    name?: string;
    ariaLabel?: string;
    ariaLabelledby?: string;
    size?: "sm" | "md" | "lg";
    className?: string;
    onchange?: (checked: boolean) => void;
    onChange?: (checked: boolean) => void;
  } = $props();

  let isPressed = $state(false);

  function toggle() {
    if (disabled) return;
    const nextVal = !Boolean(checked);
    checked = nextVal;
    onchange?.(nextVal);
    onChange?.(nextVal);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (disabled) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      toggle();
    }
  }

  function handlePointerDown() {
    if (!disabled) {
      isPressed = true;
    }
  }

  function handlePointerUp() {
    isPressed = false;
  }

  function handlePointerLeave() {
    isPressed = false;
  }
</script>

<button
  type="button"
  {id}
  {name}
  role="switch"
  aria-checked={Boolean(checked)}
  aria-label={ariaLabel}
  aria-labelledby={ariaLabelledby}
  aria-disabled={disabled}
  {disabled}
  class="apple-switch {size} {Boolean(checked) ? 'on' : 'off'} {isPressed ? 'pressed' : ''} {disabled ? 'disabled' : ''} {className}"
  onclick={toggle}
  onkeydown={handleKeydown}
  onpointerdown={handlePointerDown}
  onpointerup={handlePointerUp}
  onpointerleave={handlePointerLeave}
>
  <span class="apple-switch-track">
    <span class="apple-switch-thumb"></span>
  </span>
</button>

<style>
  .apple-switch {
    position: relative;
    display: inline-flex;
    align-items: center;
    padding: 0;
    margin: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    outline: none;
    flex-shrink: 0;
    line-height: 1;
    vertical-align: middle;
  }

  .apple-switch.disabled {
    opacity: 0.45;
    cursor: not-allowed;
    pointer-events: none;
  }

  /* Focus Visible Ring - Apple HIG Compliant */
  .apple-switch:focus-visible .apple-switch-track {
    box-shadow: 0 0 0 2px var(--bg, #0c0e14), 0 0 0 4px var(--accent, #6366f1);
  }

  /* Track */
  .apple-switch-track {
    position: relative;
    display: block;
    border-radius: 9999px;
    box-sizing: border-box;
    transition: background-color 0.22s cubic-bezier(0.16, 1, 0.3, 1),
                border-color 0.22s cubic-bezier(0.16, 1, 0.3, 1),
                box-shadow 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  }

  /* Sizes */
  .apple-switch.sm .apple-switch-track {
    width: 32px;
    height: 18px;
  }

  .apple-switch.md .apple-switch-track {
    width: 42px;
    height: 24px;
  }

  .apple-switch.lg .apple-switch-track {
    width: 50px;
    height: 28px;
  }

  /* Off state track */
  .apple-switch.off .apple-switch-track {
    background-color: var(--surface-elevated, rgba(255, 255, 255, 0.14));
    border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.15);
  }

  .apple-switch.off:hover:not(.disabled) .apple-switch-track {
    background-color: var(--surface-hover, rgba(255, 255, 255, 0.2));
    border-color: var(--border-strong, rgba(255, 255, 255, 0.25));
  }

  /* On state track */
  .apple-switch.on .apple-switch-track {
    background-color: var(--accent, #6366f1);
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .apple-switch.on:hover:not(.disabled) .apple-switch-track {
    filter: brightness(1.06);
  }

  /* Thumb */
  .apple-switch-thumb {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    border-radius: 9999px;
    background-color: #ffffff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.28), 0 3px 8px rgba(0, 0, 0, 0.14);
    box-sizing: border-box;
    pointer-events: none;
    transition: left 0.22s cubic-bezier(0.16, 1, 0.3, 1),
                width 0.18s cubic-bezier(0.16, 1, 0.3, 1),
                transform 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  }

  /* Thumb sizing & positioning */
  /* SM */
  .apple-switch.sm .apple-switch-thumb {
    height: 14px;
    width: 14px;
    left: 2px;
  }
  .apple-switch.sm.on .apple-switch-thumb {
    left: 16px;
  }
  .apple-switch.sm.pressed.off .apple-switch-thumb {
    width: 17px;
  }
  .apple-switch.sm.pressed.on .apple-switch-thumb {
    left: 13px;
    width: 17px;
  }

  /* MD */
  .apple-switch.md .apple-switch-thumb {
    height: 20px;
    width: 20px;
    left: 2px;
  }
  .apple-switch.md.on .apple-switch-thumb {
    left: 20px;
  }
  .apple-switch.md.pressed.off .apple-switch-thumb {
    width: 24px;
  }
  .apple-switch.md.pressed.on .apple-switch-thumb {
    left: 16px;
    width: 24px;
  }

  /* LG */
  .apple-switch.lg .apple-switch-thumb {
    height: 24px;
    width: 24px;
    left: 2px;
  }
  .apple-switch.lg.on .apple-switch-thumb {
    left: 24px;
  }
  .apple-switch.lg.pressed.off .apple-switch-thumb {
    width: 29px;
  }
  .apple-switch.lg.pressed.on .apple-switch-thumb {
    left: 19px;
    width: 29px;
  }

  /* Reduced Motion */
  @media (prefers-reduced-motion: reduce) {
    .apple-switch-track,
    .apple-switch-thumb {
      transition: none !important;
    }
  }
</style>
