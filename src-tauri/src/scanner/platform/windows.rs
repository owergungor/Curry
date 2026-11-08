use std::collections::HashSet;
use std::path::{Path, PathBuf};

use crate::scanner::lnk::parse_lnk_file;
use crate::scanner::model::DiscoveredApp;

/// Scans installed Windows applications from Start Menu, Desktop, and Registry Uninstall keys.
pub fn scan_installed_applications() -> Vec<DiscoveredApp> {
    let mut discovered = Vec::new();
    let mut seen_executables: HashSet<String> = HashSet::new();

    // 1. Scan Start Menu directories
    scan_start_menu_shortcuts(&mut discovered, &mut seen_executables);

    // 2. Scan Desktop shortcuts
    scan_desktop_shortcuts(&mut discovered, &mut seen_executables);

    // 3. Scan Windows Registry Uninstall keys
    scan_registry_uninstall_keys(&mut discovered, &mut seen_executables);

    // 4. Scan Xbox app & Game Pass installations
    scan_xbox_games(&mut discovered, &mut seen_executables);

    // 5. Scan Microsoft Store / UWP packages
    scan_microsoft_store_apps(&mut discovered, &mut seen_executables);

    discovered
}

fn scan_start_menu_shortcuts(discovered: &mut Vec<DiscoveredApp>, seen: &mut HashSet<String>) {
    let mut paths_to_scan = Vec::new();

    // %ProgramData%\Microsoft\Windows\Start Menu\Programs
    if let Ok(program_data) = std::env::var("ProgramData") {
        let p = PathBuf::from(program_data)
            .join("Microsoft")
            .join("Windows")
            .join("Start Menu")
            .join("Programs");
        if p.is_dir() {
            paths_to_scan.push(p);
        }
    }

    // %APPDATA%\Microsoft\Windows\Start Menu\Programs
    if let Ok(app_data) = std::env::var("APPDATA") {
        let p = PathBuf::from(app_data)
            .join("Microsoft")
            .join("Windows")
            .join("Start Menu")
            .join("Programs");
        if p.is_dir() {
            paths_to_scan.push(p);
        }
    }

    for dir in paths_to_scan {
        scan_directory_shortcuts(&dir, "start_menu", discovered, seen);
    }
}

fn scan_desktop_shortcuts(discovered: &mut Vec<DiscoveredApp>, seen: &mut HashSet<String>) {
    let mut paths_to_scan = Vec::new();

    // %PUBLIC%\Desktop
    if let Ok(public_dir) = std::env::var("PUBLIC") {
        let p = PathBuf::from(public_dir).join("Desktop");
        if p.is_dir() {
            paths_to_scan.push(p);
        }
    }

    // %USERPROFILE%\Desktop
    if let Ok(user_profile) = std::env::var("USERPROFILE") {
        let p = PathBuf::from(user_profile).join("Desktop");
        if p.is_dir() {
            paths_to_scan.push(p);
        }
    }

    for dir in paths_to_scan {
        scan_directory_shortcuts(&dir, "desktop", discovered, seen);
    }
}

fn scan_directory_shortcuts(
    dir: &Path,
    source: &str,
    discovered: &mut Vec<DiscoveredApp>,
    seen: &mut HashSet<String>,
) {
    // Read directory with error handling (skip if access denied or unreadable)
    let entries = match std::fs::read_dir(dir) {
        Ok(e) => e,
        Err(_) => return,
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            // Recurse into subdirectories (e.g. Programs\Discord Inc)
            scan_directory_shortcuts(&path, source, discovered, seen);
        } else if let Some(ext) = path.extension() {
            if ext.eq_ignore_ascii_case("lnk") {
                process_lnk_file(&path, source, discovered, seen);
            }
        }
    }
}

