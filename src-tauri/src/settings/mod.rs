pub mod fullscreen;
pub mod model;
pub mod profiles;
pub mod sound;
pub mod startup;
pub mod storage;

pub use fullscreen::{
    detect_fullscreen_state, should_suppress_for_fullscreen, FullscreenBehavior, FullscreenState,
};
pub use model::{AppSettings, AppTheme};
pub use profiles::{
    format_display_name, is_duplicate_profile, parse_executable_info, resolve_glow_params,
    ApplicationProfile, ParsedExecutableInfo, ResolvedGlowParams,
};
pub use sound::SoundManager;
pub use startup::StartupManager;
pub use storage::SettingsStorage;
