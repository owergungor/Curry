<script lang="ts">
  import { untrack } from "svelte";
  import { t } from "$lib/i18n";
  import { THEMES, DEFAULT_THEME, type ThemeId } from "$lib/themes";
  import type { Appearance } from "$lib/AppearanceTabs.svelte";
  import type { ScanResult } from "$lib/ipc";
  import type { ApplicationProfile } from "$lib/apps";
  import AppleSwitch from "$lib/components/AppleSwitch.svelte";

  interface AppSettingsLike {
    enabled: boolean;
    startup_enabled: boolean;
    show_in_taskbar?: boolean;
    show_notifications: boolean;
    history_limit: number;
    sound_enabled: boolean;
    oled_mode?: boolean;
    default_page?: string | null;
    display_name?: string | null;
    onboarding_completed?: boolean;
  }

  let {
    open = $bindable(false),
    appSettings,
    selectedTheme,
    appearance,
    applications = [],
    isScanningApps = false,
    startStep = 0,
    onThemeSelect,
    onAppearanceChange,
    onScanApps,
    onComplete,
    onSkip,
  }: {
    open: boolean;
    appSettings: AppSettingsLike;
    selectedTheme: ThemeId;
    appearance: Appearance;
    applications?: ApplicationProfile[];
    isScanningApps?: boolean;
    startStep?: number;
    onThemeSelect?: (id: ThemeId) => void;
    onAppearanceChange?: (mode: Appearance) => void;
    onScanApps?: () => Promise<ScanResult | void>;
    onComplete?: (prefs: {
      displayName: string | null;
      theme: ThemeId;
      appearance: Appearance;
      showNotifications: boolean;
      soundEnabled: boolean;
      historyLimit: number;
      startupEnabled: boolean;
      showInTaskbar: boolean;
      oledMode: boolean;
      defaultPage: "dashboard" | "notifications" | "applications" | "glow";
    }) => void;
    onSkip?: () => void;
  } = $props();

  let step = $state(0);

  // Local preferences state initialized from appSettings
  let displayName = $state("");
  let chosenTheme = $state<ThemeId>(DEFAULT_THEME);
  let chosenAppearance = $state<Appearance>("dark");
  let captureNotifications = $state(true);
  let soundAlerts = $state(true);
  let historyLimit = $state(100);
  let startWithWindows = $state(false);
  let keepInTaskbar = $state(true);
  let oledMode = $state(false);
  let defaultPage = $state<"dashboard" | "notifications" | "applications" | "glow">("dashboard");

  let isScanningLocal = $state(false);
  let scanResultCount = $state<number | null>(null);
  let effectiveAppsCount = $derived(scanResultCount !== null ? scanResultCount : applications.length);
  let isPlayingSound = $state(false);
  let dialogEl = $state<HTMLDivElement | null>(null);
  let wasOpen = false;

  // Initialize local wizard state ONLY when transitioning from closed -> open
  $effect(() => {
    if (open && !wasOpen) {
      wasOpen = true;
      untrack(() => {
        step = startStep;
        scanResultCount = null;
        displayName = appSettings?.display_name || "";
        chosenTheme = selectedTheme || DEFAULT_THEME;
        chosenAppearance = appearance || "dark";
        captureNotifications = appSettings?.show_notifications ?? true;
        soundAlerts = appSettings?.sound_enabled ?? true;
        historyLimit = appSettings?.history_limit || 100;
        startWithWindows = appSettings?.startup_enabled ?? false;
        keepInTaskbar = appSettings?.show_in_taskbar ?? true;
        oledMode = appSettings?.oled_mode ?? false;
        defaultPage = ((appSettings?.default_page as any) || "dashboard");
      });
      // Focus the dialog container itself (not Get Started) so background controls lose focus
      // and no button is unintentionally activated by stray keystrokes.
      queueMicrotask(() => {
        dialogEl?.focus({ preventScroll: true });
      });
    } else if (!open && wasOpen) {
      wasOpen = false;
    }
  });

  function handleAppearance(newMode: Appearance) {
    chosenAppearance = newMode;
    if (onAppearanceChange) onAppearanceChange(newMode);
  }

  function handleTheme(themeId: ThemeId) {
    chosenTheme = themeId;
    if (onThemeSelect) onThemeSelect(themeId);
  }

  async function handleScan() {
    if (isScanningLocal || isScanningApps) return;
    isScanningLocal = true;
    try {
      if (onScanApps) {
        const res = await onScanApps();
        if (res && typeof res.totalFound === "number") {
          scanResultCount = res.totalFound;
        } else {
          scanResultCount = applications.length;
        }
      }
    } catch (err) {
      console.error("Onboarding app scan error:", err);
    } finally {
      isScanningLocal = false;
    }
  }

  function playSampleSound() {
    if (isPlayingSound || typeof window === "undefined") return;
    isPlayingSound = true;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.36);
        setTimeout(() => {
          isPlayingSound = false;
          ctx.close().catch(() => {});
        }, 400);
      } else {
        isPlayingSound = false;
      }
    } catch {
      isPlayingSound = false;
    }
  }

  function handleGetStarted() {
    step = 1;
    queueMicrotask(() => {
      dialogEl?.focus({ preventScroll: true });
    });
  }

  function nextStep() {
    if (step < 5) {
      step += 1;
    } else {
      finish();
    }
  }

  function prevStep() {
    if (step > 0) {
      step -= 1;
    }
  }

  function finish() {
    if (onComplete) {
      onComplete({
        displayName: displayName.trim() ? displayName.trim() : null,
        theme: chosenTheme,
        appearance: chosenAppearance,
        showNotifications: captureNotifications,
        soundEnabled: soundAlerts,
        historyLimit,
        startupEnabled: startWithWindows,
        showInTaskbar: keepInTaskbar,
        oledMode,
        defaultPage,
      });
    }
    open = false;
  }

  function skipAll() {
    if (onSkip) {
      onSkip();
    } else {
      finish();
    }
    open = false;
  }

  const FOCUSABLE_SELECTOR =
    'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

  function getFocusableElements(): HTMLElement[] {
    if (!dialogEl) return [];
    return Array.from(dialogEl.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      (el) => el.offsetParent !== null
    );
  }

  function isInteractiveElement(el: HTMLElement | null): boolean {
    if (!el || el === dialogEl) return false;
    const tag = el.tagName;
    if (
      tag === "BUTTON" ||
      tag === "INPUT" ||
      tag === "TEXTAREA" ||
      tag === "SELECT" ||
      tag === "A"
    ) {
      return true;
    }
    const role = el.getAttribute("role");
    return role === "button" || role === "switch" || role === "radio" || role === "tab";
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!open || e.isComposing || e.defaultPrevented) return;

    // 1. Explicit Escape rule: Step 0 skips/closes; Steps 1..5 navigate back
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      if (step === 0) {
        skipAll();
      } else {
        prevStep();
      }
      return;
    }

    // 2. Focus trapping for Tab / Shift+Tab within the open wizard modal
    if (e.key === "Tab") {
      const focusables = getFocusableElements();
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (!active || !dialogEl?.contains(active) || active === dialogEl) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
        return;
      }
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
        return;
      }
      if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
        return;
      }
      return;
    }

    // 3. Block keyboard events targeting background elements behind the modal
    const target = e.target as HTMLElement | null;
    const targetInDialog = !!(dialogEl && target && dialogEl.contains(target));
    if (!targetInDialog) {
      e.preventDefault();
      e.stopPropagation();
      dialogEl?.focus({ preventScroll: true });
      return;
    }

    // 4. On Welcome Screen (Step 0): never advance on arbitrary keys;
    //    Enter/Space only activate a focused interactive button via native browser behavior.
    if (step === 0) {
      const isActivationKey = e.key === "Enter" || e.key === " " || e.code === "Space";
      if (isActivationKey && !isInteractiveElement(target)) {
        e.preventDefault();
        e.stopPropagation();
      }
      return;
    }
  }

  // Attach capture-phase window keydown listener only while wizard is open, with automatic cleanup
  $effect(() => {
    if (!open || typeof window === "undefined") return;
    window.addEventListener("keydown", handleKeydown, true);
    return () => {
      window.removeEventListener("keydown", handleKeydown, true);
    };
  });

  const activeThemeMeta = $derived(
    THEMES.find((t) => t.id === chosenTheme) || THEMES[0]
  );