fn process_lnk_file(
    lnk_path: &Path,
    source: &str,
    discovered: &mut Vec<DiscoveredApp>,
    seen: &mut HashSet<String>,
) {
    let parsed = match parse_lnk_file(lnk_path) {
        Some(p) => p,
        None => return,
    };

    let target_path_str = match parsed.target_path {
        Some(t) => t,
        None => return,
    };

    let target_path = Path::new(&target_path_str);
    // Resolve relative shortcut paths if applicable
    let resolved_target_str = if target_path.is_relative() {
        if let Some(ref wd) = parsed.working_dir {
            let candidate = Path::new(wd).join(target_path);
            if let Ok(canon) = std::fs::canonicalize(&candidate) {
                canon.to_string_lossy().replace("\\\\?\\", "").to_string()
            } else if candidate.is_file() {
                candidate.to_string_lossy().to_string()
            } else if let Some(parent) = lnk_path.parent() {
                let candidate2 = parent.join(target_path);
                if let Ok(canon) = std::fs::canonicalize(&candidate2) {
                    canon.to_string_lossy().replace("\\\\?\\", "").to_string()
                } else if candidate2.is_file() {
                    candidate2.to_string_lossy().to_string()
                } else {
                    target_path_str
                }
            } else {
                target_path_str
            }
        } else if let Some(parent) = lnk_path.parent() {
            let candidate = parent.join(target_path);
            if let Ok(canon) = std::fs::canonicalize(&candidate) {
                canon.to_string_lossy().replace("\\\\?\\", "").to_string()
            } else if candidate.is_file() {
                candidate.to_string_lossy().to_string()
            } else {
                target_path_str
            }
        } else {
            target_path_str
        }
    } else if let Ok(canon) = std::fs::canonicalize(target_path) {
        canon.to_string_lossy().replace("\\\\?\\", "").to_string()
    } else {
        target_path_str
    };

    let final_target_path = Path::new(&resolved_target_str);

    // Only accept .exe targets
    if !final_target_path
        .extension()
        .map_or(false, |ext| ext.eq_ignore_ascii_case("exe"))
    {
        return;
    }

    let exe_name = match final_target_path.file_name().and_then(|f| f.to_str()) {
        Some(n) => n.to_string(),
        None => return,
    };

    // Filter out uninstaller/helper utilities
    if is_blacklisted_executable(&exe_name) {
        return;
    }

    let norm_key = exe_name.to_lowercase();
    if seen.contains(&norm_key) {
        return;
    }
    seen.insert(norm_key);

    // Derive display name from shortcut file stem
    let display_name = lnk_path
        .file_stem()
        .and_then(|s| s.to_str())
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| {
            crate::settings::format_display_name(exe_name.strip_suffix(".exe").unwrap_or(&exe_name))
        });

    discovered.push(DiscoveredApp {
        name: display_name,
        executable_name: exe_name,
        executable_path: Some(resolved_target_str),
        icon_path: parsed.icon_path,
        source: source.to_string(),
        is_new: false,
    });
}

fn scan_registry_uninstall_keys(discovered: &mut Vec<DiscoveredApp>, seen: &mut HashSet<String>) {
    use windows::core::{PCWSTR, PWSTR};
    use windows::Win32::System::Registry::{
        RegCloseKey, RegEnumKeyExW, RegOpenKeyExW, HKEY, HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE,
        KEY_READ, KEY_WOW64_32KEY, KEY_WOW64_64KEY,
    };

    let targets = [
        (
            HKEY_CURRENT_USER,
            "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall",
            KEY_READ,
        ),
        (
            HKEY_LOCAL_MACHINE,
            "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall",
            KEY_READ | KEY_WOW64_64KEY,
        ),
        (
            HKEY_LOCAL_MACHINE,
            "SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall",
            KEY_READ | KEY_WOW64_32KEY,
        ),
    ];

    for (root, subkey, access) in targets {
        unsafe {
            let mut hkey = HKEY::default();
            let subkey_wide: Vec<u16> = subkey.encode_utf16().chain(std::iter::once(0)).collect();

            if RegOpenKeyExW(
                root,
                PCWSTR(subkey_wide.as_ptr()),
                Some(0),
                access,
                &mut hkey,
            )
            .is_err()
            {
                continue;
            }

            let mut index = 0u32;
            let mut name_buf = [0u16; 256];

            loop {
                let mut name_len = name_buf.len() as u32;
                let enum_res = RegEnumKeyExW(
                    hkey,
                    index,
                    Some(PWSTR(name_buf.as_mut_ptr())),
                    &mut name_len,
                    None,
                    None,
                    None,
                    None,
                );

                if enum_res.is_err() {
                    break;
                }

                let child_key_name = String::from_utf16_lossy(&name_buf[..name_len as usize]);
                index += 1;

                // Inspect child key
                let mut child_hkey = HKEY::default();
                let child_wide: Vec<u16> = child_key_name
                    .encode_utf16()
                    .chain(std::iter::once(0))
                    .collect();

                if RegOpenKeyExW(
                    hkey,
                    PCWSTR(child_wide.as_ptr()),
                    Some(0),
                    access,
                    &mut child_hkey,
                )
                .is_ok()
                {
                    process_registry_app_key(child_hkey, discovered, seen);
                    let _ = RegCloseKey(child_hkey);
                }
            }

            let _ = RegCloseKey(hkey);
        }
    }
}

