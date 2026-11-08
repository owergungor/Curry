use std::collections::HashMap;
use std::sync::Mutex;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct AppIconInfo {
    pub icon: Option<String>,
    pub color: String,
}

static ICON_CACHE: Mutex<Option<HashMap<String, AppIconInfo>>> = Mutex::new(None);

/// Fallback color when icon extraction fails or colors are neutral/gray.
pub const DEFAULT_FALLBACK_GLOW_COLOR: &str = "#FF5C00"; // Amber Neon signature

/// Retrieves or extracts an application icon and its dominant vivid glow color.
pub fn get_app_icon_and_color(path_or_exe: &str, app_name: &str) -> AppIconInfo {
    let key = if !path_or_exe.trim().is_empty() {
        path_or_exe.trim().to_lowercase()
    } else {
        app_name.trim().to_lowercase()
    };

    // Check memory cache
    if let Ok(guard) = ICON_CACHE.lock() {
        if let Some(ref map) = *guard {
            if let Some(cached) = map.get(&key) {
                return cached.clone();
            }
        }
    }

    let result = extract_icon_and_color_internal(path_or_exe, app_name);

    // Save to cache
    if let Ok(mut guard) = ICON_CACHE.lock() {
        let map = guard.get_or_insert_with(HashMap::new);
        map.insert(key.clone(), result.clone());
        if !app_name.trim().is_empty() {
            map.insert(app_name.trim().to_lowercase(), result.clone());
        }
    }

    result
}

fn extract_icon_and_color_internal(path_or_exe: &str, app_name: &str) -> AppIconInfo {
    let trimmed = path_or_exe.trim();

    // 1. If path points to an existing PNG/JPG file directly (e.g. Store / Xbox logos)
    if !trimmed.is_empty() && (trimmed.ends_with(".png") || trimmed.ends_with(".jpg") || trimmed.ends_with(".jpeg")) {
        let p = std::path::Path::new(trimmed);
        if p.is_file() {
            if let Ok(bytes) = std::fs::read(p) {
                let mime = if trimmed.ends_with(".png") { "image/png" } else { "image/jpeg" };
                let b64 = base64_encode(&bytes);
                let data_url = format!("data:{};base64,{}", mime, b64);
                let color = derive_color_from_name_or_fallback(app_name);
                return AppIconInfo {
                    icon: Some(data_url),
                    color,
                };
            }
        }
    }

    #[cfg(target_os = "windows")]
    {
        if let Some(info) = extract_windows_icon_and_color(trimmed, app_name) {
            return info;
        }
    }

    AppIconInfo {
        icon: None,
        color: derive_color_from_name_or_fallback(app_name),
    }
}

