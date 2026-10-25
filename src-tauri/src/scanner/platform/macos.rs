use crate::scanner::model::DiscoveredApp;

/// Platform stub for macOS application discovery.
pub fn scan_installed_applications() -> Vec<DiscoveredApp> {
    // macOS applications can be discovered via /Applications and ~/Applications in Tier-1 macOS expansion.
    // For now, return empty list cleanly without panicking.
    Vec::new()
}
