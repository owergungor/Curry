pub mod glow;
pub mod models;
pub mod notification;
pub mod notifications;
pub mod settings;
pub mod single_instance;
pub mod state;
pub mod tray;

use std::sync::Arc;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager, State, WindowEvent};

use crate::glow::{GlowManager, GlowSettings};
use crate::notification::model::Notification;
use crate::notification::{NotificationEngine, PipelineStatus};
use crate::settings::{AppSettings, SettingsStorage, SoundManager, StartupManager};
use crate::state::AppState;

#[derive(Debug, Serialize)]
pub struct BackendConnectionStatus {
    pub connected: bool,
    pub app_name: String,
    pub version: String,
    pub target_os: String,
    pub target_arch: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AddNotificationInput {
    pub title: String,
    #[serde(default, alias = "body")]
    pub message: String,
    #[serde(default, alias = "app_name", alias = "source_app")]
    pub source: Option<String>,
    #[serde(default)]
    pub duration: Option<u64>,
    #[serde(default)]
    pub icon: Option<String>,
}

#[tauri::command]
fn check_backend_connection() -> BackendConnectionStatus {
    BackendConnectionStatus {
        connected: true,
        app_name: "Curry".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        target_os: std::env::consts::OS.to_string(),
        target_arch: std::env::consts::ARCH.to_string(),
        message: "Tauri backend connected successfully".to_string(),
    }
}

#[tauri::command]
fn get_app_state(state: State<'_, AppState>) -> bool {
    state.is_enabled()
}

#[tauri::command]
fn toggle_app_state(app: AppHandle, state: State<'_, AppState>) -> bool {
    let next_state = state.toggle_enabled();
    tray::set_tray_enabled_state(next_state);
    let _ = app.emit("app-state-changed", next_state);
    next_state
}

#[tauri::command]
fn get_app_settings(state: State<'_, AppState>) -> Result<AppSettings, String> {
    let storage = state
        .settings_storage()
        .ok_or_else(|| "Settings storage is not initialized".to_string())?;

    Ok(storage.get())
}

#[tauri::command]
fn update_app_settings(
    app: AppHandle,
    state: State<'_, AppState>,
    settings: AppSettings,
) -> Result<AppSettings, String> {
    let storage = state
        .settings_storage()
        .ok_or_else(|| "Settings storage is not initialized".to_string())?;

    let updated = storage.update(settings)?;

    // Synchronize master enabled state with AppState and tray
    state.set_enabled(updated.enabled);
    tray::set_tray_enabled_state(updated.enabled);
    if let Some(engine) = state.notification_engine() {
        engine.set_history_limit(updated.history_limit);
    }
    let _ = app.emit("app-state-changed", updated.enabled);
    let _ = app.emit("app-settings-updated", &updated);

    Ok(updated)
}

#[tauri::command]
fn get_startup_status() -> bool {
    StartupManager::is_enabled()
}

#[tauri::command]
fn set_startup_status(
    app: AppHandle,
    state: State<'_, AppState>,
    enabled: bool,
) -> Result<bool, String> {
    StartupManager::set_enabled(enabled)?;

    if let Some(storage) = state.settings_storage() {
        let mut settings = storage.get();
        if settings.startup_enabled != enabled {
            settings.startup_enabled = enabled;
            let _ = storage.update(settings);
            let _ = app.emit("app-settings-updated", storage.get());
        }
    }

    Ok(enabled)
}

#[tauri::command]
fn play_sound_preview() -> Result<(), String> {
    SoundManager::play_alert();
    Ok(())
}

#[tauri::command]
fn add_notification(
    state: State<'_, AppState>,
    notification: Option<AddNotificationInput>,
    title: Option<String>,
    message: Option<String>,
    source: Option<String>,
) -> Result<Notification, String> {
    let engine = state
        .notification_engine()
        .ok_or_else(|| "Notification engine is not initialized".to_string())?;

    if !state.is_enabled() {
        return Err("Curry is disabled; notification not added".to_string());
    }

    let input = if let Some(n) = notification {
        n
    } else {
        AddNotificationInput {
            title: title.unwrap_or_else(|| "Notification".to_string()),
            message: message.unwrap_or_default(),
            source,
            duration: Some(2500),
            icon: None,
        }
    };

    let now_millis = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as i64;

    let app_name = input.source.unwrap_or_else(|| "Curry".to_string());

    let notif = Notification {
        id: format!("notif-{}", now_millis),
        title: input.title,
        message: input.message.clone(),
        body: input.message,
        timestamp: now_millis,
        duration: input.duration.or(Some(2500)),
        enabled: true,
        source: Some(app_name.clone()),
        app_name: app_name.clone(),
        source_app: app_name,
        icon: input.icon,
        platform: std::env::consts::OS.to_string(),
        urgency: Some(crate::notification::model::NotificationUrgency::Normal),
        read: false,
    };

    engine.add_notification(notif).map_err(|e| e.to_string())
}

#[tauri::command]
fn send_test_notification(state: State<'_, AppState>) -> Result<Notification, String> {
    let engine = state
        .notification_engine()
        .ok_or_else(|| "Notification engine is not initialized".to_string())?;

    engine
        .send_test_notification()
        .map_err(|err| err.to_string())
}

#[tauri::command]
fn get_notifications(state: State<'_, AppState>) -> Result<Vec<Notification>, String> {
    let engine = state
        .notification_engine()
        .ok_or_else(|| "Notification engine is not initialized".to_string())?;

    Ok(engine.get_notifications())
}

#[tauri::command]
fn clear_notifications(app: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    let engine = state
        .notification_engine()
        .ok_or_else(|| "Notification engine is not initialized".to_string())?;

    engine.clear_notifications();
    let _ = app.emit("notifications-cleared", ());
    Ok(())
}

#[tauri::command]
fn remove_notification(app: AppHandle, state: State<'_, AppState>, id: String) -> Result<bool, String> {
    let engine = state
        .notification_engine()
        .ok_or_else(|| "Notification engine is not initialized".to_string())?;

    let removed = engine.remove_notification(&id);
    if removed {
        let _ = app.emit("notification-removed", id);
    }
    Ok(removed)
}

#[tauri::command]
fn dismiss_notification(app: AppHandle, state: State<'_, AppState>, id: String) -> Result<bool, String> {
    remove_notification(app, state, id)
}

#[tauri::command]
fn mark_notification_as_read(app: AppHandle, state: State<'_, AppState>, id: String) -> Result<bool, String> {
    let engine = state
        .notification_engine()
        .ok_or_else(|| "Notification engine is not initialized".to_string())?;

    let updated = engine.mark_as_read(&id);
    if updated {
        let _ = app.emit("notification-read-updated", id.clone());
        let _ = app.emit("notification-read-status-changed", (id, true));
    }
    Ok(updated)
}

#[tauri::command]
fn mark_notification_as_unread(app: AppHandle, state: State<'_, AppState>, id: String) -> Result<bool, String> {
    let engine = state
        .notification_engine()
        .ok_or_else(|| "Notification engine is not initialized".to_string())?;

    let updated = engine.mark_as_unread(&id);
    if updated {
        let _ = app.emit("notification-unread-updated", id.clone());
        let _ = app.emit("notification-read-status-changed", (id, false));
    }
    Ok(updated)
}

#[tauri::command]
fn toggle_notification_read(app: AppHandle, state: State<'_, AppState>, id: String) -> Result<bool, String> {
    let engine = state
        .notification_engine()
        .ok_or_else(|| "Notification engine is not initialized".to_string())?;

    let notifications = engine.get_notifications();
    if let Some(item) = notifications.iter().find(|n| n.id == id) {
        let new_read = !item.read;
        let updated = engine.set_read_status(&id, new_read);
        if updated {
            let _ = app.emit("notification-read-status-changed", (id.clone(), new_read));
            if new_read {
                let _ = app.emit("notification-read-updated", id);
            } else {
                let _ = app.emit("notification-unread-updated", id);
            }
        }
        Ok(new_read)
    } else {
        Err(format!("Notification with ID '{}' not found", id))
    }
}

#[tauri::command]
fn restore_main_window(app: AppHandle) -> Result<(), String> {
    crate::tray::restore_main_window(&app);
    Ok(())
}

#[tauri::command]
fn get_pipeline_status(state: State<'_, AppState>) -> Result<PipelineStatus, String> {
    let engine = state
        .notification_engine()
        .ok_or_else(|| "Notification engine is not initialized".to_string())?;

    Ok(engine.pipeline_status())
}

#[tauri::command]
fn open_notification_settings() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        use std::process::Command;
        const CREATE_NO_WINDOW: u32 = 0x08000000;

