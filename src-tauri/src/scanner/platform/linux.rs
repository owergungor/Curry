use crate::scanner::model::DiscoveredApp;

/// Platform stub for Linux application discovery.
pub fn scan_installed_applications() -> Vec<DiscoveredApp> {
    // Linux applications can be discovered via /usr/share/applications and ~/.local/share/applications (.desktop files).
    // For Tier-2 Linux scaffolding, return empty list cleanly without panicking.
    Vec::new()
}
