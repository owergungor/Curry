<script lang="ts">
  import { page } from "$app/state";
  import { formatDiagnosticsForExport, redactSensitiveString } from "$lib/errors/sanitizer";

  let showDetails = $state(false);
  let copied = $state(false);

  const rawMessage = $derived(page?.error?.message ?? "An unexpected application error occurred.");
  const sanitizedMessage = $derived(redactSensitiveString(rawMessage));

  function handleReload() {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }

  async function handleCopy() {
    const report = formatDiagnosticsForExport({
      code: "INITIALIZATION_FAILED",
      category: "system",
      severity: "fatal",
      timestamp: new Date().toISOString(),
      platform: typeof navigator !== "undefined" ? navigator.userAgent : "desktop",
      appVersion: "2.0",
      sanitizedMessage: "Fatal application error rendered at root error boundary.",
      technicalDetails: rawMessage,
    });

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(report);
      }
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 2500);
    } catch (e) {
      console.warn("Failed to copy error diagnostics:", e);
    }
  }
</script>

<main class="fatal-error-shell" role="alert">
  <div class="error-container">
    <div class="error-icon-box" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
        <path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.125 5.25a1.125 1.125 0 112.25 0v5.25a1.125 1.125 0 11-2.25 0V7.5zm1.125 9a1.125 1.125 0 100-2.25 1.125 1.125 0 000 2.25z" clip-rule="evenodd" />
      </svg>
    </div>

    <h1 class="error-heading">Curry encountered an unexpected problem</h1>
    <p class="error-description">
      The application was unable to complete initialization or render this view. Your existing settings and notifications remain intact.
    </p>

    <div class="error-actions">
      <button type="button" class="btn primary-btn" onclick={handleReload}>
        <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M8 3a5 5 0 104.546 2.914.5.5 0 01.908-.417A6 6 0 118 2v1z" clip-rule="evenodd" />
          <path d="M8 4.466V.534a.25.25 0 01.41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 018 4.466z" />
        </svg>
        Reload Curry
      </button>

      <button type="button" class="btn secondary-btn" onclick={() => (showDetails = !showDetails)}>
        {showDetails ? "Hide Diagnostics" : "View Details"}
      </button>

      <button type="button" class="btn secondary-btn" onclick={handleCopy}>
        {copied ? "Copied!" : "Copy Diagnostics"}
      </button>
    </div>

    {#if showDetails}
      <div class="diagnostics-panel">
        <div class="diag-header">Sanitized Diagnostics</div>
        <pre class="diag-body">{sanitizedMessage}</pre>
        <span class="diag-note">All credentials, tokens, and personal user paths have been redacted.</span>
      </div>
    {/if}
  </div>
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    background: #0c0e14;
    color: #f8fafc;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }

  .fatal-error-shell {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    box-sizing: border-box;
    background: radial-gradient(circle at 50% 20%, rgba(239, 68, 68, 0.08) 0%, transparent 60%), #0c0e14;
  }

  .error-container {
    max-width: 520px;
    width: 100%;
    background: #131722;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 32px 28px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.4);
  }

  .error-icon-box {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    background: rgba(239, 68, 68, 0.14);
    color: #ef4444;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
  }

  .error-heading {
    margin: 0 0 10px 0;
    font-size: 1.25rem;
    font-weight: 600;
    line-height: 1.3;
    color: #f8fafc;
  }

  .error-description {
    margin: 0 0 24px 0;
    font-size: 0.875rem;
    line-height: 1.5;
    color: #94a3b8;
  }

  .error-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    flex-wrap: wrap;
    width: 100%;
  }

  .btn {
    font-size: 0.8125rem;
    font-weight: 500;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  }

  .btn:focus-visible {
    outline: 2px solid #ff5c00;
    outline-offset: 2px;
  }

  .primary-btn {
    background: #ff5c00;
    border: 1px solid #ff5c00;
    color: #ffffff;
  }

  .primary-btn:hover {
    background: #e05200;
    border-color: #e05200;
  }

  .secondary-btn {
    background: #1c2233;
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #f8fafc;
  }

  .secondary-btn:hover {
    background: #262e45;
    border-color: rgba(255, 255, 255, 0.2);
  }

  .diagnostics-panel {
    margin-top: 24px;
    width: 100%;
    background: #07080c;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    padding: 14px;
    text-align: left;
    box-sizing: border-box;
  }

  .diag-header {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #94a3b8;
    margin-bottom: 8px;
  }

  .diag-body {
    margin: 0 0 8px 0;
    font-family: monospace;
    font-size: 0.75rem;
    line-height: 1.4;
    color: #cbd5e1;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 160px;
    overflow-y: auto;
  }

  .diag-note {
    font-size: 0.6875rem;
    color: #64748b;
    font-style: italic;
  }

  @media (prefers-reduced-motion: reduce) {
    .fatal-error-shell, .error-container, .btn {
      transition: none !important;
      animation: none !important;
    }
  }
</style>
