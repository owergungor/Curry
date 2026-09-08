use serde::{Deserialize, Serialize};

use crate::glow::model::{GlowAnimationStyle, GlowSettings, MonitorTarget};

/// Per-application custom glow profile.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplicationProfile {
    /// Unique identifier for this profile.
    #[serde(default = "default_profile_id")]
    pub id: String,

    /// Human-readable application display name (e.g. "Discord", "Spotify").
    #[serde(alias = "application_name", alias = "app_name", alias = "appName")]
    pub application_name: String,

    /// Process executable name (e.g. "Discord.exe", "Spotify.exe").
    #[serde(alias = "executable_name", alias = "exe_name", alias = "executable")]
    pub executable_name: String,

    /// Optional full path to the executable (e.g. "C:\Program Files\Discord\Discord.exe").
    #[serde(
        default,
        skip_serializing_if = "Option::is_none",
        alias = "executable_path",
        alias = "executablePath"
    )]
    pub executable_path: Option<String>,

    /// Whether this application profile is enabled. If false, glow is suppressed.
    #[serde(default = "default_true")]
    pub enabled: bool,

    /// Optional per-app glow color override (Hex string, e.g. "#5865F2"). If None, uses global color.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,

    /// Optional per-app visual animation style override. If None, uses global animation.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub animation: Option<GlowAnimationStyle>,

    /// Optional per-app peak opacity override (0.1 to 1.0). If None, uses global intensity.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub intensity: Option<f32>,

    /// Optional per-app duration in seconds (e.g. 2.0). If None, uses global duration.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub duration: Option<f64>,

    /// Optional per-app border thickness override (2 to 32 pixels). If None, uses global thickness.
    #[serde(
        default,
        skip_serializing_if = "Option::is_none",
        alias = "border_thickness",
        alias = "borderThickness"
    )]
    pub border_thickness: Option<u32>,

    /// Optional per-app corner rounding override (0 to 48 pixels). If None, uses global corner radius.
    #[serde(
        default,
        skip_serializing_if = "Option::is_none",
        alias = "corner_rounding",
        alias = "cornerRounding",
        alias = "corner_radius",
        alias = "cornerRadius"
    )]
    pub corner_rounding: Option<u32>,

    /// Optional per-app monitor target override. If None, uses global monitor target.
    #[serde(default, skip_serializing_if = "Option::is_none", alias = "monitor_target")]
    pub monitor_target: Option<MonitorTarget>,

    /// Optional per-app fullscreen suppression override.
    #[serde(
        default,
        skip_serializing_if = "Option::is_none",
        alias = "suppress_in_fullscreen"
    )]
    pub suppress_in_fullscreen: Option<bool>,
}

fn default_profile_id() -> String {
    let millis = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
    format!("prof-{}", millis)
}

fn default_true() -> bool {
    true
}

/// Parsed and sanitized metadata from an executable path or filename.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParsedExecutableInfo {
    pub display_name: String,
    pub executable_name: String,
    pub executable_path: Option<String>,
}

/// Parses an executable path or name, validates .exe extension, and derives a clean display name.
pub fn parse_executable_info(input: &str) -> Result<ParsedExecutableInfo, String> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Err("Executable path or name cannot be empty".to_string());
    }

    let path = std::path::Path::new(trimmed);
    let filename = path
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| "Invalid executable path: unable to extract filename".to_string())?
        .trim();

    if filename.is_empty() {
        return Err("Executable filename cannot be empty".to_string());
    }

    if !filename.to_lowercase().ends_with(".exe") {
        return Err("Selected file must be a Windows executable (.exe)".to_string());
    }

    let clean_name = filename
        .strip_suffix(".exe")
        .or_else(|| filename.strip_suffix(".EXE"))
        .unwrap_or(filename);

    let display_name = format_display_name(clean_name);

    let executable_path = if path.is_absolute() || trimmed.contains('\\') || trimmed.contains('/') {
        Some(trimmed.to_string())
    } else {
        None
    };

    Ok(ParsedExecutableInfo {
        display_name,
        executable_name: filename.to_string(),
        executable_path,
    })
}

/// Formats a raw executable base name into a cleaner user-facing display name.
pub fn format_display_name(raw_name: &str) -> String {
    let cleaned = raw_name.replace(['_', '-'], " ");
    let mut words = Vec::new();
    for word in cleaned.split_whitespace() {
        let mut chars = word.chars();
        if let Some(first) = chars.next() {
            let capitalized = format!("{}{}", first.to_uppercase(), chars.as_str());
            words.push(capitalized);
        }
    }
    if words.is_empty() {
        raw_name.to_string()
    } else {
        words.join(" ")
    }
}

/// Checks if an executable name is already used by another profile (case-insensitive).
pub fn is_duplicate_profile(
    profiles: &[ApplicationProfile],
    executable_name: &str,
    exclude_id: Option<&str>,
) -> bool {
    let target = executable_name.trim().to_lowercase();
    let target_stripped = target.strip_suffix(".exe").unwrap_or(&target);

    profiles.iter().any(|p| {
        if let Some(id) = exclude_id {
            if p.id == id {
                return false;
            }
        }
        let p_exe = p.executable_name.trim().to_lowercase();
        let p_exe_stripped = p_exe.strip_suffix(".exe").unwrap_or(&p_exe);
        p_exe == target || p_exe_stripped == target_stripped
    })
}