        let mut cmd = Command::new("cmd");
        cmd.args(["/C", "start", "ms-settings:notifications"]);
        cmd.creation_flags(CREATE_NO_WINDOW);
        cmd.spawn()
            .map_err(|e| format!("Failed to open Windows notification settings: {}", e))?;
        Ok(())
    }
    #[cfg(not(target_os = "windows"))]
    {
        Err("Opening notification settings is not supported on this platform".to_string())
    }
}

#[tauri::command]
fn get_glow_settings(state: State<'_, AppState>) -> Result<GlowSettings, String> {
    let glow = state
        .glow_manager()
        .ok_or_else(|| "Glow manager is not initialized".to_string())?;

    Ok(glow.get_settings())
}

#[tauri::command]
fn update_glow_settings(state: State<'_, AppState>, settings: GlowSettings) -> Result<(), String> {
    let glow = state
        .glow_manager()
        .ok_or_else(|| "Glow manager is not initialized".to_string())?;

    glow.update_settings(settings)
}

/// Unified configuration for screen-edge glow preview requests.
#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct GlowPreviewConfig {
    #[serde(default)]
    pub color: Option<String>,
    #[serde(default)]
    pub animation: Option<String>,
    #[serde(default)]
    pub intensity: Option<f32>,
    #[serde(default)]
    pub duration: Option<f64>,
    #[serde(default, alias = "duration_ms", alias = "durationMs")]
    pub duration_ms: Option<u64>,
    #[serde(default, alias = "monitor_target", alias = "monitorTarget")]
    pub monitor_target: Option<crate::glow::model::MonitorTarget>,
}