#[cfg(target_os = "windows")]
fn extract_windows_icon_and_color(path: &str, app_name: &str) -> Option<AppIconInfo> {
    use windows::core::PCWSTR;
    use windows::Win32::Graphics::Gdi::{
        CreateCompatibleDC, DeleteDC, DeleteObject, GetDIBits, GetObjectW, BITMAP, BITMAPINFO,
        BITMAPINFOHEADER, BI_RGB, DIB_RGB_COLORS, HGDIOBJ,
    };
    use windows::Win32::Storage::FileSystem::FILE_FLAGS_AND_ATTRIBUTES;
    use windows::Win32::UI::Shell::{SHGetFileInfoW, SHFILEINFOW, SHGFI_ICON, SHGFI_LARGEICON};
    use windows::Win32::UI::WindowsAndMessaging::{DestroyIcon, GetIconInfo, ICONINFO};

    if path.is_empty() {
        return None;
    }

    // Prepare wide string for path
    let wide_path: Vec<u16> = path.encode_utf16().chain(std::iter::once(0)).collect();

    unsafe {
        let mut shfi = SHFILEINFOW::default();
        let res = SHGetFileInfoW(
            PCWSTR(wide_path.as_ptr()),
            FILE_FLAGS_AND_ATTRIBUTES(0),
            Some(&mut shfi),
            std::mem::size_of::<SHFILEINFOW>() as u32,
            SHGFI_ICON | SHGFI_LARGEICON,
        );

        if res == 0 || shfi.hIcon.is_invalid() {
            return None;
        }

        let hicon = shfi.hIcon;
        let mut icon_info = ICONINFO::default();
        if GetIconInfo(hicon, &mut icon_info).is_err() {
            let _ = DestroyIcon(hicon);
            return None;
        }

        let mut bmp = BITMAP::default();
        if GetObjectW(
            HGDIOBJ(icon_info.hbmColor.0),
            std::mem::size_of::<BITMAP>() as i32,
            Some(&mut bmp as *mut _ as *mut _),
        ) == 0
        {
            let _ = DeleteObject(HGDIOBJ(icon_info.hbmColor.0));
            let _ = DeleteObject(HGDIOBJ(icon_info.hbmMask.0));
            let _ = DestroyIcon(hicon);
            return None;
        }

        let width = bmp.bmWidth;
        let height = bmp.bmHeight;
        if width <= 0 || height <= 0 || width > 256 || height > 256 {
            let _ = DeleteObject(HGDIOBJ(icon_info.hbmColor.0));
            let _ = DeleteObject(HGDIOBJ(icon_info.hbmMask.0));
            let _ = DestroyIcon(hicon);
            return None;
        }

        let mut bi = BITMAPINFO {
            bmiHeader: BITMAPINFOHEADER {
                biSize: std::mem::size_of::<BITMAPINFOHEADER>() as u32,
                biWidth: width,
                biHeight: -height, // negative for top-down bitmap
                biPlanes: 1,
                biBitCount: 32,
                biCompression: BI_RGB.0,
                ..Default::default()
            },
            ..Default::default()
        };

        let hdc = CreateCompatibleDC(None);
        let mut raw_pixels = vec![0u8; (width * height * 4) as usize];

        let dib_res = GetDIBits(
            hdc,
            icon_info.hbmColor,
            0,
            height as u32,
            Some(raw_pixels.as_mut_ptr() as *mut _),
            &mut bi,
            DIB_RGB_COLORS,
        );

        let _ = DeleteDC(hdc);
        let _ = DeleteObject(HGDIOBJ(icon_info.hbmColor.0));
        let _ = DeleteObject(HGDIOBJ(icon_info.hbmMask.0));
        let _ = DestroyIcon(hicon);

        if dib_res == 0 {
            return None;
        }

        // Extract dominant vivid glow color from pixels
        let dominant_color = extract_dominant_glow_color(&raw_pixels, width as usize, height as usize)
            .unwrap_or_else(|| derive_color_from_name_or_fallback(app_name));

        // Generate 32-bit RGBA BMP file in memory
        let bmp_bytes = build_32bit_bmp(width as u32, height as u32, &raw_pixels);
        let b64 = base64_encode(&bmp_bytes);
        let data_url = format!("data:image/bmp;base64,{}", b64);

        Some(AppIconInfo {
            icon: Some(data_url),
            color: dominant_color,
        })
    }
}

/// Builds a valid 32-bit BMP file header and image data.
fn build_32bit_bmp(width: u32, height: u32, bgra_pixels: &[u8]) -> Vec<u8> {
    let file_header_size = 14u32;
    let info_header_size = 40u32;
    let image_size = width * height * 4;
    let total_size = file_header_size + info_header_size + image_size;

    let mut buf = Vec::with_capacity(total_size as usize);

    // BITMAPFILEHEADER (14 bytes)
    buf.extend_from_slice(b"BM"); // bfType
    buf.extend_from_slice(&total_size.to_le_bytes()); // bfSize
    buf.extend_from_slice(&0u16.to_le_bytes()); // bfReserved1
    buf.extend_from_slice(&0u16.to_le_bytes()); // bfReserved2
    buf.extend_from_slice(&(file_header_size + info_header_size).to_le_bytes()); // bfOffBits

    // BITMAPINFOHEADER (40 bytes)
    buf.extend_from_slice(&info_header_size.to_le_bytes()); // biSize
    buf.extend_from_slice(&(width as i32).to_le_bytes()); // biWidth
    buf.extend_from_slice(&(-(height as i32)).to_le_bytes()); // biHeight (top-down)
    buf.extend_from_slice(&1u16.to_le_bytes()); // biPlanes
    buf.extend_from_slice(&32u16.to_le_bytes()); // biBitCount
    buf.extend_from_slice(&0u32.to_le_bytes()); // biCompression (BI_RGB)
    buf.extend_from_slice(&image_size.to_le_bytes()); // biSizeImage
    buf.extend_from_slice(&2835u32.to_le_bytes()); // biXPelsPerMeter (72 DPI)
    buf.extend_from_slice(&2835u32.to_le_bytes()); // biYPelsPerMeter
    buf.extend_from_slice(&0u32.to_le_bytes()); // biClrUsed
    buf.extend_from_slice(&0u32.to_le_bytes()); // biClrImportant

    // Pixel data (BGRA)
    buf.extend_from_slice(bgra_pixels);

    buf
}