</script>

{#if open}
  <div class="onboarding-overlay">
    <div class="onboarding-backdrop" onclick={skipAll} aria-hidden="true"></div>

    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
      class="onboarding-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      bind:this={dialogEl}
      tabindex="-1"
      onkeydown={(e) => e.stopPropagation()}
    >
      <!-- Ambient Glow Orbs -->
      <div class="glow-orb orb-primary" aria-hidden="true"></div>
      <div class="glow-orb orb-secondary" aria-hidden="true"></div>

      <!-- Header Navigation Bar (Steps 1 to 5) -->
      {#if step > 0}
        <div class="wizard-header">
          <button
            type="button"
            class="wizard-nav-btn back-btn"
            onclick={prevStep}
            aria-label={t('onboarding.back')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <span>{t('onboarding.back')}</span>
          </button>

          <!-- Step Indicators 1..5 -->
          <div class="step-indicators" aria-label="Step navigation">
            {#each [1, 2, 3, 4, 5] as s}
              <button
                type="button"
                class="step-pill {s === step ? 'active' : ''} {s < step ? 'completed' : ''}"
                onclick={() => (step = s)}
                aria-current={s === step ? 'step' : undefined}
                title="Step {s}"
              >
                <span class="step-number">{s}</span>
                {#if s < step}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="check-icon">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                {/if}
              </button>
              {#if s < 5}
                <div class="step-connector {s < step ? 'active' : ''}"></div>
              {/if}
            {/each}
          </div>

          <button
            type="button"
            class="wizard-nav-btn skip-step-btn"
            onclick={nextStep}
          >
            <span>{t('onboarding.skip_step')}</span>
          </button>
        </div>
      {/if}

      <!-- Wizard Step Body -->
      <div class="wizard-body">
        <!-- ============================================================= -->
        <!-- STEP 0: HERO WELCOME SCREEN                                   -->
        <!-- ============================================================= -->
        {#if step === 0}
          <div class="hero-step animate-fade-in">
            <div class="brand-hero-badge">
              <div class="hero-icon-wrap">
                <img src="/favicon.png" alt="Curry Logo" class="hero-logo-img" />
              </div>
              <div class="brand-glow-halo"></div>
            </div>

            <h1 id="onboarding-title" class="hero-title">{t('onboarding.welcome_title')}</h1>
            <p class="hero-subtitle">{t('onboarding.welcome_subtitle')}</p>
            <p class="hero-desc">{t('onboarding.welcome_desc')}</p>

            <!-- Feature Showcase Cards -->
            <div class="feature-showcase-grid">
              <div class="showcase-card">
                <div class="showcase-icon-box glow-amber">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 3c0 4.97-4.03 9-9 9 4.97 0 9 4.03 9 9 0-4.97 4.03-9 9-9-4.97 0-9-4.03-9-9z"></path>
                  </svg>
                </div>
                <div class="showcase-text">
                  <span class="showcase-heading">Ambient Screen Glow</span>
                  <span class="showcase-sub">Real-time edge lightning for desktop alerts</span>
                </div>
              </div>

              <div class="showcase-card">
                <div class="showcase-icon-box glow-cyan">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="3"></rect>
                    <path d="M3 9h18"></path>
                    <path d="M9 21V9"></path>
                  </svg>
                </div>
                <div class="showcase-text">
                  <span class="showcase-heading">Per-App Customization</span>
                  <span class="showcase-sub">Personalized neon colors & app profiles</span>
                </div>
              </div>

              <div class="showcase-card">
                <div class="showcase-icon-box glow-purple">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polygon points="12 6 12 12 16 14"></polygon>
                  </svg>
                </div>
                <div class="showcase-text">
                  <span class="showcase-heading">OLED Burn-in Protection</span>
                  <span class="showcase-sub">Lightweight, dark mode & gaming suppression</span>
                </div>
              </div>
            </div>

            <!-- Hero Action Buttons -->
            <div class="hero-footer-actions">
              <button
                type="button"
                id="onboarding-get-started-btn"
                class="primary-glow-btn"
                onclick={handleGetStarted}
              >
                <span>{t('onboarding.get_started')}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="btn-icon">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>

              <button
                type="button"
                id="onboarding-skip-setup-btn"
                class="ghost-link-btn"
                onclick={skipAll}
              >
                <span>{t('onboarding.skip_setup')}</span>
              </button>
            </div>
          </div>

        <!-- ============================================================= -->
        <!-- STEP 1: PERSONALIZE YOUR EXPERIENCE                           -->
        <!-- ============================================================= -->
        {:else if step === 1}
          <div class="wizard-step animate-fade-in">
            <div class="step-title-wrap">
              <span class="step-eyebrow">{t('onboarding.step1_eyebrow')}</span>
              <h2 class="step-main-title">{t('onboarding.step1_title')}</h2>
              <p class="step-desc">{t('onboarding.step1_desc')}</p>
            </div>

            <div class="step-content-grid">
              <!-- Display Name Input -->
              <div class="form-group">
                <label for="onboarding-display-name" class="form-label">
                  {t('onboarding.display_name')}
                </label>
                <div class="input-with-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="field-icon">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <input
                    id="onboarding-display-name"
                    type="text"
                    maxlength="40"
                    bind:value={displayName}
                    placeholder={t('onboarding.display_name_placeholder')}
                    class="wizard-text-input"
                  />
                </div>
              </div>

              <!-- Appearance Mode Selection -->
              <div class="form-group">
                <span class="form-label">{t('onboarding.theme_mode')}</span>
                <div class="appearance-card-grid">
                  <button
                    type="button"
                    class="appearance-select-btn {chosenAppearance === 'system' ? 'active' : ''}"
                    onclick={() => handleAppearance('system')}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mode-icon">
                      <rect x="2" y="3" width="20" height="14" rx="2"></rect>
                      <line x1="8" y1="21" x2="16" y2="21"></line>
                      <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                    <span class="mode-label">System</span>
                  </button>

                  <button
                    type="button"
                    class="appearance-select-btn {chosenAppearance === 'dark' ? 'active' : ''}"
                    onclick={() => handleAppearance('dark')}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mode-icon">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                    </svg>
                    <span class="mode-label">Dark</span>
                  </button>

                  <button
                    type="button"
                    class="appearance-select-btn {chosenAppearance === 'light' ? 'active' : ''}"
                    onclick={() => handleAppearance('light')}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mode-icon">
                      <circle cx="12" cy="12" r="5"></circle>
                      <line x1="12" y1="1" x2="12" y2="3"></line>
                      <line x1="12" y1="21" x2="12" y2="23"></line>
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                      <line x1="1" y1="12" x2="3" y2="12"></line>
                      <line x1="21" y1="12" x2="23" y2="12"></line>
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                    </svg>
                    <span class="mode-label">Light</span>
                  </button>
                </div>
              </div>

              <!-- Theme Palette Selector Grid -->
              <div class="form-group">
                <div class="theme-label-row">
                  <span class="form-label">{t('onboarding.themes_palette')}</span>
                  <span class="active-theme-badge">{activeThemeMeta.label}</span>
                </div>

                <div class="themes-pill-grid">
                  {#each THEMES as th}
                    <button
                      type="button"
                      class="theme-compact-card {chosenTheme === th.id ? 'active' : ''}"
                      onclick={() => handleTheme(th.id)}
                      title="{th.label}: {th.description}"
                    >
                      <div class="theme-swatch-row">
                        {#each th.swatches.slice(0, 3) as sw}
                          <span class="swatch-dot" style:background-color={sw}></span>
                        {/each}
                      </div>
                      <span class="theme-name">{th.name}</span>
                    </button>
                  {/each}
                </div>
              </div>
            </div>

            <div class="wizard-step-footer">
              <button type="button" class="primary-glow-btn next-btn" onclick={nextStep}>
                <span>{t('onboarding.continue')}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="btn-icon">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>

        <!-- ============================================================= -->
        <!-- STEP 2: NOTIFICATIONS & GLOW                                  -->
        <!-- ============================================================= -->
        {:else if step === 2}
          <div class="wizard-step animate-fade-in">
            <div class="step-title-wrap">
              <span class="step-eyebrow">{t('onboarding.step2_eyebrow')}</span>
              <h2 class="step-main-title">{t('onboarding.step2_title')}</h2>
              <p class="step-desc">{t('onboarding.step2_desc')}</p>
            </div>

            <div class="options-list">
              <!-- Capture Windows Notifications -->
              <div class="option-row">
                <div class="option-icon-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                </div>
                <div class="option-info">
                  <span class="option-title">{t('onboarding.capture_title')}</span>
                  <span class="option-desc">{t('onboarding.capture_sub')}</span>
                </div>
                <AppleSwitch
                  id="onboard-capture-switch"
                  bind:checked={captureNotifications}
                  ariaLabel={t('onboarding.capture_title')}
                />
              </div>

              <!-- Audio Chimes -->
              <div class="option-row">
                <div class="option-icon-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                  </svg>
                </div>
                <div class="option-info">
                  <span class="option-title">{t('onboarding.sound_title')}</span>
                  <span class="option-desc">{t('onboarding.sound_sub')}</span>
                </div>
                <div class="option-action-side">
                  <button
                    type="button"
                    class="mini-action-btn"
                    onclick={playSampleSound}
                    disabled={isPlayingSound}
                    title={t('onboarding.test_sound')}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mini-btn-icon {isPlayingSound ? 'spin' : ''}">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    <span>{t('onboarding.test_sound')}</span>
                  </button>
                  <AppleSwitch
                    id="onboard-sound-switch"
                    bind:checked={soundAlerts}
                    ariaLabel={t('onboarding.sound_title')}
                  />
                </div>
              </div>

              <!-- Bounded History Limit Slider -->
              <div class="option-row">
                <div class="option-icon-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                  </svg>
                </div>
                <div class="option-info">
                  <span class="option-title">{t('settings.history_limit')}</span>
                  <span class="option-desc">Keep up to {historyLimit} recent notifications</span>
                </div>
                <div class="slider-control-group">
                  <input
                    type="range"
                    min="10"
                    max="500"
                    step="10"
                    bind:value={historyLimit}
                    class="native-slider"
                  />
                  <span class="val-pill">{historyLimit}</span>
                </div>
              </div>
            </div>

            <!-- Architecture Info Card -->
            <div class="info-callout">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="callout-icon">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <span>Native Windows UserNotificationListener integration with privacy-first offline storage.</span>
            </div>

            <div class="wizard-step-footer">
              <button type="button" class="primary-glow-btn next-btn" onclick={nextStep}>
                <span>{t('onboarding.continue')}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="btn-icon">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>

        <!-- ============================================================= -->
        <!-- STEP 3: APPLICATION DISCOVERY                                 -->
        <!-- ============================================================= -->
        {:else if step === 3}
          <div class="wizard-step animate-fade-in">
            <div class="step-title-wrap">
              <span class="step-eyebrow">{t('onboarding.step3_eyebrow')}</span>
              <h2 class="step-main-title">{t('onboarding.step3_title')}</h2>
              <p class="step-desc">{t('onboarding.step3_desc')}</p>
            </div>

            <!-- Scanner Center Showcase -->
            <div class="scanner-hero-box">
              <div class="scanner-radar {isScanningLocal || isScanningApps ? 'pulsing' : ''}">
                <div class="radar-circle circle-1"></div>
                <div class="radar-circle circle-2"></div>
                <div class="radar-center-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    <line x1="11" y1="8" x2="11" y2="14"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                  </svg>
                </div>
              </div>

              {#if isScanningLocal || isScanningApps}
                <div class="scanner-status-text">
                  <span class="status-bold">{t('onboarding.scanning')}</span>
                  <span class="status-sub">Detecting installed desktop applications and Start Menu shortcuts...</span>
                </div>
              {:else if effectiveAppsCount > 0}
                <div class="scanner-status-text">
                  <span class="status-bold text-success">{t('onboarding.scan_complete')}</span>
                  <span class="status-sub">{t('onboarding.apps_found', { count: effectiveAppsCount })}</span>
                </div>
              {:else}
                <div class="scanner-status-text">
                  <span class="status-bold">Ready to Discover Apps</span>
                  <span class="status-sub">Scan your system to auto-configure per-app glowing notifications.</span>
                </div>
              {/if}

              <!-- Scan Action Trigger Button -->
              <button
                type="button"
                id="onboard-scan-trigger-btn"
                class="scan-action-btn"
                disabled={isScanningLocal || isScanningApps}
                onclick={handleScan}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon {isScanningLocal || isScanningApps ? 'spin' : ''}">
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
                <span>{isScanningLocal || isScanningApps ? t('onboarding.scanning') : t('onboarding.scan_btn')}</span>
              </button>

              <!-- App preview chips if apps found -->
              {#if applications.length > 0}
                <div class="discovered-chips-preview">
                  {#each applications.slice(0, 8) as app}
                    <div class="app-chip" title={app.applicationName}>
                      {#if app.icon}
                        <img src={app.icon} alt="" class="chip-icon" />
                      {:else}
                        <span class="chip-avatar-letter">{app.applicationName.charAt(0).toUpperCase()}</span>
                      {/if}
                      <span class="chip-name">{app.applicationName}</span>
                    </div>
                  {/each}
                  {#if applications.length > 8}
                    <div class="app-chip chip-more">
                      <span>+{applications.length - 8} more</span>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>

            <div class="wizard-step-footer">
              <button type="button" class="primary-glow-btn next-btn" onclick={nextStep}>
                <span>{t('onboarding.continue')}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="btn-icon">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>

        <!-- ============================================================= -->
        <!-- STEP 4: QUICK PREFERENCES                                     -->
        <!-- ============================================================= -->
        {:else if step === 4}
          <div class="wizard-step animate-fade-in">
            <div class="step-title-wrap">
              <span class="step-eyebrow">{t('onboarding.step4_eyebrow')}</span>
              <h2 class="step-main-title">{t('onboarding.step4_title')}</h2>
              <p class="step-desc">{t('onboarding.step4_desc')}</p>
            </div>

            <div class="options-list">
              <!-- Start with Windows -->
              <div class="option-row">
                <div class="option-icon-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="3" width="20" height="14" rx="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                  </svg>
                </div>
                <div class="option-info">
                  <span class="option-title">{t('onboarding.start_with_windows')}</span>
                  <span class="option-desc">{t('onboarding.start_with_windows_sub')}</span>
                </div>
                <AppleSwitch
                  id="onboard-startup-switch"
                  bind:checked={startWithWindows}
                  ariaLabel={t('onboarding.start_with_windows')}
                />
              </div>

              <!-- Minimize to Tray / Taskbar visibility -->
              <div class="option-row">
                <div class="option-icon-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                    <path d="M7 15h10"></path>
                  </svg>
                </div>
                <div class="option-info">
                  <span class="option-title">{t('onboarding.taskbar_tray')}</span>
                  <span class="option-desc">{t('onboarding.taskbar_tray_sub')}</span>
                </div>
                <AppleSwitch
                  id="onboard-taskbar-switch"
                  bind:checked={keepInTaskbar}
                  ariaLabel={t('onboarding.taskbar_tray')}
                />
              </div>

              <!-- OLED Mode -->
              <div class="option-row">
                <div class="option-icon-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                </div>
                <div class="option-info">
                  <span class="option-title">{t('onboarding.oled_mode')}</span>
                  <span class="option-desc">{t('onboarding.oled_mode_sub')}</span>
                </div>
                <AppleSwitch
                  id="onboard-oled-switch"
                  bind:checked={oledMode}
                  ariaLabel={t('onboarding.oled_mode')}
                />
              </div>

              <!-- Default Startup View -->
              <div class="option-row default-view-row">
                <div class="option-icon-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                    <polyline points="2 17 12 22 22 17"></polyline>
                    <polyline points="2 12 12 17 22 12"></polyline>
                  </svg>
                </div>
                <div class="option-info">
                  <span class="option-title">{t('onboarding.default_page')}</span>
                  <span class="option-desc">{t('onboarding.default_page_desc')}</span>
                </div>

                <div class="landing-tabs-group" role="radiogroup" aria-label={t('onboarding.default_page')}>
                  {#each [
                    { id: 'dashboard', label: 'Dashboard' },
                    { id: 'notifications', label: 'Notifications' },
                    { id: 'applications', label: 'Apps' },
                    { id: 'glow', label: 'Glow' }
                  ] as p}
                    <button
                      type="button"
                      class="landing-tab-btn {defaultPage === p.id ? 'active' : ''}"
                      onclick={() => (defaultPage = p.id as any)}
                    >
                      <span>{p.label}</span>
                    </button>
                  {/each}
                </div>
              </div>
            </div>

            <div class="wizard-step-footer">
              <button type="button" class="primary-glow-btn next-btn" onclick={nextStep}>
                <span>{t('onboarding.continue')}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="btn-icon">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>

        <!-- ============================================================= -->
        <!-- STEP 5: READY TO GO                                           -->
        <!-- ============================================================= -->
        {:else if step === 5}
          <div class="wizard-step animate-fade-in ready-step">
            <div class="step-title-wrap ready-title-wrap">
              <div class="success-badge-circle">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="check-large">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <span class="step-eyebrow text-success">{t('onboarding.step5_eyebrow')}</span>
              <h2 class="step-main-title">{t('onboarding.step5_title')}</h2>
              <p class="step-desc">
                {#if displayName.trim()}
                  Welcome, <strong>{displayName.trim()}</strong>! {t('onboarding.step5_desc')}
                {:else}
                  {t('onboarding.step5_desc')}
                {/if}
              </p>
            </div>

            <!-- Configuration Summary Card -->
            <div class="summary-card">
              <div class="summary-header">
                <span class="summary-title">Configuration Summary</span>
              </div>
              <div class="summary-grid">
                <div class="summary-item">
                  <span class="summary-label">{t('onboarding.summary_theme')}</span>
                  <div class="summary-val-wrap">
                    <span class="summary-color-pip" style:background-color={activeThemeMeta.swatches[2] || '#0070f3'}></span>
                    <span class="summary-val">{activeThemeMeta.name} ({chosenAppearance})</span>
                  </div>
                </div>

                <div class="summary-item">
                  <span class="summary-label">{t('onboarding.summary_notifications')}</span>
                  <span class="summary-val {captureNotifications ? 'text-success' : 'text-muted'}">
                    {captureNotifications ? 'Active' : 'Disabled'} {soundAlerts ? '(Sound on)' : ''}
                  </span>
                </div>

                <div class="summary-item">
                  <span class="summary-label">{t('onboarding.summary_apps')}</span>
                  <span class="summary-val">{effectiveAppsCount} Configured</span>
                </div>

                <div class="summary-item">
                  <span class="summary-label">{t('onboarding.summary_startup')}</span>
                  <span class="summary-val capitalize">{defaultPage}</span>
                </div>
              </div>
            </div>

            <!-- Launch Curry Final Action -->
            <div class="ready-footer-actions">
              <button
                type="button"
                id="onboarding-launch-curry-btn"
                class="primary-glow-btn launch-btn"
                onclick={finish}
              >
                <span>{t('onboarding.launch_curry')}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="btn-icon">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .onboarding-overlay {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    box-sizing: border-box;
    font-family: inherit;
    color: var(--text-primary, #ffffff);
  }

  .onboarding-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(8, 8, 11, 0.88);
    backdrop-filter: blur(28px);
    -webkit-backdrop-filter: blur(28px);
  }

  .onboarding-card {
    position: relative;
    width: 100%;
    max-width: 680px;
    background: rgba(18, 19, 24, 0.96);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7), 0 0 40px -10px rgba(255, 92, 0, 0.22);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    max-height: 90vh;
    animation: scale-up 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    outline: none;
  }

  .onboarding-card:focus {
    outline: none;
  }

  .onboarding-card button:focus-visible,
  .onboarding-card input:focus-visible {
    outline: 2px solid #ff7a00;
    outline-offset: 2px;
  }

  @keyframes scale-up {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(12px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .glow-orb {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
    filter: blur(70px);
    opacity: 0.35;
    z-index: 0;
  }

  .orb-primary {
    top: -80px;
    left: -80px;
    width: 240px;
    height: 240px;
    background: radial-gradient(circle, #ff5c00 0%, transparent 70%);
  }

  .orb-secondary {
    bottom: -60px;
    right: -60px;
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, #ff9000 0%, transparent 70%);
  }

  /* Wizard Top Header Navigation */
  .wizard-header {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(25, 26, 33, 0.6);
  }

  .wizard-nav-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.65);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    padding: 6px 10px;
    border-radius: 8px;
    transition: all 0.15s ease;
  }

  .wizard-nav-btn:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.08);
  }

  .wizard-nav-btn svg {
    width: 16px;
    height: 16px;
  }

  .skip-step-btn {
    color: rgba(255, 255, 255, 0.45);
  }

  .skip-step-btn:hover {
    color: var(--accent, #ff5c00);
  }

  .step-indicators {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .step-pill {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .step-pill.active {
    background: var(--accent, #ff5c00);
    border-color: var(--accent, #ff5c00);
    color: #ffffff;
    box-shadow: 0 0 12px var(--accent, #ff5c00);
    transform: scale(1.1);
  }

  .step-pill.completed {
    background: rgba(255, 92, 0, 0.2);
    border-color: rgba(255, 92, 0, 0.4);
    color: var(--accent, #ff5c00);
  }

  .check-icon {
    width: 14px;
    height: 14px;
  }

  .step-connector {
    width: 16px;
    height: 2px;
    background: rgba(255, 255, 255, 0.08);
    transition: background 0.2s ease;
  }

  .step-connector.active {
    background: var(--accent, #ff5c00);
  }

  /* Body Container */
  .wizard-body {
    position: relative;
    z-index: 1;
    padding: 32px 36px 36px;
    overflow-y: auto;
    overflow-x: hidden;
  }

  /* Hero Step (Step 0) */
  .hero-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 12px 10px;
  }

  .brand-hero-badge {
    position: relative;
    margin-bottom: 24px;
  }

  .hero-icon-wrap {
    position: relative;
    z-index: 2;
    width: 80px;
    height: 80px;
    border-radius: 22px;
    background: linear-gradient(135deg, rgba(255, 92, 0, 0.2), rgba(255, 92, 0, 0.05));
    border: 1.5px solid rgba(255, 92, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 24px rgba(255, 92, 0, 0.25);
  }

  .hero-logo-img {
    width: 52px;
    height: 52px;
    object-fit: contain;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
  }

  .brand-glow-halo {
    position: absolute;
    inset: -12px;
    background: radial-gradient(circle, rgba(255, 92, 0, 0.5) 0%, transparent 70%);
    border-radius: 50%;
    z-index: 1;
    animation: halo-pulse 3s infinite alternate ease-in-out;
  }

  @keyframes halo-pulse {
    from {
      opacity: 0.4;
      transform: scale(0.95);
    }
    to {
      opacity: 0.8;
      transform: scale(1.1);
    }
  }

  .hero-title {
    font-size: 32px;
    font-weight: 700;
    letter-spacing: -0.02em;
    margin: 0 0 6px;
    color: #ffffff;
  }

  .hero-subtitle {
    font-size: 17px;
    font-weight: 600;
    color: var(--accent, #ff5c00);
    margin: 0 0 10px;
  }

  .hero-desc {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.65);
    max-width: 420px;
    margin: 0 0 28px;
    line-height: 1.5;
  }

  .feature-showcase-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
    width: 100%;
    max-width: 480px;
    margin-bottom: 32px;
  }

  .showcase-card {
    display: flex;
    align-items: center;
    gap: 14px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 14px;
    padding: 12px 16px;
    text-align: left;
    transition: all 0.2s ease;
  }

  .showcase-card:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.12);
  }

  .showcase-icon-box {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .showcase-icon-box svg {
    width: 20px;
    height: 20px;
  }

  .glow-amber {
    background: rgba(255, 92, 0, 0.15);
    color: #ff5c00;
    border: 1px solid rgba(255, 92, 0, 0.3);
  }

  .glow-cyan {
    background: rgba(0, 180, 255, 0.15);
    color: #00b4ff;
    border: 1px solid rgba(0, 180, 255, 0.3);
  }

  .glow-purple {
    background: rgba(168, 85, 247, 0.15);
    color: #a855f7;
    border: 1px solid rgba(168, 85, 247, 0.3);
  }

  .showcase-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .showcase-heading {
    font-size: 13px;
    font-weight: 600;
    color: #ffffff;
  }

  .showcase-sub {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.55);
  }

  .hero-footer-actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    width: 100%;
    max-width: 320px;
  }

  .primary-glow-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 13px 24px;
    background: linear-gradient(135deg, var(--accent, #ff5c00), #e26512);
    border: none;
    border-radius: 12px;
    color: #ffffff;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 18px rgba(255, 92, 0, 0.35);
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .primary-glow-btn:hover {
    transform: translateY(-1.5px);
    box-shadow: 0 6px 24px rgba(255, 92, 0, 0.5);
    filter: brightness(1.05);
  }

  .primary-glow-btn:active {
    transform: translateY(0);
  }

  .btn-icon {
    width: 16px;
    height: 16px;
  }

  .ghost-link-btn {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.45);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 8px;
    transition: color 0.15s ease;
  }

  .ghost-link-btn:hover {
    color: #ffffff;
  }

  /* Step Generic Titles */
  .step-title-wrap {
    margin-bottom: 24px;
  }

  .step-eyebrow {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--accent, #ff5c00);
    display: block;
    margin-bottom: 4px;
  }

  .step-main-title {
    font-size: 24px;
    font-weight: 700;
    letter-spacing: -0.01em;
    margin: 0 0 6px;
    color: #ffffff;
  }

  .step-desc {
    font-size: 13.5px;
    color: rgba(255, 255, 255, 0.6);
    margin: 0;
    line-height: 1.45;
  }

  /* Form Elements */
  .step-content-grid {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 28px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .form-label {
    font-size: 12.5px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.85);
  }

  .input-with-icon {
    position: relative;
    display: flex;
    align-items: center;
  }

  .field-icon {
    position: absolute;
    left: 14px;
    width: 16px;
    height: 16px;
    color: rgba(255, 255, 255, 0.4);
    pointer-events: none;
  }

  .wizard-text-input {
    width: 100%;
    padding: 11px 14px 11px 40px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: #ffffff;
    font-size: 13.5px;
    outline: none;
    transition: all 0.2s ease;
  }

  .wizard-text-input:focus {
    border-color: var(--accent, #ff5c00);
    box-shadow: 0 0 14px rgba(255, 92, 0, 0.25);
    background: rgba(255, 255, 255, 0.06);
  }

  /* Appearance Card Selectors */
  .appearance-card-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .appearance-select-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 12px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: rgba(255, 255, 255, 0.65);
  }

  .appearance-select-btn:hover {
    background: rgba(255, 255, 255, 0.06);
    color: #ffffff;
  }

  .appearance-select-btn.active {
    background: rgba(255, 92, 0, 0.12);
    border-color: var(--accent, #ff5c00);
    color: #ffffff;
    box-shadow: 0 0 12px rgba(255, 92, 0, 0.2);
  }

  .mode-icon {
    width: 22px;
    height: 22px;
  }

  .mode-label {
    font-size: 12px;
    font-weight: 600;
  }

  /* Themes Pill Grid */
  .theme-label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .active-theme-badge {
    font-size: 11px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 6px;
    background: rgba(255, 92, 0, 0.15);
    color: var(--accent, #ff5c00);
    border: 1px solid rgba(255, 92, 0, 0.3);
  }

  .themes-pill-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 8px;
    max-height: 180px;
    overflow-y: auto;
    padding: 2px;
  }

  .theme-compact-card {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
  }

  .theme-compact-card:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.14);
  }

  .theme-compact-card.active {
    background: rgba(255, 92, 0, 0.14);
    border-color: var(--accent, #ff5c00);
    box-shadow: 0 0 10px rgba(255, 92, 0, 0.2);
  }

  .theme-swatch-row {
    display: flex;
    gap: 3px;
    flex-shrink: 0;
  }

  .swatch-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .theme-name {
    font-size: 11.5px;
    font-weight: 600;
    color: #ffffff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Options List (Steps 2 and 4) */
  .options-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 28px;
  }

  .option-row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 14px;
    transition: background 0.15s ease;
  }

  .option-row:hover {
    background: rgba(255, 255, 255, 0.045);
  }

  .option-icon-box {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.09);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--accent, #ff5c00);
    flex-shrink: 0;
  }

  .option-icon-box svg {
    width: 18px;
    height: 18px;
  }

  .option-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .option-title {
    font-size: 13.5px;
    font-weight: 600;
    color: #ffffff;
  }

  .option-desc {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.55);
  }

  .option-action-side {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .mini-action-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    color: #ffffff;
    font-size: 11.5px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .mini-action-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .mini-btn-icon {
    width: 12px;
    height: 12px;
  }

  .slider-control-group {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .native-slider {
    width: 120px;
    accent-color: var(--accent, #ff5c00);
    cursor: pointer;
  }

  .val-pill {
    font-size: 12px;
    font-weight: 700;
    padding: 2px 7px;
    background: rgba(255, 92, 0, 0.15);
    color: var(--accent, #ff5c00);
    border-radius: 6px;
    min-width: 32px;
    text-align: center;
  }

  .info-callout {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: rgba(255, 92, 0, 0.08);
    border: 1px solid rgba(255, 92, 0, 0.2);
    border-radius: 10px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 24px;
  }

  .callout-icon {
    width: 16px;
    height: 16px;
    color: var(--accent, #ff5c00);
    flex-shrink: 0;
  }

  /* Step 3: Application Discovery */
  .scanner-hero-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 18px 12px;
    margin-bottom: 24px;
  }

  .scanner-radar {
    position: relative;
    width: 84px;
    height: 84px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
  }

  .radar-circle {
    position: absolute;
    inset: 0;
    border: 1.5px solid rgba(255, 92, 0, 0.3);
    border-radius: 50%;
  }

  .circle-2 {
    inset: -10px;
    border-color: rgba(255, 92, 0, 0.15);
  }

  .radar-center-icon {
    position: relative;
    z-index: 2;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(255, 92, 0, 0.18);
    border: 1.5px solid var(--accent, #ff5c00);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    box-shadow: 0 0 16px rgba(255, 92, 0, 0.3);
  }

  .radar-center-icon svg {
    width: 22px;
    height: 22px;
  }

  .scanner-radar.pulsing .circle-1 {
    animation: ping-1 1.8s infinite cubic-bezier(0, 0, 0.2, 1);
  }

  .scanner-radar.pulsing .circle-2 {
    animation: ping-2 1.8s infinite cubic-bezier(0, 0, 0.2, 1);
  }

  @keyframes ping-1 {
    75%, 100% {
      transform: scale(1.3);
      opacity: 0;
    }
  }

  @keyframes ping-2 {
    75%, 100% {
      transform: scale(1.5);
      opacity: 0;
    }
  }

  .scanner-status-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 18px;
  }

  .status-bold {
    font-size: 15px;
    font-weight: 700;
    color: #ffffff;
  }

  .text-success {
    color: #10b981 !important;
  }

  .status-sub {
    font-size: 12.5px;
    color: rgba(255, 255, 255, 0.55);
  }

  .scan-action-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 10px;
    color: #ffffff;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-bottom: 20px;
  }

  .scan-action-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.14);
    border-color: rgba(255, 255, 255, 0.25);
  }

  .scan-action-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .discovered-chips-preview {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    max-width: 480px;
  }

  .app-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
  }

  .chip-icon {
    width: 16px;
    height: 16px;
    object-fit: contain;
  }

  .chip-avatar-letter {
    width: 16px;
    height: 16px;
    border-radius: 4px;
    background: rgba(255, 92, 0, 0.2);
    color: var(--accent, #ff5c00);
    font-size: 10px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .chip-name {
    font-size: 11.5px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.85);
    max-width: 100px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .chip-more {
    color: rgba(255, 255, 255, 0.5);
    font-size: 11px;
    font-weight: 600;
  }

  /* Default Landing Page Radio Group (Step 4) */
  .default-view-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .landing-tabs-group {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
    width: 100%;
  }

  .landing-tab-btn {
    padding: 8px 10px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.65);
    font-size: 11.5px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: center;
  }

  .landing-tab-btn:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.08);
  }

  .landing-tab-btn.active {
    background: rgba(255, 92, 0, 0.14);
    border-color: var(--accent, #ff5c00);
    color: #ffffff;
    box-shadow: 0 0 10px rgba(255, 92, 0, 0.2);
  }

  /* Step 5: Ready to Go */
  .ready-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .ready-title-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .success-badge-circle {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: rgba(16, 185, 129, 0.16);
    border: 2px solid #10b981;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #10b981;
    margin-bottom: 14px;
    box-shadow: 0 0 24px rgba(16, 185, 129, 0.35);
  }

  .check-large {
    width: 28px;
    height: 28px;
  }

  .summary-card {
    width: 100%;
    max-width: 460px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 16px 20px;
    margin-bottom: 28px;
    text-align: left;
  }

  .summary-header {
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    padding-bottom: 10px;
    margin-bottom: 12px;
  }

  .summary-title {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba(255, 255, 255, 0.45);
  }

  .summary-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px 18px;
  }

  .summary-item {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .summary-label {
    font-size: 11.5px;
    color: rgba(255, 255, 255, 0.5);
  }

  .summary-val-wrap {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .summary-color-pip {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .summary-val {
    font-size: 12.5px;
    font-weight: 600;
    color: #ffffff;
  }

  .capitalize {
    text-transform: capitalize;
  }

  .ready-footer-actions {
    width: 100%;
    max-width: 320px;
  }

  .launch-btn {
    padding: 14px 28px;
    font-size: 15px;
  }

  .wizard-step-footer {
    display: flex;
    justify-content: flex-end;
  }

  .next-btn {
    width: auto;
    min-width: 140px;
  }

  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .animate-fade-in {
    animation: fade-in 0.24s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 600px) {
    .onboarding-card {
      max-height: 96vh;
    }
    .wizard-body {
      padding: 24px 20px;
    }
    .themes-pill-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .landing-tabs-group {
      grid-template-columns: repeat(2, 1fr);
    }
    .summary-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