/// Core execution helper for screen-edge preview rendering.
pub fn execute_preview(state: &AppState, config: GlowPreviewConfig) -> Result<(), String> {
    let glow = state
        .glow_manager()
        .ok_or_else(|| "Glow manager is not initialized".to_string())?;

    let settings = glow.get_settings();
    let oled_mode = state
        .settings_storage()
        .map(|s| s.get().oled_mode)
        .unwrap_or(false);

    let resolved_color = config
        .color
        .filter(|c| !c.trim().is_empty())
        .unwrap_or(settings.color);

    let animation_style = match config.animation.as_deref() {
        Some(a) if !a.trim().is_empty() => crate::glow::model::normalize_animation(a),
        _ => settings.animation_style,
    };

    let mut final_intensity = config.intensity.unwrap_or(settings.intensity).clamp(0.1, 1.0);
    let mut final_thickness = settings.thickness.clamp(2, 32);
    let mut final_duration_ms = config
        .duration_ms
        .unwrap_or_else(|| {
            config
                .duration
                .map(|d| (d * 1000.0).round() as u64)
                .unwrap_or(settings.duration_ms)
        })
        .clamp(200, 15_000);

    if oled_mode {
        final_intensity = final_intensity.min(0.60);
        final_thickness = (final_thickness / 2).max(2);
        final_duration_ms = final_duration_ms.min(2000);
    }

    let target = config.monitor_target.unwrap_or(settings.monitor_target);

    let payload = crate::glow::model::GlowPayload {
        color: resolved_color,
        duration_ms: final_duration_ms,
        intensity: final_intensity,
        thickness: final_thickness,
        corner_radius: settings.corner_radius,
        animation_style,
        oled_mode,
    };

    glow.trigger_payload_preview(payload, Some(target));
    Ok(())
}

#[tauri::command]
fn preview_global_glow(state: State<'_, AppState>) -> Result<(), String> {
    execute_preview(&state, GlowPreviewConfig::default())
}

#[tauri::command]
fn preview_application_glow(state: State<'_, AppState>, profile_id: String) -> Result<(), String> {
    let storage = state
        .settings_storage()
        .ok_or_else(|| "Settings storage is not initialized".to_string())?;

    let settings = storage.get();
    let profile = settings
        .applications
        .iter()
        .find(|p| p.id == profile_id)
        .ok_or_else(|| format!("Application profile with ID '{}' not found", profile_id))?;

    let config = GlowPreviewConfig {
        color: profile.color.clone(),
        animation: profile.animation.map(|a| match a {
            crate::glow::model::GlowAnimationStyle::Pulse => "pulse".to_string(),
            crate::glow::model::GlowAnimationStyle::Sweep => "sweep".to_string(),
            crate::glow::model::GlowAnimationStyle::Ambient => "ambient".to_string(),
            crate::glow::model::GlowAnimationStyle::Comet => "comet".to_string(),
            crate::glow::model::GlowAnimationStyle::Ripple => "ripple".to_string(),
            crate::glow::model::GlowAnimationStyle::Breathing => "breathing".to_string(),
            crate::glow::model::GlowAnimationStyle::Solid => "solid".to_string(),
        }),
        intensity: profile.intensity,
        duration: profile.duration,
        duration_ms: profile.duration.map(|d| (d * 1000.0).round() as u64),
        monitor_target: profile.monitor_target.clone(),
    };

    execute_preview(&state, config)
}

