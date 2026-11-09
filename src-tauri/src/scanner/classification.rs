/// Pure, cross-platform classification logic for application scanning and profile sanitization.
/// Identifies and filters out Windows internal AppX/UWP infrastructure components,
/// unresolved resource identifiers, background host/broker processes, system services,
/// frameworks, runtimes, and non-user-facing daemons.

/// Determines if a string is an unresolved Windows resource identifier
/// such as `@{Microsoft.AAD.BrokerPlugin...}` or `ms-resource:...`.
pub fn is_resource_based_name(name: &str) -> bool {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return false;
    }
    trimmed.starts_with("@{")
        || trimmed.starts_with("ms-resource:")
        || trimmed.contains("?ms-resource:")
        || (trimmed.starts_with('@') && (trimmed.contains('{') || trimmed.contains("ms-resource")))
}

/// Checks if a file path is located in internal Windows system folders,
/// such as `C:\Windows\SystemApps`, `System32`, `SysWOW64`, or installer package caches.
pub fn is_system_app_path(path: &str) -> bool {
    let lower = path.to_lowercase();
    lower.contains("\\windows\\systemapps\\")
        || lower.contains("/windows/systemapps/")
        || lower.contains("\\systemapps\\")
        || lower.contains("/systemapps/")
        || lower.contains("\\windows\\system32\\")
        || lower.contains("/windows/system32/")
        || lower.contains("\\windows\\syswow64\\")
        || lower.contains("/windows/syswow64/")
        || lower.contains("\\package cache\\")
        || lower.contains("/package cache/")
}

/// Checks if an executable is a known background host, service daemon, broker, or CLI utility.
pub fn is_blacklisted_executable(name: &str) -> bool {
    let lower = name.trim().to_lowercase();
    if lower.is_empty() {
        return false;
    }

    // Exact executable names
    const EXACT_BLACKLIST: &[&str] = &[
        "runtimebroker.exe",
        "accountscontrolhost.exe",
        "appresolver.exe",
        "appresolverux.exe",
        "backgroundtaskhost.exe",
        "searchhost.exe",
        "smartscreen.exe",
        "wslhost.exe",
        "systemsettingsadminflows.exe",
        "rundll32.exe",
        "regsvr32.exe",
        "conhost.exe",
        "gamebarft.exe",
        "textinputhost.exe",
        "fancyzonescli.exe",
        "cmd.exe",
        "powershell.exe",
        "wsl.exe",
        "nvcontainer.exe",
        "nvfvsdksvc_x64.exe",
        "nvfvsdksvc.exe",
        "pushnotificationslongrunningtask.exe",
        "aicontext.exe",
        "appactions.exe",
        "tcui.exe",
        "tcui-app.exe",
        "xbox.tcui.exe",
        "xboxidp.exe",
    ];

    if EXACT_BLACKLIST.contains(&lower.as_str()) {
        return true;
    }

    // Substring patterns indicating installer/updater/service daemons
    const SUBSTRING_PATTERNS: &[&str] = &[
        "unins",
        "setup",
        "installer",
        "updater",
        "update",
        "crashpad",
        "crash_reporter",
        "helper",
        "shellexperiencehost.exe",
        "startmenuexperiencehost.exe",
        "lockapp.exe",
    ];

    SUBSTRING_PATTERNS.iter().any(|&pat| lower.contains(pat))
}