unsafe fn read_reg_string(
    hkey: windows::Win32::System::Registry::HKEY,
    value_name: &str,
) -> Option<String> {
    use windows::core::PCWSTR;
    use windows::Win32::System::Registry::{
        RegQueryValueExW, REG_EXPAND_SZ, REG_SZ, REG_VALUE_TYPE,
    };

    let val_wide: Vec<u16> = value_name
        .encode_utf16()
        .chain(std::iter::once(0))
        .collect();
    let mut val_type = REG_VALUE_TYPE::default();
    let mut data_len = 0u32;

    // First call to get required buffer size
    let query_res = RegQueryValueExW(
        hkey,
        PCWSTR(val_wide.as_ptr()),
        None,
        Some(&mut val_type),
        None,
        Some(&mut data_len),
    );

    if query_res.is_err() || data_len == 0 {
        return None;
    }

    if val_type != REG_SZ && val_type != REG_EXPAND_SZ {
        return None;
    }

    let mut buf: Vec<u8> = vec![0u8; data_len as usize];
    let query_res2 = RegQueryValueExW(
        hkey,
        PCWSTR(val_wide.as_ptr()),
        None,
        Some(&mut val_type),
        Some(buf.as_mut_ptr()),
        Some(&mut data_len),
    );

    if query_res2.is_err() {
        return None;
    }

    // Convert UTF-16 bytes to string
    let u16_slice: &[u16] =
        std::slice::from_raw_parts(buf.as_ptr() as *const u16, data_len as usize / 2);

    // Strip trailing nulls
    let trimmed = match u16_slice.iter().position(|&c| c == 0) {
        Some(pos) => &u16_slice[..pos],
        None => u16_slice,
    };

    let s = String::from_utf16_lossy(trimmed).trim().to_string();
    if s.is_empty() {
        None
    } else {
        Some(s)
    }
}

unsafe fn process_registry_app_key(
    hkey: windows::Win32::System::Registry::HKEY,
    discovered: &mut Vec<DiscoveredApp>,
    seen: &mut HashSet<String>,
) {
    // 1. DisplayName is required
    let display_name = match read_reg_string(hkey, "DisplayName") {
        Some(name) => name,
        None => return,
    };

    // Filter out common non-applications (updates, patches, toolchains)
    if is_blacklisted_app_name(&display_name) {
        return;
    }

    // Check SystemComponent DWORD
    // (If SystemComponent == 1, skip)

    // 2. Resolve executable path from DisplayIcon or InstallLocation
    let display_icon = read_reg_string(hkey, "DisplayIcon");
    let install_location = read_reg_string(hkey, "InstallLocation");

    let exe_path_opt = resolve_executable_from_registry_fields(
        display_icon.as_deref(),
        install_location.as_deref(),
    );

    if let Some(exe_path) = exe_path_opt {
        let path = Path::new(&exe_path);
        if let Some(exe_name) = path.file_name().and_then(|f| f.to_str()) {
            if !is_blacklisted_executable(exe_name) {
                let norm_key = exe_name.to_lowercase();
                if !seen.contains(&norm_key) {
                    seen.insert(norm_key);
                    discovered.push(DiscoveredApp {
                        name: display_name,
                        executable_name: exe_name.to_string(),
                        executable_path: Some(exe_path),
                        icon_path: display_icon,
                        source: "registry".to_string(),
                        is_new: false,
                    });
                }
            }
        }
    }
}

