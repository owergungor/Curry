fn main() {
    let windows_attrs = tauri_build::WindowsAttributes::new().static_vc_runtime(true);
    let attrs = tauri_build::Attributes::new().windows_attributes(windows_attrs);
    tauri_build::try_build(attrs).expect("failed to run build script");
}
