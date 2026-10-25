use serde::{Deserialize, Serialize};

/// Frequency for automated application scans.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "lowercase")]
pub enum AutoScanFrequency {
    #[default]
    Startup,
    Daily,
    Weekly,
}

/// Lifecycle state for application scan.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "lowercase")]
pub enum ScanLifecycleState {
    #[default]
    Idle,
    Scanning,
    Completed,
    Failed,
}

/// Discovered application metadata.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscoveredApp {
    pub name: String,
    pub executable_name: String,
    pub executable_path: Option<String>,
    pub icon_path: Option<String>,
    pub source: String,
    pub is_new: bool,
}

/// Aggregated result of an application scan.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ScanResult {
    pub total_found: usize,
    pub new_added: usize,
    pub already_existing: usize,
    pub discovered_apps: Vec<DiscoveredApp>,
    pub timestamp: u64,
}

/// Current status and progress of the application scanner.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ScanStatus {
    pub state: ScanLifecycleState,
    pub progress_message: Option<String>,
    pub last_result: Option<ScanResult>,
    pub error: Option<String>,
}
