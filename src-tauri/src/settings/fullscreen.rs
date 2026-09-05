use serde::{Deserialize, Serialize};

/// Visual state of the active foreground window relative to display monitors.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum FullscreenState {
    NotFullscreen,
    Fullscreen,
    Unknown,
}

/// Global user-configured policy for glow overlay behavior when fullscreen / gaming is active.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum FullscreenBehavior {
    AlwaysShow,
    SuppressInFullscreen,
    SuppressGaming,
}

impl Default for FullscreenBehavior {
    fn default() -> Self {
        Self::SuppressInFullscreen
    }
}

impl<'de> Deserialize<'de> for FullscreenBehavior {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        match s.to_lowercase().replace('-', "_").as_str() {
            "always_show" | "alwaysshow" | "always" => Ok(Self::AlwaysShow),
            "suppress_gaming" | "suppressgaming" | "gaming" => Ok(Self::SuppressGaming),
            "suppress_in_fullscreen" | "suppressinfullscreen" | "suppress" => {
                Ok(Self::SuppressInFullscreen)
            }
            _ => Ok(Self::SuppressInFullscreen),
        }
    }
}

/// Determines whether glow effect should be suppressed based on fullscreen state, global behavior, and profile override.
pub fn should_suppress_for_fullscreen(
    behavior: FullscreenBehavior,
    profile_suppress_override: Option<bool>,
    fullscreen_state: FullscreenState,
) -> bool {
    // Application profile override has highest priority
    if let Some(suppress_override) = profile_suppress_override {
        if suppress_override {
            return matches!(fullscreen_state, FullscreenState::Fullscreen);
        } else {
            return false;
        }
    }

    match behavior {
        FullscreenBehavior::AlwaysShow => false,
        FullscreenBehavior::SuppressInFullscreen | FullscreenBehavior::SuppressGaming => {
            matches!(fullscreen_state, FullscreenState::Fullscreen)
        }
    }
}

/// Windows Win32 detection for determining whether the active foreground window covers the full monitor bounds.
#[cfg(target_os = "windows")]
pub fn detect_fullscreen_state() -> FullscreenState {
    #[repr(C)]
    struct RECT {
        left: i32,
        top: i32,
        right: i32,
        bottom: i32,
    }

    #[repr(C)]
    struct MONITORINFO {
        cb_size: u32,
        rc_monitor: RECT,
        rc_work: RECT,
        dw_flags: u32,
    }

    extern "system" {
        fn GetForegroundWindow() -> isize;
        fn GetWindowRect(hwnd: isize, lp_rect: *mut RECT) -> i32;
        fn MonitorFromWindow(hwnd: isize, dw_flags: u32) -> isize;
        fn GetMonitorInfoW(h_monitor: isize, lpmi: *mut MONITORINFO) -> i32;
        fn GetClassNameW(hwnd: isize, lp_class_name: *mut u16, n_max_count: i32) -> i32;
        fn IsWindowVisible(hwnd: isize) -> i32;
    }

    const MONITOR_DEFAULTTONEAREST: u32 = 2;

    unsafe {
        let hwnd = GetForegroundWindow();
        if hwnd == 0 {
            return FullscreenState::NotFullscreen;
        }

        if IsWindowVisible(hwnd) == 0 {
            return FullscreenState::NotFullscreen;
        }

        // Filter out Windows shell desktop windows
        let mut class_buf = [0u16; 256];
        let len = GetClassNameW(hwnd, class_buf.as_mut_ptr(), 256);
        if len > 0 {
            let class_str = String::from_utf16_lossy(&class_buf[..len as usize]);
            if class_str == "Progman" || class_str == "WorkerW" || class_str == "Shell_TrayWnd" {
                return FullscreenState::NotFullscreen;
            }
        }

        let mut win_rect = RECT {
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
        };
        if GetWindowRect(hwnd, &mut win_rect) == 0 {
            return FullscreenState::Unknown;
        }

        let hmon = MonitorFromWindow(hwnd, MONITOR_DEFAULTTONEAREST);
        if hmon == 0 {
            return FullscreenState::Unknown;
        }

        let mut mon_info = MONITORINFO {
            cb_size: std::mem::size_of::<MONITORINFO>() as u32,
            rc_monitor: RECT {
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
            },
            rc_work: RECT {
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
            },
            dw_flags: 0,
        };

        if GetMonitorInfoW(hmon, &mut mon_info) == 0 {
            return FullscreenState::Unknown;
        }

        // If window bounds completely cover or exceed the monitor bounds, it's fullscreen
        let is_fullscreen = win_rect.left <= mon_info.rc_monitor.left
            && win_rect.top <= mon_info.rc_monitor.top
            && win_rect.right >= mon_info.rc_monitor.right
            && win_rect.bottom >= mon_info.rc_monitor.bottom;

        if is_fullscreen {
            FullscreenState::Fullscreen
        } else {
            FullscreenState::NotFullscreen
        }
    }
}

/// Fallback detection for non-Windows platforms.
#[cfg(not(target_os = "windows"))]
pub fn detect_fullscreen_state() -> FullscreenState {
    FullscreenState::NotFullscreen
}