fn resolve_executable_from_registry_fields(
    display_icon: Option<&str>,
    install_location: Option<&str>,
) -> Option<String> {
    // 1. Try DisplayIcon: often "C:\path\to\app.exe,0" or "C:\path\to\app.exe"
    if let Some(icon) = display_icon {
        let clean = icon.trim().trim_matches('"');
        let raw_path = clean.split(',').next().unwrap_or(clean).trim();
        if raw_path.to_lowercase().ends_with(".exe") {
            let p = Path::new(raw_path);
            if p.is_file() {
                return Some(raw_path.to_string());
            }
        }
    }

    // 2. Try InstallLocation: look for an .exe inside
    if let Some(loc) = install_location {
        let clean = loc.trim().trim_matches('"');
        let loc_path = Path::new(clean);
        if loc_path.is_dir() {
            if let Ok(entries) = std::fs::read_dir(loc_path) {
                for entry in entries.flatten() {
                    let p = entry.path();
                    if p.is_file()
                        && p.extension()
                            .map_or(false, |ext| ext.eq_ignore_ascii_case("exe"))
                    {
                        if let Some(name) = p.file_name().and_then(|f| f.to_str()) {
                            if !is_blacklisted_executable(name) {
                                return Some(p.to_string_lossy().to_string());
                            }
                        }
                    }
                }
            }
        }
    }

    None
}

pub fn is_blacklisted_executable(name: &str) -> bool {
    let lower = name.to_lowercase();
    let blacklisted = [
        "unins",
        "setup",
        "installer",
        "updater",
        "update",
        "crashpad",
        "crash_reporter",
        "helper",
        "cmd.exe",
        "powershell.exe",
        "conhost.exe",
        "rundll32.exe",
        "regsvr32.exe",
    ];

    blacklisted.iter().any(|b| lower.contains(b))
}

pub fn is_blacklisted_app_name(name: &str) -> bool {
    let lower = name.to_lowercase();
    let blacklisted = [
        "redistributable",
        "security update",
        "update for windows",
        "hotfix",
        "service pack",
        "kb[0-9]",
        "microsoft visual c++",
        "windows sdk",
        ".net framework",
    ];

    blacklisted.iter().any(|b| lower.contains(b))
}

/// Scans installed Xbox app and Game Pass games across all available drive roots.
fn scan_xbox_games(discovered: &mut Vec<DiscoveredApp>, seen: &mut HashSet<String>) {
    let drive_letters = [
        "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T",
        "U", "V", "W", "X", "Y", "Z",
    ];

    for drive in drive_letters {
        let mut candidates = Vec::new();
        let xbox_root = PathBuf::from(format!("{}:\\XboxGames", drive));
        if xbox_root.is_dir() {
            candidates.push(xbox_root);
        }

        let modifiable_root = PathBuf::from(format!("{}:\\Program Files\\ModifiableWindowsApps", drive));
        if modifiable_root.is_dir() {
            candidates.push(modifiable_root);
        }

        for base_dir in candidates {
            let entries = match std::fs::read_dir(&base_dir) {
                Ok(e) => e,
                Err(_) => continue,
            };

            for entry in entries.flatten() {
                let game_folder = entry.path();
                if !game_folder.is_dir() {
                    continue;
                }

                process_xbox_game_directory(&game_folder, discovered, seen);
            }
        }
    }
}

