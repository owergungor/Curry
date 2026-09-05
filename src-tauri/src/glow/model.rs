use serde::{Deserialize, Serialize};

/// Animation style for the screen-edge glow effect.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum GlowAnimationStyle {
    Pulse,
    Sweep,
    Ambient,
    Comet,
    Ripple,
    #[serde(rename = "breathing")]
    Breathing,
    #[serde(rename = "solid")]
    Solid,
}

impl GlowAnimationStyle {
    /// Returns the active canonical style, migrating legacy styles (Breathing, Solid) to Ambient.
    pub fn canonical(&self) -> Self {
        match self {
            Self::Breathing | Self::Solid => Self::Ambient,
            other => *other,
        }
    }
}

impl Default for GlowAnimationStyle {
    fn default() -> Self {
        Self::Pulse
    }
}

impl<'de> Deserialize<'de> for GlowAnimationStyle {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        match s.to_lowercase().as_str() {
            "pulse" => Ok(Self::Pulse),
            "sweep" => Ok(Self::Sweep),
            "ambient" => Ok(Self::Ambient),
            "comet" => Ok(Self::Comet),
            "ripple" => Ok(Self::Ripple),
            "breathing" => Ok(Self::Breathing),
            "solid" => Ok(Self::Solid),
            _ => Ok(Self::Pulse),
        }
    }
}

/// Target monitor configuration for overlay placement.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum MonitorTarget {
    Primary,
    Active,
    All,
    #[serde(rename = "specific")]
    Specific(String),
}

impl Default for MonitorTarget {
    fn default() -> Self {
        Self::Primary
    }
}

impl<'de> Deserialize<'de> for MonitorTarget {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        match s.to_lowercase().as_str() {
            "active" => Ok(Self::Active),
            "all" => Ok(Self::All),
            "primary" => Ok(Self::Primary),
            val if val.starts_with("specific:") => {
                let id = val.trim_start_matches("specific:").to_string();
                Ok(Self::Specific(id))
            }
            _ => Ok(Self::Primary),
        }
    }
}

/// User-configurable settings for the screen-edge glow effect.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct GlowSettings {
    /// Whether screen-edge glowing is enabled when notifications arrive.
    pub enabled: bool,
    /// Total duration in milliseconds the glow effect should remain visible.
    pub duration_ms: u64,
    /// Peak opacity / intensity of the glow (0.0 to 1.0).
    pub intensity: f32,
    /// Edge border / spread thickness in pixels (2 to 32).
    pub thickness: u32,
    /// Screen corner rounding in pixels (0 to 48).
    pub corner_radius: u32,
    /// Visual animation mode (Pulse, Sweep, Ambient, Comet, Ripple).
    pub animation_style: GlowAnimationStyle,
    /// Target display on which the glow will render.
    pub monitor_target: MonitorTarget,
    /// Primary glow color (Hex string, e.g. "#6366f1").
    pub color: String,
}

impl Default for GlowSettings {
    fn default() -> Self {
        Self {
            enabled: true,
            duration_ms: 2500,
            intensity: 0.8,
            thickness: 8,
            corner_radius: 24,
            animation_style: GlowAnimationStyle::Pulse,
            monitor_target: MonitorTarget::Primary,
            color: "#6366f1".to_string(),
        }
    }
}

/// Event payload dispatched through Tauri to the overlay window to trigger an animation.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GlowPayload {
    pub color: String,
    pub duration_ms: u64,
    pub intensity: f32,
    pub thickness: u32,
    pub corner_radius: u32,
    pub animation_style: GlowAnimationStyle,
    #[serde(default)]
    pub oled_mode: bool,
}
