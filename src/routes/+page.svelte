<script lang="ts">
  import { onMount } from "svelte";
  import { invoke } from "@tauri-apps/api/core";
  import { listen } from "@tauri-apps/api/event";
  import { THEMES, DEFAULT_THEME, type ThemeId, getThemeGlowPalette } from "$lib/themes";
  import Dropdown, { type DropdownItem } from "$lib/Dropdown.svelte";
  import Skeleton from "$lib/Skeleton.svelte";
  import AppearanceTabs, { type Appearance } from "$lib/AppearanceTabs.svelte";
  import AppleSwitch from "$lib/components/AppleSwitch.svelte";
  import ColorPicker from "$lib/ColorPicker.svelte";
  import { check as checkUpdate } from "@tauri-apps/plugin-updater";
  import { t, currentLanguage, setLanguage, initLanguage, LANGUAGE_DROPDOWN_OPTIONS, type SupportedLocale } from "$lib/i18n";
  import { errorStore } from "$lib/errors";
  import ErrorIsland from "$lib/components/ErrorIsland.svelte";
  import ErrorModal from "$lib/components/ErrorModal.svelte";
  import ThemeSelector from "$lib/components/ThemeSelector.svelte";
  import { APP_VERSION } from "$lib/version";

  interface ConnectionInfo {
    connected: boolean;
    app_name: string;
    version: string;
    target_os: string;
    target_arch: string;
    message: string;
  }

  interface Notification {
    id: string;
    title: string;
    message?: string;
    body: string;
    timestamp: number;
    duration?: number | null;
    enabled?: boolean;
    source?: string | null;
    app_name: string;
    source_app?: string;
    icon?: string | null;
    platform: string;
    urgency?: "low" | "normal" | "high" | "critical" | null;
    read: boolean;
  }

  interface GlowSettings {
    enabled: boolean;
    duration_ms: number;
    intensity: number;
    thickness: number;
    corner_radius: number;
    animation_style: "pulse" | "sweep" | "ambient" | "comet" | "ripple" | "breathing" | "solid";
    monitor_target: "primary" | "active" | "all" | string;
    color: string;
  }

  interface ApplicationProfile {
    id: string;
    applicationName: string;
    executableName: string;
    executablePath?: string | null;
    enabled: boolean;
    color?: string | null;
    animation?: "pulse" | "sweep" | "ambient" | "comet" | "ripple" | null;
    intensity?: number | null;
    duration?: number | null;
    borderThickness?: number | null;
    cornerRounding?: number | null;
    monitorTarget?: "primary" | "active" | "all" | string | null;
    suppressInFullscreen?: boolean | null;
  }

  interface ParsedExecutableInfo {
    displayName: string;
    executableName: string;
    executablePath: string | null;
  }

  interface AppSettings {
    enabled: boolean;
    startup_enabled: boolean;
    show_notifications: boolean;
    history_limit: number;
    sound_enabled: boolean;
    glow: GlowSettings;
    theme?: ThemeId;
    appearance?: Appearance;
    language?: string;
    applications?: ApplicationProfile[];
    oled_mode?: boolean;
    fullscreen_behavior?: "always_show" | "suppress_in_fullscreen" | "suppress_gaming";
    auto_update_enabled?: boolean;
    auto_update_frequency?: "startup" | "daily" | "weekly" | "monthly";
    last_update_check?: number | null;
    reduced_motion?: boolean;
  }

  type ProviderStatus =
    | "idle"
    | "listening"
    | "permission_required"
    | "permission_denied"
    | "unsupported"
    | { error: string };

  interface PipelineStatus {
    provider_name: string;
    provider_status: ProviderStatus;
    captured_count: number;
    is_enabled: boolean;
  }

  function getAppInitial(name: string | undefined): string {
    if (!name || !name.trim()) return "N";
    return name.trim().charAt(0).toUpperCase();
  }

  function formatTimestamp(ts: number): string {
    if (!ts || isNaN(ts)) return t("common.just_now");
    const elapsedSecs = Math.floor((Date.now() - ts) / 1000);
    if (elapsedSecs < 10) return t("common.just_now");
    if (elapsedSecs < 60) return t("common.seconds_ago", { n: elapsedSecs });
    const elapsedMins = Math.floor(elapsedSecs / 60);
    if (elapsedMins < 60) return t("common.minutes_ago", { n: elapsedMins });
    const elapsedHours = Math.floor(elapsedMins / 60);
    if (elapsedHours < 24) return t("common.hours_ago", { n: elapsedHours });
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  // Theme Management (Defaults to Standard)
  let selectedTheme = $state<ThemeId>(DEFAULT_THEME);
  let currentGlowPalette = $derived(getThemeGlowPalette(selectedTheme));

  // Appearance Management (System / Light / Dark)
  let appearance = $state<Appearance>("system");
  let osPrefersDark = $state(true);

  let effectiveAppearance = $derived(
    appearance === "system" ? (osPrefersDark ? "dark" : "light") : appearance
  );

  $effect(() => {
    if (typeof window !== "undefined") {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      osPrefersDark = mql.matches;
      const handler = (e: MediaQueryListEvent) => {
        if (osPrefersDark !== e.matches) {
          osPrefersDark = e.matches;
        }
      };
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    }
  });

  $effect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-appearance", effectiveAppearance);
      document.body.setAttribute("data-appearance", effectiveAppearance);
    }
  });

  function handleAppearanceChange(newVal: Appearance) {
    appearance = newVal;
    appSettings.appearance = newVal;
    saveAppSettings();
  }

  function selectTheme(themeId: ThemeId) {
    selectedTheme = themeId;
    appSettings.theme = themeId;
    saveAppSettings();
    try {
      localStorage.setItem("curry_selected_theme", themeId);
    } catch (err) {
      console.error("Failed to persist theme in localStorage:", err);
    }
  }

  $effect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", selectedTheme);
      document.body.setAttribute("data-theme", selectedTheme);
    }
  });

  let lastSyncedChrome = {
    appearance: "" as Appearance,
    theme: "" as ThemeId,
    isDark: null as boolean | null,
  };

  // Synchronize native window chrome (caption bar & buttons) whenever theme or appearance changes
  // Guarded to prevent cyclical event storms or OS feedback loops
  $effect(() => {
    const isDark = effectiveAppearance === "dark";
    if (
      lastSyncedChrome.appearance === appearance &&
      lastSyncedChrome.theme === selectedTheme &&
      lastSyncedChrome.isDark === isDark
    ) {
      return;
    }
    lastSyncedChrome = { appearance, theme: selectedTheme, isDark };
    invoke("sync_window_chrome", {
      appearance,
      theme: selectedTheme,
      isDark,
    }).catch((err) => {
      console.warn("Failed to sync window chrome:", err);
    });
  });

  // Software Update Management
  function formatUserVersion(v: string | undefined | null): string {
    if (!v) return APP_VERSION;
    const clean = v.replace(/^v/, "");
    const parts = clean.split(".");
    if (parts.length >= 2) {
      return `${parts[0]}.${parts[1]}`;
    }
    return clean;
  }

  function handleLanguageChange(newLang: string) {
    const valid = newLang as SupportedLocale;
    setLanguage(valid);
    appSettings.language = valid;
    saveAppSettings();
  }

  let AUTO_UPDATE_FREQUENCY_OPTIONS = $derived<DropdownItem[]>([
    { value: "startup", label: t("settings.frequency_startup"), description: t("settings.frequency_startup_desc") },
    { value: "daily", label: t("settings.frequency_daily"), description: t("settings.frequency_daily_desc") },
    { value: "weekly", label: t("settings.frequency_weekly"), description: t("settings.frequency_weekly_desc") },
    { value: "monthly", label: t("settings.frequency_monthly"), description: t("settings.frequency_monthly_desc") },
  ]);

  type UpdateLifecycleState =
    | "idle"
    | "checking"
    | "uptodate"
    | "available"
    | "downloading"
    | "verifying"
    | "installing"
    | "restart_required"
    | "error";

  let updateState = $state<UpdateLifecycleState>("idle");
  let updateProgress = $state<number | null>(null);
  let isCheckingUpdate = $derived(updateState === "checking");
  let isInstallingUpdate = $derived(
    updateState === "downloading" ||
    updateState === "verifying" ||
    updateState === "installing"
  );
  let updateStatusMessage = $state<string | null>(null);
  let updateAvailable = $derived(updateState === "available");
  let pendingUpdateObj = $state<any>(null);
  let updateDownloadCancelled = $state(false);

  async function checkForUpdatesManually() {
    if (isCheckingUpdate || isInstallingUpdate) return;
    updateState = "checking";
    updateProgress = null;
    updateStatusMessage = t("updater.checking");

    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        updateState = "error";
        updateStatusMessage = t("updater.offline");
        return;
      }

      const checkPromise = checkUpdate();
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout: Update check took longer than 15s")), 15000)
      );

      const update = await Promise.race([checkPromise, timeoutPromise]);
      appSettings.last_update_check = Math.floor(Date.now() / 1000);
      saveAppSettings();

      if (update && update.available) {
        pendingUpdateObj = update;
        updateState = "available";
        updateStatusMessage = t("updater.update_available", {
          version: formatUserVersion(update.version),
        });
      } else {
        pendingUpdateObj = null;
        updateState = "uptodate";
        updateStatusMessage = t("updater.up_to_date", {
          version: formatUserVersion(connectionInfo?.version ?? APP_VERSION),
        });
      }
    } catch (err: unknown) {
      updateState = "error";
      const errStr = err instanceof Error ? err.message : String(err);
      console.warn("[Updater] Check returned:", errStr);

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        updateStatusMessage = t("updater.offline");
      } else if (
        errStr.includes("429") ||
        errStr.toLowerCase().includes("rate limit") ||
        errStr.includes("403")
      ) {
        updateStatusMessage = t("updater.rate_limited");
      } else if (
        errStr.includes("404") ||
        errStr.toLowerCase().includes("not found")
      ) {
        updateStatusMessage = t("updater.server_error");
      } else if (
        errStr.toLowerCase().includes("signature") ||
        errStr.toLowerCase().includes("minisign") ||
        errStr.toLowerCase().includes("public key") ||
        errStr.toLowerCase().includes("invalid symbol") ||
        errStr.toLowerCase().includes("base64")
      ) {
        updateStatusMessage = t("updater.signature_error");
      } else {
        updateStatusMessage = t("updater.network_error");
      }
    }
  }

  async function checkAutoUpdateIfDue() {
    if (appSettings.auto_update_enabled === false) return;
    const now = Math.floor(Date.now() / 1000);
    const freq = appSettings.auto_update_frequency || "daily";
    const last = appSettings.last_update_check || 0;

    let isDue = false;
    if (freq === "startup") {
      isDue = true;
    } else if (freq === "daily" && now - last >= 86400) {
      isDue = true;
    } else if (freq === "weekly" && now - last >= 604800) {
      isDue = true;
    } else if (freq === "monthly" && now - last >= 2592000) {
      isDue = true;
    }

    if (!isDue) return;
    if (isCheckingUpdate || isInstallingUpdate) return;

    try {
      const update = await checkUpdate();
      appSettings.last_update_check = now;
      saveAppSettings();
      if (update && update.available) {
        pendingUpdateObj = update;
        updateState = "available";
        updateStatusMessage = t("updater.update_available", {
          version: formatUserVersion(update.version),
        });
      }
    } catch {
      // Silent background check failure
    }
  }

  function cancelUpdateDownload() {
    if (updateState === "downloading") {
      updateDownloadCancelled = true;
      updateState = "available";
      updateProgress = null;
      updateStatusMessage = t("updater.update_available", {
        version: formatUserVersion(pendingUpdateObj?.version ?? APP_VERSION),
      });
    }
  }

  async function restartCurry() {
    try {
      await invoke("restart_app");
    } catch {
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    }
  }

  async function installUpdate() {
    if (!pendingUpdateObj || isInstallingUpdate) return;
    updateDownloadCancelled = false;
    updateState = "downloading";
    updateProgress = 0;
    updateStatusMessage = t("updater.downloading", { progress: 0 });

    try {
      let downloaded = 0;
      let totalLength = 0;

      await pendingUpdateObj.downloadAndInstall((event: any) => {
        if (updateDownloadCancelled) {
          throw new Error("Download cancelled by user");
        }
        if (event.event === "Started") {
          totalLength = event.data?.contentLength ?? 0;
          downloaded = 0;
          updateState = "downloading";
          updateProgress = 0;
          updateStatusMessage = t("updater.downloading", { progress: 0 });
        } else if (event.event === "Progress") {
          downloaded += event.data?.chunkLength ?? 0;
          if (totalLength > 0) {
            updateProgress = Math.min(100, Math.round((downloaded / totalLength) * 100));
          }
          updateStatusMessage = t("updater.downloading", { progress: updateProgress ?? 0 });
        } else if (event.event === "Finished") {
          updateProgress = 100;
          updateState = "verifying";
          updateStatusMessage = t("updater.verifying");
        }
      });

      updateState = "restart_required";
      updateStatusMessage = t("updater.restart_required");
    } catch (err: unknown) {
      if (updateDownloadCancelled) {
        return;
      }
      const errStr = err instanceof Error ? err.message : String(err);
      console.warn("[Updater] Installation failed:", errStr);
      updateState = "error";

      if (
        errStr.toLowerCase().includes("signature") ||
        errStr.toLowerCase().includes("key") ||
        errStr.toLowerCase().includes("invalid symbol") ||
        errStr.toLowerCase().includes("base64")
      ) {
        updateStatusMessage = t("updater.signature_error");
      } else {
        updateStatusMessage = t("updater.server_error");
      }

      errorStore.report({
        category: "update",
        rawError: err,
        title: "Update Installation Incomplete",
        message: updateStatusMessage,
        suggestion: "Your current Curry installation remains untouched. You can retry or download the installer directly.",
      });
    }
  }

  // Mark all notifications as read
  let isMarkingAllRead = $state(false);
  async function markAllNotificationsAsRead() {
    if (isMarkingAllRead || unreadCount === 0) return;
    isMarkingAllRead = true;
    try {
      notifications = notifications.map((n) => ({ ...n, read: true }));
      await invoke("mark_all_notifications_as_read");
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
      await fetchNotifications();
    } finally {
      isMarkingAllRead = false;
    }
  }

  let ANIMATION_OPTIONS = $derived<DropdownItem[]>([
    { value: "pulse", label: t("anim.pulse"), description: t("anim.pulse_desc") },
    { value: "sweep", label: t("anim.sweep"), description: t("anim.sweep_desc") },
    { value: "ambient", label: t("anim.ambient"), description: t("anim.ambient_desc") },
    { value: "comet", label: t("anim.comet"), description: t("anim.comet_desc") },
    { value: "ripple", label: t("anim.ripple"), description: t("anim.ripple_desc") },
  ]);

  let MONITOR_OPTIONS = $derived<DropdownItem[]>([
    { value: "primary", label: t("glow.monitor_primary"), description: t("glow.monitor_primary_desc") },
    { value: "active", label: t("glow.monitor_active"), description: t("glow.monitor_active_desc") },
    { value: "all", label: t("glow.monitor_all"), description: t("glow.monitor_all_desc") },
  ]);

  let FULLSCREEN_OPTIONS = $derived<DropdownItem[]>([
    { value: "always_show", label: t("fullscreen.always_show"), description: t("fullscreen.always_show_desc") },
    { value: "suppress_in_fullscreen", label: t("fullscreen.suppress_in_fullscreen"), description: t("fullscreen.suppress_in_fullscreen_desc") },
    { value: "suppress_gaming", label: t("fullscreen.suppress_gaming"), description: t("fullscreen.suppress_gaming_desc") },
  ]);

  // Loading and skeleton state
  let showNotificationsSkeleton = $state(false);

  // Throttled pipeline status fetch during bursts
  let pipelineThrottleTimer: ReturnType<typeof setTimeout> | null = null;
  function schedulePipelineStatusFetch() {
    if (pipelineThrottleTimer) return;
    pipelineThrottleTimer = setTimeout(() => {
      pipelineThrottleTimer = null;
      fetchPipelineStatus();
    }, 400);
  }

  type TabKey = "dashboard" | "notifications" | "applications" | "glow" | "settings";

  const TAB_ORDER: Record<TabKey, number> = {
    dashboard: 0,
    notifications: 1,
    applications: 2,
    glow: 3,
    settings: 4,
  };

  // Top Tab Navigation State with Directional Motion
  let activeTab = $state<TabKey>("dashboard");
  let navDirection = $state<"forward" | "backward" | "none">("none");
  let feedFilter = $state<"all" | "unread" | "critical">("all");

  function navigateToTab(target: TabKey) {
    if (target === activeTab) return;
    const oldIdx = TAB_ORDER[activeTab];
    const newIdx = TAB_ORDER[target];
    navDirection = newIdx > oldIdx ? "forward" : "backward";
    activeTab = target;
  }

  // Animated Sliding Tab Indicator State
  let navCenterTabsEl = $state<HTMLElement | null>(null);
  let activeTabIndicator = $state({ left: 0, width: 0, ready: false });

  function updateTabIndicator() {
    if (typeof window !== "undefined" && navCenterTabsEl) {
      const activeBtn = navCenterTabsEl.querySelector<HTMLElement>(`#tab-${activeTab}-btn`);
      if (activeBtn) {
        const navRect = navCenterTabsEl.getBoundingClientRect();
        const btnRect = activeBtn.getBoundingClientRect();
        activeTabIndicator = {
          left: Math.round(btnRect.left - navRect.left),
          width: Math.round(btnRect.width),
          ready: true,
        };
      }
    }
  }

  $effect(() => {
    const _t = activeTab;
    const _l = $currentLanguage;
    if (typeof window !== "undefined") {
      requestAnimationFrame(() => updateTabIndicator());
    }
  });

  function handleTabKeyDown(e: KeyboardEvent, current: TabKey) {
    const tabs: TabKey[] = ["dashboard", "notifications", "applications", "glow", "settings"];
    const currentIdx = TAB_ORDER[current];
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const nextTab = tabs[(currentIdx + 1) % tabs.length];
      navigateToTab(nextTab);
      document.getElementById(`tab-${nextTab}-btn`)?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prevTab = tabs[(currentIdx - 1 + tabs.length) % tabs.length];
      navigateToTab(prevTab);
      document.getElementById(`tab-${prevTab}-btn`)?.focus();
    }
  }

  // Connection & System State
  let status = $state<"checking" | "connected" | "disconnected">("checking");
  let connectionInfo = $state<ConnectionInfo | null>(null);
  let errorMessage = $state<string | null>(null);
  let lastCheckedAt = $state<string | null>(null);
  let pingCount = $state(0);
  let isPinging = $state(false);

  // Application & Settings State
  let isEnabled = $state(true);
  let isToggling = $state(false);
  let appSettings = $state<AppSettings>({
    enabled: true,
    startup_enabled: false,
    show_notifications: true,
    history_limit: 100,
    sound_enabled: false,
    glow: {
      enabled: true,
      duration_ms: 2500,
      intensity: 0.8,
      thickness: 8,
      corner_radius: 24,
      animation_style: "pulse",
      monitor_target: "primary",
      color: "#6366f1",
    },
    theme: DEFAULT_THEME,
    applications: [],
    oled_mode: false,
    fullscreen_behavior: "suppress_in_fullscreen",
    reduced_motion: false,
  });

  // Application Profiles State
  let applications = $state<ApplicationProfile[]>([]);
  let appSearchQuery = $state("");
  let editingProfile = $state<ApplicationProfile | null>(null);
  let isProfileModalOpen = $state(false);
  let isCreatingNewProfile = $state(false);
  let isPreviewingProfile = $state(false);
  let profileActionError = $state<string | null>(null);

  // Apps View Mode: "grid" vs "list"
  let appsViewMode = $state<"grid" | "list">("grid");
  let profileToDelete = $state<ApplicationProfile | null>(null);

  function setAppsViewMode(mode: "grid" | "list") {
    appsViewMode = mode;
    try {
      localStorage.setItem("curry_apps_view_mode", mode);
    } catch (err) {
      console.warn("Failed to persist apps view mode:", err);
    }
  }

  function requestDeleteProfile(profile: ApplicationProfile) {
    profileToDelete = profile;
  }

  function confirmDeleteProfile() {
    if (profileToDelete) {
      deleteProfile(profileToDelete.id);
      profileToDelete = null;
    }
  }

  function cancelDeleteProfile() {
    profileToDelete = null;
  }

  let filteredProfiles = $derived.by(() => {
    const q = appSearchQuery.trim().toLowerCase();
    if (!q) return applications;
    return applications.filter(
      (p) =>
        p.applicationName.toLowerCase().includes(q) ||
        p.executableName.toLowerCase().includes(q)
    );
  });

  const DEFAULT_STARTER_PROFILES: ApplicationProfile[] = [
    {
      id: "prof-discord",
      applicationName: "Discord",
      executableName: "Discord.exe",
      enabled: true,
      color: "#5865F2",
      animation: "comet",
      intensity: 0.85,
      duration: 2.5,
      monitorTarget: "primary",
      suppressInFullscreen: false,
    },
    {
      id: "prof-spotify",
      applicationName: "Spotify",
      executableName: "Spotify.exe",
      enabled: true,
      color: "#1DB954",
      animation: "ambient",
      intensity: 0.70,
      duration: 2.0,
      monitorTarget: "primary",
      suppressInFullscreen: true,
    },
    {
      id: "prof-steam",
      applicationName: "Steam",
      executableName: "steam.exe",
      enabled: true,
      color: "#1b2838",
      animation: "pulse",
      intensity: 0.80,
      duration: 2.0,
      monitorTarget: "primary",
      suppressInFullscreen: true,
    },
  ];

  async function fetchApplicationProfiles() {
    try {
      const list = await invoke<ApplicationProfile[]>("get_application_profiles");
      if (list && list.length > 0) {
        applications = list;
      } else if (applications.length === 0) {
        // Initialize starter presets
        applications = [...DEFAULT_STARTER_PROFILES];
        for (const p of DEFAULT_STARTER_PROFILES) {
          try {
            await invoke("save_application_profile", { profile: p });
          } catch {
            // ignore initial seeding error
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch application profiles:", err);
    }
  }

  function openAddProfileModal() {
    profileActionError = null;
    editingProfile = {
      id: `prof-${Date.now()}`,
      applicationName: "",
      executableName: "",
      executablePath: null,
      enabled: true,
      color: appSettings.glow.color,
      animation: "pulse",
      intensity: appSettings.glow.intensity,
      duration: Math.round((appSettings.glow.duration_ms / 1000) * 10) / 10,
      borderThickness: appSettings.glow.thickness,
      cornerRounding: appSettings.glow.corner_radius,
      monitorTarget: appSettings.glow.monitor_target,
      suppressInFullscreen: false,
    };
    isCreatingNewProfile = true;
    isProfileModalOpen = true;
  }

  function openEditProfileModal(p: ApplicationProfile) {
    profileActionError = null;
    editingProfile = {
      ...p,
      executablePath: p.executablePath ?? null,
      color: p.color ?? appSettings.glow.color,
      animation: p.animation ?? "pulse",
      intensity: p.intensity ?? appSettings.glow.intensity,
      duration: p.duration ?? Math.round((appSettings.glow.duration_ms / 1000) * 10) / 10,
      borderThickness: p.borderThickness ?? appSettings.glow.thickness,
      cornerRounding: p.cornerRounding ?? appSettings.glow.corner_radius,
      monitorTarget: p.monitorTarget ?? appSettings.glow.monitor_target,
      suppressInFullscreen: p.suppressInFullscreen ?? false,
    };
    isCreatingNewProfile = false;
    isProfileModalOpen = true;
  }

  function closeProfileModal() {
    isProfileModalOpen = false;
    editingProfile = null;
    profileActionError = null;
  }

  async function browseForExecutable() {
    profileActionError = null;
    try {
      const res = await invoke<ParsedExecutableInfo | null>("pick_executable_file");
      if (res && editingProfile) {
        editingProfile.executableName = res.executableName;
        editingProfile.executablePath = res.executablePath || null;
        if (!editingProfile.applicationName || editingProfile.applicationName.trim() === "" || isCreatingNewProfile) {
          editingProfile.applicationName = res.displayName;
        }
      }
    } catch (err) {
      const appErr = errorStore.report({
        category: "profile",
        rawError: err,
      });
      profileActionError = appErr.message;
    }
  }

  async function handleExeBlur() {
    if (!editingProfile || !editingProfile.executableName.trim()) return;
    const val = editingProfile.executableName.trim();
    if (val.includes("\\") || val.includes("/")) {
      try {
        const info = await invoke<ParsedExecutableInfo>("parse_executable_path", { path: val });
        editingProfile.executableName = info.executableName;
        editingProfile.executablePath = info.executablePath || val;
        if (!editingProfile.applicationName || editingProfile.applicationName.trim() === "" || isCreatingNewProfile) {
          editingProfile.applicationName = info.displayName;
        }
      } catch {
        // preserve as-is
      }
    } else if (!editingProfile.applicationName || editingProfile.applicationName.trim() === "") {
      const stripped = val.toLowerCase().endsWith(".exe") ? val.slice(0, -4) : val;
      if (stripped.length > 0) {
        editingProfile.applicationName = stripped.charAt(0).toUpperCase() + stripped.slice(1);
      }
    }
  }

  async function saveProfile() {
    if (!editingProfile) return;
    const appName = editingProfile.applicationName.trim();
    const exeName = editingProfile.executableName.trim();

    if (!appName) {
      profileActionError = "App name is required.";
      return;
    }
    if (appName.length > 100) {
      profileActionError = "App name is too long (maximum 100 characters).";
      return;
    }
    if (!exeName) {
      profileActionError = "Executable name is required (e.g. Discord.exe).";
      return;
    }
    if (!exeName.toLowerCase().endsWith(".exe")) {
      profileActionError = "Executable name must end with .exe (e.g. Discord.exe).";
      return;
    }
    if (editingProfile.executablePath && editingProfile.executablePath.length > 512) {
      profileActionError = "Executable path is too long (maximum 512 characters).";
      return;
    }

    // Client-side duplicate check (case-insensitive)
    const normExe = exeName.toLowerCase();
    const normExeStripped = normExe.endsWith(".exe") ? normExe.slice(0, -4) : normExe;
    const isDuplicate = applications.some((p) => {
      if (p.id === editingProfile!.id) return false;
      const pExe = p.executableName.trim().toLowerCase();
      const pExeStripped = pExe.endsWith(".exe") ? pExe.slice(0, -4) : pExe;
      return pExe === normExe || pExeStripped === normExeStripped;
    });

    if (isDuplicate) {
      profileActionError = `An app profile for ${exeName} already exists.`;
      return;
    }

    if (editingProfile.borderThickness != null) {
      const bt = Number(editingProfile.borderThickness);
      if (isNaN(bt) || bt < 2 || bt > 32) {
        profileActionError = "Border thickness must be between 2 and 32 px.";
        return;
      }
    }
    if (editingProfile.cornerRounding != null) {
      const cr = Number(editingProfile.cornerRounding);
      if (isNaN(cr) || cr < 0 || cr > 48) {
        profileActionError = "Corner rounding must be between 0 and 48 px.";
        return;
      }
    }

    try {
      const saved = await invoke<ApplicationProfile>("save_application_profile", {
        profile: {
          ...editingProfile,
          applicationName: appName,
          executableName: exeName,
          executablePath: editingProfile.executablePath?.trim() || null,
          animation: editingProfile.animation || "pulse",
          borderThickness: editingProfile.borderThickness != null ? Number(editingProfile.borderThickness) : null,
          cornerRounding: editingProfile.cornerRounding != null ? Number(editingProfile.cornerRounding) : null,
        },
      });

      const idx = applications.findIndex((p) => p.id === saved.id);
      if (idx >= 0) {
        applications[idx] = saved;
      } else {
        applications = [...applications, saved];
      }

      closeProfileModal();
    } catch (err) {
      const appErr = errorStore.report({
        category: "profile",
        rawError: err,
        onRetry: () => saveProfile(),
      });
      profileActionError = appErr.message;
    }
  }

  async function deleteProfile(id: string) {
    try {
      await invoke("delete_application_profile", { id });
      applications = applications.filter((p) => p.id !== id);
      if (editingProfile?.id === id) {
        closeProfileModal();
      }
    } catch (err) {
      errorStore.report({
        category: "profile",
        rawError: err,
        title: "Could Not Delete Profile",
        message: "The application profile could not be removed from storage.",
        onRetry: () => deleteProfile(id),
      });
    }
  }

  async function toggleProfile(p: ApplicationProfile) {
    const updated: ApplicationProfile = { ...p, enabled: !p.enabled };
    try {
      const saved = await invoke<ApplicationProfile>("save_application_profile", {
        profile: updated,
      });
      const idx = applications.findIndex((x) => x.id === saved.id);
      if (idx >= 0) {
        applications[idx] = saved;
      }
    } catch (err) {
      errorStore.report({
        category: "profile",
        rawError: err,
        title: "Could Not Update Profile",
        message: "Failed to update profile enabled state.",
        onRetry: () => toggleProfile(p),
      });
    }
  }

  function normalizeAnimation(val?: string | null): string {
    if (!val) return "pulse";
    const lower = val.trim().toLowerCase();
    if (["pulse", "sweep", "ambient", "comet", "ripple"].includes(lower)) {
      return lower;
    }
    if (lower === "breathing" || lower === "solid") {
      return "ambient";
    }
    return "pulse";
  }

  let profileGlowTimeout: ReturnType<typeof setTimeout> | null = null;

  async function previewProfileGlow(p: ApplicationProfile | null) {
    if (!p || isPreviewingProfile) return;
    isPreviewingProfile = true;
    try {
      let previewed = false;
      if (p.id && p !== editingProfile) {
        try {
          await invoke("preview_application_glow", { profileId: p.id });
          previewed = true;
        } catch {
          previewed = false;
        }
      }
      if (!previewed) {
        const durSec = p.duration ?? (appSettings.glow.duration_ms / 1000);
        const durMs = Math.round(durSec * 1000);
        await invoke("preview_glow", {
          color: p.color || appSettings.glow.color,
          animation: normalizeAnimation(p.animation) || normalizeAnimation(appSettings.glow.animation_style),
          intensity: p.intensity ?? appSettings.glow.intensity,
          duration: durSec,
          durationMs: durMs,
          borderThickness: p.borderThickness != null ? Number(p.borderThickness) : appSettings.glow.thickness,
          cornerRounding: p.cornerRounding != null ? Number(p.cornerRounding) : appSettings.glow.corner_radius,
          monitorTarget: p.monitorTarget || appSettings.glow.monitor_target,
        });
      }
    } catch (err) {
      console.error("Failed to trigger profile preview:", err);
      isPreviewingProfile = false;
      return;
    }
    if (profileGlowTimeout) clearTimeout(profileGlowTimeout);
    const durSec = p.duration ?? (appSettings.glow.duration_ms / 1000);
    const fallbackMs = Math.round(durSec * 1000) + 1200;
    profileGlowTimeout = setTimeout(() => {
      isPreviewingProfile = false;
    }, fallbackMs);
  }

  // Notification Storage State
  let notifications = $state<Notification[]>([]);
  let isNotificationsLoading = $state(true);
  let isClearing = $state(false);
  let showClearConfirm = $state(false);

  // Glow Preview & Sound State
  let isPreviewingGlow = $state(false);
  let isPlayingSound = $state(false);

  // Pipeline Status State
  let pipelineStatus = $state<PipelineStatus | null>(null);
  let isSendingTest = $state(false);
  let testNotificationError = $state<string | null>(null);

  // Derived Computed Values
  let statusInfo = $derived(getStatusLabel(pipelineStatus?.provider_status));
  let notificationCounts = $derived.by(() => {
    let unread = 0;
    let critical = 0;
    let high = 0;
    for (let i = 0; i < notifications.length; i++) {
      const n = notifications[i];
      if (!n.read) unread++;
      if (n.urgency === "critical") critical++;
      else if (n.urgency === "high") high++;
    }
    return { unread, critical, high };
  });
  let unreadCount = $derived(notificationCounts.unread);
  let criticalCount = $derived(notificationCounts.critical);
  let highCount = $derived(notificationCounts.high);
  let filteredNotifications = $derived.by(() => {
    if (feedFilter === "unread") return notifications.filter((n) => !n.read);
    if (feedFilter === "critical") return notifications.filter((n) => n.urgency === "critical" || n.urgency === "high");
    return notifications;
  });
  let recentNotifications = $derived(notifications.slice(0, 4));

  function getStatusLabel(st: ProviderStatus | undefined): { label: string; kind: "ok" | "warn" | "err" } {
    if (!st) return { label: t("header.status_paused") || "Unknown", kind: "warn" };
    if (typeof st === "string") {
      switch (st) {
        case "listening":
          return { label: t("header.status_active") || "Listening", kind: "ok" };
        case "permission_required":
          return { label: t("header.status_permission") || "Permission Req", kind: "warn" };
        case "permission_denied":
          return { label: t("header.status_error") || "Permission Denied", kind: "err" };
        case "unsupported":
          return { label: t("header.status_error") || "Unsupported OS", kind: "err" };
        case "idle":
          return { label: t("header.status_paused") || "Idle", kind: "warn" };
        default:
          return { label: st, kind: "warn" };
      }
    }
    if ("error" in st) {
      return { label: t("header.status_error") || "Service Error", kind: "err" };
    }
    return { label: t("header.status_paused") || "Unknown", kind: "warn" };
  }

  async function checkConnection() {
    isPinging = true;
    errorMessage = null;

    try {
      const info = await invoke<ConnectionInfo>("check_backend_connection");
      connectionInfo = info;
      status = "connected";
      lastCheckedAt = new Date().toLocaleTimeString();
      pingCount += 1;

      await fetchAppSettings();
      await fetchApplicationProfiles();
      await fetchNotifications();
      await fetchPipelineStatus();
    } catch (err: unknown) {
      status = "disconnected";
      errorMessage = "Backend connection lost";
      lastCheckedAt = new Date().toLocaleTimeString();
      errorStore.report({
        category: "system",
        severity: "fatal",
        rawError: err,
        title: "Backend Unavailable",
        message: "Curry could not connect to its background process.",
        suggestion: "Ensure Curry is running and background processes are permitted.",
        onRetry: () => checkConnection(),
      });
    } finally {
      isPinging = false;
    }
  }

  let isSettingsLoading = $state(true);
  let settingsError = $state<string | null>(null);
  let settingsErrorTimer: ReturnType<typeof setTimeout> | null = null;
  let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  async function fetchAppSettings() {
    try {
      const s = await invoke<AppSettings>("get_app_settings");
      if (
        appSettings.enabled !== s.enabled ||
        appSettings.startup_enabled !== s.startup_enabled ||
        appSettings.show_notifications !== s.show_notifications ||
        appSettings.history_limit !== s.history_limit ||
        appSettings.sound_enabled !== s.sound_enabled ||
        appSettings.oled_mode !== s.oled_mode ||
        appSettings.fullscreen_behavior !== s.fullscreen_behavior ||
        appSettings.reduced_motion !== s.reduced_motion ||
        appSettings.theme !== s.theme ||
        JSON.stringify(appSettings.glow) !== JSON.stringify(s.glow) ||
        JSON.stringify(appSettings.applications) !== JSON.stringify(s.applications)
      ) {
        appSettings = s;
        isEnabled = s.enabled;
        if (s.theme && THEMES.some((t) => t.id === s.theme)) {
          selectedTheme = s.theme;
        } else {
          selectedTheme = DEFAULT_THEME;
        }
        if (s.language && ["en", "es", "fr", "de", "tr"].includes(s.language)) {
          setLanguage(s.language as SupportedLocale);
        }
      }
    } catch (err) {
      errorStore.report({
        category: "settings",
        rawError: err,
        title: "Settings Unavailable",
        message: "Curry could not load your saved settings.",
        suggestion: "Default settings are active for now.",
        onRetry: () => fetchAppSettings(),
      });
    } finally {
      isSettingsLoading = false;
    }
  }

  function saveAppSettingsDebounced(ms = 150) {
    if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(() => {
      saveAppSettings();
    }, ms);
  }

  async function saveAppSettings() {
    if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
    try {
      appSettings.enabled = isEnabled;
      const updated = await invoke<AppSettings>("update_app_settings", { settings: appSettings });
      appSettings = updated;
      isEnabled = updated.enabled;
      settingsError = null;
    } catch (err: unknown) {
      const appErr = errorStore.report({
        category: "settings",
        rawError: err,
        onRetry: () => saveAppSettings(),
      });
      settingsError = appErr.message;
      if (settingsErrorTimer) clearTimeout(settingsErrorTimer);
      settingsErrorTimer = setTimeout(() => {
        settingsError = null;
      }, 5000);
      await fetchAppSettings();
    }
  }

  async function toggleAppState() {
    isToggling = true;
    try {
      const next = await invoke<boolean>("toggle_app_state");
      isEnabled = next;
      appSettings.enabled = next;
      await fetchPipelineStatus();
    } catch (err) {
      errorStore.report({
        category: "system",
        rawError: err,
        title: "State Toggle Failed",
        message: "Could not switch Curry master state.",
        onRetry: () => toggleAppState(),
      });
    } finally {
      isToggling = false;
    }
  }

  async function toggleStartup() {
    try {
      const target = !appSettings.startup_enabled;
      const res = await invoke<boolean>("set_startup_status", { enabled: target });
      appSettings.startup_enabled = res;
    } catch (err) {
      errorStore.report({
        category: "system",
        rawError: err,
        title: "Startup Toggle Failed",
        message: "Could not update system startup setting.",
        suggestion: "Ensure you have permission to modify system startup items.",
        onRetry: () => toggleStartup(),
      });
    }
  }

  async function testSoundAlert() {
    isPlayingSound = true;
    try {
      await invoke("play_sound_preview");
    } catch (err) {
      errorStore.report({
        category: "media",
        rawError: err,
        title: "Sound Preview Failed",
        message: "Could not play alert sound.",
        suggestion: "Verify system audio output device is connected and unmuted.",
      });
    } finally {
      setTimeout(() => {
        isPlayingSound = false;
      }, 400);
    }
  }

  async function fetchPipelineStatus() {
    try {
      const nextStatus = await invoke<PipelineStatus>("get_pipeline_status");
      if (
        !pipelineStatus ||
        pipelineStatus.captured_count !== nextStatus.captured_count ||
        pipelineStatus.is_enabled !== nextStatus.is_enabled ||
        pipelineStatus.provider_name !== nextStatus.provider_name ||
        JSON.stringify(pipelineStatus.provider_status) !== JSON.stringify(nextStatus.provider_status)
      ) {
        pipelineStatus = nextStatus;
      }
    } catch (err) {
      console.error("Failed to fetch pipeline status:", err);
    }
  }

  async function fetchNotifications() {
    isNotificationsLoading = true;
    const skeletonTimer = setTimeout(() => {
      if (isNotificationsLoading) {
        showNotificationsSkeleton = true;
      }
    }, 120);

    try {
      const list = await invoke<Notification[]>("get_notifications");
      if (
        notifications.length !== list.length ||
        (list.length > 0 && notifications[0]?.id !== list[0]?.id)
      ) {
        notifications = list;
      }
    } catch (err) {
      console.error("Failed to fetch stored notifications:", err);
    } finally {
      clearTimeout(skeletonTimer);
      isNotificationsLoading = false;
      showNotificationsSkeleton = false;
    }
  }

  let glowTimeout: ReturnType<typeof setTimeout> | null = null;

  async function previewDefaultGlow() {
    if (isPreviewingGlow) return;
    isPreviewingGlow = true;
    try {
      await invoke("preview_global_glow");
    } catch (err) {
      isPreviewingGlow = false;
      errorStore.report({
        category: "window",
        rawError: err,
        title: "Preview Unavailable",
        message: "Curry could not render the screen-edge preview overlay.",
        suggestion: "Ensure Curry is enabled in the top bar.",
      });
      return;
    }
    if (glowTimeout) clearTimeout(glowTimeout);
    const fallbackMs = (appSettings.glow.duration_ms || 2500) + 1200;
    glowTimeout = setTimeout(() => {
      isPreviewingGlow = false;
    }, fallbackMs);
  }

  const previewGlow = previewDefaultGlow;

  async function confirmClearAll() {
    isClearing = true;
    try {
      await invoke("clear_notifications");
      notifications = [];
      showClearConfirm = false;
    } catch (err) {
      errorStore.report({
        category: "notification",
        rawError: err,
        title: "Could Not Clear History",
        message: "Curry could not clear notification records from storage.",
        onRetry: () => confirmClearAll(),
      });
    } finally {
      isClearing = false;
    }
  }

  async function removeNotification(id: string) {
    try {
      await invoke("dismiss_notification", { id });
      notifications = notifications.filter((n) => n.id !== id);
    } catch (err) {
      errorStore.report({
        category: "notification",
        rawError: err,
        title: "Could Not Dismiss Notification",
        message: "The notification could not be removed from history.",
      });
    }
  }

  async function markAsRead(id: string) {
    try {
      await invoke("mark_notification_as_read", { id });
      notifications = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      errorStore.report({
        category: "notification",
        rawError: err,
        title: "Could Not Update Notification",
        message: "Unable to update the read status of this notification.",
      });
    }
  }

  async function markAsUnread(id: string) {
    try {
      await invoke("mark_notification_as_unread", { id });
      notifications = notifications.map((n) => (n.id === id ? { ...n, read: false } : n));
    } catch (err) {
      errorStore.report({
        category: "notification",
        rawError: err,
        title: "Could Not Update Notification",
        message: "Unable to update the read status of this notification.",
      });
    }
  }

  async function sendTestNotification() {
    isSendingTest = true;
    testNotificationError = null;
    try {
      const notif = await invoke<Notification>("send_test_notification");
      if (!notifications.some((n) => n.id === notif.id)) {
        notifications = [notif, ...notifications];
      }
      await fetchPipelineStatus();
    } catch (err: unknown) {
      const appErr = errorStore.report({
        category: "notification",
        rawError: err,
        onRetry: () => sendTestNotification(),
      });
      testNotificationError = appErr.message;
    } finally {
      isSendingTest = false;
    }
  }

  async function openWindowsSettings() {
    try {
      await invoke("open_notification_settings");
    } catch (err) {
      errorStore.report({
        category: "system",
        rawError: err,
        title: "Could Not Open Settings",
        message: "Curry could not open system notification settings automatically.",
        suggestion: "Please open your operating system settings manually.",
      });
    }
  }

  onMount(() => {
    try {
      // Initialize language from localStorage or system locale
      const savedLang = (typeof localStorage !== "undefined" ? localStorage.getItem("curry_language") : null) as SupportedLocale;
      if (savedLang && ["en", "es", "fr", "de", "tr"].includes(savedLang)) {
        setLanguage(savedLang);
      } else {
        initLanguage();
      }

      // [LEGACY / BACKWARDS COMPATIBILITY] Read curry_selected_theme with fallback to legacy notiglow_selected_theme
      const savedTheme = (localStorage.getItem("curry_selected_theme") || localStorage.getItem("notiglow_selected_theme")) as string;
      if (savedTheme === "matrix-green" || savedTheme === "matrix_green") {
        selectedTheme = DEFAULT_THEME;
        try {
          localStorage.setItem("curry_selected_theme", DEFAULT_THEME);
        } catch {}
      } else if (savedTheme && THEMES.some((t) => t.id === savedTheme)) {
        selectedTheme = savedTheme as ThemeId;
      } else {
        selectedTheme = DEFAULT_THEME;
        try {
          localStorage.setItem("curry_selected_theme", DEFAULT_THEME);
        } catch {}
      }

      // Restore persisted Apps view mode (grid vs list)
      const savedAppsView = localStorage.getItem("curry_apps_view_mode");
      if (savedAppsView === "grid" || savedAppsView === "list") {
        appsViewMode = savedAppsView;
      } else {
        appsViewMode = "grid";
      }
    } catch {
      selectedTheme = DEFAULT_THEME;
      appsViewMode = "grid";
      initLanguage();
    }

    checkConnection();
    fetchAppSettings();
    fetchPipelineStatus();
    fetchNotifications();

    const unlistenStatePromise = listen<boolean>("app-state-changed", (event) => {
      isEnabled = event.payload;
      appSettings.enabled = event.payload;
      fetchPipelineStatus();
    });

    const unlistenSettingsPromise = listen<AppSettings>("app-settings-updated", (event) => {
      appSettings = event.payload;
      isEnabled = event.payload.enabled;
      if (event.payload.theme && THEMES.some((t) => t.id === event.payload.theme)) {
        selectedTheme = event.payload.theme;
      }
      if (event.payload.language && ["en", "es", "fr", "de", "tr"].includes(event.payload.language)) {
        setLanguage(event.payload.language as SupportedLocale);
      }
    });

    const unlistenTraySettingsPromise = listen<void>("open-settings-tab", () => {
      navigateToTab("settings");
    });

    const handleNewNotif = (notif: Notification) => {
      testNotificationError = null;
      notifications = [notif, ...notifications.filter((n) => n.id !== notif.id)];
      fetchPipelineStatus();
    };

    const unlistenNotifPromise = listen<Notification>("notification-received", (event) => {
      handleNewNotif(event.payload);
    });

    let isWindowHiddenInTray = false;

    const unlistenHiddenPromise = listen<void>("window-hidden-to-tray", () => {
      isWindowHiddenInTray = true;
    });

    const unlistenRestoredPromise = listen<void>("window-restored", () => {
      isWindowHiddenInTray = false;
      fetchPipelineStatus();
      fetchAppSettings();
    });

    const unlistenClearedPromise = listen<void>("notifications-cleared", () => {
      notifications = [];
    });

    const unlistenRemovedPromise = listen<string>("notification-removed", (event) => {
      const removedId = event.payload;
      notifications = notifications.filter((n) => n.id !== removedId);
    });

    const unlistenReadPromise = listen<string>("notification-read-updated", (event) => {
      const readId = event.payload;
      notifications = notifications.map((n) => (n.id === readId ? { ...n, read: true } : n));
    });

    const unlistenUnreadPromise = listen<string>("notification-unread-updated", (event) => {
      const unreadId = event.payload;
      notifications = notifications.map((n) => (n.id === unreadId ? { ...n, read: false } : n));
    });

    const unlistenReadStatusPromise = listen<[string, boolean]>("notification-read-status-changed", (event) => {
      const [statusId, isRead] = event.payload;
      notifications = notifications.map((n) => (n.id === statusId ? { ...n, read: isRead } : n));
    });

    const unlistenGlowFinishedPromise = listen<void>("glow-finished", () => {
      isPreviewingGlow = false;
      isPreviewingProfile = false;
      if (glowTimeout) {
        clearTimeout(glowTimeout);
        glowTimeout = null;
      }
      if (profileGlowTimeout) {
        clearTimeout(profileGlowTimeout);
        profileGlowTimeout = null;
      }
    });

    const updateCheckTimeout = setTimeout(() => {
      checkAutoUpdateIfDue();
    }, 2500);

    const interval = setInterval(() => {
      if (isWindowHiddenInTray || (typeof document !== "undefined" && document.hidden)) return;
      fetchPipelineStatus();
    }, 4000);

    const handleVisibilityChange = () => {
      if (typeof document !== "undefined" && !document.hidden && !isWindowHiddenInTray) {
        fetchPipelineStatus();
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      clearTimeout(updateCheckTimeout);
      clearInterval(interval);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
      unlistenStatePromise.then((unlisten) => unlisten());
      unlistenSettingsPromise.then((unlisten) => unlisten());
      unlistenTraySettingsPromise.then((unlisten) => unlisten());
      unlistenNotifPromise.then((unlisten) => unlisten());
      unlistenHiddenPromise.then((unlisten) => unlisten());
      unlistenRestoredPromise.then((unlisten) => unlisten());
      unlistenClearedPromise.then((unlisten) => unlisten());
      unlistenRemovedPromise.then((unlisten) => unlisten());
      unlistenReadPromise.then((unlisten) => unlisten());
      unlistenGlowFinishedPromise.then((unlisten) => unlisten());
      unlistenUnreadPromise.then((unlisten) => unlisten());
      unlistenReadStatusPromise.then((unlisten) => unlisten());
    };
  });
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === "Escape") {
      if (profileToDelete) {
        profileToDelete = null;
      }
      if (showClearConfirm) {
        showClearConfirm = false;
      }
      if (settingsError) {
        settingsError = null;
      }
      if (testNotificationError) {
        testNotificationError = null;
      }
      if (errorMessage) {
        errorMessage = null;
      }
    }
  }}
/>

<div class="shell" data-theme={selectedTheme} data-appearance={effectiveAppearance}>
  <div class="ambient-glow-mesh" aria-hidden="true"></div>

  <!-- Windows 11 Desktop Top Header (Brand + Top Nav Tabs + Authoritative Listening Status) -->
  <header class="app-header">
    <div class="header-left">
      <div class="brand-badge" title="Curry Desktop">
        <img src="/favicon.png" alt="Curry" class="brand-icon-img" />
      </div>
      <div class="brand-text">
        <div class="brand-row">
          <h1 class="brand-title">Curry</h1>
          <span class="brand-version-pill">v{formatUserVersion(connectionInfo?.version ?? APP_VERSION)}</span>
        </div>
      </div>
    </div>

    <!-- Center Top Navigation Tabs (Resizable Glass Navbar) -->
    <div class="header-center-wrap">
      <nav class="header-center-tabs" bind:this={navCenterTabsEl} aria-label={t('nav.dashboard')}>
        {#if activeTabIndicator.ready}
          <div
            class="nav-sliding-pill"
            style:transform="translateX({activeTabIndicator.left}px)"
            style:width="{activeTabIndicator.width}px"
            aria-hidden="true"
          ></div>
        {/if}
        <button
          id="tab-dashboard-btn"
          class="nav-tab {activeTab === 'dashboard' ? 'active' : ''}"
          onclick={() => navigateToTab("dashboard")}
          onkeydown={(e) => handleTabKeyDown(e, "dashboard")}
          aria-current={activeTab === 'dashboard' ? 'page' : undefined}
          title={t('nav.dashboard')}
        >
          <span class="nav-tab-glow" aria-hidden="true"></span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="nav-icon">
            <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
            <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
            <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
            <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
          </svg>
          <span class="nav-label">{t('nav.dashboard')}</span>
        </button>

        <button
          id="tab-notifications-btn"
          class="nav-tab {activeTab === 'notifications' ? 'active' : ''}"
          onclick={() => navigateToTab("notifications")}
          onkeydown={(e) => handleTabKeyDown(e, "notifications")}
          aria-current={activeTab === 'notifications' ? 'page' : undefined}
          title={t('nav.notifications')}
        >
          <span class="nav-tab-glow" aria-hidden="true"></span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="nav-icon">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <span class="nav-label">{t('nav.notifications')}</span>
          {#if unreadCount > 0}
            <span class="nav-badge">{unreadCount}</span>
          {/if}
        </button>

        <button
          id="tab-applications-btn"
          class="nav-tab {activeTab === 'applications' ? 'active' : ''}"
          onclick={() => navigateToTab("applications")}
          onkeydown={(e) => handleTabKeyDown(e, "applications")}
          aria-current={activeTab === 'applications' ? 'page' : undefined}
          aria-label={t('nav.apps')}
          title={t('nav.apps')}
        >
          <span class="nav-tab-glow" aria-hidden="true"></span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="nav-icon">
            <rect x="2" y="3" width="20" height="14" rx="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
          <span class="nav-label">{t('nav.apps')}</span>
        </button>

        <button
          id="tab-glow-btn"
          class="nav-tab {activeTab === 'glow' ? 'active' : ''}"
          onclick={() => navigateToTab("glow")}
          onkeydown={(e) => handleTabKeyDown(e, "glow")}
          aria-current={activeTab === 'glow' ? 'page' : undefined}
          title={t('nav.glow')}
        >
          <span class="nav-tab-glow" aria-hidden="true"></span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="nav-icon">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
          <span class="nav-label">{t('nav.glow')}</span>
        </button>

        <button
          id="tab-settings-btn"
          class="nav-tab {activeTab === 'settings' ? 'active' : ''}"
          onclick={() => navigateToTab("settings")}
          onkeydown={(e) => handleTabKeyDown(e, "settings")}
          aria-current={activeTab === 'settings' ? 'page' : undefined}
          title={t('nav.settings')}
        >
          <span class="nav-tab-glow" aria-hidden="true"></span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="nav-icon">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          <span class="nav-label">{t('nav.settings')}</span>
        </button>
      </nav>
    </div>

    <!-- Right: Interactive Listening Status Button & Header Glow Button -->
    <div class="header-right">
      <button
        id="toggle-state-btn"
        class="listening-toggle-btn {isEnabled ? statusInfo.kind : 'paused'}"
        onclick={toggleAppState}
        disabled={isToggling}
        role="switch"
        aria-checked={isEnabled}
        title={isEnabled ? "Notification listener active. Click to pause." : "Notification listener paused. Click to resume."}
        aria-label={isEnabled ? "Notification listener active. Click to pause." : "Notification listener paused. Click to resume."}
      >
        <span class="status-dot-pulse {isEnabled ? statusInfo.kind : 'paused'}"></span>
        <span class="status-text-label">
          {#if !isEnabled}
            {t('header.status_paused')}
          {:else}
            {statusInfo.label}
          {/if}
        </span>
      </button>

      <button
        id="header-glow-btn"
        class="header-glow-btn"
        onclick={previewDefaultGlow}
        disabled={isPreviewingGlow || !appSettings.glow.enabled}
        title={t('header.test_glow')}
        aria-label={t('header.test_glow')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="header-glow-icon {isPreviewingGlow ? 'pulse' : ''}">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
        <span>{isPreviewingGlow ? t('header.testing') : t('header.test_glow')}</span>
      </button>
    </div>
  </header>

  <!-- Main Viewport with Directional Hero Page Transition -->
  <main class="main-viewport" id="main-content">
    {#key `${activeTab}_${$currentLanguage}`}
      <div class="hero-page-container page-{navDirection}">
        {#if activeTab === "dashboard"}
          <!-- ============================================================= -->
          <!-- DASHBOARD VIEW                                                -->
          <!-- ============================================================= -->
          <div class="view-container dashboard-view">
            <div class="view-hero-header">
              <span class="hero-eyebrow">{t('dashboard.eyebrow')}</span>
              <h2 class="view-title">{t('dashboard.title')}</h2>
              <p class="view-subtitle">{t('dashboard.desc')}</p>
            </div>

            <!-- 4 Metric Cards (Using actual live data) -->
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-top">
                  <span class="metric-label">{t('dashboard.stat_total')}</span>
                  <div class="metric-icon-wrap total">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="2" y="3" width="20" height="14" rx="2"></rect>
                      <line x1="8" y1="21" x2="16" y2="21"></line>
                      <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                  </div>
                </div>
                <div class="metric-value">{notifications.length}</div>
                <span class="metric-foot">{t('dashboard.total_sub')}</span>
              </div>

              <div class="metric-card">
                <div class="metric-top">
                  <span class="metric-label">{t('dashboard.stat_unread')}</span>
                  <div class="metric-icon-wrap unread">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                  </div>
                </div>
                <div class="metric-value">{unreadCount}</div>
                <span class="metric-foot">{t('dashboard.unread_sub')}</span>
              </div>

              <div class="metric-card">
                <div class="metric-top">
                  <span class="metric-label">{t('dashboard.stat_critical')}</span>
                  <div class="metric-icon-wrap critical">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                  </div>
                </div>
                <div class="metric-value">{criticalCount}</div>
                <span class="metric-foot">{t('dashboard.critical_sub')}</span>
              </div>

              <div class="metric-card">
                <div class="metric-top">
                  <span class="metric-label">{t('dashboard.stat_priority')}</span>
                  <div class="metric-icon-wrap high">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                  </div>
                </div>
                <div class="metric-value">{highCount}</div>
                <span class="metric-foot">{t('dashboard.priority_sub')}</span>
              </div>
            </div>

            <!-- System Diagnostics & Pipeline Status -->
            <div class="dashboard-section-row">
              <div class="card panel-card system-status-panel">
                <div class="panel-header">
                  <div class="panel-title-wrap">
                    <div class="panel-icon-circle">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 class="panel-title">{t('dashboard.diagnostics_title')}</h3>
                      <p class="panel-desc">{t('dashboard.diagnostics_desc')}</p>
                    </div>
                  </div>

                  <div class="panel-header-actions">
                    <button
                      class="secondary-btn"
                      onclick={sendTestNotification}
                      disabled={isSendingTest}
                      title={t('dashboard.test_toast')}
                    >
                      <svg class="btn-icon {isSendingTest ? 'spin' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                      </svg>
                      <span>{isSendingTest ? t('dashboard.sending') : t('dashboard.test_toast')}</span>
                    </button>

                    <button
                      id="ping-btn"
                      class="secondary-btn"
                      onclick={checkConnection}
                      disabled={isPinging}
                      aria-label={t('dashboard.test_ipc')}
                    >
                      <svg class="btn-icon {isPinging ? 'spin' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="23 4 23 10 17 10"></polyline>
                        <polyline points="1 20 1 14 7 14"></polyline>
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                      </svg>
                      <span>{isPinging ? t('dashboard.checking') : t('dashboard.test_ipc')}</span>
                    </button>
                  </div>
                </div>

                {#if connectionInfo}
                  <div class="system-meta-grid">
                    <div class="meta-box">
                      <span class="meta-box-label">{t('dashboard.meta_app')}</span>
                      <span class="meta-box-val">{connectionInfo.app_name} v{formatUserVersion(connectionInfo.version)}</span>
                    </div>
                    <div class="meta-box">
                      <span class="meta-box-label">{t('dashboard.meta_os_arch')}</span>
                      <span class="meta-box-val">{connectionInfo.target_os} ({connectionInfo.target_arch})</span>
                    </div>
                    <div class="meta-box">
                      <span class="meta-box-label">{t('dashboard.meta_provider')}</span>
                      <span class="meta-box-val">{pipelineStatus?.provider_name ?? "Windows Native"}</span>
                    </div>
                    <div class="meta-box">
                      <span class="meta-box-label">{t('dashboard.meta_pipeline')}</span>
                      <span class="status-chip {statusInfo.kind}">
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>
                {/if}

                {#if pipelineStatus?.provider_status === "permission_required" || pipelineStatus?.provider_status === "permission_denied"}
                  <div class="permission-warning-banner">
                    <span>{t('dashboard.perm_warning')}</span>
                    <button class="settings-link-btn" onclick={openWindowsSettings}>
                      {t('dashboard.open_settings')}
                    </button>
                  </div>
                {/if}
              </div>
            </div>

            <!-- Recent Notifications Strip -->
            <div class="dashboard-section-row">
              <div class="card panel-card recent-feed-panel">
                <div class="panel-header">
                  <div>
                    <h3 class="panel-title">{t('dashboard.recent_feed')}</h3>
                    <p class="panel-desc">{t('dashboard.recent_desc')}</p>
                  </div>
                  {#if notifications.length > 0}
                    <button class="text-link-btn" onclick={() => navigateToTab("notifications")}>
                      {t('dashboard.view_all', { count: notifications.length })}
                    </button>
                  {/if}
                </div>

                {#if notifications.length === 0}
                  <div class="empty-state-panel">
                    <div class="empty-icon-ring">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                      </svg>
                    </div>
                    <h4 class="empty-heading">{t('dashboard.no_notifications')}</h4>
                    <p class="empty-paragraph">{t('dashboard.no_notifications_desc')}</p>
                    <button class="primary-btn" onclick={sendTestNotification} disabled={isSendingTest}>
                      {t('dashboard.send_sample')}
                    </button>
                  </div>
                {:else}
                  <div class="recent-list">
                    {#each recentNotifications as item (item.id)}
                      <div class="recent-item-row {item.read ? 'is-read' : 'is-unread'} urgency-{item.urgency ?? 'normal'}">
                        <div class="recent-avatar">
                          {#if item.icon}
                            <img src={item.icon} alt={item.app_name} class="recent-avatar-img" />
                          {:else}
                            <span>{getAppInitial(item.app_name || item.source_app)}</span>
                          {/if}
                        </div>

                        <div class="recent-content">
                          <div class="recent-top-line">
                            <span class="recent-source">{item.app_name || item.source_app || "Unknown"}</span>
                            {#if item.urgency}
                              <span class="urgency-tag {item.urgency}">{item.urgency}</span>
                            {/if}
                            <span class="recent-time">{formatTimestamp(item.timestamp)}</span>
                          </div>
                          <div class="recent-title">{item.title || "(No Title)"}</div>
                          <div class="recent-body">{item.body || item.message || ""}</div>
                        </div>

                        <div class="recent-actions">
                          {#if !item.read}
                            <button class="tiny-action-btn" onclick={() => markAsRead(item.id)} title={t('notifications.mark_read')}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            </button>
                          {/if}
                          <button class="tiny-action-btn danger" onclick={() => removeNotification(item.id)} title={t('notifications.dismiss')}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        </div>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>
          </div>

        {:else if activeTab === "notifications"}
          <!-- ============================================================= -->
          <!-- NOTIFICATIONS VIEW                                            -->
          <!-- ============================================================= -->
          <div class="view-container notifications-view">
            <div class="view-hero-header view-header-row">
              <div>
                <span class="hero-eyebrow">{t('notifications.eyebrow')}</span>
                <h2 class="view-title">{t('notifications.title')}</h2>
                <p class="view-subtitle">{t('notifications.desc')}</p>
              </div>

              <div class="feed-header-controls">
                <!-- Filter Segmented Tabs -->
                <div class="segmented-control" role="radiogroup" aria-label={t('notifications.filter_all')}>
                  <button
                    class="segment-btn {feedFilter === 'all' ? 'active' : ''}"
                    onclick={() => (feedFilter = "all")}
                  >
                    {t('notifications.filter_all')} ({notifications.length})
                  </button>
                  <button
                    class="segment-btn {feedFilter === 'unread' ? 'active' : ''}"
                    onclick={() => (feedFilter = "unread")}
                  >
                    {t('notifications.filter_unread')} ({unreadCount})
                  </button>
                  <button
                    class="segment-btn {feedFilter === 'critical' ? 'active' : ''}"
                    onclick={() => (feedFilter = "critical")}
                  >
                    {t('notifications.filter_priority')} ({criticalCount + highCount})
                  </button>
                </div>

                <!-- Mark All as Read Button -->
                <button
                  id="mark-all-read-btn"
                  class="secondary-btn"
                  onclick={markAllNotificationsAsRead}
                  disabled={unreadCount === 0 || isMarkingAllRead}
                  aria-label={t('notifications.mark_all_read')}
                  title={t('notifications.mark_all_read')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>{isMarkingAllRead ? t('notifications.marking') : t('notifications.mark_all_read')}</span>
                </button>

                <!-- Clear All Button -->
                <button
                  id="clear-all-btn"
                  class="danger-btn"
                  onclick={() => (showClearConfirm = true)}
                  disabled={notifications.length === 0 || isClearing}
                  aria-label={t('notifications.clear_all')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  <span>{t('notifications.clear_all')}</span>
                </button>
              </div>
            </div>

            {#if testNotificationError}
              <div class="alert-banner danger">
                <span>{testNotificationError}</span>
                <button class="banner-close" onclick={() => (testNotificationError = null)}>✕</button>
              </div>
            {/if}

            <!-- Notification Cards List -->
            <div class="notification-feed-list" role="feed" aria-label="Notification list">
              {#if showNotificationsSkeleton}
                <div class="cards-stack">
                  {#each [1, 2, 3] as _sId}
                    <div class="notification-card-skeleton">
                      <Skeleton width="40px" height="40px" borderRadius="10px" />
                      <div class="skeleton-content-col">
                        <div class="skeleton-row-top">
                          <Skeleton width="110px" height="13px" borderRadius="4px" />
                          <Skeleton width="60px" height="13px" borderRadius="4px" />
                        </div>
                        <Skeleton width="60%" height="16px" borderRadius="4px" />
                        <Skeleton width="88%" height="13px" borderRadius="4px" />
                      </div>
                    </div>
                  {/each}
                </div>
              {:else if filteredNotifications.length === 0}
                <div class="empty-state-panel">
                  <div class="empty-icon-ring">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                  </div>
                  <h4 class="empty-heading">
                    {feedFilter === "unread"
                      ? t('notifications.empty_unread_title')
                      : feedFilter === "critical"
                      ? t('notifications.empty_priority_title')
                      : t('notifications.empty_history_title')}
                  </h4>
                  <p class="empty-paragraph">
                    {feedFilter === "unread"
                      ? t('notifications.empty_unread_desc')
                      : feedFilter === "critical"
                      ? t('notifications.empty_priority_desc')
                      : t('notifications.empty_history_desc')}
                  </p>
                  {#if feedFilter === "all"}
                    <button class="primary-btn" onclick={sendTestNotification} disabled={isSendingTest}>
                      {t('notifications.send_sample')}
                    </button>
                  {/if}
                </div>
              {:else}
                <div class="cards-stack">
                  {#each filteredNotifications as item (item.id)}
                    <article class="notification-card {item.read ? 'is-read' : 'is-unread'} urgency-{item.urgency ?? 'normal'}">
                      <div class="card-avatar-col">
                        <div class="card-avatar" title={item.app_name || item.source_app || "App"}>
                          {#if item.icon}
                            <img src={item.icon} alt={item.app_name} class="avatar-img" />
                          {:else}
                            <span class="avatar-initial">{getAppInitial(item.app_name || item.source_app)}</span>
                          {/if}
                        </div>
                        {#if !item.read}
                          <span class="card-unread-dot" title="Unread"></span>
                        {/if}
                      </div>

                      <div class="card-body-col">
                        <div class="card-meta-line">
                          <div class="card-source-tags">
                            <span class="card-source-name">{item.app_name || item.source_app || "Unknown App"}</span>
                            <span class="platform-chip">{item.platform}</span>
                            {#if item.urgency}
                              <span class="urgency-chip {item.urgency}">{item.urgency}</span>
                            {/if}
                          </div>
                          <time class="card-timestamp" datetime={new Date(item.timestamp).toISOString()}>
                            {formatTimestamp(item.timestamp)}
                          </time>
                        </div>

                        <h4 class="card-title">{item.title || t('notifications.no_title')}</h4>
                        <p class="card-text">{item.body || item.message || t('notifications.no_body')}</p>

                        <div class="card-footer-line">
                          <span class="card-id-code">ID: {item.id}</span>
                          <div class="card-actions-group">
                            {#if !item.read}
                              <button
                                class="item-action-btn read"
                                onclick={() => markAsRead(item.id)}
                                aria-label={t('notifications.mark_read')}
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tiny-icon">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                <span>{t('notifications.mark_read')}</span>
                              </button>
                            {:else}
                              <button
                                class="item-action-btn unread"
                                onclick={() => markAsUnread(item.id)}
                                aria-label={t('notifications.mark_unread')}
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tiny-icon">
                                  <circle cx="12" cy="12" r="4"></circle>
                                </svg>
                                <span>{t('notifications.mark_unread')}</span>
                              </button>
                            {/if}

                            <button
                                class="item-action-btn dismiss"
                                onclick={() => removeNotification(item.id)}
                                aria-label={t('notifications.dismiss')}
                              >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tiny-icon">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                              <span>{t('notifications.dismiss')}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  {/each}
                </div>
              {/if}
            </div>
          </div>

        {:else if activeTab === "applications"}
          <!-- ============================================================= -->
          <!-- APPLICATIONS VIEW                                             -->
          <!-- ============================================================= -->
          <div class="view-container applications-view">
            <div class="view-hero-header view-header-row">
              <div>
                <span class="hero-eyebrow">{t('apps.eyebrow')}</span>
                <div class="apps-title-with-toggle">
                  <h2 class="view-title">{t('apps.title')}</h2>
                  <div class="apps-view-toggle ghost-toggle-group" role="group" aria-label={t('apps.view_mode')}>
                    <button
                      type="button"
                      id="apps-view-grid-btn"
                      class="ghost-icon-btn {appsViewMode === 'grid' ? 'active' : ''}"
                      onclick={() => setAppsViewMode('grid')}
                      title={t('apps.view_grid')}
                      aria-label={t('apps.view_grid')}
                      aria-pressed={appsViewMode === 'grid'}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="view-toggle-icon">
                        <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
                        <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
                        <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
                        <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
                      </svg>
                    </button>
                    <button
                      type="button"
                      id="apps-view-list-btn"
                      class="ghost-icon-btn {appsViewMode === 'list' ? 'active' : ''}"
                      onclick={() => setAppsViewMode('list')}
                      title={t('apps.view_list')}
                      aria-label={t('apps.view_list')}
                      aria-pressed={appsViewMode === 'list'}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="view-toggle-icon">
                        <line x1="8" y1="6" x2="21" y2="6"></line>
                        <line x1="8" y1="12" x2="21" y2="12"></line>
                        <line x1="8" y1="18" x2="21" y2="18"></line>
                        <line x1="3" y1="6" x2="3.01" y2="6"></line>
                        <line x1="3" y1="12" x2="3.01" y2="12"></line>
                        <line x1="3" y1="18" x2="3.01" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                </div>
                <p class="view-subtitle">{t('apps.desc')}</p>
              </div>

              <button
                id="add-application-btn"
                class="primary-btn"
                onclick={openAddProfileModal}
                title={t('apps.add_profile')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>+ {t('apps.add_profile')}</span>
              </button>
            </div>

            <!-- Search Bar -->
            <div class="app-search-bar card">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                bind:value={appSearchQuery}
                placeholder={t('apps.search_placeholder')}
                class="app-search-input"
              />
              {#if appSearchQuery}
                <button class="clear-search-btn" onclick={() => (appSearchQuery = "")} title="Clear search">
                  ✕
                </button>
              {/if}
            </div>

            <!-- Profiles Container (Grid vs List) -->
            <div class="apps-container view-mode-{appsViewMode}">
              {#if filteredProfiles.length === 0}
                <div class="empty-state-card card">
                  <div class="empty-state-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="2" y="3" width="20" height="14" rx="2"></rect>
                      <line x1="8" y1="21" x2="16" y2="21"></line>
                      <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                  </div>
                  <h3>{appSearchQuery ? t('apps.no_matching') : t('apps.no_profiles')}</h3>
                  <p>{appSearchQuery ? t('apps.no_matching_desc', { query: appSearchQuery }) : t('apps.no_profiles_desc')}</p>
                  <button class="primary-btn" onclick={openAddProfileModal}>
                    <span>+ {t('apps.add_profile')}</span>
                  </button>
                </div>
              {:else if appsViewMode === "grid"}
                <div class="applications-grid">
                  {#each filteredProfiles as profile (profile.id)}
                    <div class="app-profile-card card {profile.enabled ? '' : 'disabled'}">
                      <div class="app-card-header">
                        <div
                          class="app-avatar-box"
                          style:--app-glow-color={profile.color || appSettings.glow.color}
                          style:border-color={profile.color || appSettings.glow.color}
                        >
                          <span class="app-avatar-letter">{getAppInitial(profile.applicationName)}</span>
                        </div>
                        <div class="app-card-title-col">
                          <div class="app-name-row">
                            <h4 class="app-name">{profile.applicationName}</h4>
                            <span class="custom-profile-badge">{t('apps.custom_profile')}</span>
                            {#if !profile.enabled}
                              <span class="suppressed-badge">{t('apps.disabled')}</span>
                            {/if}
                          </div>
                          <span class="app-executable-text" title={profile.executablePath || profile.executableName}>
                            {profile.executableName}
                          </span>
                        </div>
                      </div>

                      <div class="app-card-body">
                        {#if profile.executablePath}
                          <div class="app-path-hint" title={profile.executablePath}>{profile.executablePath}</div>
                        {/if}
                        <div class="app-tags-row">
                          <span class="app-tag anim">
                            {(profile.animation || appSettings.glow.animation_style).toUpperCase()}
                          </span>
                          <span class="app-tag">
                            {Math.round((profile.intensity ?? appSettings.glow.intensity) * 100)}%
                          </span>
                          <span class="app-tag">
                            {profile.duration ? `${profile.duration}s` : `${appSettings.glow.duration_ms / 1000}s`}
                          </span>
                          {#if profile.suppressInFullscreen}
                            <span class="app-tag fs-suppressed">{t('apps.fullscreen_suppressed')}</span>
                          {/if}
                          {#if profile.borderThickness != null}
                            <span class="app-tag">{profile.borderThickness}px {t('glow.thickness')}</span>
                          {/if}
                          {#if profile.cornerRounding != null}
                            <span class="app-tag">{profile.cornerRounding}px {t('glow.corner_radius')}</span>
                          {/if}
                          {#if profile.monitorTarget && profile.monitorTarget !== 'primary'}
                            <span class="app-tag monitor">
                              {profile.monitorTarget === 'all' ? t('apps.all_displays') : t('apps.active_window')}
                            </span>
                          {/if}
                        </div>
                      </div>

                      <div class="app-profile-actions app-card-actions">
                        <!-- STRICT ORDER: Switch -> Preview -> Edit -> Delete -->
                        <!-- 1. Switch -->
                        <AppleSwitch
                          checked={profile.enabled}
                          onchange={() => toggleProfile(profile)}
                          ariaLabel={profile.enabled ? `Disable profile ${profile.applicationName}` : `Enable profile ${profile.applicationName}`}
                          size="sm"
                        />

                        <!-- 2. Preview -->
                        <button
                          type="button"
                          class="icon-action-btn"
                          onclick={() => previewProfileGlow(profile)}
                          title={t('apps.preview_btn')}
                          disabled={isPreviewingProfile}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tiny-icon {isPreviewingProfile ? 'pulse' : ''}">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                          <span>{t('apps.preview_btn')}</span>
                        </button>

                        <!-- 3. Edit -->
                        <button
                          type="button"
                          class="secondary-btn edit-btn"
                          onclick={() => openEditProfileModal(profile)}
                          title={t('apps.edit')}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tiny-icon">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                          <span>{t('apps.edit')}</span>
                        </button>

                        <!-- 4. Delete (Confirmation flow preserved) -->
                        <button
                          type="button"
                          class="danger-icon-btn"
                          onclick={() => requestDeleteProfile(profile)}
                          title={t('apps.delete')}
                          aria-label={`Delete ${profile.applicationName} profile`}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tiny-icon">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  {/each}
                </div>
              {:else}
                <!-- LIST VIEW: Strict Order: Switch -> Preview -> Edit -> Delete -->
                <div class="applications-list" role="list">
                  {#each filteredProfiles as profile (profile.id)}
                    <div class="app-profile-list-item card {profile.enabled ? '' : 'disabled'}" role="listitem">
                      <div class="app-profile-left">
                        <div
                          class="app-avatar-box"
                          style:--app-glow-color={profile.color || appSettings.glow.color}
                          style:border-color={profile.color || appSettings.glow.color}
                        >
                          <span class="app-avatar-letter">{getAppInitial(profile.applicationName)}</span>
                        </div>
                        <div class="app-info">
                          <div class="app-name-row">
                            <h4 class="app-name">{profile.applicationName}</h4>
                            {#if !profile.enabled}
                              <span class="suppressed-badge">{t('apps.disabled')}</span>
                            {/if}
                          </div>
                          <span class="app-executable-text" title={profile.executablePath || profile.executableName}>
                            {profile.executableName}
                            {#if profile.executablePath}
                              <span class="app-path-hint" title={profile.executablePath}>• {profile.executablePath}</span>
                            {/if}
                          </span>
                          <div class="app-tags-row">
                            <span class="app-tag anim">
                              {(profile.animation || appSettings.glow.animation_style).toUpperCase()}
                            </span>
                            <span class="app-tag">
                              {Math.round((profile.intensity ?? appSettings.glow.intensity) * 100)}%
                            </span>
                            <span class="app-tag">
                              {profile.duration ? `${profile.duration}s` : `${appSettings.glow.duration_ms / 1000}s`}
                            </span>
                            {#if profile.suppressInFullscreen}
                              <span class="app-tag fs-suppressed">{t('apps.fullscreen_suppressed')}</span>
                            {/if}
                          </div>
                        </div>
                      </div>

                      <!-- STRICT ORDER: Switch -> Preview (ghost) -> Edit (ghost) -> Delete -->
                      <div class="app-profile-list-actions">
                        <!-- 1. Switch -->
                        <AppleSwitch
                          checked={profile.enabled}
                          onchange={() => toggleProfile(profile)}
                          ariaLabel={profile.enabled ? `Disable profile ${profile.applicationName}` : `Enable profile ${profile.applicationName}`}
                          size="sm"
                        />

                        <!-- 2. Preview (Ghost button) -->
                        <button
                          type="button"
                          class="ghost-action-btn"
                          onclick={() => previewProfileGlow(profile)}
                          title={t('apps.preview_btn')}
                          disabled={isPreviewingProfile}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tiny-icon {isPreviewingProfile ? 'pulse' : ''}">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                          <span>{t('apps.preview_btn')}</span>
                        </button>

                        <!-- 3. Edit (Ghost button) -->
                        <button
                          type="button"
                          class="ghost-action-btn"
                          onclick={() => openEditProfileModal(profile)}
                          title={t('apps.edit')}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tiny-icon">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                          <span>{t('apps.edit')}</span>
                        </button>

                        <!-- 4. Delete (Danger button with confirmation flow) -->
                        <button
                          type="button"
                          class="danger-icon-btn"
                          onclick={() => requestDeleteProfile(profile)}
                          title={t('apps.delete')}
                          aria-label={`Delete ${profile.applicationName} profile`}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tiny-icon">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          </div>

        {:else if activeTab === "glow"}
          <!-- ============================================================= -->
          <!-- GLOW EXPERIENCE VIEW                                          -->
          <!-- ============================================================= -->
          <div class="view-container glow-view">
            <div class="view-hero-header view-header-row">
              <div>
                <span class="hero-eyebrow">{t('glow.eyebrow')}</span>
                <h2 class="view-title">{t('glow.title')}</h2>
                <p class="view-subtitle">{t('glow.desc')}</p>
              </div>

              <button
                id="preview-glow-btn"
                class="primary-btn"
                onclick={previewGlow}
                disabled={isPreviewingGlow || !appSettings.glow.enabled}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon {isPreviewingGlow ? 'pulse' : ''}">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <span>{isPreviewingGlow ? t('glow.previewing') : t('glow.preview_btn')}</span>
              </button>
            </div>

            <div class="settings-sections-stack">
              <!-- Master Toggle & Animation Dynamic -->
              <section class="card panel-card">
                <div class="panel-header">
                  <div class="panel-title-wrap">
                    <div class="panel-icon-circle">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polygon points="10 8 16 12 10 16 10 8"></polygon>
                      </svg>
                    </div>
                    <div>
                      <h3 class="panel-title">{t('glow.activation_title')}</h3>
                      <p class="panel-desc">{t('glow.activation_desc')}</p>
                    </div>
                  </div>
                </div>

                <div class="controls-list">
                  <div class="control-item">
                    <div class="control-label-group">
                      <span class="control-title">{t('glow.global_switch')}</span>
                      <span class="control-sub">{t('glow.global_switch_desc')}</span>
                    </div>
                    <AppleSwitch
                      id="glow-enabled-switch"
                      checked={appSettings.glow.enabled}
                      onchange={(val) => {
                        appSettings.glow.enabled = val;
                        saveAppSettings();
                      }}
                      ariaLabel="Toggle screen-edge glow"
                    />
                  </div>

                  <div class="control-item">
                    <div class="control-label-group">
                      <span class="control-title">{t('glow.animation_style')}</span>
                      <span class="control-sub">{t('glow.animation_desc')}</span>
                    </div>
                    <div class="dropdown-control-wrapper">
                      <Dropdown
                        items={ANIMATION_OPTIONS}
                        value={appSettings.glow.animation_style}
                        onSelect={(val: string) => {
                          appSettings.glow.animation_style = val as any;
                          saveAppSettings();
                        }}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <!-- Geometry & Curvature -->
              <section class="card panel-card">
                <div class="panel-header">
                  <div class="panel-title-wrap">
                    <div class="panel-icon-circle">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="4"></rect>
                      </svg>
                    </div>
                    <div>
                      <h3 class="panel-title">{t('glow.geometry_title')}</h3>
                      <p class="panel-desc">{t('glow.geometry_desc')}</p>
                    </div>
                  </div>
                </div>

                <div class="controls-list">
                  <div class="control-item">
                    <div class="control-label-group">
                      <span class="control-title">{t('glow.thickness')}</span>
                      <span class="control-sub">{t('glow.thickness_sub', { thickness: appSettings.glow.thickness })}</span>
                    </div>
                    <div class="slider-box">
                      <input
                        type="range"
                        min="2"
                        max="32"
                        step="1"
                        bind:value={appSettings.glow.thickness}
                        oninput={() => saveAppSettingsDebounced(150)}
                        onchange={saveAppSettings}
                        class="native-slider"
                      />
                      <span class="slider-val-badge">{appSettings.glow.thickness}px</span>
                    </div>
                  </div>

                  <div class="control-item">
                    <div class="control-label-group">
                      <span class="control-title">{t('glow.corner_radius')}</span>
                      <span class="control-sub">{t('glow.corner_radius_sub', { radius: appSettings.glow.corner_radius })}</span>
                    </div>
                    <div class="slider-box">
                      <input
                        type="range"
                        min="0"
                        max="48"
                        step="2"
                        bind:value={appSettings.glow.corner_radius}
                        oninput={() => saveAppSettingsDebounced(150)}
                        onchange={saveAppSettings}
                        class="native-slider"
                      />
                      <span class="slider-val-badge">{appSettings.glow.corner_radius}px</span>
                    </div>
                  </div>
                </div>
              </section>

              <!-- Duration & Intensity -->
              <section class="card panel-card">
                <div class="panel-header">
                  <div class="panel-title-wrap">
                    <div class="panel-icon-circle">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                    </div>
                    <div>
                      <h3 class="panel-title">{t('glow.timing_title')}</h3>
                      <p class="panel-desc">{t('glow.timing_desc')}</p>
                    </div>
                  </div>
                </div>

                <div class="controls-list">
                  <div class="control-item">
                    <div class="control-label-group">
                      <span class="control-title">{t('glow.duration')}</span>
                      <span class="control-sub">{t('glow.duration_sub', { duration: appSettings.glow.duration_ms })}</span>
                    </div>
                    <div class="slider-box">
                      <input
                        type="range"
                        min="500"
                        max="10000"
                        step="250"
                        bind:value={appSettings.glow.duration_ms}
                        oninput={() => saveAppSettingsDebounced(150)}
                        onchange={saveAppSettings}
                        class="native-slider"
                      />
                      <span class="slider-val-badge">{appSettings.glow.duration_ms}ms</span>
                    </div>
                  </div>

                  <div class="control-item">
                    <div class="control-label-group">
                      <span class="control-title">{t('glow.intensity')}</span>
                      <span class="control-sub">{t('glow.intensity_sub', { intensity: Math.round(appSettings.glow.intensity * 100) })}</span>
                    </div>
                    <div class="slider-box">
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        bind:value={appSettings.glow.intensity}
                        oninput={() => saveAppSettingsDebounced(150)}
                        onchange={saveAppSettings}
                        class="native-slider"
                      />
                      <span class="slider-val-badge">{Math.round(appSettings.glow.intensity * 100)}%</span>
                    </div>
                  </div>
                </div>
              </section>

              <!-- Multi-Monitor Targeting & Accent Color -->
              <section class="card panel-card">
                <div class="panel-header">
                  <div class="panel-title-wrap">
                    <div class="panel-icon-circle">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="2" y="3" width="20" height="14" rx="2"></rect>
                        <line x1="8" y1="21" x2="16" y2="21"></line>
                        <line x1="12" y1="17" x2="12" y2="21"></line>
                      </svg>
                    </div>
                    <div>
                      <h3 class="panel-title">{t('glow.targeting_title')}</h3>
                      <p class="panel-desc">{t('glow.targeting_desc')}</p>
                    </div>
                  </div>
                </div>

                <div class="controls-list">
                  <div class="control-item">
                    <div class="control-label-group">
                      <span class="control-title">{t('glow.monitor_target')}</span>
                      <span class="control-sub">{t('glow.monitor_sub')}</span>
                    </div>
                    <div class="dropdown-control-wrapper">
                      <Dropdown
                        items={MONITOR_OPTIONS}
                        value={appSettings.glow.monitor_target}
                        onSelect={(val: string) => {
                          appSettings.glow.monitor_target = val;
                          saveAppSettings();
                        }}
                      />
                    </div>
                  </div>

                  <div class="control-item">
                    <div class="control-label-group">
                      <span class="control-title">{t('glow.default_color')}</span>
                      <span class="control-sub">{t('glow.default_color_desc')}</span>
                    </div>
                    <ColorPicker
                      color={appSettings.glow.color}
                      onChange={(newCol: string) => {
                        appSettings.glow.color = newCol;
                        saveAppSettings();
                      }}
                    />
                  </div>
                </div>
              </section>

              <!-- Fullscreen & OLED Optimization -->
              <section class="card panel-card">
                <div class="panel-header">
                  <div class="panel-title-wrap">
                    <div class="panel-icon-circle">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 class="panel-title">{t('glow.optimization_title')}</h3>
                      <p class="panel-desc">{t('glow.optimization_desc')}</p>
                    </div>
                  </div>
                </div>

                <div class="controls-list">
                  <div class="control-item">
                    <div class="control-label-group">
                      <span class="control-title">{t('glow.fullscreen_title')}</span>
                      <span class="control-sub">{t('glow.fullscreen_sub')}</span>
                    </div>
                    <div class="dropdown-control-wrapper">
                      <Dropdown
                        items={FULLSCREEN_OPTIONS}
                        value={appSettings.fullscreen_behavior ?? "suppress_in_fullscreen"}
                        onSelect={(val: string) => {
                          appSettings.fullscreen_behavior = val as any;
                          saveAppSettings();
                        }}
                      />
                    </div>
                  </div>

                  <div class="control-item">
                    <div class="control-label-group">
                      <span class="control-title">{t('settings.oled_title')}</span>
                      <span class="control-sub">{t('glow.oled_sub')}</span>
                    </div>
                    <AppleSwitch
                      id="oled-mode-switch"
                      checked={appSettings.oled_mode}
                      onchange={(val) => {
                        appSettings.oled_mode = val;
                        saveAppSettings();
                      }}
                      ariaLabel="Toggle OLED optimization mode"
                    />
                  </div>

                  <div class="control-item">
                    <div class="control-label-group">
                      <span class="control-title">{t('glow.reduced_motion')}</span>
                      <span class="control-sub">{t('glow.reduced_motion_desc')}</span>
                    </div>
                    <AppleSwitch
                      id="reduced-motion-switch"
                      checked={appSettings.reduced_motion ?? false}
                      onchange={(val) => {
                        appSettings.reduced_motion = val;
                        saveAppSettings();
                      }}
                      ariaLabel="Toggle reduced motion accessibility"
                    />
                  </div>
                </div>
              </section>
            </div>
          </div>

        {:else}
          <!-- ============================================================= -->
          <!-- SETTINGS VIEW                                                 -->
          <!-- ============================================================= -->
          <div class="view-container settings-view">
            <div class="view-hero-header">
              <span class="hero-eyebrow">{t('settings.eyebrow')}</span>
              <h2 class="view-title">{t('settings.title')}</h2>
              <p class="view-subtitle">{t('settings.desc')}</p>
            </div>

            {#if settingsError}
              <div class="alert-banner danger">
                <span>Settings save error: {settingsError}</span>
                <button class="banner-close" onclick={() => (settingsError = null)}>✕</button>
              </div>
            {/if}

            <div class="settings-sections-stack">
              <!-- Appearance Mode & Language Row (2 columns) -->
              <div class="settings-appearance-grid">
                <!-- Sol Kolon: Appearance Mode -->
                <section class="card panel-card appearance-card">
                  <div class="appearance-col">
                    <div class="panel-title-wrap appearance-title-wrap">
                      <div class="panel-icon-circle">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
                      </div>
                      <div class="appearance-label-block">
                        <h3 class="panel-title">{t('settings.appearance_mode')}</h3>
                        <p class="panel-desc">{t('settings.appearance_desc')}</p>
                      </div>
                    </div>

                    <div class="appearance-tabs-container">
                      <AppearanceTabs
                        selected={appearance}
                        onChange={(mode) => handleAppearanceChange(mode)}
                      />
                    </div>
                  </div>
                </section>

                <!-- Sağ Kolon: Language Dropdown -->
                <section class="card panel-card language-card">
                  <div class="appearance-col">
                    <div class="panel-title-wrap appearance-title-wrap">
                      <div class="panel-icon-circle">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="2" y1="12" x2="22" y2="12"></line>
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                        </svg>
                      </div>
                      <div class="appearance-label-block">
                        <h3 class="panel-title">{t('settings.language')}</h3>
                        <p class="panel-desc">{t('settings.language_desc')}</p>
                      </div>
                    </div>

                    <div class="language-dropdown-container">
                      <Dropdown
                        id="language-selector"
                        items={LANGUAGE_DROPDOWN_OPTIONS}
                        value={$currentLanguage}
                        onchange={(val) => handleLanguageChange(val as string)}
                        ariaLabel={t('settings.language')}
                      />
                    </div>
                  </div>
                </section>
              </div>

              <!-- Appearance & Curated Themes -->
              <section class="card panel-card">
                <div class="panel-header">
                  <div class="panel-title-wrap">
                    <div class="panel-icon-circle">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 2a10 10 0 0 0 0 20"></path>
                        <path d="M12 2v20"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 class="panel-title">{t('settings.themes')}</h3>
                      <p class="panel-desc">{t('settings.themes_desc')}</p>
                    </div>
                  </div>
                </div>

                <ThemeSelector
                  bind:selectedTheme
                  appearance={effectiveAppearance}
                  onselect={(id) => selectTheme(id)}
                />
              </section>

              <!-- Windows Startup & Behavior -->
              <section class="card panel-card">
                <div class="panel-header">
                  <div class="panel-title-wrap">
                    <div class="panel-icon-circle">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="2" y="3" width="20" height="14" rx="2"></rect>
                        <line x1="8" y1="21" x2="16" y2="21"></line>
                        <line x1="12" y1="17" x2="12" y2="21"></line>
                      </svg>
                    </div>
                    <div>
                      <h3 class="panel-title">{t('settings.windows_title')}</h3>
                      <p class="panel-desc">{t('settings.windows_desc')}</p>
                    </div>
                  </div>
                </div>

                <div class="controls-list">
                  <div class="control-item">
                    <div class="control-label-group">
                      <span class="control-title">{t('settings.startup_title')}</span>
                      <span class="control-sub">{t('settings.startup_desc')}</span>
                    </div>
                    <AppleSwitch
                      id="startup-enabled-switch"
                      checked={appSettings.startup_enabled}
                      onchange={toggleStartup}
                      ariaLabel={t('settings.startup_title')}
                    />
                  </div>

                  <div class="control-item">
                    <div class="control-label-group">
                      <span class="control-title">{t('settings.master_title')}</span>
                      <span class="control-sub">{t('settings.master_desc')}</span>
                    </div>
                    <AppleSwitch
                      id="master-monitoring-switch"
                      checked={appSettings.enabled}
                      onchange={(val) => {
                        appSettings.enabled = val;
                        saveAppSettings();
                      }}
                      ariaLabel={t('settings.master_title')}
                    />
                  </div>
                </div>
              </section>

              <!-- Sound Alerts -->
              <section class="card panel-card">
                <div class="panel-header">
                  <div class="panel-title-wrap">
                    <div class="panel-icon-circle">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 class="panel-title">{t('settings.sound_chime_title')}</h3>
                      <p class="panel-desc">{t('settings.sound_chime_desc')}</p>
                    </div>
                  </div>
                </div>

                <div class="controls-list">
                  <div class="control-item">
                    <div class="control-label-group">
                      <span class="control-title">{t('settings.sound_chime_enable')}</span>
                      <span class="control-sub">{t('settings.sound_chime_enable_sub')}</span>
                    </div>
                    <AppleSwitch
                      id="sound-enabled-switch"
                      checked={appSettings.sound_enabled}
                      onchange={(val) => {
                        appSettings.sound_enabled = val;
                        saveAppSettings();
                      }}
                      ariaLabel={t('settings.sound_chime_enable')}
                    />
                  </div>

                  <div class="control-item">
                    <div class="control-label-group">
                      <span class="control-title">{t('settings.sound_test_title')}</span>
                      <span class="control-sub">{t('settings.sound_test_sub')}</span>
                    </div>
                    <button
                      class="secondary-btn"
                      onclick={testSoundAlert}
                      disabled={isPlayingSound}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon {isPlayingSound ? 'spin' : ''}">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                      </svg>
                      <span>{isPlayingSound ? t('settings.sound_playing') : t('settings.sound_play')}</span>
                    </button>
                  </div>
                </div>
              </section>

              <!-- History Retention & Limits -->
              <section class="card panel-card">
                <div class="panel-header">
                  <div class="panel-title-wrap">
                    <div class="panel-icon-circle">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                      </svg>
                    </div>
                    <div>
                      <h3 class="panel-title">{t('settings.history_storage_title')}</h3>
                      <p class="panel-desc">{t('settings.history_storage_desc')}</p>
                    </div>
                  </div>
                </div>

                <div class="controls-list">
                  <div class="control-item">
                    <div class="control-label-group">
                      <span class="control-title">{t('settings.show_feed_title')}</span>
                      <span class="control-sub">{t('settings.show_feed_sub')}</span>
                    </div>
                    <AppleSwitch
                      id="show-notifications-switch"
                      checked={appSettings.show_notifications}
                      onchange={(val) => {
                        appSettings.show_notifications = val;
                        saveAppSettings();
                      }}
                      ariaLabel={t('settings.show_feed_title')}
                    />
                  </div>

                  <div class="control-item">
                    <div class="control-label-group">
                      <span class="control-title">{t('settings.history_limit')}</span>
                      <span class="control-sub">{t('settings.history_limit_sub', { limit: appSettings.history_limit })}</span>
                    </div>
                    <div class="slider-box">
                      <input
                        type="range"
                        min="10"
                        max="500"
                        step="10"
                        bind:value={appSettings.history_limit}
                        oninput={() => saveAppSettingsDebounced(150)}
                        onchange={saveAppSettings}
                        class="native-slider"
                      />
                      <span class="slider-val-badge">{appSettings.history_limit}</span>
                    </div>
                  </div>
                </div>
              </section>

              <!-- Software Updates (Production Auto-Updater) -->
              <section class="card panel-card updater-card">
                <div class="panel-header">
                  <div class="panel-title-wrap">
                    <div class="panel-icon-circle">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                      </svg>
                    </div>
                    <div>
                      <h3 class="panel-title">{t('updater.title')}</h3>
                      <p class="panel-desc">{t('updater.desc')}</p>
                    </div>
                  </div>
                </div>

                <div class="controls-list">
                  <!-- Auto Update Enable / Disable Toggle -->
                  <div class="control-item">
                    <div class="control-label-group">
                      <span class="control-title">{t('updater.auto_updates')}</span>
                      <span class="control-sub">{t('updater.auto_updates_desc')}</span>
                    </div>
                    <AppleSwitch
                      id="auto-update-switch"
                      checked={appSettings.auto_update_enabled ?? true}
                      onchange={(val) => {
                        appSettings.auto_update_enabled = val;
                        saveAppSettings();
                      }}
                      ariaLabel={t('updater.auto_updates')}
                    />
                  </div>

                  <!-- Update Frequency Dropdown -->
                  <div class="control-item">
                    <div class="control-label-group">
                      <span class="control-title">{t('updater.check_frequency')}</span>
                      <span class="control-sub">{t('updater.check_frequency_desc')}</span>
                    </div>
                    <div class="dropdown-control-wrapper">
                      <Dropdown
                        id="update-frequency-dropdown"
                        items={AUTO_UPDATE_FREQUENCY_OPTIONS}
                        value={appSettings.auto_update_frequency ?? "daily"}
                        disabled={!(appSettings.auto_update_enabled ?? true)}
                        ariaLabel={t('updater.check_frequency')}
                        onchange={(val) => {
                          appSettings.auto_update_frequency = val as any;
                          saveAppSettings();
                        }}
                      />
                    </div>
                  </div>

                  <!-- Current Version & Action Row -->
                  <div class="control-item updater-row">
                    <div class="control-label-group">
                      <span class="control-title">Curry v{formatUserVersion(connectionInfo?.version ?? '2.0')}</span>
                      <span class="control-sub">
                        {#if updateStatusMessage}
                          {updateStatusMessage}
                        {:else}
                          {t('updater.up_to_date', { version: formatUserVersion(connectionInfo?.version ?? '2.0') })}
                        {/if}
                      </span>
                      {#if updateState === 'downloading' && updateProgress !== null}
                        <div class="update-progress-bar-wrap" role="progressbar" aria-valuenow={updateProgress} aria-valuemin="0" aria-valuemax="100">
                          <div class="update-progress-bar-fill" style="width: {updateProgress}%;"></div>
                        </div>
                      {/if}
                    </div>
                    <div class="updater-actions">
                      {#if updateState === 'downloading'}
                        <button
                          type="button"
                          class="secondary-btn cancel-update-btn"
                          onclick={cancelUpdateDownload}
                        >
                          <span>{t('updater.cancel')}</span>
                        </button>
                      {:else if updateState === 'restart_required'}
                        <button
                          type="button"
                          class="primary-btn restart-btn"
                          onclick={restartCurry}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
                            <polyline points="23 4 23 10 17 10"></polyline>
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                          </svg>
                          <span>{t('updater.restart_now')}</span>
                        </button>
                      {:else if updateState === 'available'}
                        <button
                          type="button"
                          class="primary-btn update-btn"
                          onclick={installUpdate}
                          disabled={isInstallingUpdate}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                          </svg>
                          <span>{t('updater.ready_to_install')}</span>
                        </button>
                      {:else if updateState === 'verifying' || updateState === 'installing'}
                        <button
                          type="button"
                          class="secondary-btn"
                          disabled
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon spin">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M12 6v6l4 2"></path>
                          </svg>
                          <span>{updateState === 'verifying' ? t('updater.verifying') : t('updater.installing')}</span>
                        </button>
                      {:else if updateState === 'error'}
                        <button
                          type="button"
                          class="secondary-btn retry-btn"
                          onclick={checkForUpdatesManually}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
                            <polyline points="1 4 1 10 7 10"></polyline>
                            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                          </svg>
                          <span>{t('updater.retry')}</span>
                        </button>
                      {:else}
                        <button
                          type="button"
                          class="secondary-btn"
                          onclick={checkForUpdatesManually}
                          disabled={isCheckingUpdate}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon {isCheckingUpdate ? 'spin' : ''}">
                            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                          </svg>
                          <span>{isCheckingUpdate ? t('updater.checking') : t('updater.check_now', {}, 'Check Now')}</span>
                        </button>
                      {/if}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        {/if}
      </div>
    {/key}
  </main>

  <!-- Status Bar Footer -->
  <footer class="app-status-bar">
    <div class="status-left">
      <span class="status-item">
        <span class="status-mini-dot {status === 'connected' ? 'ok' : 'err'}"></span>
        IPC: {status === 'connected' ? t('status.healthy') : t('status.disconnected')}
      </span>
      <span class="status-sep">&bull;</span>
      <span class="status-item">{t('status.provider')}: {pipelineStatus?.provider_name ?? 'Windows Notification'}</span>
      <span class="status-sep">&bull;</span>
      <span class="status-item">{t('status.captured')}: {pipelineStatus?.captured_count ?? notifications.length}</span>
    </div>

    <div class="status-right">
      <span class="status-item">{t('status.default')}: {t('status.perpetuity')}</span>
      <span class="status-sep">&bull;</span>
      <span class="status-item highlight">{t('status.single_instance')}</span>
    </div>
  </footer>

  <!-- Clear All Confirmation Modal Dialog -->
  {#if showClearConfirm}
    <div class="modal-backdrop">
      <button
        type="button"
        class="modal-backdrop-dismiss"
        onclick={() => (showClearConfirm = false)}
        aria-label="Close dialog"
      ></button>
      <div
        class="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clear-dialog-title"
        tabindex="-1"
      >
        <div class="modal-icon-circle danger">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </div>

        <h3 id="clear-dialog-title" class="modal-title">{t('notifications.clear_modal_title')}</h3>
        <p class="modal-body">
          {t('notifications.clear_modal_msg', { count: notifications.length })}
        </p>

        <div class="modal-footer-btns">
          <button
            class="secondary-btn"
            onclick={() => (showClearConfirm = false)}
            disabled={isClearing}
          >
            {t('common.cancel')}
          </button>
          <button
            class="danger-btn"
            onclick={confirmClearAll}
            disabled={isClearing}
          >
            {isClearing ? t('notifications.deleting') : t('notifications.delete_all_confirm')}
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Delete Profile Confirmation Modal Dialog -->
  {#if profileToDelete}
    <div class="modal-backdrop">
      <button
        type="button"
        class="modal-backdrop-dismiss"
        onclick={cancelDeleteProfile}
        aria-label="Close dialog"
      ></button>
      <div
        class="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-profile-dialog-title"
        tabindex="-1"
      >
        <div class="modal-icon-circle danger">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </div>

        <h3 id="delete-profile-dialog-title" class="modal-title">{t('apps.confirm_delete_title')}</h3>
        <p class="modal-body">
          {t('apps.confirm_delete_msg', { name: profileToDelete.applicationName })}
        </p>

        <div class="modal-footer-btns">
          <button
            class="secondary-btn"
            onclick={cancelDeleteProfile}
          >
            {t('common.cancel')}
          </button>
          <button
            class="danger-btn"
            onclick={confirmDeleteProfile}
          >
            {t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Application Profile Add / Edit Modal -->
  {#if isProfileModalOpen && editingProfile}
    <div class="modal-backdrop" onclick={closeProfileModal} role="presentation">
      <div
        class="modal-card card profile-modal-card"
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.stopPropagation()}
        role="dialog"
        tabindex="-1"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
      >
        <div class="modal-header">
          <div class="modal-title-group">
            <div
              class="app-avatar-box modal-avatar"
              style:--app-glow-color={editingProfile.color || appSettings.glow.color}
              style:border-color={editingProfile.color || appSettings.glow.color}
            >
              <span class="app-avatar-letter">{getAppInitial(editingProfile.applicationName)}</span>
            </div>
            <div>
              <h3 id="profile-modal-title" class="modal-title">
                {isCreatingNewProfile ? t('apps.modal_add_title') : t('apps.modal_edit_title')}
              </h3>
              <p class="modal-subtitle">{t('apps.modal_subtitle')}</p>
            </div>
          </div>
          <button class="modal-close-btn" onclick={closeProfileModal} aria-label="Close dialog">✕</button>
        </div>

        {#if profileActionError}
          <div class="alert-banner danger">
            <span>{profileActionError}</span>
          </div>
        {/if}

        <div class="modal-body-form">
          <div class="form-section-header">{t('apps.section_details')}</div>

          <div class="form-row">
            <label class="form-label" for="prof-app-name">{t('apps.app_name')}</label>
            <input
              id="prof-app-name"
              type="text"
              bind:value={editingProfile.applicationName}
              placeholder="e.g. Discord, Spotify, Steam"
              class="native-input"
            />
          </div>

          <div class="form-row">
            <label class="form-label" for="prof-exe-name">{t('apps.exe_name')}</label>
            <div class="input-with-action">
              <input
                id="prof-exe-name"
                type="text"
                bind:value={editingProfile.executableName}
                onblur={handleExeBlur}
                placeholder="e.g. Discord.exe, Spotify.exe, steam.exe"
                class="native-input"
              />
              <button
                type="button"
                id="prof-browse-btn"
                class="secondary-btn browse-btn"
                onclick={browseForExecutable}
                title="Browse Windows executable (*.exe)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tiny-icon">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>{t('apps.browse_exe')}</span>
              </button>
            </div>
          </div>

          {#if editingProfile.executablePath}
            <div class="form-row path-row">
              <label class="form-label" for="prof-exe-path">{t('apps.path')}</label>
              <div class="path-display-box">
                <span id="prof-exe-path" class="path-text" title={editingProfile.executablePath}>
                  {editingProfile.executablePath}
                </span>
                <button
                  type="button"
                  class="clear-path-btn"
                  onclick={() => { if (editingProfile) editingProfile.executablePath = null; }}
                  title="Clear path"
                >
                  ✕
                </button>
              </div>
            </div>
          {/if}

          <div class="control-item modal-toggle-item">
            <div class="control-label-group">
              <span class="control-title">{t('apps.enabled')}</span>
              <span class="control-sub">{t('apps.enabled_desc')}</span>
            </div>
            <AppleSwitch
              id="modal-profile-enabled-switch"
              checked={editingProfile.enabled}
              onchange={(val) => {
                if (editingProfile) editingProfile.enabled = val;
              }}
              ariaLabel="Toggle profile enabled state"
            />
          </div>

          <div class="form-section-header">{t('apps.section_glow')}</div>

          <!-- Glow Color -->
          <div class="form-row">
            <span class="form-label">{t('apps.override_color')}</span>
            <ColorPicker
              color={editingProfile.color || appSettings.glow.color}
              onChange={(newCol: string) => {
                if (editingProfile) editingProfile.color = newCol;
              }}
            />
          </div>

          <!-- Animation -->
          <div class="form-row">
            <span class="form-label">{t('glow.animation_style')}</span>
            <div class="dropdown-control-wrapper">
              <Dropdown
                items={ANIMATION_OPTIONS}
                value={editingProfile.animation || "pulse"}
                onSelect={(val: string) => {
                  if (editingProfile) editingProfile.animation = val as any;
                }}
              />
            </div>
          </div>

          <!-- Intensity Slider -->
          <div class="form-row">
            <div class="control-label-group">
              <label class="form-label" for="prof-intensity">{t('glow.intensity')} ({Math.round((editingProfile.intensity ?? appSettings.glow.intensity) * 100)}%)</label>
            </div>
            <div class="slider-box">
              <input
                id="prof-intensity"
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                bind:value={editingProfile.intensity}
                class="native-slider"
              />
              <span class="slider-val-badge">{Math.round((editingProfile.intensity ?? appSettings.glow.intensity) * 100)}%</span>
            </div>
          </div>

          <!-- Duration Slider -->
          <div class="form-row">
            <div class="control-label-group">
              <label class="form-label" for="prof-duration">{t('glow.duration')} ({editingProfile.duration ?? 2.0}s)</label>
            </div>
            <div class="slider-box">
              <input
                id="prof-duration"
                type="range"
                min="0.5"
                max="10.0"
                step="0.5"
                bind:value={editingProfile.duration}
                class="native-slider"
              />
              <span class="slider-val-badge">{editingProfile.duration ?? 2.0}s</span>
            </div>
          </div>

          <!-- Border Thickness Slider -->
          <div class="form-row">
            <div class="control-label-group">
              <label class="form-label" for="prof-thickness">{t('glow.thickness')} ({editingProfile.borderThickness ?? appSettings.glow.thickness}px)</label>
            </div>
            <div class="slider-box">
              <input
                id="prof-thickness"
                type="range"
                min="2"
                max="32"
                step="1"
                bind:value={editingProfile.borderThickness}
                class="native-slider"
              />
              <span class="slider-val-badge">{editingProfile.borderThickness ?? appSettings.glow.thickness}px</span>
            </div>
          </div>

          <!-- Corner Rounding Slider -->
          <div class="form-row">
            <div class="control-label-group">
              <label class="form-label" for="prof-rounding">{t('glow.corner_radius')} ({editingProfile.cornerRounding ?? appSettings.glow.corner_radius}px)</label>
            </div>
            <div class="slider-box">
              <input
                id="prof-rounding"
                type="range"
                min="0"
                max="48"
                step="2"
                bind:value={editingProfile.cornerRounding}
                class="native-slider"
              />
              <span class="slider-val-badge">{editingProfile.cornerRounding ?? appSettings.glow.corner_radius}px</span>
            </div>
          </div>

          <div class="form-section-header">{t('glow.optimization_title')}</div>

          <!-- Monitor Target -->
          <div class="form-row">
            <span class="form-label">{t('glow.monitor_target')}</span>
            <div class="dropdown-control-wrapper">
              <Dropdown
                items={MONITOR_OPTIONS}
                value={editingProfile.monitorTarget || "primary"}
                onSelect={(val: string) => {
                  if (editingProfile) editingProfile.monitorTarget = val;
                }}
              />
            </div>
          </div>

          <!-- Suppress in Fullscreen -->
          <div class="control-item modal-toggle-item">
            <div class="control-label-group">
              <span class="control-title">{t('glow.fullscreen_title')}</span>
              <span class="control-sub">{t('glow.fullscreen_sub')}</span>
            </div>
            <AppleSwitch
              id="modal-profile-suppress-switch"
              checked={editingProfile.suppressInFullscreen}
              onchange={(val) => {
                if (editingProfile) editingProfile.suppressInFullscreen = val;
              }}
              ariaLabel="Toggle fullscreen suppression"
            />
          </div>
        </div>

        <div class="modal-footer profile-modal-footer">
          <div class="modal-footer-left">
            {#if !isCreatingNewProfile}
              <button
                class="danger-btn"
                onclick={() => editingProfile && deleteProfile(editingProfile.id)}
              >
                {t('common.delete')}
              </button>
            {/if}
            <button
              class="secondary-btn preview-action-btn"
              onclick={() => previewProfileGlow(editingProfile)}
              disabled={isPreviewingProfile}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tiny-icon {isPreviewingProfile ? 'pulse' : ''}">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <span>{isPreviewingProfile ? t('apps.previewing') : t('apps.preview_btn')}</span>
            </button>
          </div>
          <div class="modal-footer-right">
            <button class="secondary-btn" onclick={closeProfileModal}>{t('common.cancel')}</button>
            <button class="primary-btn" onclick={saveProfile}>{t('common.save')}</button>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Application-Owned Centralized Error System Presentation -->
  <ErrorIsland reducedMotion={appSettings.reduced_motion} />
  <ErrorModal />
</div>

<style>
  /* ========================================================================= */
  /* WINDOWS 11 DESIGN SYSTEM & THEME TOKENS                                  */
  /* ========================================================================= */
  :global(body) {
    margin: 0;
    padding: 0;
    pointer-events: auto;
    background-color: #0b0f19;
    color: #f8fafc;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI Variable Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    user-select: none;
    overflow: hidden;
    transition: background-color 0.2s ease, color 0.15s ease;
  }

  /* Thin Theme-Aware Desktop Scrollbar */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 3px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: var(--border-strong);
  }

  /* Root Base Themes */
  :global(body[data-theme="perpetuity"]) { background-color: #000000; color: #ededed; }
  :global(body[data-theme="perpetuity"][data-appearance="light"]) { background-color: #ffffff; color: #000000; }
  :global(body[data-theme="indigo"]) { background-color: #0b0f19; color: #f0f4ff; }
  :global(body[data-theme="indigo"][data-appearance="light"]) { background-color: #f4f7fc; color: #0f172a; }
  :global(body[data-theme="violet"]) { background-color: #0e0c1b; color: #f3f1ff; }
  :global(body[data-theme="violet"][data-appearance="light"]) { background-color: #f8f7ff; color: #1a103c; }
  :global(body[data-theme="amethyst-haze"]) { background-color: #0e0b16; color: #f5f0ff; }
  :global(body[data-theme="amethyst-haze"][data-appearance="light"]) { background-color: #faf5ff; color: #2e1065; }
  :global(body[data-theme="catppuccin"]) { background-color: #181825; color: #cdd6f4; }
  :global(body[data-theme="catppuccin"][data-appearance="light"]) { background-color: #eff1f5; color: #4c4f69; }
  :global(body[data-theme="neon-magenta"]) { background-color: #0f0814; color: #fdf2f8; }
  :global(body[data-theme="neon-magenta"][data-appearance="light"]) { background-color: #fdf2f8; color: #831843; }
  :global(body[data-theme="sakura"]) { background-color: #180d13; color: #fff0f6; }
  :global(body[data-theme="sakura"][data-appearance="light"]) { background-color: #fff5f8; color: #3b1024; }
  :global(body[data-theme="burgundy"]) { background-color: #15080c; color: #fde8ef; }
  :global(body[data-theme="burgundy"][data-appearance="light"]) { background-color: #fff1f4; color: #4c0519; }
  :global(body[data-theme="amberstate"]) { background-color: #0d1117; color: #f8fafc; }
  :global(body[data-theme="amberstate"][data-appearance="light"]) { background-color: #fffbeb; color: #451a03; }
  :global(body[data-theme="mocha"]) { background-color: #16110d; color: #f9f0e8; }
  :global(body[data-theme="mocha"][data-appearance="light"]) { background-color: #fbf6f1; color: #332014; }
  :global(body[data-theme="sage-mist"]) { background-color: #0c1310; color: #ecfdf5; }
  :global(body[data-theme="sage-mist"][data-appearance="light"]) { background-color: #f0fdf4; color: #064e3b; }
  :global(body[data-theme="zen-linen"]) { background-color: #f7f6f2; color: #1c1b18; }
  :global(body[data-theme="zen-linen"][data-appearance="dark"]) { background-color: #181714; color: #f7f6f2; }

  /* ------------------------------------------------------------------------- */
  /* THEME 1: STANDARD (PERPETUITY - VERCEL MONOCHROME PRECISION - DEFAULT)    */
  /* ------------------------------------------------------------------------- */
  .shell,
  .shell[data-theme="perpetuity"] {
    --bg: #000000;
    --bg-secondary: #0a0a0a;
    --surface: #111111;
    --surface-elevated: #1a1a1a;
    --surface-hover: #222222;
    --border: rgba(255, 255, 255, 0.14);
    --border-strong: rgba(0, 112, 243, 0.5);
    --text-primary: #ededed;
    --text-secondary: #a1a1a1;
    --text-muted: #888888;
    --accent: #ffffff;
    --accent-hover: #eaeaea;
    --accent-fg: #000000;
    --accent-gradient: linear-gradient(135deg, #0070f3 0%, #00dfd8 100%);
    --header-glow: radial-gradient(circle, rgba(0, 112, 243, 0.16) 0%, rgba(50, 145, 255, 0.05) 50%, transparent 70%);
    --glow-surface: rgba(0, 112, 243, 0.18);
    --ring: #0070f3;
    --danger: #e00000;
    --danger-bg: rgba(224, 0, 0, 0.14);
    --danger-border: rgba(224, 0, 0, 0.35);
    --danger-text: #ff6666;
    --warning: #f5a623;
    --warning-bg: rgba(245, 166, 35, 0.14);
    --warning-border: rgba(245, 166, 35, 0.35);
    --warning-text: #f5a623;
    --success: #0070f3;
    --success-bg: rgba(0, 112, 243, 0.14);
    --success-border: rgba(0, 112, 243, 0.35);
    --success-text: #3291ff;
  }

  .shell[data-theme="perpetuity"][data-appearance="light"] {
    --bg: #ffffff;
    --bg-secondary: #fafafa;
    --surface: #ffffff;
    --surface-elevated: #f5f5f5;
    --surface-hover: #eaeaea;
    --border: rgba(0, 0, 0, 0.09);
    --border-strong: rgba(0, 112, 243, 0.45);
    --text-primary: #000000;
    --text-secondary: #444444;
    --text-muted: #666666;
    --accent: #000000;
    --accent-hover: #222222;
    --accent-fg: #ffffff;
    --ring: #0070f3;
    --warning-text: #fbbf24;
    --success: #10b981;
    --success-bg: rgba(16, 185, 129, 0.14);
    --success-border: rgba(16, 185, 129, 0.35);
    --success-text: #34d399;
  }

  /* ------------------------------------------------------------------------- */
  /* THEME 3: CATPPUCCIN                                                       */
  /* ------------------------------------------------------------------------- */
  .shell[data-theme="catppuccin"] {
    --bg: #181825;
    --bg-secondary: #11111b;
    --surface: #1e1e2e;
    --surface-elevated: #313244;
    --surface-hover: #3b3c52;
    --border: rgba(147, 153, 178, 0.2);
    --border-strong: rgba(203, 166, 247, 0.45);
    --text-primary: #cdd6f4;
    --text-secondary: #bac2de;
    --text-muted: #a6adc8;
    --accent: #cba6f7;
    --accent-hover: #b4befe;
    --accent-fg: #11111b;
    --accent-gradient: linear-gradient(135deg, #cba6f7 0%, #89b4fa 100%);
    --header-glow: radial-gradient(circle, rgba(203, 166, 247, 0.16) 0%, rgba(137, 180, 250, 0.05) 50%, transparent 70%);
    --glow-surface: rgba(203, 166, 247, 0.2);
    --ring: #cba6f7;
    --danger: #f38ba8;
    --danger-bg: rgba(243, 139, 168, 0.14);
    --danger-border: rgba(243, 139, 168, 0.35);
    --danger-text: #f38ba8;
    --warning: #f9e2af;
    --warning-bg: rgba(249, 226, 175, 0.14);
    --warning-border: rgba(249, 226, 175, 0.35);
    --warning-text: #f9e2af;
    --success: #a6e3a1;
    --success-bg: rgba(166, 227, 161, 0.14);
    --success-border: rgba(166, 227, 161, 0.35);
    --success-text: #a6e3a1;
  }

  .shell[data-theme="catppuccin"][data-appearance="light"] {
    --bg: #eff1f5;
    --bg-secondary: #e6e9ef;
    --surface: #ffffff;
    --surface-elevated: #dce0e8;
    --surface-hover: #ccd0da;
    --border: rgba(140, 143, 161, 0.25);
    --border-strong: rgba(136, 57, 239, 0.45);
    --text-primary: #4c4f69;
    --text-secondary: #5c5f77;
    --text-muted: #6c6f85;
    --accent: #8839ef;
    --accent-hover: #7287fd;
    --accent-fg: #ffffff;
    --accent-gradient: linear-gradient(135deg, #8839ef 0%, #1e66f5 100%);
    --header-glow: radial-gradient(circle, rgba(136, 57, 239, 0.12) 0%, rgba(30, 102, 245, 0.05) 50%, transparent 70%);
    --glow-surface: rgba(136, 57, 239, 0.15);
    --ring: #8839ef;
    --danger: #d20f39;
    --danger-bg: rgba(210, 15, 57, 0.12);
    --danger-border: rgba(210, 15, 57, 0.3);
    --danger-text: #d20f39;
    --warning: #df8e1d;
    --warning-bg: rgba(223, 142, 29, 0.12);
    --warning-border: rgba(223, 142, 29, 0.3);
    --warning-text: #df8e1d;
    --success: #40a02b;
    --success-bg: rgba(64, 160, 43, 0.12);
    --success-border: rgba(64, 160, 43, 0.3);
    --success-text: #40a02b;
  }

  /* ------------------------------------------------------------------------- */
  /* THEME: ZEN LINEN (LIGHT & DARK DUAL-MODE)                                 */
  /* ------------------------------------------------------------------------- */
  .shell[data-theme="zen-linen"] {
    --bg: #f7f6f2;
    --bg-secondary: #efeee9;
    --surface: #fcfbfa;
    --surface-elevated: #e8e6df;
    --surface-hover: #dedbd3;
    --border: rgba(120, 115, 105, 0.22);
    --border-strong: rgba(92, 103, 83, 0.45);
    --text-primary: #1c1b18;
    --text-secondary: #45433d;
    --text-muted: #706d64;
    --accent: #5c6753;
    --accent-hover: #475040;
    --accent-fg: #ffffff;
    --accent-gradient: linear-gradient(135deg, #5c6753 0%, #8a957f 100%);
    --header-glow: radial-gradient(circle, rgba(92, 103, 83, 0.12) 0%, rgba(138, 149, 127, 0.05) 50%, transparent 70%);
    --glow-surface: rgba(92, 103, 83, 0.16);
    --ring: #5c6753;
    --danger: #b91c1c;
    --danger-bg: rgba(185, 28, 28, 0.1);
    --danger-border: rgba(185, 28, 28, 0.3);
    --danger-text: #991b1b;
    --warning: #b8860b;
    --warning-bg: rgba(184, 134, 11, 0.12);
    --warning-border: rgba(184, 134, 11, 0.3);
    --warning-text: #8b5a04;
    --success: #2d6a4f;
    --success-bg: rgba(45, 106, 79, 0.12);
    --success-border: rgba(45, 106, 79, 0.3);
    --success-text: #2d6a4f;
  }

  .shell[data-theme="zen-linen"][data-appearance="dark"] {
    --bg: #181714;
    --bg-secondary: #12110e;
    --surface: #201f1b;
    --surface-elevated: #2a2924;
    --surface-hover: #33322c;
    --border: rgba(180, 175, 160, 0.16);
    --border-strong: rgba(138, 149, 127, 0.45);
    --text-primary: #f7f6f2;
    --text-secondary: #c4c1b5;
    --text-muted: #8e8a7d;
    --accent: #7a8870;
    --accent-hover: #8f9e85;
    --accent-fg: #ffffff;
    --accent-gradient: linear-gradient(135deg, #7a8870 0%, #a4af9a 100%);
    --header-glow: radial-gradient(circle, rgba(122, 136, 112, 0.15) 0%, rgba(164, 175, 154, 0.05) 50%, transparent 70%);
    --glow-surface: rgba(122, 136, 112, 0.18);
    --ring: #7a8870;
    --danger: #f87171;
    --danger-bg: rgba(248, 113, 113, 0.14);
    --danger-border: rgba(248, 113, 113, 0.35);
    --danger-text: #fca5a5;
    --warning: #fbbf24;
    --warning-bg: rgba(251, 191, 36, 0.14);
    --warning-border: rgba(251, 191, 36, 0.35);
    --warning-text: #fbbf24;
    --success: #34d399;
    --success-bg: rgba(52, 211, 153, 0.14);
    --success-border: rgba(52, 211, 153, 0.35);
    --success-text: #34d399;
  }

  /* ------------------------------------------------------------------------- */
  /* THEME 6: NEON MAGENTA                                                     */
  /* ------------------------------------------------------------------------- */
  .shell[data-theme="neon-magenta"] {
    --bg: #0f0814;
    --bg-secondary: #09040c;
    --surface: #1a0e24;
    --surface-elevated: #29163a;
    --surface-hover: #3a2052;
    --border: rgba(236, 72, 153, 0.22);
    --border-strong: rgba(244, 63, 94, 0.5);
    --text-primary: #fdf2f8;
    --text-secondary: #fce7f3;
    --text-muted: #f472b6;
    --accent: #e11488;
    --accent-hover: #c00e73;
    --accent-fg: #ffffff;
    --accent-gradient: linear-gradient(135deg, #e11488 0%, #06b6d4 100%);
    --header-glow: radial-gradient(circle, rgba(225, 20, 136, 0.2) 0%, rgba(6, 182, 212, 0.08) 50%, transparent 70%);
    --glow-surface: rgba(225, 20, 136, 0.24);
    --ring: #e11488;
    --danger: #e11488;
    --danger-bg: rgba(225, 20, 136, 0.14);
    --danger-border: rgba(225, 20, 136, 0.35);
    --danger-text: #f472b6;
    --warning: #f59e0b;
    --warning-bg: rgba(245, 158, 11, 0.14);
    --warning-border: rgba(245, 158, 11, 0.35);
    --warning-text: #fbbf24;
    --success: #10b981;
    --success-bg: rgba(16, 185, 129, 0.14);
    --success-border: rgba(16, 185, 129, 0.35);
    --success-text: #34d399;
  }

  .shell[data-theme="neon-magenta"][data-appearance="light"] {
    --bg: #fdf2f8;
    --bg-secondary: #fce7f3;
    --surface: #ffffff;
    --surface-elevated: #fbcfe8;
    --surface-hover: #f9a8d4;
    --border: rgba(236, 72, 153, 0.22);
    --border-strong: rgba(219, 39, 119, 0.45);
    --text-primary: #831843;
    --text-secondary: #9d174d;
    --text-muted: #be185d;
    --accent: #db2777;
    --accent-hover: #be185d;
    --accent-fg: #ffffff;
    --accent-gradient: linear-gradient(135deg, #db2777 0%, #0891b2 100%);
    --header-glow: radial-gradient(circle, rgba(219, 39, 119, 0.14) 0%, rgba(8, 145, 178, 0.06) 50%, transparent 70%);
    --glow-surface: rgba(219, 39, 119, 0.18);
    --ring: #db2777;
    --danger: #e11488;
    --danger-bg: rgba(225, 20, 136, 0.12);
    --danger-border: rgba(225, 20, 136, 0.3);
    --danger-text: #e11488;
    --warning: #d97706;
    --warning-bg: rgba(217, 119, 6, 0.12);
    --warning-border: rgba(217, 119, 6, 0.3);
    --warning-text: #d97706;
    --success: #059669;
    --success-bg: rgba(5, 150, 105, 0.12);
    --success-border: rgba(5, 150, 105, 0.3);
    --success-text: #059669;
  }

  /* ------------------------------------------------------------------------- */
  /* THEME 7: AMETHYST HAZE                                                    */
  /* ------------------------------------------------------------------------- */
  .shell[data-theme="amethyst-haze"] {
    --bg: #0e0b16;
    --bg-secondary: #08060c;
    --surface: #191329;
    --surface-elevated: #281c40;
    --surface-hover: #352554;
    --border: rgba(168, 85, 247, 0.22);
    --border-strong: rgba(192, 132, 252, 0.45);
    --text-primary: #f5f0ff;
    --text-secondary: #e9d5ff;
    --text-muted: #c084fc;
    --accent: #a855f7;
    --accent-hover: #9333ea;
    --accent-fg: #ffffff;
    --accent-gradient: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
    --header-glow: radial-gradient(circle, rgba(168, 85, 247, 0.18) 0%, rgba(236, 72, 153, 0.08) 50%, transparent 70%);
    --glow-surface: rgba(168, 85, 247, 0.22);
    --ring: #a855f7;
    --danger: #f43f5e;
    --danger-bg: rgba(244, 63, 94, 0.14);
    --danger-border: rgba(244, 63, 94, 0.35);
    --danger-text: #fb7185;
    --warning: #fbbf24;
    --warning-bg: rgba(251, 191, 36, 0.14);
    --warning-border: rgba(251, 191, 36, 0.35);
    --warning-text: #fbbf24;
    --success: #34d399;
    --success-bg: rgba(52, 211, 153, 0.14);
    --success-border: rgba(52, 211, 153, 0.35);
    --success-text: #34d399;
  }

  .shell[data-theme="amethyst-haze"][data-appearance="light"] {
    --bg: #faf5ff;
    --bg-secondary: #f3e8ff;
    --surface: #ffffff;
    --surface-elevated: #f7edff;
    --surface-hover: #ebd5ff;
    --border: rgba(168, 85, 247, 0.2);
    --border-strong: rgba(147, 51, 234, 0.45);
    --text-primary: #2e1065;
    --text-secondary: #581c87;
    --text-muted: #7e22ce;
    --accent: #9333ea;
    --accent-hover: #7e22ce;
    --accent-fg: #ffffff;
    --accent-gradient: linear-gradient(135deg, #9333ea 0%, #c084fc 100%);
    --header-glow: radial-gradient(circle, rgba(147, 51, 234, 0.14) 0%, rgba(192, 132, 252, 0.06) 50%, transparent 70%);
    --glow-surface: rgba(147, 51, 234, 0.18);
    --ring: #9333ea;
    --danger: #e11d48;
    --danger-bg: rgba(225, 29, 72, 0.12);
    --danger-border: rgba(225, 29, 72, 0.3);
    --danger-text: #e11d48;
    --warning: #d97706;
    --warning-bg: rgba(217, 119, 6, 0.12);
    --warning-border: rgba(217, 119, 6, 0.3);
    --warning-text: #d97706;
    --success: #059669;
    --success-bg: rgba(5, 150, 105, 0.12);
    --success-border: rgba(5, 150, 105, 0.3);
    --success-text: #059669;
  }

  /* ------------------------------------------------------------------------- */
  /* THEME 8: SAGE MIST                                                        */
  /* ------------------------------------------------------------------------- */
  .shell[data-theme="sage-mist"] {
    --bg: #0c1310;
    --bg-secondary: #070b09;
    --surface: #121e18;
    --surface-elevated: #1a2c24;
    --surface-hover: #233a30;
    --border: rgba(52, 211, 153, 0.22);
    --border-strong: rgba(52, 211, 153, 0.45);
    --text-primary: #ecfdf5;
    --text-secondary: #d1fae5;
    --text-muted: #a7f3d0;
    --accent: #34d399;
    --accent-hover: #10b981;
    --accent-fg: #064e3b;
    --accent-gradient: linear-gradient(135deg, #34d399 0%, #14b8a6 100%);
    --header-glow: radial-gradient(circle, rgba(52, 211, 153, 0.16) 0%, rgba(20, 184, 166, 0.08) 50%, transparent 70%);
    --glow-surface: rgba(52, 211, 153, 0.2);
    --ring: #34d399;
    --danger: #f87171;
    --danger-bg: rgba(248, 113, 113, 0.14);
    --danger-border: rgba(248, 113, 113, 0.35);
    --danger-text: #fca5a5;
    --warning: #f59e0b;
    --warning-bg: rgba(245, 158, 11, 0.14);
    --warning-border: rgba(245, 158, 11, 0.35);
    --warning-text: #fbbf24;
    --success: #10b981;
    --success-bg: rgba(16, 185, 129, 0.14);
    --success-border: rgba(16, 185, 129, 0.35);
    --success-text: #34d399;
  }

  .shell[data-theme="sage-mist"][data-appearance="light"] {
    --bg: #f0fdf4;
    --bg-secondary: #dcfce7;
    --surface: #ffffff;
    --surface-elevated: #bbf7d0;
    --surface-hover: #a7f3d0;
    --border: rgba(52, 211, 153, 0.28);
    --border-strong: rgba(5, 150, 105, 0.45);
    --text-primary: #064e3b;
    --text-secondary: #065f46;
    --text-muted: #047857;
    --accent: #059669;
    --accent-hover: #047857;
    --accent-fg: #ffffff;
    --accent-gradient: linear-gradient(135deg, #059669 0%, #14b8a6 100%);
    --header-glow: radial-gradient(circle, rgba(5, 150, 105, 0.14) 0%, rgba(20, 184, 166, 0.06) 50%, transparent 70%);
    --glow-surface: rgba(5, 150, 105, 0.18);
    --ring: #059669;
    --danger: #dc2626;
    --danger-bg: rgba(220, 38, 38, 0.12);
    --danger-border: rgba(220, 38, 38, 0.3);
    --danger-text: #dc2626;
    --warning: #d97706;
    --warning-bg: rgba(217, 119, 6, 0.12);
    --warning-border: rgba(217, 119, 6, 0.3);
    --warning-text: #d97706;
    --success: #059669;
    --success-bg: rgba(5, 150, 105, 0.12);
    --success-border: rgba(5, 150, 105, 0.3);
    --success-text: #059669;
  }

  /* ------------------------------------------------------------------------- */
  /* THEME 10: AMBERSTATE                                                      */
  /* ------------------------------------------------------------------------- */
  .shell[data-theme="amberstate"] {
    --bg: #0d1117;
    --bg-secondary: #080a0e;
    --surface: #161b22;
    --surface-elevated: #212833;
    --surface-hover: #2b3543;
    --border: rgba(245, 158, 11, 0.22);
    --border-strong: rgba(251, 191, 36, 0.45);
    --text-primary: #f8fafc;
    --text-secondary: #e2e8f0;
    --text-muted: #cbd5e1;
    --accent: #f59e0b;
    --accent-hover: #d97706;
    --accent-fg: #1a1003;
    --accent-gradient: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
    --header-glow: radial-gradient(circle, rgba(245, 158, 11, 0.18) 0%, rgba(234, 88, 12, 0.08) 50%, transparent 70%);
    --glow-surface: rgba(245, 158, 11, 0.22);
    --ring: #f59e0b;
    --danger: #ef4444;
    --danger-bg: rgba(239, 68, 68, 0.14);
    --danger-border: rgba(239, 68, 68, 0.35);
    --danger-text: #fca5a5;
    --warning: #f59e0b;
    --warning-bg: rgba(245, 158, 11, 0.14);
    --warning-border: rgba(245, 158, 11, 0.35);
    --warning-text: #fde68a;
    --success: #10b981;
    --success-bg: rgba(16, 185, 129, 0.14);
    --success-border: rgba(16, 185, 129, 0.35);
    --success-text: #34d399;
  }

  .shell[data-theme="amberstate"][data-appearance="light"] {
    --bg: #fffbeb;
    --bg-secondary: #fef3c7;
    --surface: #ffffff;
    --surface-elevated: #fde68a;
    --surface-hover: #fcd34d;
    --border: rgba(245, 158, 11, 0.22);
    --border-strong: rgba(217, 119, 6, 0.45);
    --text-primary: #451a03;
    --text-secondary: #78350f;
    --text-muted: #92400e;
    --accent: #d97706;
    --accent-hover: #b45309;
    --accent-fg: #ffffff;
    --accent-gradient: linear-gradient(135deg, #d97706 0%, #ea580c 100%);
    --header-glow: radial-gradient(circle, rgba(217, 119, 6, 0.14) 0%, rgba(234, 88, 12, 0.06) 50%, transparent 70%);
    --glow-surface: rgba(217, 119, 6, 0.18);
    --ring: #d97706;
    --danger: #dc2626;
    --danger-bg: rgba(220, 38, 38, 0.12);
    --danger-border: rgba(220, 38, 38, 0.3);
    --danger-text: #dc2626;
    --warning: #d97706;
    --warning-bg: rgba(217, 119, 6, 0.12);
    --warning-border: rgba(217, 119, 6, 0.3);
    --warning-text: #d97706;
    --success: #059669;
    --success-bg: rgba(5, 150, 105, 0.12);
    --success-border: rgba(5, 150, 105, 0.3);
    --success-text: #059669;
  }

  /* ------------------------------------------------------------------------- */
  /* THEME 11: INDIGO FROST                                                    */
  /* ------------------------------------------------------------------------- */
  .shell[data-theme="indigo"] {
    --bg: #0b0f19;
    --bg-secondary: #070a12;
    --surface: #162035;
    --surface-elevated: #1e293b;
    --surface-hover: #27364f;
    --border: rgba(99, 102, 241, 0.22);
    --border-strong: rgba(99, 102, 241, 0.45);
    --text-primary: #f0f4ff;
    --text-secondary: #cbd5e1;
    --text-muted: #94a3b8;
    --accent: #6366f1;
    --accent-hover: #4f46e5;
    --accent-fg: #ffffff;
    --accent-gradient: linear-gradient(135deg, #6366f1 0%, #38bdf8 100%);
    --header-glow: radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, rgba(56, 189, 248, 0.08) 50%, transparent 70%);
    --glow-surface: rgba(99, 102, 241, 0.22);
    --ring: #6366f1;
    --danger: #ef4444;
    --danger-bg: rgba(239, 68, 68, 0.14);
    --danger-border: rgba(239, 68, 68, 0.35);
    --danger-text: #fca5a5;
    --warning: #f59e0b;
    --warning-bg: rgba(245, 158, 11, 0.14);
    --warning-border: rgba(245, 158, 11, 0.35);
    --warning-text: #fbbf24;
    --success: #10b981;
    --success-bg: rgba(16, 185, 129, 0.14);
    --success-border: rgba(16, 185, 129, 0.35);
    --success-text: #34d399;
  }

  .shell[data-theme="indigo"][data-appearance="light"] {
    --bg: #f4f7fc;
    --bg-secondary: #ebf0f9;
    --surface: #ffffff;
    --surface-elevated: #f1f5fb;
    --surface-hover: #e2eaf5;
    --border: rgba(99, 102, 241, 0.18);
    --border-strong: rgba(99, 102, 241, 0.4);
    --text-primary: #0f172a;
    --text-secondary: #334155;
    --text-muted: #64748b;
    --accent: #4f46e5;
    --accent-hover: #4338ca;
    --accent-fg: #ffffff;
  }

  /* ------------------------------------------------------------------------- */
  /* THEME 12: VIOLET DUSK                                                     */
  /* ------------------------------------------------------------------------- */
  .shell[data-theme="violet"] {
    --bg: #0e0c1b;
    --bg-secondary: #080612;
    --surface: #1f1b3c;
    --surface-elevated: #27224b;
    --surface-hover: #332d61;
    --border: rgba(99, 102, 241, 0.25);
    --border-strong: rgba(168, 85, 247, 0.45);
    --text-primary: #f3f1ff;
    --text-secondary: #dcd7ff;
    --text-muted: #a8a1d9;
    --accent: #6366f1;
    --accent-hover: #4f46e5;
    --accent-fg: #ffffff;
    --accent-gradient: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
    --header-glow: radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.08) 50%, transparent 70%);
    --glow-surface: rgba(99, 102, 241, 0.22);
    --ring: #6366f1;
    --danger: #f43f5e;
    --danger-bg: rgba(244, 63, 94, 0.14);
    --danger-border: rgba(244, 63, 94, 0.35);
    --danger-text: #fb7185;
    --warning: #f59e0b;
    --warning-bg: rgba(245, 158, 11, 0.14);
    --warning-border: rgba(245, 158, 11, 0.35);
    --warning-text: #fbbf24;
    --success: #10b981;
    --success-bg: rgba(16, 185, 129, 0.14);
    --success-border: rgba(16, 185, 129, 0.35);
    --success-text: #34d399;
  }

  .shell[data-theme="violet"][data-appearance="light"] {
    --bg: #f8f7ff;
    --bg-secondary: #f0eeff;
    --surface: #ffffff;
    --surface-elevated: #f4f2ff;
    --surface-hover: #e8e4ff;
    --border: rgba(99, 102, 241, 0.2);
    --border-strong: rgba(99, 102, 241, 0.45);
    --text-primary: #1a103c;
    --text-secondary: #4338ca;
    --text-muted: #6e5fa3;
    --accent: #6366f1;
    --accent-hover: #4f46e5;
    --accent-fg: #ffffff;
    --accent-gradient: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    --header-glow: radial-gradient(circle, rgba(99, 102, 241, 0.14) 0%, rgba(139, 92, 246, 0.06) 50%, transparent 70%);
    --glow-surface: rgba(99, 102, 241, 0.18);
    --ring: #6366f1;
    --danger: #f43f5e;
    --danger-bg: rgba(244, 63, 94, 0.12);
    --danger-border: rgba(244, 63, 94, 0.3);
    --danger-text: #f43f5e;
    --warning: #f59e0b;
    --warning-bg: rgba(245, 158, 11, 0.12);
    --warning-border: rgba(245, 158, 11, 0.3);
    --warning-text: #f59e0b;
    --success: #10b981;
    --success-bg: rgba(16, 185, 129, 0.12);
    --success-border: rgba(16, 185, 129, 0.3);
    --success-text: #10b981;
  }

  /* ------------------------------------------------------------------------- */
  /* THEME 13: SAKURA DAWN                                                     */
  /* ------------------------------------------------------------------------- */
  .shell[data-theme="sakura"] {
    --bg: #180d13;
    --bg-secondary: #10080d;
    --surface: #2e1a26;
    --surface-elevated: #361f2d;
    --surface-hover: #4a2b3e;
    --border: rgba(244, 63, 94, 0.25);
    --border-strong: rgba(251, 113, 133, 0.45);
    --text-primary: #fff0f6;
    --text-secondary: #fce7f3;
    --text-muted: #deabc2;
    --accent: #f43f5e;
    --accent-hover: #e11d48;
    --accent-fg: #ffffff;
    --accent-gradient: linear-gradient(135deg, #f43f5e 0%, #fda4af 100%);
    --header-glow: radial-gradient(circle, rgba(244, 63, 94, 0.18) 0%, rgba(253, 164, 175, 0.08) 50%, transparent 70%);
    --glow-surface: rgba(244, 63, 94, 0.22);
    --ring: #f43f5e;
    --danger: #e11d48;
    --danger-bg: rgba(225, 29, 72, 0.14);
    --danger-border: rgba(225, 29, 72, 0.35);
    --danger-text: #fda4af;
    --warning: #f59e0b;
    --warning-bg: rgba(245, 158, 11, 0.14);
    --warning-border: rgba(245, 158, 11, 0.35);
    --warning-text: #fbbf24;
    --success: #10b981;
    --success-bg: rgba(16, 185, 129, 0.14);
    --success-border: rgba(16, 185, 129, 0.35);
    --success-text: #34d399;
  }

  .shell[data-theme="sakura"][data-appearance="light"] {
    --bg: #fff5f8;
    --bg-secondary: #ffeaf1;
    --surface: #ffffff;
    --surface-elevated: #fff0f4;
    --surface-hover: #ffe4ec;
    --border: rgba(244, 63, 94, 0.18);
    --border-strong: rgba(244, 63, 94, 0.35);
    --text-primary: #3b1024;
    --text-secondary: #5a1e3b;
    --text-muted: #8e4467;
    --accent: #e11d48;
    --accent-hover: #be123c;
    --accent-fg: #ffffff;
  }

  /* ------------------------------------------------------------------------- */
  /* THEME 14: BURGUNDY WINE                                                   */
  /* ------------------------------------------------------------------------- */
  .shell[data-theme="burgundy"] {
    --bg: #15080c;
    --bg-secondary: #0d0407;
    --surface: #26121b;
    --surface-elevated: #2e1621;
    --surface-hover: #401f2f;
    --border: rgba(225, 29, 72, 0.25);
    --border-strong: rgba(244, 63, 94, 0.45);
    --text-primary: #fde8ef;
    --text-secondary: #fbcfe8;
    --text-muted: #c997a8;
    --accent: #e11d48;
    --accent-hover: #be123c;
    --accent-fg: #ffffff;
    --accent-gradient: linear-gradient(135deg, #e11d48 0%, #be123c 100%);
    --header-glow: radial-gradient(circle, rgba(225, 29, 72, 0.18) 0%, rgba(190, 18, 60, 0.08) 50%, transparent 70%);
    --glow-surface: rgba(225, 29, 72, 0.22);
    --ring: #e11d48;
    --danger: #be123c;
    --danger-bg: rgba(190, 18, 60, 0.14);
    --danger-border: rgba(190, 18, 60, 0.35);
    --danger-text: #fda4af;
    --warning: #f59e0b;
    --warning-bg: rgba(245, 158, 11, 0.14);
    --warning-border: rgba(245, 158, 11, 0.35);
    --warning-text: #fbbf24;
    --success: #10b981;
    --success-bg: rgba(16, 185, 129, 0.14);
    --success-border: rgba(16, 185, 129, 0.35);
    --success-text: #34d399;
  }

  .shell[data-theme="burgundy"][data-appearance="light"] {
    --bg: #fff1f4;
    --bg-secondary: #ffe4ea;
    --surface: #ffffff;
    --surface-elevated: #ffebf0;
    --surface-hover: #ffdfe7;
    --border: rgba(225, 29, 72, 0.2);
    --border-strong: rgba(225, 29, 72, 0.4);
    --text-primary: #4c0519;
    --text-secondary: #700b27;
    --text-muted: #9f1239;
    --accent: #be123c;
    --accent-hover: #9f1239;
    --accent-fg: #ffffff;
  }

  /* ------------------------------------------------------------------------- */
  /* THEME 15: MOCHA MOUSSE                                                    */
  /* ------------------------------------------------------------------------- */
  .shell[data-theme="mocha"] {
    --bg: #16110d;
    --bg-secondary: #0e0a07;
    --surface: #281f19;
    --surface-elevated: #31261e;
    --surface-hover: #44342a;
    --border: rgba(217, 119, 6, 0.25);
    --border-strong: rgba(245, 158, 11, 0.45);
    --text-primary: #f9f0e8;
    --text-secondary: #fed7aa;
    --text-muted: #c4aea0;
    --accent: #d97706;
    --accent-hover: #b45309;
    --accent-fg: #ffffff;
    --accent-gradient: linear-gradient(135deg, #d97706 0%, #b45309 100%);
    --header-glow: radial-gradient(circle, rgba(217, 119, 6, 0.18) 0%, rgba(180, 83, 9, 0.08) 50%, transparent 70%);
    --glow-surface: rgba(217, 119, 6, 0.22);
    --ring: #d97706;
    --danger: #ef4444;
    --danger-bg: rgba(239, 68, 68, 0.14);
    --danger-border: rgba(239, 68, 68, 0.35);
    --danger-text: #fca5a5;
    --warning: #f59e0b;
    --warning-bg: rgba(245, 158, 11, 0.14);
    --warning-border: rgba(245, 158, 11, 0.35);
    --warning-text: #fde68a;
    --success: #10b981;
    --success-bg: rgba(16, 185, 129, 0.14);
    --success-border: rgba(16, 185, 129, 0.35);
    --success-text: #34d399;
  }

  .shell[data-theme="mocha"][data-appearance="light"] {
    --bg: #fbf6f1;
    --bg-secondary: #f4eae1;
    --surface: #ffffff;
    --surface-elevated: #f7efe7;
    --surface-hover: #efe2d5;
    --border: rgba(180, 83, 9, 0.2);
    --border-strong: rgba(180, 83, 9, 0.4);
    --text-primary: #332014;
    --text-secondary: #54341e;
    --text-muted: #735643;
    --accent: #b45309;
    --accent-hover: #92400e;
    --accent-fg: #ffffff;
  }

  /* Updater Progress Bar & Action Styling */
  .update-progress-bar-wrap {
    width: 100%;
    max-width: 280px;
    height: 6px;
    background: var(--surface-hover);
    border-radius: 3px;
    overflow: hidden;
    margin-top: 6px;
  }

  .update-progress-bar-fill {
    height: 100%;
    background: var(--accent-gradient, var(--accent));
    transition: width 0.2s ease;
  }

  .cancel-update-btn {
    color: var(--danger-text, #fca5a5);
    border-color: var(--danger-border, rgba(239, 68, 68, 0.35));
  }

  .restart-btn {
    background: var(--accent-gradient, var(--accent));
    color: var(--accent-fg, #ffffff);
  }

  /* ------------------------------------------------------------------------- */
  /* APPEARANCE: LIGHT MODE SYSTEM OVERRIDES                                   */
  /* Note: glow.color is strictly independent and unaffected by this           */
  /* ------------------------------------------------------------------------- */
  .shell[data-appearance="light"] {
    --bg: #f8fafc;
    --bg-secondary: #f1f5f9;
    --surface: #ffffff;
    --surface-elevated: #f8fafc;
    --surface-hover: #e2e8f0;
    --border: rgba(15, 23, 42, 0.12);
    --border-strong: rgba(99, 102, 241, 0.4);
    --text-primary: #0f172a;
    --text-secondary: #334155;
    --text-muted: #64748b;
    --header-glow: radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(56, 189, 248, 0.05) 50%, transparent 70%);
  }

  /* ------------------------------------------------------------------------- */
  /* SHELL LAYOUT                                                              */
  /* ------------------------------------------------------------------------- */
  .shell {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100vh;
    box-sizing: border-box;
    overflow: hidden;
    background-color: var(--bg);
    color: var(--text-primary);
  }

  .ambient-glow-mesh {
    position: absolute;
    top: -120px;
    right: -100px;
    width: 520px;
    height: 520px;
    background: var(--header-glow);
    pointer-events: none;
    z-index: 0;
    transition: background 0.25s ease;
  }

  /* ------------------------------------------------------------------------- */
  /* HEADER WITH INTEGRATED TOP TABS & INTERACTIVE LISTENER CONTROL            */
  /* ------------------------------------------------------------------------- */
  .app-header {
    position: relative;
    z-index: 20;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    padding: 10px 20px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
    justify-self: start;
    flex-shrink: 0;
  }

  .brand-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 7px;
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    box-shadow: 0 0 12px var(--glow-surface);
    flex-shrink: 0;
    overflow: hidden;
  }

  .brand-icon-img {
    width: 22px;
    height: 22px;
    border-radius: 4px;
    object-fit: contain;
  }

  .brand-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .brand-title {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--text-primary);
  }

  .brand-version-pill {
    font-size: 10px;
    font-weight: 600;
    padding: 1px 5px;
    border-radius: 4px;
    background: var(--surface-elevated);
    color: var(--text-muted);
    font-family: monospace;
  }

  .header-center-wrap {
    display: flex;
    justify-content: center;
    align-items: center;
    justify-self: center;
  }

  /* 21st.dev Inspired Resizable Glass Navbar */
  .header-center-tabs {
    position: relative;
    display: flex;
    align-items: center;
    gap: 3px;
    background: var(--surface-elevated, rgba(30, 41, 59, 0.7));
    padding: 4px;
    border-radius: 12px;
    border: 1px solid var(--border-strong, rgba(255, 255, 255, 0.15));
    backdrop-filter: blur(16px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2), 0 0 0 1px var(--border, rgba(255, 255, 255, 0.05));
    transition: width 0.25s cubic-bezier(0.16, 1, 0.3, 1), padding 0.2s ease;
  }

  .nav-sliding-pill {
    position: absolute;
    top: 4px;
    bottom: 4px;
    left: 0;
    background: var(--surface);
    border: 1px solid var(--border-strong);
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18), 0 0 0 1px var(--border);
    transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), width 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: none;
    z-index: 1;
  }

  .nav-tab {
    position: relative;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 7px 14px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-muted);
    background: transparent;
    border: 1px solid transparent;
    cursor: pointer;
    overflow: hidden;
    transition: color 0.15s ease, transform 0.12s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .nav-tab:active {
    transform: scale(0.96);
  }

  .nav-tab-glow {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: radial-gradient(circle at 50% 50%, var(--glow-surface) 0%, transparent 80%);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s ease, transform 0.25s ease;
    transform: scale(0.85);
  }

  .nav-tab:hover {
    color: var(--text-primary);
    background: var(--surface-hover);
  }

  .nav-tab:hover .nav-tab-glow {
    opacity: 0.6;
    transform: scale(1);
  }

  .nav-tab.active {
    color: var(--accent);
    font-weight: 600;
  }

  .header-center-tabs:not(:has(.nav-sliding-pill)) .nav-tab.active {
    background: var(--surface);
    border-color: var(--border-strong);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18), 0 0 0 1px var(--border);
  }

  .nav-tab.active .nav-tab-glow {
    opacity: 0.8;
    transform: scale(1.05);
  }

  .nav-tab:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--accent);
  }

  .nav-icon {
    position: relative;
    z-index: 1;
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }

  .nav-label {
    position: relative;
    z-index: 1;
    letter-spacing: -0.01em;
  }

  .nav-badge,
  .nav-badge-pill {
    position: relative;
    z-index: 1;
    background: var(--accent);
    color: var(--accent-fg);
    font-size: 10px;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 10px;
    line-height: 1.2;
    box-shadow: 0 0 8px var(--glow-surface);
  }

  /* Dropdown & Helper Wrappers */
  .dropdown-control-wrapper {
    min-width: 240px;
    max-width: 320px;
  }

  /* Skeleton Loading for Notifications Feed */
  .notification-card-skeleton {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 18px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    box-sizing: border-box;
  }

  .skeleton-content-col {
    display: flex;
    flex-direction: column;
    gap: 7px;
    flex: 1;
  }

  .skeleton-row-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  /* Appearance Mode & Language Row (2 columns) */
  .settings-appearance-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    width: 100%;
  }

  @media (max-width: 820px) {
    .settings-appearance-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }
  }

  .appearance-card,
  .language-card {
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .appearance-col {
    display: flex;
    flex-direction: column;
    gap: 14px;
    height: 100%;
    justify-content: space-between;
  }

  .appearance-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    width: 100%;
  }

  .appearance-title-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .appearance-label-block {
    min-width: 0;
  }

  .appearance-tabs-container {
    padding: 0;
    width: 100%;
  }

  .language-dropdown-container {
    width: 100%;
  }

  .theme-title-group {
    display: flex;
    flex-direction: column;
    gap: 3px;
    align-items: flex-start;
  }

  .theme-family-badge {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    background: var(--surface-elevated);
    padding: 2px 7px;
    border-radius: 6px;
    border: 1px solid var(--border);
  }

  /* Updater Card in Settings */
  .updater-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .updater-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .update-btn {
    background: var(--accent-gradient);
    color: var(--accent-fg);
  }

  /* Right: Interactive Listening Status Button & Header Glow Button */
  .header-right {
    display: flex;
    align-items: center;
    gap: 8px;
    justify-self: end;
    flex-shrink: 0;
  }

  .header-glow-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 11px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-primary);
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease, color 0.15s ease;
    flex-shrink: 0;
  }

  .header-glow-btn:hover:not(:disabled) {
    background: var(--surface-hover);
    border-color: var(--accent);
    color: var(--accent);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  }

  .header-glow-btn:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }

  .header-glow-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .header-glow-icon {
    width: 13px;
    height: 13px;
  }

  .header-glow-icon.pulse {
    animation: header-icon-pulse 1s ease-in-out infinite;
  }

  @keyframes header-icon-pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.15); opacity: 0.8; }
  }

  .listening-toggle-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 96px;
    box-sizing: border-box;
    gap: 7px;
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
    background: var(--surface-elevated);
    transition: transform 0.15s ease, background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .listening-toggle-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  }

  .listening-toggle-btn:active:not(:disabled) {
    transform: scale(0.96);
  }

  .listening-toggle-btn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--accent);
  }

  .listening-toggle-btn.ok {
    background: var(--success-bg);
    border-color: var(--success-border);
    color: var(--success-text);
  }

  .listening-toggle-btn.ok:hover:not(:disabled) {
    background: var(--success-bg);
    border-color: var(--success);
  }

  .listening-toggle-btn.warn,
  .listening-toggle-btn.paused {
    background: var(--warning-bg);
    border-color: var(--warning-border);
    color: var(--warning-text);
  }

  .listening-toggle-btn.warn:hover:not(:disabled),
  .listening-toggle-btn.paused:hover:not(:disabled) {
    border-color: var(--warning);
  }

  .listening-toggle-btn.err {
    background: var(--danger-bg);
    border-color: var(--danger-border);
    color: var(--danger-text);
  }

  .status-dot-pulse {
    width: 7px;
    height: 7px;
    border-radius: 50%;
  }

  .status-dot-pulse.ok {
    background-color: var(--success);
    box-shadow: 0 0 8px var(--success);
    animation: dot-pulse 2s infinite ease-in-out;
  }

  .status-dot-pulse.warn,
  .status-dot-pulse.paused {
    background-color: var(--warning);
    box-shadow: 0 0 6px var(--warning);
  }

  .status-dot-pulse.err {
    background-color: var(--danger);
    box-shadow: 0 0 8px var(--danger);
  }

  @keyframes dot-pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.2); opacity: 0.75; }
  }

  .status-text-label {
    letter-spacing: -0.01em;
  }

  /* ------------------------------------------------------------------------- */
  /* MAIN CONTENT VIEWPORT & 21ST.DEV-INSPIRED DIRECTIONAL HERO TRANSITIONS     */
  /* ------------------------------------------------------------------------- */
  .main-viewport {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 20px 28px;
    box-sizing: border-box;
    position: relative;
    z-index: 1;
  }

  .hero-page-container {
    animation-duration: 220ms;
    animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
    animation-fill-mode: both;
    will-change: transform, opacity;
  }

  .hero-page-container.page-forward {
    animation-name: hero-enter-forward;
  }

  .hero-page-container.page-backward {
    animation-name: hero-enter-backward;
  }

  .hero-page-container.page-none,
  .hero-page-container:not(.page-forward):not(.page-backward) {
    animation-name: hero-enter-none;
  }

  @keyframes hero-enter-forward {
    0% {
      opacity: 0;
      transform: translate3d(16px, 0, 0);
    }
    100% {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  }

  @keyframes hero-enter-backward {
    0% {
      opacity: 0;
      transform: translate3d(-16px, 0, 0);
    }
    100% {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  }

  @keyframes hero-enter-none {
    0% {
      opacity: 0;
      transform: translateY(8px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Apps View Toggle & List Mode Styling */
  .apps-title-with-toggle {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 4px;
  }

  .apps-view-toggle {
    display: inline-flex;
    align-items: center;
    background: var(--surface-elevated, rgba(255, 255, 255, 0.04));
    border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
    border-radius: 8px;
    padding: 2px;
    gap: 2px;
  }

  .ghost-icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: transparent;
    border: none;
    color: var(--text-muted, #888);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .ghost-icon-btn:hover {
    color: var(--text, #ededed);
    background: rgba(255, 255, 255, 0.06);
  }

  .ghost-icon-btn.active {
    color: var(--accent, #6366f1);
    background: var(--surface-hover, rgba(255, 255, 255, 0.12));
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  }

  .ghost-icon-btn:focus-visible {
    outline: 2px solid var(--accent, #6366f1);
    outline-offset: 1px;
  }

  .ghost-action-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
    color: var(--text, #ededed);
    padding: 6px 12px;
    border-radius: 7px;
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .ghost-action-btn:hover:not(:disabled) {
    background: var(--surface-hover, rgba(255, 255, 255, 0.08));
    border-color: var(--border-strong, rgba(255, 255, 255, 0.22));
    transform: translateY(-1px);
  }

  .ghost-action-btn:active:not(:disabled) {
    transform: scale(0.98);
  }

  .ghost-action-btn:focus-visible {
    outline: 2px solid var(--accent, #6366f1);
    outline-offset: 2px;
  }

  .ghost-action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .applications-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  .app-profile-list-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 18px;
    border-radius: 10px;
    background: var(--surface, #111);
    border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
    transition: all 0.15s ease;
  }

  .app-profile-list-item:hover {
    border-color: var(--border-strong, rgba(255, 255, 255, 0.18));
    background: var(--surface-hover, rgba(255, 255, 255, 0.04));
  }

  .app-profile-list-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }

  .view-container {
    max-width: 980px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .view-hero-header {
    margin-bottom: 2px;
  }

  .hero-eyebrow {
    display: inline-block;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--accent);
    margin-bottom: 3px;
    animation: eyebrow-enter 180ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .view-title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: var(--text-primary);
    animation: title-enter 200ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .view-subtitle {
    margin: 3px 0 0 0;
    font-size: 12px;
    color: var(--text-muted);
    animation: subtitle-enter 240ms cubic-bezier(0.16, 1, 0.3, 1) 30ms both;
  }

  .view-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  @keyframes eyebrow-enter {
    0% { opacity: 0; transform: translateY(4px); }
    100% { opacity: 1; transform: translateY(0); }
  }

  @keyframes title-enter {
    0% { opacity: 0; transform: translateY(6px); }
    100% { opacity: 1; transform: translateY(0); }
  }

  @keyframes subtitle-enter {
    0% { opacity: 0; transform: translateY(8px); }
    100% { opacity: 1; transform: translateY(0); }
  }

  /* ------------------------------------------------------------------------- */
  /* CARDS & PANELS                                                            */
  /* ------------------------------------------------------------------------- */
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  }

  .panel-card {
    padding: 16px 20px;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  .panel-title-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .panel-icon-circle {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: var(--surface-elevated);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--accent);
  }

  .panel-icon-circle svg {
    width: 15px;
    height: 15px;
  }

  .panel-title {
    margin: 0;
    font-size: 13.5px;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: var(--text-primary);
  }

  .panel-desc {
    margin: 2px 0 0 0;
    font-size: 11.5px;
    color: var(--text-muted);
    line-height: 1.4;
  }

  .panel-header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* ------------------------------------------------------------------------- */
  /* METRICS GRID (DASHBOARD)                                                  */
  /* ------------------------------------------------------------------------- */
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    animation: content-stagger-enter 260ms cubic-bezier(0.16, 1, 0.3, 1) 60ms both;
  }

  @keyframes content-stagger-enter {
    0% { opacity: 0; transform: translateY(10px); }
    100% { opacity: 1; transform: translateY(0); }
  }

  .metric-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    transition: transform 0.15s ease, border-color 0.15s ease;
  }

  .metric-card:hover {
    transform: translateY(-2px);
    border-color: var(--border-strong);
  }

  .metric-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .metric-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .metric-icon-wrap {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .metric-icon-wrap svg {
    width: 13px;
    height: 13px;
  }

  .metric-icon-wrap.total { background: var(--surface-elevated); color: var(--accent); }
  .metric-icon-wrap.unread { background: var(--surface-elevated); color: var(--accent); }
  .metric-icon-wrap.critical { background: var(--danger-bg); color: var(--danger-text); }
  .metric-icon-wrap.high { background: var(--warning-bg); color: var(--warning-text); }

  .metric-value {
    font-size: 22px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 6px 0 2px 0;
    letter-spacing: -0.02em;
  }

  .metric-foot {
    font-size: 10px;
    color: var(--text-muted);
  }

  /* ------------------------------------------------------------------------- */
  /* SYSTEM STATUS & RECENT FEED (DASHBOARD)                                   */
  /* ------------------------------------------------------------------------- */
  .dashboard-section-row {
    display: flex;
    flex-direction: column;
    gap: 12px;
    animation: content-stagger-enter 260ms cubic-bezier(0.16, 1, 0.3, 1) 80ms both;
  }

  .system-meta-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-top: 6px;
  }

  .meta-box {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 8px 10px;
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    border-radius: 6px;
  }

  .meta-box-label {
    font-size: 10px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .meta-box-val {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .status-chip {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    width: fit-content;
  }

  .status-chip.ok { background: var(--success-bg); color: var(--success-text); }
  .status-chip.warn { background: var(--warning-bg); color: var(--warning-text); }
  .status-chip.err { background: var(--danger-bg); color: var(--danger-text); }

  .permission-warning-banner {
    margin-top: 10px;
    padding: 8px 12px;
    border-radius: 6px;
    background: var(--warning-bg);
    border: 1px solid var(--warning-border);
    color: var(--warning-text);
    font-size: 11px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .settings-link-btn {
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text-primary);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    cursor: pointer;
  }

  .settings-link-btn:hover {
    border-color: var(--border-strong);
  }

  /* Recent Notifications List */
  .recent-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .recent-item-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: 8px;
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    transition: background-color 0.15s ease, border-color 0.15s ease;
  }

  .recent-item-row:hover {
    background: var(--surface-hover);
    border-color: var(--border-strong);
  }

  .recent-item-row.is-unread {
    border-left: 3px solid var(--accent);
  }

  .recent-avatar {
    width: 26px;
    height: 26px;
    border-radius: 6px;
    background: var(--surface);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    color: var(--text-primary);
    overflow: hidden;
    flex-shrink: 0;
  }

  .recent-avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .recent-content {
    flex: 1;
    min-width: 0;
  }

  .recent-top-line {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 10px;
  }

  .recent-source {
    font-weight: 600;
    color: var(--text-primary);
  }

  .urgency-tag {
    font-size: 9px;
    padding: 1px 4px;
    border-radius: 3px;
    text-transform: uppercase;
    font-weight: 700;
  }

  .urgency-tag.critical { background: var(--danger-bg); color: var(--danger-text); }
  .urgency-tag.high { background: var(--warning-bg); color: var(--warning-text); }
  .urgency-tag.normal { background: var(--surface); color: var(--text-secondary); }

  .recent-time {
    color: var(--text-muted);
    margin-left: auto;
  }

  .recent-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .recent-body {
    font-size: 11px;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .recent-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  .tiny-action-btn {
    width: 22px;
    height: 22px;
    border-radius: 4px;
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .tiny-action-btn:hover {
    background: var(--surface-hover);
    color: var(--text-primary);
  }

  .tiny-action-btn.danger:hover {
    background: var(--danger-bg);
    color: var(--danger-text);
  }

  .tiny-action-btn svg {
    width: 11px;
    height: 11px;
  }

  /* ------------------------------------------------------------------------- */
  /* NOTIFICATION FEED & CARDS                                                 */
  /* ------------------------------------------------------------------------- */
  .feed-header-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .segmented-control {
    display: flex;
    background: var(--surface);
    padding: 2px;
    border-radius: 6px;
    border: 1px solid var(--border);
  }

  .segment-btn {
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
    color: var(--text-muted);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: background-color 0.15s ease, color 0.15s ease;
  }

  .segment-btn.active {
    background: var(--surface-elevated);
    color: var(--accent);
    font-weight: 600;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .segment-btn:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 1px;
  }

  .notification-feed-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    animation: content-stagger-enter 260ms cubic-bezier(0.16, 1, 0.3, 1) 60ms both;
  }

  .cards-stack {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .notification-card {
    display: flex;
    gap: 12px;
    padding: 12px 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
  }

  .notification-card:hover {
    background: var(--surface-hover);
    border-color: var(--border-strong);
    transform: translateY(-1px);
  }

  .notification-card.is-unread {
    border-left: 3px solid var(--accent);
    background: var(--surface);
  }

  .notification-card.is-read {
    opacity: 0.88;
  }

  .card-avatar-col {
    position: relative;
    display: flex;
    align-items: flex-start;
  }

  .card-avatar {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    color: var(--text-primary);
    overflow: hidden;
  }

  .avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .card-unread-dot {
    position: absolute;
    top: -2px;
    right: -2px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background-color: var(--accent);
    box-shadow: 0 0 6px var(--accent);
  }

  .card-body-col {
    flex: 1;
    min-width: 0;
  }

  .card-meta-line {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 3px;
  }

  .card-source-tags {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .card-source-name {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .platform-chip {
    font-size: 9px;
    padding: 1px 4px;
    border-radius: 3px;
    background: var(--surface-elevated);
    color: var(--text-muted);
    text-transform: uppercase;
  }

  .urgency-chip {
    font-size: 9px;
    padding: 1px 5px;
    border-radius: 3px;
    text-transform: uppercase;
    font-weight: 700;
  }

  .urgency-chip.critical { background: var(--danger-bg); color: var(--danger-text); }
  .urgency-chip.high { background: var(--warning-bg); color: var(--warning-text); }
  .urgency-chip.normal { background: var(--surface-elevated); color: var(--accent); }

  .card-timestamp {
    font-size: 10px;
    color: var(--text-muted);
  }

  .card-title {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .card-text {
    margin: 3px 0 6px 0;
    font-size: 12px;
    color: var(--text-muted);
    line-height: 1.4;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .card-footer-line {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .card-id-code {
    font-size: 10px;
    font-family: monospace;
    color: var(--text-muted);
    opacity: 0.75;
  }

  .card-actions-group {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .item-action-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid transparent;
  }

  .item-action-btn.read {
    background: var(--surface-elevated);
    border-color: var(--border);
    color: var(--accent);
  }

  .item-action-btn.read:hover {
    background: var(--surface-hover);
  }

  .item-action-btn.unread {
    background: var(--surface-elevated);
    border-color: var(--border);
    color: var(--text-muted);
  }

  .item-action-btn.dismiss {
    background: var(--danger-bg);
    border-color: var(--danger-border);
    color: var(--danger-text);
  }

  .item-action-btn.dismiss:hover {
    opacity: 0.85;
  }

  /* ------------------------------------------------------------------------- */
  /* EMPTY STATES                                                              */
  /* ------------------------------------------------------------------------- */
  .empty-state-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 16px;
    text-align: center;
    color: var(--text-muted);
  }

  .empty-icon-ring {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 10px;
    color: var(--text-muted);
  }

  .empty-icon-ring svg {
    width: 20px;
    height: 20px;
  }

  .empty-heading {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .empty-paragraph {
    margin: 4px 0 12px 0;
    font-size: 11px;
    max-width: 320px;
    color: var(--text-muted);
  }

  /* ------------------------------------------------------------------------- */
  /* CONTROLS & SETTINGS COMPONENTS                                            */
  /* ------------------------------------------------------------------------- */
  .settings-sections-stack {
    display: flex;
    flex-direction: column;
    gap: 12px;
    animation: content-stagger-enter 260ms cubic-bezier(0.16, 1, 0.3, 1) 60ms both;
  }

  .controls-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .control-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14px;
    padding: 6px 0;
  }

  .control-label-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .control-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .control-sub {
    font-size: 11px;
    color: var(--text-muted);
  }

  /* Slider */
  .slider-box {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 220px;
  }

  .native-slider {
    flex: 1;
    accent-color: var(--accent);
    cursor: pointer;
  }

  .slider-val-badge {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-secondary);
    min-width: 48px;
    text-align: right;
  }

  /* Switch */
  .switch-control {
    position: relative;
    width: 40px;
    height: 22px;
    border-radius: 11px;
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    cursor: pointer;
    padding: 2px;
    flex-shrink: 0;
    transition: background-color 0.2s ease, border-color 0.2s ease;
  }

  .switch-control.on {
    background: var(--accent);
    border-color: var(--ring);
    box-shadow: 0 0 10px var(--glow-surface);
  }

  .switch-control:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }

  .switch-ball {
    display: block;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .switch-control.on .switch-ball {
    transform: translateX(18px);
  }

  /* Native Select */
  .native-select {
    padding: 6px 12px;
    border-radius: 8px;
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    color: var(--text-primary);
    font-size: 12px;
    cursor: pointer;
    outline: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .native-select:focus-visible {
    border-color: var(--accent);
    outline: none;
    box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--accent);
  }

  /* Color Palette Chips */
  .color-palette-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .color-dot {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .color-dot.selected {
    border-color: var(--text-primary);
    transform: scale(1.18);
    box-shadow: 0 0 8px var(--glow-surface);
  }

  .color-dot:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }

  .color-divider {
    width: 1px;
    height: 18px;
    background: var(--border);
    margin: 0 2px;
  }

  .custom-color-control {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--surface-elevated);
    padding: 3px 8px 3px 6px;
    border-radius: 6px;
    border: 1px solid var(--border);
    transition: border-color 0.15s ease;
  }

  .custom-color-control:hover {
    border-color: var(--accent);
  }

  .custom-color-picker-label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    position: relative;
    color: var(--accent);
  }

  .palette-icon {
    width: 16px;
    height: 16px;
    transition: transform 0.15s ease;
  }

  .custom-color-picker-label:hover .palette-icon {
    transform: rotate(15deg);
  }

  .custom-color-input-hidden {
    position: absolute;
    opacity: 0;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    cursor: pointer;
  }

  .custom-color-hex-tag {
    font-size: 11px;
    font-family: monospace;
    font-weight: 600;
    color: var(--text-muted);
    letter-spacing: 0.05em;
  }

  /* ------------------------------------------------------------------------- */
  /* THEME PICKER GRID                                                         */
  /* ------------------------------------------------------------------------- */
  .themes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 10px;
    margin-top: 4px;
  }

  .theme-picker-card {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 13px 14px;
    border-radius: 11px;
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    cursor: pointer;
    text-align: left;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1),
                border-color 0.15s ease,
                background-color 0.15s ease,
                box-shadow 0.15s ease;
  }

  .theme-picker-card:hover {
    border-color: var(--border-strong);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }

  .theme-picker-card:active {
    transform: scale(0.985);
  }

  .theme-picker-card.active {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent), 0 3px 12px rgba(0, 0, 0, 0.16);
  }

  .theme-picker-card:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--accent);
  }

  .theme-card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  .theme-card-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--text-primary);
  }

  .theme-selected-pill {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 2px 6px;
    border-radius: 10px;
    background: var(--accent);
    color: var(--accent-fg);
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
  }

  .theme-card-desc {
    font-size: 10px;
    color: var(--text-muted);
    margin: 0 0 8px 0;
    line-height: 1.35;
    min-height: 28px;
  }

  .theme-swatches-strip {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
  }

  .theme-swatch-circle {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .theme-mini-frame {
    border-radius: 6px;
    padding: 7px 9px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    border-width: 1px;
    border-style: solid;
  }

  .mini-frame-header {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .mini-frame-accent-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  .mini-frame-bar {
    height: 5px;
    border-radius: 3px;
  }

  .mini-frame-bar.secondary {
    height: 3px;
    opacity: 0.5;
  }

  /* ------------------------------------------------------------------------- */
  /* BUTTONS & ALERTS                                                          */
  /* ------------------------------------------------------------------------- */
  .primary-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    background: var(--accent);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: var(--accent-fg);
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    transition: background-color 0.15s ease,
                transform 0.12s cubic-bezier(0.16, 1, 0.3, 1),
                box-shadow 0.15s ease;
  }

  .primary-btn:hover:not(:disabled) {
    filter: brightness(1.07);
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.22);
  }

  .primary-btn:active:not(:disabled) {
    transform: scale(0.97);
  }

  .primary-btn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--accent);
  }

  .primary-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }

  .secondary-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 13px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    color: var(--text-primary);
    cursor: pointer;
    transition: background-color 0.15s ease,
                border-color 0.15s ease,
                transform 0.12s cubic-bezier(0.16, 1, 0.3, 1),
                box-shadow 0.15s ease;
  }

  .secondary-btn:hover:not(:disabled) {
    background: var(--surface-hover);
    border-color: var(--border-strong);
    transform: translateY(-1px);
  }

  .secondary-btn:active:not(:disabled) {
    transform: scale(0.97);
  }

  .secondary-btn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--accent);
  }

  .secondary-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    transform: none !important;
  }

  .danger-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 13px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    background: var(--danger-bg);
    border: 1px solid var(--danger-border);
    color: var(--danger-text);
    cursor: pointer;
    transition: background-color 0.15s ease,
                transform 0.12s cubic-bezier(0.16, 1, 0.3, 1),
                box-shadow 0.15s ease;
  }

  .danger-btn:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.22);
    border-color: rgba(239, 68, 68, 0.45);
    transform: translateY(-1px);
  }

  .danger-btn:active:not(:disabled) {
    transform: scale(0.97);
  }

  .danger-btn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--danger);
  }

  .danger-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    transform: none !important;
  }

  .text-link-btn {
    background: none;
    border: none;
    color: var(--accent);
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
  }

  .text-link-btn:hover {
    text-decoration: underline;
  }

  .btn-icon {
    width: 14px;
    height: 14px;
  }

  .tiny-icon {
    width: 10px;
    height: 10px;
  }

  .alert-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
  }

  .alert-banner.danger {
    background: var(--danger-bg);
    border: 1px solid var(--danger-border);
    color: var(--danger-text);
  }

  .banner-close {
    background: none;
    border: none;
    color: inherit;
    font-size: 13px;
    cursor: pointer;
  }

  /* ------------------------------------------------------------------------- */
  /* STATUS BAR FOOTER                                                         */
  /* ------------------------------------------------------------------------- */
  .app-status-bar {
    position: relative;
    z-index: 10;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 18px;
    background: var(--surface);
    border-top: 1px solid var(--border);
    font-size: 11px;
    color: var(--text-muted);
  }

  .status-left,
  .status-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .status-item {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }

  .status-item.highlight {
    color: var(--text-secondary);
  }

  .status-mini-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  .status-mini-dot.ok { background-color: var(--success); }
  .status-mini-dot.err { background-color: var(--danger); }

  .status-sep {
    opacity: 0.4;
  }

  /* ------------------------------------------------------------------------- */
  /* CONFIRMATION MODAL                                                        */
  /* ------------------------------------------------------------------------- */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 999;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }

  .modal-backdrop-dismiss {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
    margin: 0;
  }

  .modal-card {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 380px;
    background: var(--surface);
    border: 1px solid var(--border-strong);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .modal-icon-circle {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
  }

  .modal-icon-circle.danger {
    background: var(--danger-bg);
    color: var(--danger-text);
  }

  .modal-icon-circle svg {
    width: 22px;
    height: 22px;
  }

  .modal-title {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: var(--text-primary);
  }

  .modal-body {
    margin: 6px 0 18px 0;
    font-size: 12px;
    color: var(--text-muted);
    line-height: 1.4;
  }

  .modal-footer-btns {
    display: flex;
    gap: 8px;
    width: 100%;
    justify-content: flex-end;
  }

  .modal-footer-btns button {
    flex: 1;
    justify-content: center;
  }

  /* ------------------------------------------------------------------------- */
  /* ANIMATIONS & ACCESSIBILITY                                                */
  /* ------------------------------------------------------------------------- */
  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .pulse {
    animation: pulse 1.5s ease-in-out infinite alternate;
  }

  @keyframes pulse {
    0% { transform: scale(1); opacity: 0.8; }
    100% { transform: scale(1.1); opacity: 1; }
  }

  /* Responsive Resizing */
  @media (max-width: 720px) {
    .app-header {
      padding: 8px 12px;
    }
    .header-center-tabs {
      gap: 2px;
    }
    .nav-tab {
      padding: 5px 8px;
      font-size: 11px;
      gap: 5px;
    }
    .brand-version-pill {
      display: none;
    }
    .metrics-grid,
    .system-meta-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .appearance-card .panel-desc {
      display: none;
    }
  }

  @media (max-width: 540px) {
    .appearance-row {
      gap: 8px;
    }
    .nav-tab span {
      display: none;
    }
    .nav-tab {
      padding: 6px;
    }
    .listening-toggle-btn {
      padding: 4px 8px;
    }
  }

  /* ========================================================================= */
  /* APPLICATION PROFILES VIEW & MODAL STYLING                                */
  /* ========================================================================= */
  .applications-view {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .app-search-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md, 10px);
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .app-search-bar:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--accent);
  }

  .app-search-bar .search-icon {
    width: 18px;
    height: 18px;
    color: var(--text-tertiary);
    flex-shrink: 0;
  }

  .app-search-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: var(--text-primary);
    font-size: 14px;
    font-family: inherit;
  }

  .app-search-input::placeholder {
    color: var(--text-tertiary);
  }

  .clear-search-btn {
    background: transparent;
    border: none;
    color: var(--text-tertiary);
    cursor: pointer;
    font-size: 14px;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
  }

  .clear-search-btn:hover {
    color: var(--text-primary);
    background: var(--surface-hover);
  }

  .applications-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
    gap: 16px;
    align-items: stretch;
  }

  .app-profile-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 14px;
    padding: 16px 18px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md, 10px);
    transition: transform 0.15s ease, border-color 0.15s ease, background-color 0.15s ease;
    min-height: 180px;
    box-sizing: border-box;
  }

  .app-card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .app-card-title-col {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
    flex: 1;
  }

  .app-card-body {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
    flex: 1;
  }

  .app-card-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    padding-top: 10px;
    border-top: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
    margin-top: auto;
  }

  .applications-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .app-profile-list-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 18px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md, 10px);
    transition: transform 0.15s ease, border-color 0.15s ease, background-color 0.15s ease;
  }

  .app-profile-list-item:hover {
    border-color: var(--border-strong);
    background: var(--surface-hover);
    transform: translateY(-1px);
  }

  .app-profile-list-item.disabled {
    opacity: 0.65;
  }

  .app-profile-list-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .ghost-action-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 6px;
    background: var(--surface-subtle);
    border: 1px solid var(--border);
    color: var(--text-secondary);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .ghost-action-btn:hover {
    background: var(--surface-hover);
    color: var(--text-primary);
    border-color: var(--border-strong);
  }

  .app-profile-card:hover {
    border-color: var(--border-strong);
    background: var(--surface-hover);
    transform: translateY(-1px);
  }

  .app-profile-card.disabled {
    opacity: 0.65;
  }

  .app-profile-left {
    display: flex;
    align-items: center;
    gap: 14px;
    flex: 1;
    min-width: 0;
  }

  .app-avatar-box {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.04);
    border: 2px solid var(--app-glow-color, var(--primary));
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 0 12px -2px var(--app-glow-color, var(--primary));
  }

  .app-avatar-letter {
    font-size: 18px;
    font-weight: 700;
    color: var(--text-primary);
  }

  .app-info {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }

  .app-name-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .app-name {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .custom-profile-badge {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(99, 102, 241, 0.15);
    color: #818cf8;
    border: 1px solid rgba(99, 102, 241, 0.25);
  }

  .suppressed-badge {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--danger-bg);
    color: var(--danger-text);
  }

  .app-executable-text {
    font-size: 12px;
    color: var(--text-tertiary);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }

  .app-tags-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 2px;
    flex-wrap: wrap;
  }

  .app-tag {
    font-size: 11px;
    padding: 1px 7px;
    border-radius: 4px;
    background: var(--surface-subtle);
    color: var(--text-secondary);
    border: 1px solid var(--border);
  }

  .app-tag.anim {
    font-weight: 600;
    color: var(--primary);
  }

  .app-tag.fs-suppressed {
    background: rgba(239, 68, 68, 0.1);
    color: #f87171;
    border-color: rgba(239, 68, 68, 0.2);
  }

  .app-profile-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .icon-action-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 6px;
    background: var(--surface-subtle);
    border: 1px solid var(--border);
    color: var(--text-secondary);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .icon-action-btn:hover {
    background: var(--surface-hover);
    color: var(--text-primary);
    border-color: var(--border-strong);
  }

  .danger-icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    background: transparent;
    border: 1px solid transparent;
    color: var(--text-tertiary);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .danger-icon-btn:hover {
    background: var(--danger-bg);
    color: var(--danger-text);
    border-color: rgba(239, 68, 68, 0.3);
  }

  /* Profile Modal specific styles */
  .profile-modal-card {
    max-width: 520px;
    width: 100%;
    max-height: min(90vh, 640px);
    display: flex;
    flex-direction: column;
    text-align: left;
    align-items: stretch;
    padding: 24px;
    box-sizing: border-box;
    overflow: hidden;
  }

  .modal-avatar {
    width: 38px;
    height: 38px;
  }

  .modal-body-form {
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin: 16px 0 20px 0;
    overflow-y: auto;
    overflow-x: hidden;
    flex: 1;
    min-height: 0;
    padding-right: 6px;
  }

  .form-section-header {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--accent);
    padding-bottom: 4px;
    border-bottom: 1px solid var(--border);
    margin: 8px 0 2px 0;
  }

  .form-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .native-input {
    width: 100%;
    padding: 8px 12px;
    background: var(--surface-subtle);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-primary);
    font-size: 13px;
    outline: none;
    font-family: inherit;
    box-sizing: border-box;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .native-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--accent);
  }

  .input-with-action {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
  }

  .browse-btn {
    flex-shrink: 0;
    padding: 8px 14px;
    font-size: 12px;
    font-weight: 600;
  }

  .path-row {
    margin-top: -2px;
  }

  .path-display-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 6px 10px;
    background: var(--surface-subtle);
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 11px;
    color: var(--text-muted);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    overflow: hidden;
  }

  .path-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    direction: rtl;
    text-align: left;
  }

  .clear-path-btn {
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 12px;
    padding: 0 4px;
    flex-shrink: 0;
  }

  .clear-path-btn:hover {
    color: var(--danger-text);
  }

  .app-path-hint {
    font-size: 11px;
    color: var(--text-muted);
    opacity: 0.75;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 260px;
    display: inline-block;
    vertical-align: middle;
  }

  .modal-toggle-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0;
  }

  .profile-modal-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-top: 10px;
  }

  .modal-footer-left,
  .modal-footer-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .preview-action-btn {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  /* Desktop Responsive Adaptation */
  @media (max-width: 980px) {
    .app-header {
      padding: 8px 12px;
      gap: 8px;
    }
    .nav-tab {
      padding: 6px 10px;
      gap: 5px;
      font-size: 11px;
    }
    .brand-title {
      font-size: 14px;
    }
    .brand-version-pill {
      display: none;
    }
    .main-viewport {
      padding: 16px 18px;
    }
  }

  @media (max-width: 768px) {
    .header-center-tabs {
      overflow-x: auto;
      max-width: 100%;
    }
    .app-profile-card {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
    .app-profile-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }

  /* Reduced Motion Accessibility */
  @media (prefers-reduced-motion: reduce) {
    *, ::before, ::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
    .hero-page-container,
    .hero-page-container.page-forward,
    .hero-page-container.page-backward,
    .hero-page-container.page-none,
    .hero-eyebrow,
    .view-title,
    .view-subtitle,
    .metrics-grid,
    .dashboard-section-row,
    .notification-feed-list,
    .settings-sections-stack {
      animation: none !important;
      transform: none !important;
      filter: none !important;
      opacity: 1 !important;
    }
  }
</style>
