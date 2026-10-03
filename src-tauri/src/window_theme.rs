use crate::settings::{AppTheme, AppearanceMode};
use tauri::WebviewWindow;

/// Converts a hex color string (e.g. "#121826" or "121826") into Win32 COLORREF (0x00BBGGRR).
pub fn hex_to_colorref(hex_str: &str) -> Option<u32> {
    let clean = hex_str.trim().trim_start_matches('#');
    if clean.len() == 6 {
        let r = u8::from_str_radix(&clean[0..2], 16).ok()?;
        let g = u8::from_str_radix(&clean[2..4], 16).ok()?;
        let b = u8::from_str_radix(&clean[4..6], 16).ok()?;
        Some(((b as u32) << 16) | ((g as u32) << 8) | (r as u32))
    } else {
        None
    }
}

/// Resolved color palette for native window chrome.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct WindowChromeColors {
    pub is_dark: bool,
    pub caption_color: u32,
    pub text_color: u32,
    pub border_color: u32,
}

impl WindowChromeColors {
    /// Resolves optimal native window chrome colors matching theme and appearance.
    pub fn resolve(theme: AppTheme, is_dark: bool) -> Self {
        if !is_dark {
            // Light appearance mode
            match theme {
                AppTheme::VintagePaper => Self {
                    is_dark: false,
                    caption_color: hex_to_colorref("#f7f3ec").unwrap_or(0x00ECF3F7),
                    text_color: hex_to_colorref("#241e17").unwrap_or(0x00171E24),
                    border_color: hex_to_colorref("#ded6c7").unwrap_or(0x00C7D6DE),
                },
                _ => Self {
                    is_dark: false,
                    caption_color: hex_to_colorref("#f8fafc").unwrap_or(0x00FCFAF8),
                    text_color: hex_to_colorref("#0f172a").unwrap_or(0x002A170F),
                    border_color: hex_to_colorref("#e2e8f0").unwrap_or(0x00F0E8E2),
                },
            }
        } else {
            // Dark appearance mode
            match theme {
                AppTheme::Perpetuity => Self {
                    is_dark: true,
                    caption_color: hex_to_colorref("#121826").unwrap_or(0x00261812),
                    text_color: hex_to_colorref("#f8fafc").unwrap_or(0x00FCFAF8),
                    border_color: hex_to_colorref("#1e293b").unwrap_or(0x003B291E),
                },
                AppTheme::Catppuccin => Self {
                    is_dark: true,
                    caption_color: hex_to_colorref("#1e1e2e").unwrap_or(0x002E1E1E),
                    text_color: hex_to_colorref("#cdd6f4").unwrap_or(0x00F4D6CD),
                    border_color: hex_to_colorref("#313244").unwrap_or(0x00443231),
                },
                AppTheme::AmethystHaze => Self {
                    is_dark: true,
                    caption_color: hex_to_colorref("#191329").unwrap_or(0x00291319),
                    text_color: hex_to_colorref("#f5f0ff").unwrap_or(0x00FFF0F5),
                    border_color: hex_to_colorref("#281c40").unwrap_or(0x00401C28),
                },
                AppTheme::SageMist => Self {
                    is_dark: true,
                    caption_color: hex_to_colorref("#121e18").unwrap_or(0x00181E12),
                    text_color: hex_to_colorref("#ecfdf5").unwrap_or(0x00F5FDEC),
                    border_color: hex_to_colorref("#1a2c24").unwrap_or(0x00242C1A),
                },
                AppTheme::Bubblegum => Self {
                    is_dark: true,
                    caption_color: hex_to_colorref("#221022").unwrap_or(0x00221022),
                    text_color: hex_to_colorref("#fdf2f8").unwrap_or(0x00F8F2FD),
                    border_color: hex_to_colorref("#321832").unwrap_or(0x00321832),
                },
                AppTheme::Amberstate => Self {
                    is_dark: true,
                    caption_color: hex_to_colorref("#161b22").unwrap_or(0x00221B16),
                    text_color: hex_to_colorref("#f8fafc").unwrap_or(0x00FCFAF8),
                    border_color: hex_to_colorref("#212833").unwrap_or(0x00332821),
                },
                AppTheme::VintagePaper => Self {
                    // Vintage paper requested in dark mode keeps dark surface with vintage tones
                    is_dark: true,
                    caption_color: hex_to_colorref("#1e1a16").unwrap_or(0x00161A1E),
                    text_color: hex_to_colorref("#f7f3ec").unwrap_or(0x00ECF3F7),
                    border_color: hex_to_colorref("#3d342a").unwrap_or(0x002A343D),
                },
            }
        }
    }
}

/// Detects whether Windows OS is currently configured in dark mode for applications.
#[cfg(target_os = "windows")]
pub fn is_windows_system_dark_mode() -> bool {
    use std::ptr;
    extern "system" {
        fn RegOpenKeyExW(
            hKey: isize,
            lpSubKey: *const u16,
            ulOptions: u32,
            samDesired: u32,
            phkResult: *mut isize,
        ) -> i32;
        fn RegQueryValueExW(
            hKey: isize,
            lpValueName: *const u16,
            lpReserved: *mut u32,
            lpType: *mut u32,
            lpData: *mut u8,
            lpcbData: *mut u32,
        ) -> i32;
        fn RegCloseKey(hKey: isize) -> i32;
    }

    const HKEY_CURRENT_USER: isize = -2147483647; // 0x80000001
    const KEY_READ: u32 = 0x20019;

    let subkey: Vec<u16> = "Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize\0"
        .encode_utf16()
        .collect();
    let val_name: Vec<u16> = "AppsUseLightTheme\0".encode_utf16().collect();

    let mut hkey: isize = 0;
    unsafe {
        if RegOpenKeyExW(HKEY_CURRENT_USER, subkey.as_ptr(), 0, KEY_READ, &mut hkey) == 0 {
            let mut data: u32 = 0;
            let mut data_len: u32 = std::mem::size_of::<u32>() as u32;
            let mut val_type: u32 = 0;
            let res = RegQueryValueExW(
                hkey,
                val_name.as_ptr(),
                ptr::null_mut(),
                &mut val_type,
                &mut data as *mut _ as *mut u8,
                &mut data_len,
            );
            let _ = RegCloseKey(hkey);
            if res == 0 {
                return data == 0; // 0 = dark mode, 1 = light mode
            }
        }
    }
    true // default to dark
}