fn process_xbox_game_directory(
    game_dir: &Path,
    discovered: &mut Vec<DiscoveredApp>,
    seen: &mut HashSet<String>,
) {
    let folder_name = match game_dir.file_name().and_then(|n| n.to_str()) {
        Some(n) => n.to_string(),
        None => return,
    };

    // Ignore metadata/cache directories
    if folder_name.eq_ignore_ascii_case(".GamingRoot") || folder_name.eq_ignore_ascii_case("GameSave") {
        return;
    }

    // Inspect Content directory or game root directory
    let content_dir = game_dir.join("Content");
    let target_dir = if content_dir.is_dir() {
        &content_dir
    } else {
        game_dir
    };

    // 1. Try MicrosoftGame.config
    let game_config_path = target_dir.join("MicrosoftGame.config");
    if game_config_path.is_file() {
        if let Ok(config_str) = std::fs::read_to_string(&game_config_path) {
            let display_name = extract_xml_attr(&config_str, "ShellVisuals", "DefaultDisplayName")
                .or_else(|| extract_xml_attr(&config_str, "Identity", "Name"))
                .unwrap_or_else(|| folder_name.clone());

            let exe_rel = extract_xml_attr(&config_str, "Executable", "Name")
                .or_else(|| extract_xml_attr(&config_str, "Application", "Executable"));

            let logo_rel = extract_xml_attr(&config_str, "ShellVisuals", "StoreLogo")
                .or_else(|| extract_xml_attr(&config_str, "ShellVisuals", "Square150x150Logo"));

            if let Some(exe) = exe_rel {
                let norm_exe = exe.replace('/', "\\");
                let full_exe_path = target_dir.join(&norm_exe);
                let exe_name = Path::new(&norm_exe)
                    .file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or(&norm_exe)
                    .to_string();

                let norm_key = exe_name.to_lowercase();
                if !seen.contains(&norm_key) && !is_blacklisted_executable(&exe_name) {
                    seen.insert(norm_key);
                    let icon_path = logo_rel.map(|l| target_dir.join(l.replace('/', "\\")).to_string_lossy().to_string());

                    discovered.push(DiscoveredApp {
                        name: display_name,
                        executable_name: exe_name,
                        executable_path: Some(full_exe_path.to_string_lossy().to_string()),
                        icon_path,
                        source: "xbox_game".to_string(),
                        is_new: false,
                    });
                    return;
                }
            }
        }
    }

    // 2. Try AppxManifest.xml
    let manifest_path = target_dir.join("appxmanifest.xml");
    if manifest_path.is_file() {
        if let Ok(manifest_str) = std::fs::read_to_string(&manifest_path) {
            let display_name = extract_xml_content(&manifest_str, "DisplayName")
                .filter(|s| !s.starts_with("ms-resource:"))
                .unwrap_or_else(|| folder_name.clone());

            let exe_rel = extract_xml_attr(&manifest_str, "Application", "Executable");
            let logo_rel = extract_xml_content(&manifest_str, "Logo");

            if let Some(exe) = exe_rel {
                let full_exe_path = target_dir.join(&exe);
                let exe_name = Path::new(&exe)
                    .file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or(&exe)
                    .to_string();

                let norm_key = exe_name.to_lowercase();
                if !seen.contains(&norm_key) && !is_blacklisted_executable(&exe_name) {
                    seen.insert(norm_key);
                    let icon_path = logo_rel.map(|l| target_dir.join(l.replace('/', "\\")).to_string_lossy().to_string());

                    discovered.push(DiscoveredApp {
                        name: display_name,
                        executable_name: exe_name,
                        executable_path: Some(full_exe_path.to_string_lossy().to_string()),
                        icon_path,
                        source: "xbox_game".to_string(),
                        is_new: false,
                    });
                    return;
                }
            }
        }
    }

    // 3. Fallback: scan for any primary executable in target_dir
    if let Ok(entries) = std::fs::read_dir(target_dir) {
        for e in entries.flatten() {
            let p = e.path();
            if p.is_file() && p.extension().map_or(false, |ext| ext.eq_ignore_ascii_case("exe")) {
                if let Some(exe_name) = p.file_name().and_then(|n| n.to_str()) {
                    if !is_blacklisted_executable(exe_name) {
                        let norm_key = exe_name.to_lowercase();
                        if !seen.contains(&norm_key) {
                            seen.insert(norm_key);
                            discovered.push(DiscoveredApp {
                                name: folder_name.clone(),
                                executable_name: exe_name.to_string(),
                                executable_path: Some(p.to_string_lossy().to_string()),
                                icon_path: None,
                                source: "xbox_game".to_string(),
                                is_new: false,
                            });
                            return;
                        }
                    }
                }
            }
        }
    }
}