/// Simple standard base64 encoding without external crates.
fn base64_encode(data: &[u8]) -> String {
    const TABLE: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = String::with_capacity((data.len() + 2) / 3 * 4);

    for chunk in data.chunks(3) {
        let b0 = chunk[0];
        let b1 = if chunk.len() > 1 { chunk[1] } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] } else { 0 };

        let n = ((b0 as u32) << 16) | ((b1 as u32) << 8) | (b2 as u32);

        out.push(TABLE[((n >> 18) & 63) as usize] as char);
        out.push(TABLE[((n >> 12) & 63) as usize] as char);

        if chunk.len() > 1 {
            out.push(TABLE[((n >> 6) & 63) as usize] as char);
        } else {
            out.push('=');
        }

        if chunk.len() > 2 {
            out.push(TABLE[(n & 63) as usize] as char);
        } else {
            out.push('=');
        }
    }

    out
}

/// Analyzes an RGBA pixel buffer and computes a vivid, vibrant dominant glow color.
fn extract_dominant_glow_color(bgra: &[u8], width: usize, height: usize) -> Option<String> {
    if bgra.len() < width * height * 4 {
        return None;
    }

    // 24 hue bins (15 degrees each)
    let mut bin_weights = [0.0f32; 24];
    let mut bin_rgbs = [(0.0f32, 0.0f32, 0.0f32); 24];
    let mut valid_pixels = 0usize;

    for chunk in bgra.chunks_exact(4) {
        let b = chunk[0] as f32 / 255.0;
        let g = chunk[1] as f32 / 255.0;
        let r = chunk[2] as f32 / 255.0;
        let a = chunk[3] as f32 / 255.0;

        // Skip transparent or semi-transparent background pixels
        if a < 0.5 {
            continue;
        }

        valid_pixels += 1;

        let max = r.max(g).max(b);
        let min = r.min(g).min(b);
        let delta = max - min;
        let lightness = (max + min) / 2.0;

        // Ignore extreme black, pure white, or completely desaturated grays
        if lightness < 0.12 || lightness > 0.92 {
            continue;
        }

        let saturation = if delta == 0.0 {
            0.0
        } else if lightness < 0.5 {
            delta / (max + min)
        } else {
            delta / (2.0 - max - min)
        };

        if saturation < 0.18 {
            continue;
        }

        // Calculate hue in degrees (0..360)
        let hue_deg = if delta == 0.0 {
            0.0
        } else if (max - r).abs() < f32::EPSILON {
            let mut h = 60.0 * ((g - b) / delta);
            if h < 0.0 {
                h += 360.0;
            }
            h
        } else if (max - g).abs() < f32::EPSILON {
            60.0 * ((b - r) / delta + 2.0)
        } else {
            60.0 * ((r - g) / delta + 4.0)
        };

        let bin_idx = ((hue_deg / 15.0).floor() as usize).min(23);
        // Weight by saturation and distance from gray/lightness center
        let weight = saturation * saturation * (1.0 - (lightness - 0.5).abs());

        bin_weights[bin_idx] += weight;
        bin_rgbs[bin_idx].0 += r * weight;
        bin_rgbs[bin_idx].1 += g * weight;
        bin_rgbs[bin_idx].2 += b * weight;
    }

    if valid_pixels == 0 {
        return None;
    }

    // Find bin with highest weight
    let mut best_bin = 0;
    let mut best_weight = 0.0f32;
    for (i, &w) in bin_weights.iter().enumerate() {
        if w > best_weight {
            best_weight = w;
            best_bin = i;
        }
    }

    if best_weight > 0.0 {
        let (r_sum, g_sum, b_sum) = bin_rgbs[best_bin];
        let r = r_sum / best_weight;
        let g = g_sum / best_weight;
        let b = b_sum / best_weight;

        // Boost saturation & tune brightness for glowing ambient effects
        let boosted = boost_vibrancy_for_glow(r, g, b);
        Some(boosted)
    } else {
        None
    }
}