/// Checks if an application display name indicates a non-user-facing utility,
/// system framework, SDK, runtime, driver, or update.
pub fn is_blacklisted_app_name(name: &str) -> bool {
    let lower = name.trim().to_lowercase();
    if lower.is_empty() {
        return false;
    }

    const BLACKLISTED_TOKENS: &[&str] = &[
        "redistributable",
        "security update",
        "update for windows",
        "hotfix",
        "service pack",
        "microsoft visual c++",
        "windows sdk",
        ".net framework",
        "windows desktop runtime",
        "desktop runtime",
        "çalışma zamanı",
        "webview2",
        "brokerplugin",
        "appresolverux",
        "windowsappruntime",
        "winappruntime",
        "accountscontrolhost",
        "shellexperiencehost",
        "startmenuexperiencehost",
        "viewmanagementhost",
        "lockapp",
        "bioenrollment",
        "capturepicker",
        "creddialoghost",
        "secureassessmentbrowser",
        "parentalcontrols",
        "pinningconfirmationdialog",
        "printdialog",
        "xboxgamecallableui",
        "xboxspeechtotextoverlay",
        "frameview sdk",
        "nvidia container",
        "undockeddevkit",
        "gaming services",
        "xbox tcui",
        "xbox identity provider",
        "languageexperiencepack",
        "directxruntime",
        "store purchase app",
        "storepurchaseapp",
        "sparseapp",
        "sechealthui",
        "mdodrmcpfilterpackage",
    ];

    BLACKLISTED_TOKENS.iter().any(|&tok| lower.contains(tok))
}

/// Checks if an AppX/UWP package identity represents an internal Windows system,
/// framework, broker, or runtime package.
pub fn is_system_store_package(pkg_id: &str) -> bool {
    let lower = pkg_id.trim().to_lowercase();
    if lower.is_empty() {
        return false;
    }

    const SYSTEM_PREFIXES_AND_TOKENS: &[&str] = &[
        "microsoft.aad.brokerplugin",
        "brokerplugin",
        "appresolverux",
        "windowsappruntime",
        "winappruntime",
        "accountscontrolhost",
        "shellexperiencehost",
        "startmenuexperiencehost",
        "viewmanagementhost",
        "lockapp",
        "creddialoghost",
        "bioenrollment",
        "capturepicker",
        "asynctextservice",
        "assignedaccesslockapp",
        "secureassessmentbrowser",
        "parentalcontrols",
        "pinningconfirmationdialog",
        "printdialog",
        "xboxgamecallableui",
        "xboxspeechtotextoverlay",
        "contentdeliverymanager",
        "windows.immersivecontrolpanel",
        "windows.contactsupport",
        "windows.printqueue",
        "windows.cbspreview",
        "windows.warmwelcome",
        "microsoft.ecapp",
        "microsoft.win32webviewhost",
        "microsoft.windowsappruntime",
        "microsoftcorporationii.winappruntime",
        "microsoft.winappruntime",
        "microsoft.net.native",
        "microsoft.ui.xaml",
        "microsoft.vclibs",
        "microsoft.directx",
        "microsoft.services.store",
        "microsoft.advertising",
        "microsoft.desktopappinstaller",
        "microsoft.gamingservices",
        "microsoft.languageexperiencepack",
        "microsoft.powertoys.sparseapp",
        "microsoft.sechealthui",
        "microsoft.storepurchaseapp",
        "microsoft.winget",
        "microsoft.xbox.tcui",
        "microsoft.xboxgamecallableui",
        "microsoft.xboxgamingoverlay",
        "microsoft.xboxidentityprovider",
        "microsoftwindows.60909653",
        "microsoftwindows.61869720",
        "microsoftwindows.61869721",
        "microsoftwindows.61869722",
        "microsoftwindows.61869836",
        "microsoftwindows.client.",
        "microsoftwindows.undockeddevkit",
        "microsoftwindows.windowssandbox",
        "windows.cbspreview",
        "windows.printdialog",
        "mdodrmcpfilterpackage",
        "1527c705-",
        "c5e2524a-",
        "f46d4000-",
        "e2a4f912-",
    ];

    SYSTEM_PREFIXES_AND_TOKENS
        .iter()
        .any(|&prefix| lower.contains(prefix))
}