/// Scans installed Microsoft Store and UWP applications from User AppModel repository.
fn scan_microsoft_store_apps(discovered: &mut Vec<DiscoveredApp>, seen: &mut HashSet<String>) {
    use windows::core::{PCWSTR, PWSTR};
    use windows::Win32::System::Registry::{
        RegCloseKey, RegEnumKeyExW, RegOpenKeyExW, HKEY, HKEY_CURRENT_USER, KEY_READ,
    };

    let subkey = "Software\\Classes\\Local Settings\\Software\\Microsoft\\Windows\\CurrentVersion\\AppModel\\Repository\\Packages";
    unsafe {
        let mut hkey = HKEY::default();
        let subkey_wide: Vec<u16> = subkey.encode_utf16().chain(std::iter::once(0)).collect();

        if RegOpenKeyExW(
            HKEY_CURRENT_USER,
            PCWSTR(subkey_wide.as_ptr()),
            Some(0),
            KEY_READ,
            &mut hkey,
        )
        .is_err()
        {
            return;
        }

        let mut index = 0u32;
        let mut name_buf = [0u16; 512];

        loop {
            let mut name_len = name_buf.len() as u32;
            let enum_res = RegEnumKeyExW(
                hkey,
                index,
                Some(PWSTR(name_buf.as_mut_ptr())),
                &mut name_len,
                None,
                None,
                None,
                None,
            );

            if enum_res.is_err() {
                break;
            }

            let pkg_key_name = String::from_utf16_lossy(&name_buf[..name_len as usize]);
            index += 1;

            // Skip internal system and framework packages
            if is_system_store_package(&pkg_key_name) {
                continue;
            }

            // Open child package key
            let mut child_hkey = HKEY::default();
            let child_wide: Vec<u16> = pkg_key_name
                .encode_utf16()
                .chain(std::iter::once(0))
                .collect();

            if RegOpenKeyExW(
                hkey,
                PCWSTR(child_wide.as_ptr()),
                Some(0),
                KEY_READ,
                &mut child_hkey,
            )
            .is_ok()
            {
                process_store_package_key(child_hkey, &pkg_key_name, discovered, seen);
                let _ = RegCloseKey(child_hkey);
            }
        }

        let _ = RegCloseKey(hkey);
    }
}

