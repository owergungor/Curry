use serde::{Deserialize, Serialize};

use crate::glow::model::GlowSettings;

/// User-selected visual theme for Curry inspired by 21st.dev Community Themes.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
pub enum AppTheme {
    #[serde(rename = "catppuccin")]
    Catppuccin,
    #[serde(rename = "vintage-paper")]
    VintagePaper,
    #[serde(rename = "amethyst-haze")]
    AmethystHaze,
    #[serde(rename = "sage-mist")]
    SageMist,
    #[serde(rename = "bubblegum")]
    Bubblegum,
    #[serde(rename = "perpetuity")]
    Perpetuity,
    #[serde(rename = "amberstate")]
    Amberstate,
}

impl Default for AppTheme {
    fn default() -> Self {
        Self::Perpetuity
    }
}

impl<'de> Deserialize<'de> for AppTheme {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        match s.to_lowercase().as_str() {
            "catppuccin" => Ok(Self::Catppuccin),
            "vintage-paper" => Ok(Self::VintagePaper),
            "amethyst-haze" => Ok(Self::AmethystHaze),
            "sage-mist" => Ok(Self::SageMist),
            "bubblegum" => Ok(Self::Bubblegum),
            "perpetuity" => Ok(Self::Perpetuity),
            "amberstate" | "amber-slate" | "amberslate" => Ok(Self::Amberstate),
            _ => Ok(Self::Perpetuity),
        }
    }
}

use crate::settings::fullscreen::FullscreenBehavior;
use crate::settings::profiles::ApplicationProfile;

/// Centralized user-configurable application settings for Curry.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct AppSettings {
    /// Master application toggle (synchronizes with Tray and NotificationEngine).
    pub enabled: bool,
    /// Whether Curry should automatically launch on Windows login.
    pub startup_enabled: bool,
    /// Whether the notification feed is displayed in the UI.
    pub show_notifications: bool,
    /// Maximum number of notifications kept in bounded local storage (10 to 500).
    pub history_limit: usize,
    /// Whether native audio alerts should play when notifications arrive.
    pub sound_enabled: bool,
    /// Detailed configuration for the screen-edge glow overlay.
    pub glow: GlowSettings,
    /// Selected visual theme (defaults to Perpetuity, resilient to invalid values).
    #[serde(default)]
    pub theme: AppTheme,
    /// Per-application custom glow configurations.
    #[serde(default)]
    pub applications: Vec<ApplicationProfile>,
    /// Whether OLED power and burn-in prevention optimizations are active.
    #[serde(default, alias = "oledMode")]
    pub oled_mode: bool,
    /// Fullscreen / gaming overlay suppression policy.
    #[serde(default, alias = "fullscreenBehavior")]
    pub fullscreen_behavior: FullscreenBehavior,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            enabled: true,
            startup_enabled: false,
            show_notifications: true,
            history_limit: 100,
            sound_enabled: false,
            glow: GlowSettings::default(),
            theme: AppTheme::default(),
            applications: Vec::new(),
            oled_mode: false,
            fullscreen_behavior: FullscreenBehavior::default(),
        }
    }
}

impl AppSettings {
    /// Sanitizes and clamps all numeric settings to safe and expected boundaries.
    pub fn sanitized(mut self) -> Self {
        self.history_limit = self.history_limit.clamp(10, 500);
        self.glow.duration_ms = self.glow.duration_ms.clamp(500, 10_000);
        self.glow.intensity = self.glow.intensity.clamp(0.1, 1.0);
        self.glow.thickness = self.glow.thickness.clamp(2, 32);
        self.glow.corner_radius = self.glow.corner_radius.clamp(0, 48);

        if self.oled_mode {
            self.glow.intensity = self.glow.intensity.min(0.60);
            self.glow.thickness = (self.glow.thickness / 2).max(2);
            self.glow.duration_ms = self.glow.duration_ms.min(2000);
        }

        if self.glow.color.trim().is_empty() {
            self.glow.color = "#6366f1".to_string();
        }

        for prof in &mut self.applications {
            if let Some(ref mut intensity) = prof.intensity {
                *intensity = intensity.clamp(0.1, 1.0);
                if self.oled_mode {
                    *intensity = intensity.min(0.60);
                }
            }
            if let Some(ref mut dur) = prof.duration {
                if *dur <= 60.0 {
                    *dur = dur.clamp(0.5, 10.0);
                    if self.oled_mode {
                        *dur = dur.min(2.0);
                    }
                } else {
                    *dur = dur.clamp(500.0, 10000.0);
                    if self.oled_mode {
                        *dur = dur.min(2000.0);
                    }
                }
            }
        }

        self
    }
}