/// Boosts the saturation and luminance of an RGB color so it glows intensely against dark displays.
fn boost_vibrancy_for_glow(r: f32, g: f32, b: f32) -> String {
    let max = r.max(g).max(b);
    let min = r.min(g).min(b);
    let delta = max - min;
    let lightness = (max + min) / 2.0;

    let saturation = if delta == 0.0 {
        0.0
    } else if lightness < 0.5 {
        delta / (max + min)
    } else {
        delta / (2.0 - max - min)
    };

    let hue = if delta == 0.0 {
        0.0
    } else if (max - r).abs() < f32::EPSILON {
        let mut h = (g - b) / delta;
        if h < 0.0 {
            h += 6.0;
        }
        h / 6.0
    } else if (max - g).abs() < f32::EPSILON {
        ((b - r) / delta + 2.0) / 6.0
    } else {
        ((r - g) / delta + 4.0) / 6.0
    };

    // Glow parameters: high saturation (>= 0.85) and optimal luminance (0.50..0.60)
    let target_sat = saturation.max(0.85).min(1.0);
    let target_lum = lightness.clamp(0.48, 0.62);

    let (r_boost, g_boost, b_boost) = hsl_to_rgb(hue, target_sat, target_lum);

    let r_byte = (r_boost * 255.0).round().clamp(0.0, 255.0) as u8;
    let g_byte = (g_boost * 255.0).round().clamp(0.0, 255.0) as u8;
    let b_byte = (b_boost * 255.0).round().clamp(0.0, 255.0) as u8;

    format!("#{:02X}{:02X}{:02X}", r_byte, g_byte, b_byte)
}

fn hsl_to_rgb(h: f32, s: f32, l: f32) -> (f32, f32, f32) {
    if s == 0.0 {
        return (l, l, l);
    }

    let q = if l < 0.5 {
        l * (1.0 + s)
    } else {
        l + s - l * s
    };
    let p = 2.0 * l - q;

    let r = hue_to_rgb(p, q, h + 1.0 / 3.0);
    let g = hue_to_rgb(p, q, h);
    let b = hue_to_rgb(p, q, h - 1.0 / 3.0);

    (r, g, b)
}

fn hue_to_rgb(p: f32, q: f32, mut t: f32) -> f32 {
    if t < 0.0 {
        t += 1.0;
    }
    if t > 1.0 {
        t -= 1.0;
    }
    if t < 1.0 / 6.0 {
        return p + (q - p) * 6.0 * t;
    }
    if t < 1.0 / 2.0 {
        return q;
    }
    if t < 2.0 / 3.0 {
        return p + (q - p) * (2.0 / 3.0 - t) * 6.0;
    }
    p
}

/// Fallback color based on a deterministic hash of the application name.
fn derive_color_from_name_or_fallback(app_name: &str) -> String {
    if app_name.trim().is_empty() {
        return DEFAULT_FALLBACK_GLOW_COLOR.to_string();
    }

    // Curated vibrant neon glow palette for pleasant automatic assignments
    const PALETTE: [&str; 8] = [
        "#FF5C00", // Amber Neon (Curry Primary)
        "#00F2FE", // Electric Cyan
        "#10B981", // Matrix Green
        "#E11D48", // Neon Magenta
        "#8B5CF6", // Amethyst Violet
        "#F59E0B", // Sakura Gold
        "#3B82F6", // Royal Azure
        "#EC4899", // Deep Rose
    ];

    let hash: usize = app_name.bytes().fold(0usize, |acc, b| acc.wrapping_add(b as usize));
    PALETTE[hash % PALETTE.len()].to_string()
}