unsafe fn process_store_package_key(
    hkey: windows::Win32::System::Registry::HKEY,
    pkg_id: &str,
    discovered: &mut Vec<DiscoveredApp>,
    seen: &mut HashSet<String>,
) {
    let display_name_raw = read_reg_string(hkey, "DisplayName");
    let root_folder_raw = read_reg_string(hkey, "PackageRootFolder");

    let root_folder = match root_folder_raw {
        Some(r) if !r.is_empty() => r,
        _ => return,
    };

    let root_path = Path::new(&root_folder);

    // Derive display name
    let display_name = display_name_raw
        .filter(|s| !s.trim().is_empty() && !s.starts_with("ms-resource:"))
        .unwrap_or_else(|| clean_package_id_to_name(pkg_id));

    if is_blacklisted_app_name(&display_name) {
        return;
    }

    // Try reading AppxManifest.xml to find executable and icon
    let manifest_path = root_path.join("AppxManifest.xml");
    if manifest_path.is_file() {
        if let Ok(manifest_str) = std::fs::read_to_string(&manifest_path) {
            let exe_rel = extract_xml_attr(&manifest_str, "Application", "Executable");
            let logo_rel = extract_xml_content(&manifest_str, "Logo")
                .or_else(|| extract_xml_attr(&manifest_str, "uap:VisualElements", "Square150x150Logo"))
                .or_else(|| extract_xml_attr(&manifest_str, "uap:VisualElements", "Square44x44Logo"));

            if let Some(exe) = exe_rel {
                let full_exe_path = root_path.join(&exe);
                let exe_name = Path::new(&exe)
                    .file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or(&exe)
                    .to_string();

                let norm_key = exe_name.to_lowercase();
                if !seen.contains(&norm_key) && !is_blacklisted_executable(&exe_name) {
                    seen.insert(norm_key);

                    let icon_path = logo_rel.map(|l| root_path.join(l.replace('/', "\\")).to_string_lossy().to_string());

                    discovered.push(DiscoveredApp {
                        name: display_name,
                        executable_name: exe_name,
                        executable_path: Some(full_exe_path.to_string_lossy().to_string()),
                        icon_path,
                        source: "ms_store".to_string(),
                        is_new: false,
                    });
                    return;
                }
            }
        }
    }

    // Fallback: if manifest isn't accessible due to container permissions, record package entry
    let base_name = pkg_id.split('_').next().unwrap_or(pkg_id);
    let candidate_exe = format!("{}.exe", base_name.split('.').last().unwrap_or(base_name));
    let norm_key = candidate_exe.to_lowercase();

    if !seen.contains(&norm_key) && !is_blacklisted_executable(&candidate_exe) {
        seen.insert(norm_key);
        discovered.push(DiscoveredApp {
            name: display_name,
            executable_name: candidate_exe,
            executable_path: Some(root_folder),
            icon_path: None,
            source: "ms_store".to_string(),
            is_new: false,
        });
    }
}

fn is_system_store_package(pkg_id: &str) -> bool {
    let lower = pkg_id.to_lowercase();
    let sys_prefixes = [
        "microsoft.net.",
        "microsoft.vclibs.",
        "microsoft.ui.xaml.",
        "microsoft.directx.",
        "microsoft.services.store.",
        "microsoft.advertising.",
        "microsoft.windowscommunicationsapps",
        "windows.immersivecontrolpanel",
        "1527c705-",
        "c5e2524a-",
    ];

    sys_prefixes.iter().any(|prefix| lower.contains(prefix))
}

fn clean_package_id_to_name(pkg_id: &str) -> String {
    let family = pkg_id.split('_').next().unwrap_or(pkg_id);
    let app_part = family.split('.').last().unwrap_or(family);

    // Insert spaces before capital letters: "AppleMusic" -> "Apple Music"
    let mut clean = String::new();
    for (i, ch) in app_part.chars().enumerate() {
        if i > 0 && ch.is_uppercase() {
            clean.push(' ');
        }
        clean.push(ch);
    }
    clean
}

/// Simple helper to extract an XML attribute value: <Tag ... Attr="value" ...>
fn extract_xml_attr(xml: &str, tag: &str, attr: &str) -> Option<String> {
    let tag_pattern = format!("<{}", tag);
    let mut cursor = xml;

    while let Some(tag_pos) = cursor.find(&tag_pattern) {
        let tag_slice = &cursor[tag_pos..];
        let end_tag = tag_slice.find('>')?;
        let full_tag = &tag_slice[..end_tag];

        let attr_pattern = format!("{}=\"", attr);
        if let Some(attr_pos) = full_tag.find(&attr_pattern) {
            let val_slice = &full_tag[attr_pos + attr_pattern.len()..];
            let end_val = val_slice.find('"')?;
            return Some(val_slice[..end_val].to_string());
        }

        cursor = &cursor[tag_pos + tag_pattern.len()..];
    }

    None
}

/// Simple helper to extract content between <Tag>content</Tag>
fn extract_xml_content(xml: &str, tag: &str) -> Option<String> {
    let open_tag = format!("<{}>", tag);
    let close_tag = format!("</{}>", tag);

    let start = xml.find(&open_tag)?;
    let content_start = start + open_tag.len();
    let content_slice = &xml[content_start..];
    let end = content_slice.find(&close_tag)?;

    let val = content_slice[..end].trim().to_string();
    if val.is_empty() {
        None
    } else {
        Some(val)
    }
}