/// Determines if an existing or discovered application profile represents an invalid
/// Windows internal system component, background broker/service, framework/runtime,
/// or non-user-facing utility.
///
/// Returns `true` if the entry should be excluded from scanner discovery and purged
/// from existing saved settings profiles.
pub fn is_invalid_system_profile(name: &str, exe_name: &str, exe_path: Option<&str>) -> bool {
    let name_trim = name.trim();
    let exe_trim = exe_name.trim();

    // 1. Unresolved resource identifiers (@{...}, ms-resource:...)
    if is_resource_based_name(name_trim) || is_resource_based_name(exe_trim) {
        return true;
    }

    // 2. System path inspection: Windows SystemApps, System32, SysWOW64, Package Cache
    if let Some(path) = exe_path {
        if is_system_app_path(path) {
            return true;
        }
    }

    let n = name_trim.to_lowercase();
    let e = exe_trim.to_lowercase();
    let p = exe_path.unwrap_or("").to_lowercase();

    // 3. Blacklisted application display name
    if is_blacklisted_app_name(&n) {
        return true;
    }

    // 4. Blacklisted executable name
    if is_blacklisted_executable(&e) {
        return true;
    }

    // 5. System package identifier tokens appearing in name or executable
    if is_system_store_package(&n) || is_system_store_package(&e) {
        return true;
    }

    // 6. Background services, container daemons, and SDK service processes
    if e == "nvcontainer.exe"
        || e.starts_with("nvfvsdksvc")
        || e.ends_with("svc.exe")
        || e.ends_with("service.exe")
    {
        if n.contains("sdk")
            || n.contains("container")
            || n.contains("service")
            || n.contains("daemon")
            || n.contains("frameview")
        {
            return true;
        }
    }

    // Explicit concrete regression checks from user prompt
    if n.contains("frameview sdk") || n == "nvidia container" {
        return true;
    }

    // 7. Dynamic dependency / internal background tasks
    if e.contains("dynamicdependency")
        || e.contains("pushnotificationslongrunningtask")
        || p.contains("dynamicdependency")
    {
        return true;
    }

    false
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_resource_based_names() {
        assert!(is_resource_based_name("@{Microsoft.AAD.BrokerPlugin_1000.22621.1.0_neutral_neutral_cw5n1h2txyewy?ms-resource://...}"));
        assert!(is_resource_based_name("ms-resource:AppDisplayName"));
        assert!(is_resource_based_name("ms-resource:///resources/AppName"));
        assert!(is_resource_based_name("@{AppResolverUX_1.0.0.0}"));
        assert!(is_resource_based_name("@something?ms-resource:Title"));

        // Legitimate app names must pass
        assert!(!is_resource_based_name("Discord"));
        assert!(!is_resource_based_name("Spotify"));
        assert!(!is_resource_based_name("Steam"));
        assert!(!is_resource_based_name("NVIDIA Control Panel"));
        assert!(!is_resource_based_name("Xbox"));
    }

    #[test]
    fn test_system_app_path() {
        assert!(is_system_app_path(
            r"C:\Windows\SystemApps\Microsoft.Windows.AppResolverUX_cw5n1h2txyewy\AppResolverUX.exe"
        ));
        assert!(is_system_app_path(
            r"C:\WINDOWS\SystemApps\SxS\MicrosoftWindows.60909653.Filons_cw5n1h2txyewy\Filons.exe"
        ));
        assert!(is_system_app_path(r"C:\Windows\System32\runtimebroker.exe"));
        assert!(is_system_app_path(
            r"C:\Users\user\AppData\Local\Package Cache\{guid}\setup.exe"
        ));

        // User applications must pass
        assert!(!is_system_app_path(
            r"C:\Program Files\WindowsApps\NVIDIACorp.NVIDIAControlPanel_8.1.969.0_x64__56jybvy8sckqj\nvcplui.exe"
        ));
        assert!(!is_system_app_path(r"C:\Program Files\Discord\Discord.exe"));
        assert!(!is_system_app_path(
            r"C:\Program Files (x86)\Steam\steam.exe"
        ));
    }

    #[test]
    fn test_screenshot_regression_exclusions() {
        // AppResolverUX
        assert!(is_invalid_system_profile(
            "AppResolverUX",
            "AppResolverUX.exe",
            Some(
                r"C:\Windows\SystemApps\Microsoft.Windows.AppResolverUX_cw5n1h2txyewy\AppResolverUX.exe"
            )
        ));

        // Microsoft.AAD.BrokerPlugin
        assert!(is_invalid_system_profile(
            "Microsoft.AAD.BrokerPlugin",
            "BrokerPlugin.exe",
            Some(
                r"C:\Windows\SystemApps\Microsoft.AAD.BrokerPlugin_cw5n1h2txyewy\BrokerPlugin.exe"
            )
        ));

        // AccountsControlHost
        assert!(is_invalid_system_profile(
            "AccountsControlHost",
            "AccountsControlHost.exe",
            Some(
                r"C:\Windows\SystemApps\Microsoft.AccountsControl_cw5n1h2txyewy\AccountsControlHost.exe"
            )
        ));

        // PinningConfirmationDialog
        assert!(is_invalid_system_profile(
            "PinningConfirmationDialog",
            "PinningConfirmationDialog.exe",
            Some(
                r"C:\Windows\SystemApps\Microsoft.Windows.PinningConfirmationDialog_cw5n1h2txyewy\PinningConfirmationDialog.exe"
            )
        ));

        // Microsoft.AsyncTextService
        assert!(is_invalid_system_profile(
            "Microsoft.AsyncTextService",
            "Microsoft.AsyncTextService.exe",
            Some(
                r"C:\Windows\SystemApps\Microsoft.AsyncTextService_8wekyb3d8bbwe\Microsoft.AsyncTextService.exe"
            )
        ));

        // NVIDIA Container
        assert!(is_invalid_system_profile(
            "NVIDIA Container",
            "nvcontainer.exe",
            Some(r"C:\Program Files\NVIDIA Corporation\NvContainer\nvcontainer.exe")
        ));

        // NVIDIA FrameView SDK
        assert!(is_invalid_system_profile(
            "NVIDIA FrameView SDK 1.9.12728.38614306",
            "nvfvsdksvc_x64.exe",
            Some(r"C:\Program Files\NVIDIA Corporation\FrameViewSDK\nvfvsdksvc_x64.exe")
        ));

        // Resource identifier profile
        assert!(is_invalid_system_profile(
            "@{MicrosoftWindows.60909653.Filons?ms-resource://...}",
            "Filons.exe",
            None
        ));
    }

    #[test]
    fn test_legitimate_apps_preserved() {
        // NVIDIA Control Panel (Store app)
        assert!(!is_invalid_system_profile(
            "NVIDIA Control Panel",
            "nvcplui.exe",
            Some(
                r"C:\Program Files\WindowsApps\NVIDIACorp.NVIDIAControlPanel_8.1.969.0_x64__56jybvy8sckqj\nvcplui.exe"
            )
        ));

        // Discord
        assert!(!is_invalid_system_profile(
            "Discord",
            "Discord.exe",
            Some(r"C:\Users\user\AppData\Local\Discord\Discord.exe")
        ));

        // Spotify
        assert!(!is_invalid_system_profile(
            "Spotify",
            "Spotify.exe",
            Some(r"C:\Users\user\AppData\Roaming\Spotify\Spotify.exe")
        ));

        // Steam
        assert!(!is_invalid_system_profile(
            "Steam",
            "steam.exe",
            Some(r"C:\Program Files (x86)\Steam\steam.exe")
        ));

        // Xbox App
        assert!(!is_invalid_system_profile(
            "Xbox",
            "XboxPcAppCE.exe",
            Some(
                r"C:\Program Files\WindowsApps\Microsoft.GamingApp_2611.1001.10.0_x64__8wekyb3d8bbwe\XboxPcAppCE.exe"
            )
        ));

        // Photos
        assert!(!is_invalid_system_profile(
            "Photos",
            "Photos.exe",
            Some(
                r"C:\Program Files\WindowsApps\Microsoft.Windows.Photos_2026.11090.22001.0_x64__8wekyb3d8bbwe\Photos.exe"
            )
        ));

        // Notepad
        assert!(!is_invalid_system_profile(
            "Notepad",
            "Notepad.exe",
            Some(
                r"C:\Program Files\WindowsApps\Microsoft.WindowsNotepad_11.2607.14.0_x64__8wekyb3d8bbwe\Notepad\Notepad.exe"
            )
        ));

        // Curry itself
        assert!(!is_invalid_system_profile(
            "Curry",
            "Curry.exe",
            Some(r"C:\Program Files\Curry\Curry.exe")
        ));
    }
}