impl ApplicationProfile {
    /// Creates a new profile with sanitized executable and display names.
    pub fn new(app_name: impl Into<String>, exe_name: impl Into<String>) -> Self {
        let name = app_name.into();
        let exe = exe_name.into();
        let id_slug = name
            .to_lowercase()
            .replace(|c: char| !c.is_alphanumeric(), "-");
        let id = format!("{}-{}", id_slug, &default_profile_id()[5..]);

        Self {
            id,
            application_name: name,
            executable_name: exe,
            executable_path: None,
            enabled: true,
            color: None,
            animation: None,
            intensity: None,
            duration: None,
            border_thickness: None,
            corner_rounding: None,
            monitor_target: None,
            suppress_in_fullscreen: None,
        }
    }

    /// Sets an optional full executable path on this profile.
    pub fn with_executable_path(mut self, path: impl Into<String>) -> Self {
        self.executable_path = Some(path.into());
        self
    }

    /// Sets an optional custom border thickness for this profile.
    pub fn with_border_thickness(mut self, thickness: u32) -> Self {
        self.border_thickness = Some(thickness);
        self
    }

    /// Sets an optional custom corner rounding for this profile.
    pub fn with_corner_rounding(mut self, rounding: u32) -> Self {
        self.corner_rounding = Some(rounding);
        self
    }

    /// Checks if this profile matches an incoming notification's app name or executable name.
    /// Comparison is case-insensitive and trims trailing `.exe` for flexible matching.
    pub fn matches(&self, identifier: &str) -> bool {
        let trimmed_query = identifier.trim().to_lowercase();
        let stripped_query = trimmed_query
            .strip_suffix(".exe")
            .unwrap_or(&trimmed_query);

        let app_name_norm = self.application_name.trim().to_lowercase();
        let app_name_stripped = app_name_norm
            .strip_suffix(".exe")
            .unwrap_or(&app_name_norm);

        let exe_name_norm = self.executable_name.trim().to_lowercase();
        let exe_name_stripped = exe_name_norm
            .strip_suffix(".exe")
            .unwrap_or(&exe_name_norm);

        let path_matches = if let Some(ref path) = self.executable_path {
            let path_norm = path.trim().to_lowercase();
            path_norm == trimmed_query
        } else {
            false
        };

        trimmed_query == app_name_norm
            || stripped_query == app_name_stripped
            || trimmed_query == exe_name_norm
            || stripped_query == exe_name_stripped
            || path_matches
    }
}

/// Resolved parameters for triggering the glow effect after merging global settings and profile overrides.
#[derive(Debug, Clone, PartialEq)]
pub struct ResolvedGlowParams {
    pub should_glow: bool,
    pub color: String,
    pub animation_style: GlowAnimationStyle,
    pub intensity: f32,
    pub duration_ms: u64,
    pub thickness: u32,
    pub corner_radius: u32,
    pub monitor_target: MonitorTarget,
    pub suppress_in_fullscreen: bool,
    pub oled_mode: bool,
}

/// Merges global GlowSettings and an optional ApplicationProfile into final resolved glow parameters.
pub fn resolve_glow_params(
    profile: Option<&ApplicationProfile>,
    global: &GlowSettings,
    oled_mode: bool,
    global_suppress_fullscreen: bool,
) -> ResolvedGlowParams {
    // If a matching profile exists and is explicitly disabled, suppress glow entirely
    if let Some(prof) = profile {
        if !prof.enabled {
            return ResolvedGlowParams {
                should_glow: false,
                color: global.color.clone(),
                animation_style: global.animation_style.canonical(),
                intensity: 0.0,
                duration_ms: 0,
                thickness: prof.border_thickness.unwrap_or(global.thickness).clamp(2, 32),
                corner_radius: prof.corner_rounding.unwrap_or(global.corner_radius).clamp(0, 48),
                monitor_target: global.monitor_target.clone(),
                suppress_in_fullscreen: true,
                oled_mode,
            };
        }
    }

    let color = profile
        .and_then(|p| p.color.as_ref())
        .filter(|c| !c.trim().is_empty())
        .cloned()
        .unwrap_or_else(|| global.color.clone());

    let animation_style = profile
        .and_then(|p| p.animation)
        .unwrap_or(global.animation_style)
        .canonical();

    let mut intensity = profile
        .and_then(|p| p.intensity)
        .unwrap_or(global.intensity)
        .clamp(0.1, 1.0);

    let raw_duration_ms = if let Some(prof_dur) = profile.and_then(|p| p.duration) {
        if prof_dur <= 60.0 {
            (prof_dur * 1000.0).round() as u64
        } else {
            prof_dur.round() as u64
        }
    } else {
        global.duration_ms
    };

    let mut duration_ms = raw_duration_ms.clamp(500, 10_000);
    let raw_thickness = profile
        .and_then(|p| p.border_thickness)
        .unwrap_or(global.thickness);
    let mut thickness = raw_thickness.clamp(2, 32);

    let raw_corner_radius = profile
        .and_then(|p| p.corner_rounding)
        .unwrap_or(global.corner_radius);
    let corner_radius = raw_corner_radius.clamp(0, 48);

    // OLED Mode Optimizations: cap intensity to 0.6 max, reduce thickness, cap duration to 2000ms
    if oled_mode {
        intensity = intensity.min(0.60);
        thickness = (thickness / 2).max(2);
        duration_ms = duration_ms.min(2000);
    }

    let monitor_target = profile
        .and_then(|p| p.monitor_target.as_ref())
        .cloned()
        .unwrap_or_else(|| global.monitor_target.clone());

    let suppress_in_fullscreen = profile
        .and_then(|p| p.suppress_in_fullscreen)
        .unwrap_or(global_suppress_fullscreen);

    ResolvedGlowParams {
        should_glow: global.enabled,
        color,
        animation_style,
        intensity,
        duration_ms,
        thickness,
        corner_radius,
        monitor_target,
        suppress_in_fullscreen,
        oled_mode,
    }
}