#[cfg(not(target_os = "windows"))]
pub fn is_windows_system_dark_mode() -> bool {
    true
}

/// Determines the effective dark/light mode given the appearance setting and theme.
pub fn is_effective_dark_mode(appearance: AppearanceMode, theme: AppTheme) -> bool {
    match appearance {
        AppearanceMode::Dark => true,
        AppearanceMode::Light => false,
        AppearanceMode::System => {
            if theme == AppTheme::VintagePaper {
                false
            } else {
                is_windows_system_dark_mode()
            }
        }
    }
}

/// Synchronizes the native window chrome (caption bar, minimize, maximize/restore, close buttons)
/// with the user's active theme and appearance mode.
pub fn sync_window_chrome(window: &WebviewWindow, appearance: AppearanceMode, theme: AppTheme) {
    let is_dark = is_effective_dark_mode(appearance, theme);
    let colors = WindowChromeColors::resolve(theme, is_dark);

    // 1. Tauri theme synchronization
    let tauri_theme = if is_dark {
        Some(tauri::Theme::Dark)
    } else {
        Some(tauri::Theme::Light)
    };
    let _ = window.set_theme(tauri_theme);

    // 2. Windows native DWM attribute application
    #[cfg(target_os = "windows")]
    apply_windows_dwm_attributes(window, colors);
}

/// Applies native Windows DWM attributes for dark mode caption, caption color, text color, and border.
#[cfg(target_os = "windows")]
pub fn apply_windows_dwm_attributes(window: &WebviewWindow, colors: WindowChromeColors) {
    if let Ok(hwnd_val) = window.hwnd() {
        let hwnd = hwnd_val.0 as isize;
        unsafe {
            extern "system" {
                fn DwmSetWindowAttribute(
                    hwnd: isize,
                    dwAttribute: u32,
                    pvAttribute: *const std::ffi::c_void,
                    cbAttribute: u32,
                ) -> i32;
                fn SetWindowPos(
                    hwnd: isize,
                    hwnd_insert_after: isize,
                    x: i32,
                    y: i32,
                    cx: i32,
                    cy: i32,
                    flags: u32,
                ) -> i32;
            }

            let dark_val: i32 = if colors.is_dark { 1 } else { 0 };

            // DWMWA_USE_IMMERSIVE_DARK_MODE (20 on Win 10 18985+ & Win 11, 19 on older Win 10)
            const DWMWA_USE_IMMERSIVE_DARK_MODE: u32 = 20;
            const DWMWA_USE_IMMERSIVE_DARK_MODE_OLD: u32 = 19;
            DwmSetWindowAttribute(
                hwnd,
                DWMWA_USE_IMMERSIVE_DARK_MODE,
                &dark_val as *const _ as *const std::ffi::c_void,
                std::mem::size_of::<i32>() as u32,
            );
            DwmSetWindowAttribute(
                hwnd,
                DWMWA_USE_IMMERSIVE_DARK_MODE_OLD,
                &dark_val as *const _ as *const std::ffi::c_void,
                std::mem::size_of::<i32>() as u32,
            );

            // Windows 11 DWM attributes (safe no-op on Windows 10)
            const DWMWA_BORDER_COLOR: u32 = 34;
            const DWMWA_CAPTION_COLOR: u32 = 35;
            const DWMWA_TEXT_COLOR: u32 = 36;

            DwmSetWindowAttribute(
                hwnd,
                DWMWA_CAPTION_COLOR,
                &colors.caption_color as *const _ as *const std::ffi::c_void,
                std::mem::size_of::<u32>() as u32,
            );
            DwmSetWindowAttribute(
                hwnd,
                DWMWA_TEXT_COLOR,
                &colors.text_color as *const _ as *const std::ffi::c_void,
                std::mem::size_of::<u32>() as u32,
            );
            DwmSetWindowAttribute(
                hwnd,
                DWMWA_BORDER_COLOR,
                &colors.border_color as *const _ as *const std::ffi::c_void,
                std::mem::size_of::<u32>() as u32,
            );

            // Trigger non-client frame recalculation for immediate visual update
            const SWP_NOSIZE: u32 = 0x0001;
            const SWP_NOMOVE: u32 = 0x0002;
            const SWP_NOZORDER: u32 = 0x0004;
            const SWP_NOACTIVATE: u32 = 0x0010;
            const SWP_FRAMECHANGED: u32 = 0x0020;
            SetWindowPos(
                hwnd,
                0,
                0,
                0,
                0,
                0,
                SWP_NOSIZE | SWP_NOMOVE | SWP_NOZORDER | SWP_NOACTIVATE | SWP_FRAMECHANGED,
            );
        }
    }
}
