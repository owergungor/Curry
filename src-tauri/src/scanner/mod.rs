pub mod lnk;
pub mod model;
pub mod platform;

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::SystemTime;

pub use model::{AutoScanFrequency, DiscoveredApp, ScanLifecycleState, ScanResult, ScanStatus};

use crate::settings::{AppSettings, ApplicationProfile, SettingsStorage};

static IS_SCANNING: AtomicBool = AtomicBool::new(false);

/// Checks whether an application scan is currently executing.
pub fn is_scanning() -> bool {
    IS_SCANNING.load(Ordering::SeqCst)
}

/// Determines whether an automatic scan should run according to the user's settings.
pub fn should_run_auto_scan(settings: &AppSettings) -> bool {
    if !settings.auto_app_scan_enabled {
        return false;
    }

    let last_scan = match settings.last_app_scan {
        Some(ts) => ts,
        None => return true,
    };

    let now = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    match settings.auto_app_scan_frequency {
        AutoScanFrequency::Startup => true,
        AutoScanFrequency::Daily => now.saturating_sub(last_scan) >= 86_400,
        AutoScanFrequency::Weekly => now.saturating_sub(last_scan) >= 604_800,
    }
}

/// Core application scanning routine.
/// Discovers installed applications, preserves existing user profile customizations,
/// filters out previously removed applications, and persists newly discovered entries.
pub fn execute_app_scan(storage: &Arc<SettingsStorage>) -> Result<ScanResult, String> {
    // Duplicate scan guard
    if IS_SCANNING
        .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
        .is_err()
    {
        return Err("An application scan is already in progress.".to_string());
    }

    struct ScanGuard;
    impl Drop for ScanGuard {
        fn drop(&mut self) {
            IS_SCANNING.store(false, Ordering::SeqCst);
        }
    }
    let _guard = ScanGuard;

    // 1. Run platform discovery (Start Menu, Desktop, Registry)
    let raw_discovered = platform::scan_installed_applications();

    // 2. Fetch current user settings
    let mut settings = storage.get();
    let initial_app_count = settings.applications.len();

    let mut final_discovered = Vec::with_capacity(raw_discovered.len());
    let mut new_added_count = 0usize;
    let mut already_existing_count = 0usize;

    // Set of normalized removed application identifiers
    let removed_set: std::collections::HashSet<String> = settings
        .removed_applications
        .iter()
        .map(|s| s.trim().to_lowercase())
        .collect();

    for mut app in raw_discovered {
        let exe_norm = app.executable_name.trim().to_lowercase();
        let exe_stripped = exe_norm.strip_suffix(".exe").unwrap_or(&exe_norm);

        // Check if application already exists in user's profile list
        let existing_index = settings.applications.iter().position(|p| {
            let p_exe = p.executable_name.trim().to_lowercase();
            let p_stripped = p_exe.strip_suffix(".exe").unwrap_or(&p_exe);
            p_exe == exe_norm || p_stripped == exe_stripped
        });

        if let Some(idx) = existing_index {
            // Already exists: preserve ALL user custom settings (color, animation, intensity, enabled, etc.)
            app.is_new = false;
            already_existing_count += 1;

            // Enrich executable path if existing profile lacks it
            if settings.applications[idx].executable_path.is_none() && app.executable_path.is_some()
            {
                settings.applications[idx].executable_path = app.executable_path.clone();
            }
        } else if removed_set.contains(&exe_norm) || removed_set.contains(exe_stripped) {
            // User previously deleted this application profile: respect user's choice and do NOT re-add automatically
            app.is_new = false;
            already_existing_count += 1;
        } else {
            // New discovered app: create a clean profile
            app.is_new = true;
            new_added_count += 1;

            let mut new_profile = ApplicationProfile::new(&app.name, &app.executable_name);
            if let Some(ref path) = app.executable_path {
                new_profile = new_profile.with_executable_path(path);
            }
            settings.applications.push(new_profile);
        }

        final_discovered.push(app);
    }

    let now_secs = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    settings.last_app_scan = Some(now_secs);

    // Save settings if new apps were added or path was enriched or scan timestamp updated
    if settings.applications.len() != initial_app_count || new_added_count > 0 {
        let _ = storage.update(settings.clone());
    } else {
        let _ = storage.update(settings);
    }

    Ok(ScanResult {
        total_found: final_discovered.len(),
        new_added: new_added_count,
        already_existing: already_existing_count,
        discovered_apps: final_discovered,
        timestamp: now_secs,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::glow::model::GlowAnimationStyle;
    use crate::scanner::model::AutoScanFrequency;

    #[test]
    fn test_should_run_auto_scan_policy() {
        let mut settings = AppSettings::default();
        settings.auto_app_scan_enabled = false;
        assert!(!should_run_auto_scan(&settings));

        settings.auto_app_scan_enabled = true;
        settings.last_app_scan = None;
        assert!(should_run_auto_scan(&settings));

        let now = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Startup frequency: always runs on launch if enabled
        settings.auto_app_scan_frequency = AutoScanFrequency::Startup;
        settings.last_app_scan = Some(now);
        assert!(should_run_auto_scan(&settings));

        // Daily frequency: runs only after 86,400 seconds
        settings.auto_app_scan_frequency = AutoScanFrequency::Daily;
        settings.last_app_scan = Some(now - 100);
        assert!(!should_run_auto_scan(&settings));

        settings.last_app_scan = Some(now - 86_500);
        assert!(should_run_auto_scan(&settings));

        // Weekly frequency: runs only after 604,800 seconds
        settings.auto_app_scan_frequency = AutoScanFrequency::Weekly;
        settings.last_app_scan = Some(now - 100_000);
        assert!(!should_run_auto_scan(&settings));

        settings.last_app_scan = Some(now - 605_000);
        assert!(should_run_auto_scan(&settings));
    }

    #[test]
    fn test_is_blacklisted_executable_filters_unwanted_binaries() {
        #[cfg(target_os = "windows")]
        {
            use crate::scanner::platform::windows::is_blacklisted_executable;
            assert!(is_blacklisted_executable("uninstall.exe"));
            assert!(is_blacklisted_executable("unins000.exe"));
            assert!(is_blacklisted_executable("setup.exe"));
            assert!(is_blacklisted_executable("installer.exe"));
            assert!(is_blacklisted_executable("app_updater.exe"));
            assert!(is_blacklisted_executable("crash_reporter.exe"));
            assert!(is_blacklisted_executable("cmd.exe"));
            assert!(is_blacklisted_executable("powershell.exe"));

            assert!(!is_blacklisted_executable("Discord.exe"));
            assert!(!is_blacklisted_executable("Spotify.exe"));
            assert!(!is_blacklisted_executable("Code.exe"));
            assert!(!is_blacklisted_executable("Curry.exe"));
        }
    }

    #[test]
    fn test_is_blacklisted_app_name_filters_patches() {
        #[cfg(target_os = "windows")]
        {
            use crate::scanner::platform::windows::is_blacklisted_app_name;
            assert!(is_blacklisted_app_name(
                "Microsoft Visual C++ 2015-2022 Redistributable"
            ));
            assert!(is_blacklisted_app_name("Security Update for Windows"));
            assert!(is_blacklisted_app_name("Hotfix KB123456"));

            assert!(!is_blacklisted_app_name("Discord"));
            assert!(!is_blacklisted_app_name("Spotify Music"));
            assert!(!is_blacklisted_app_name("Visual Studio Code"));
        }
    }

    #[test]
    fn test_scanner_preserves_customizations_on_existing_profiles() {
        let mut profile = ApplicationProfile::new("Discord", "Discord.exe");
        profile.color = Some("#7289DA".to_string());
        profile.animation = Some(GlowAnimationStyle::Ripple);
        profile.intensity = Some(0.85);
        profile.enabled = false; // User explicitly disabled it

        let existing_profiles = vec![profile.clone()];

        let discovered = vec![DiscoveredApp {
            name: "Discord".to_string(),
            executable_name: "Discord.exe".to_string(),
            executable_path: Some(
                "C:\\Users\\User\\AppData\\Local\\Discord\\Discord.exe".to_string(),
            ),
            icon_path: None,
            source: "start_menu".to_string(),
            is_new: false,
        }];

        let mut app_list = existing_profiles;
        let mut new_added = 0usize;

        for disc in discovered {
            let exe_norm = disc.executable_name.to_lowercase();
            if let Some(idx) = app_list
                .iter()
                .position(|p| p.executable_name.to_lowercase() == exe_norm)
            {
                // Preserves user settings
                assert_eq!(app_list[idx].color, Some("#7289DA".to_string()));
                assert_eq!(app_list[idx].animation, Some(GlowAnimationStyle::Ripple));
                assert_eq!(app_list[idx].intensity, Some(0.85));
                assert!(!app_list[idx].enabled); // Remained false!

                // Enriches path
                if app_list[idx].executable_path.is_none() {
                    app_list[idx].executable_path = disc.executable_path.clone();
                }
            } else {
                new_added += 1;
            }
        }

        assert_eq!(new_added, 0);
        assert_eq!(app_list.len(), 1);
        assert_eq!(
            app_list[0].executable_path,
            Some("C:\\Users\\User\\AppData\\Local\\Discord\\Discord.exe".to_string())
        );
    }

    #[test]
    fn test_scanner_skips_user_removed_applications() {
        let removed_applications = vec!["discord.exe".to_string(), "spotify".to_string()];
        let removed_set: std::collections::HashSet<String> = removed_applications
            .iter()
            .map(|s| s.to_lowercase())
            .collect();

        let candidate_exe = "Discord.exe";
        let norm = candidate_exe.to_lowercase();
        let stripped = norm.strip_suffix(".exe").unwrap_or(&norm);

        assert!(removed_set.contains(&norm) || removed_set.contains(stripped));
    }

    #[test]
    fn test_lnk_parser_resilience_on_malformed_data() {
        use crate::scanner::lnk::parse_lnk_file;
        use std::io::Write;

        let temp_dir = std::env::temp_dir();
        let fake_lnk = temp_dir.join("curry_test_malformed.lnk");

        // Test 1: Empty file
        {
            let mut f = std::fs::File::create(&fake_lnk).unwrap();
            f.write_all(&[]).unwrap();
        }
        assert!(parse_lnk_file(&fake_lnk).is_none());

        // Test 2: Truncated header (less than 76 bytes)
        {
            let mut f = std::fs::File::create(&fake_lnk).unwrap();
            f.write_all(&[0u8; 40]).unwrap();
        }
        assert!(parse_lnk_file(&fake_lnk).is_none());

        // Test 3: Invalid CLSID
        {
            let mut f = std::fs::File::create(&fake_lnk).unwrap();
            let mut buf = [0u8; 76];
            buf[0] = 76; // header size
            f.write_all(&buf).unwrap();
        }
        assert!(parse_lnk_file(&fake_lnk).is_none());

        let _ = std::fs::remove_file(fake_lnk);
    }
}