#[tauri::command]
fn preview_glow(
    state: State<'_, AppState>,
    color: Option<String>,
    animation: Option<String>,
    intensity: Option<f32>,
    duration: Option<f64>,
    duration_ms: Option<u64>,
    monitor_target: Option<crate::glow::model::MonitorTarget>,
) -> Result<(), String> {
    let config = GlowPreviewConfig {
        color,
        animation,
        intensity,
        duration,
        duration_ms,
        monitor_target,
    };
    execute_preview(&state, config)
}

#[tauri::command]
fn trigger_glow_preview(state: State<'_, AppState>) -> Result<(), String> {
    preview_global_glow(state)
}

#[tauri::command]
fn get_application_profiles(
    state: State<'_, AppState>,
) -> Result<Vec<crate::settings::ApplicationProfile>, String> {
    let storage = state
        .settings_storage()
        .ok_or_else(|| "Settings storage is not initialized".to_string())?;

    Ok(storage.get().applications)
}

#[tauri::command]
fn save_application_profile(
    app: AppHandle,
    state: State<'_, AppState>,
    profile: crate::settings::ApplicationProfile,
) -> Result<crate::settings::ApplicationProfile, String> {
    let storage = state
        .settings_storage()
        .ok_or_else(|| "Settings storage is not initialized".to_string())?;

    let trimmed_exe = profile.executable_name.trim();
    if trimmed_exe.is_empty() {
        return Err("Executable name cannot be empty".to_string());
    }

    let mut settings = storage.get();

    // Check for duplicate profile by executable name (case-insensitive)
    if crate::settings::is_duplicate_profile(
        &settings.applications,
        trimmed_exe,
        Some(&profile.id),
    ) {
        return Err(format!(
            "An application profile for {} already exists.",
            trimmed_exe
        ));
    }

    if let Some(idx) = settings.applications.iter().position(|p| p.id == profile.id) {
        settings.applications[idx] = profile.clone();
    } else {
        settings.applications.push(profile.clone());
    }

    let updated = storage.update(settings)?;
    let _ = app.emit("app-settings-updated", &updated);
    Ok(profile)
}

#[tauri::command]
async fn pick_executable_file(
    app: AppHandle,
) -> Result<Option<crate::settings::ParsedExecutableInfo>, String> {
    use tauri_plugin_dialog::DialogExt;

    let picked = app
        .dialog()
        .file()
        .set_title("Select Application Executable")
        .add_filter("Executable Files (*.exe)", &["exe"])
        .add_filter("All Files (*.*)", &["*"])
        .blocking_pick_file();

    match picked {
        Some(file_path) => {
            let path_str = file_path.to_string();
            let info = crate::settings::parse_executable_info(&path_str)?;
            Ok(Some(info))
        }
        None => Ok(None),
    }
}

#[tauri::command]
fn parse_executable_path(path: String) -> Result<crate::settings::ParsedExecutableInfo, String> {
    crate::settings::parse_executable_info(&path)
}

#[tauri::command]
fn delete_application_profile(
    app: AppHandle,
    state: State<'_, AppState>,
    id: String,
) -> Result<bool, String> {
    let storage = state
        .settings_storage()
        .ok_or_else(|| "Settings storage is not initialized".to_string())?;

    let mut settings = storage.get();
    let initial_len = settings.applications.len();
    settings.applications.retain(|p| p.id != id);
    let removed = settings.applications.len() < initial_len;

    if removed {
        let updated = storage.update(settings)?;
        let _ = app.emit("app-settings-updated", &updated);
    }
    Ok(removed)
}

#[tauri::command]
fn trigger_profile_preview(
    state: State<'_, AppState>,
    payload: crate::glow::model::GlowPayload,
    monitor_target: Option<crate::glow::model::MonitorTarget>,
) -> Result<(), String> {
    let glow = state
        .glow_manager()
        .ok_or_else(|| "Glow manager is not initialized".to_string())?;

    glow.trigger_payload_preview(payload, monitor_target);
    Ok(())
}

#[tauri::command]
fn get_fullscreen_state() -> crate::settings::FullscreenState {
    crate::settings::detect_fullscreen_state()
}


