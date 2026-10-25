#[cfg(target_os = "windows")]
pub mod windows;
#[cfg(target_os = "windows")]
pub use windows::scan_installed_applications;

#[cfg(target_os = "macos")]
pub mod macos;
#[cfg(target_os = "macos")]
pub use macos::scan_installed_applications;

#[cfg(all(not(target_os = "windows"), not(target_os = "macos")))]
pub mod linux;
#[cfg(all(not(target_os = "windows"), not(target_os = "macos")))]
pub use linux::scan_installed_applications;