/// [LEGACY / BACKWARDS COMPATIBILITY] Migrates settings, notifications, and glow configuration
/// from legacy NotiGlow/Curry directories to Curry's com.curry.app storage directory.
fn migrate_legacy_notiglow_data(app: &AppHandle) {
    if let Ok(new_dir) = app.path().app_config_dir() {
        if let Some(parent) = new_dir.parent() {
            // [LEGACY / BACKWARDS COMPATIBILITY] Legacy data directory paths
            let legacy_dirs = [
                parent.join("com.notiglow.app"),
                parent.join("notiglow"),
                parent.join("com.curry.desktop"),
            ];

            for legacy_dir in &legacy_dirs {
                if legacy_dir.exists() && legacy_dir.is_dir() {
                    let _ = std::fs::create_dir_all(&new_dir);
                    for file_name in &["settings.json", "notifications.json", "glow_settings.json"] {
                        let old_file = legacy_dir.join(file_name);
                        let new_file = new_dir.join(file_name);
                        if old_file.exists() && !new_file.exists() {
                            if let Ok(content) = std::fs::read_to_string(&old_file) {
                                if serde_json::from_str::<serde_json::Value>(&content).is_ok() {
                                    let tmp_file = new_file.with_extension("tmp");
                                    if std::fs::write(&tmp_file, &content).is_ok() {
                                        let _ = std::fs::rename(&tmp_file, &new_file);
                                        eprintln!(
                                            "[Curry Migration] Safely validated and migrated legacy {} to Curry config directory.",
                                            file_name
                                        );
                                    }
                                } else {
                                    eprintln!(
                                        "[Curry Migration] Skipping invalid JSON in legacy {}; legacy data preserved.",
                                        file_name
                                    );
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Single-instance protection: ensure only one Curry process runs at a time,
    // and [LEGACY / BACKWARDS COMPATIBILITY] prevent concurrent execution with any lingering legacy NotiGlow process.
    let _instance_guard = match single_instance::acquire_with_legacy("Global\\Curry", Some("Global\\NotiGlow")) {
        Some(guard) => guard,
        None => {
            // Secondary launch: existing instance was focused, exit cleanly
            return;
        }
    };

    let app = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState::new())
        .setup(|app| {
            // Safely migrate any existing user data from NotiGlow to Curry
            migrate_legacy_notiglow_data(app.handle());

            let state = app.state::<AppState>();

            // Initialize centralized SettingsStorage
            let settings_storage = Arc::new(SettingsStorage::new(app.handle()));
            state.set_settings_storage(Arc::clone(&settings_storage));

            // Sync master enabled state from persisted settings
            let initial_settings = settings_storage.get();
            state.set_enabled(initial_settings.enabled);

            // Initialize GlowManager and bind SettingsStorage
            let glow = Arc::new(GlowManager::new(app.handle()));
            glow.set_settings_storage(Arc::clone(&settings_storage));
            state.set_glow_manager(Arc::clone(&glow));

            // Initialize NotificationEngine and wire up GlowManager and SettingsStorage
            let engine = Arc::new(NotificationEngine::new(app.handle().clone(), state.enabled_flag()));
            engine.set_glow_manager(Arc::clone(&glow));
            engine.set_settings_storage(Arc::clone(&settings_storage));
            engine.set_history_limit(initial_settings.history_limit);
            state.set_notification_engine(Arc::clone(&engine));

            // Automatically start the native notification listener during startup
            if let Err(err) = engine.start_listening() {
                eprintln!("[Curry] Failed to start notification provider: {}", err);
            }

            // Ensure transparent glow-overlay ignores cursor events immediately on creation
            if let Some(overlay) = app.get_webview_window("glow-overlay") {
                let _ = overlay.set_ignore_cursor_events(true);
            }

            tray::setup_tray(app.handle())?;

            // Autostart handling: if launched with --autostart, start hidden in system tray
            if std::env::args().any(|arg| arg == "--autostart") {
                if let Some(main_window) = app.get_webview_window("main") {
                    let _ = main_window.hide();
                }
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                // Prevent window destruction for main window; hide to system tray instead
                if window.label() == "main" {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            check_backend_connection,
            get_app_state,
            toggle_app_state,
            get_app_settings,
            update_app_settings,
            get_startup_status,
            set_startup_status,
            play_sound_preview,
            add_notification,
            send_test_notification,
            get_notifications,
            clear_notifications,
            remove_notification,
            dismiss_notification,
            mark_notification_as_read,
            mark_notification_as_unread,
            toggle_notification_read,
            restore_main_window,
            get_pipeline_status,
            open_notification_settings,
            get_glow_settings,
            update_glow_settings,
            trigger_glow_preview,
            preview_global_glow,
            preview_application_glow,
            preview_glow,
            get_application_profiles,
            save_application_profile,
            delete_application_profile,
            trigger_profile_preview,
            get_fullscreen_state,
            pick_executable_file,
            parse_executable_path
        ]);

    if let Err(err) = app.run(tauri::generate_context!()) {
        eprintln!("[Curry] Fatal error while running application: {}", err);
    }
}
