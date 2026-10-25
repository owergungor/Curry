use std::fs::File;
use std::io::Read;
use std::path::Path;

#[derive(Debug, Clone, Default)]
pub struct ParsedShortcut {
    pub target_path: Option<String>,
    pub icon_path: Option<String>,
    pub working_dir: Option<String>,
}

const LNK_HEADER_SIZE: usize = 76;
const LNK_CLSID: [u8; 16] = [
    0x01, 0x14, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0xC0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x46,
];

// LinkFlags bits
const FLAG_HAS_LINK_TARGET_ID_LIST: u32 = 0x01;
const FLAG_HAS_LINK_INFO: u32 = 0x02;
const FLAG_HAS_NAME: u32 = 0x04;
const FLAG_HAS_RELATIVE_PATH: u32 = 0x08;
const FLAG_HAS_WORKING_DIR: u32 = 0x10;
const FLAG_HAS_ARGUMENTS: u32 = 0x20;
const FLAG_HAS_ICON_LOCATION: u32 = 0x40;
const FLAG_IS_UNICODE: u32 = 0x80;

/// Safely parses a Windows Shell Link (.lnk) file without COM or shell invocation.
/// Returns None if the file is invalid, corrupt, or does not point to a resolvable target.
pub fn parse_lnk_file(path: &Path) -> Option<ParsedShortcut> {
    let mut file = File::open(path).ok()?;
    // Bound the maximum read to 1MB to guard against pathological or malicious files
    let mut data = Vec::new();
    file.by_ref()
        .take(1024 * 1024)
        .read_to_end(&mut data)
        .ok()?;

    if data.len() < LNK_HEADER_SIZE {
        return None;
    }

    // Check HeaderSize (must be 0x0000004C = 76)
    let header_size = read_u32_le(&data, 0)?;
    if header_size != 76 {
        return None;
    }

    // Check LinkCLSID
    if &data[4..20] != &LNK_CLSID {
        return None;
    }

    let flags = read_u32_le(&data, 20)?;
    let mut cursor = LNK_HEADER_SIZE;

    // 1. Skip LinkTargetIDList if present
    if (flags & FLAG_HAS_LINK_TARGET_ID_LIST) != 0 {
        let id_list_size = read_u16_le(&data, cursor)? as usize;
        cursor = cursor.checked_add(2)?.checked_add(id_list_size)?;
    }

    let mut target_path: Option<String> = None;

    // 2. Parse LinkInfo if present
    if (flags & FLAG_HAS_LINK_INFO) != 0 && cursor < data.len() {
        let link_info_offset = cursor;
        let link_info_size = read_u32_le(&data, link_info_offset)? as usize;
        let link_info_header_size = read_u32_le(&data, link_info_offset + 4)? as usize;

        if link_info_size >= 28 && link_info_offset + link_info_size <= data.len() {
            let local_base_path_offset = read_u32_le(&data, link_info_offset + 16)? as usize;

            if local_base_path_offset > 0 && local_base_path_offset < link_info_size {
                let start = link_info_offset + local_base_path_offset;
                if start < data.len() {
                    target_path = read_null_terminated_string(&data[start..]);
                }
            }

            // If header is large enough, check Unicode local base path offset (offset 28 / 0x1C)
            if link_info_header_size >= 0x24 {
                if let Some(unicode_offset) = read_u32_le(&data, link_info_offset + 28) {
                    let u_offset = unicode_offset as usize;
                    if u_offset > 0 && u_offset < link_info_size {
                        let start = link_info_offset + u_offset;
                        if start < data.len() {
                            if let Some(u_str) = read_null_terminated_utf16(&data[start..]) {
                                if !u_str.is_empty() {
                                    target_path = Some(u_str);
                                }
                            }
                        }
                    }
                }
            }
        }

        cursor = cursor.checked_add(link_info_size)?;
    }

    // 3. StringData structures
    let is_unicode = (flags & FLAG_IS_UNICODE) != 0;
    let mut working_dir: Option<String> = None;
    let mut icon_path: Option<String> = None;

    // NameString
    if (flags & FLAG_HAS_NAME) != 0 && cursor < data.len() {
        cursor = skip_string_data(&data, cursor, is_unicode)?;
    }

    // RelativePath
    if (flags & FLAG_HAS_RELATIVE_PATH) != 0 && cursor < data.len() {
        if target_path.is_none() {
            if let Some((rel_path, next_cursor)) = read_string_data(&data, cursor, is_unicode) {
                target_path = Some(rel_path);
                cursor = next_cursor;
            } else {
                cursor = skip_string_data(&data, cursor, is_unicode)?;
            }
        } else {
            cursor = skip_string_data(&data, cursor, is_unicode)?;
        }
    }

    // WorkingDir
    if (flags & FLAG_HAS_WORKING_DIR) != 0 && cursor < data.len() {
        if let Some((dir, next_cursor)) = read_string_data(&data, cursor, is_unicode) {
            working_dir = Some(dir);
            cursor = next_cursor;
        }
    }

    // Arguments
    if (flags & FLAG_HAS_ARGUMENTS) != 0 && cursor < data.len() {
        cursor = skip_string_data(&data, cursor, is_unicode)?;
    }

    // IconLocation
    if (flags & FLAG_HAS_ICON_LOCATION) != 0 && cursor < data.len() {
        if let Some((icon, _)) = read_string_data(&data, cursor, is_unicode) {
            icon_path = Some(icon);
        }
    }

    Some(ParsedShortcut {
        target_path,
        icon_path,
        working_dir,
    })
}

fn read_u16_le(data: &[u8], offset: usize) -> Option<u16> {
    if offset + 2 <= data.len() {
        Some(u16::from_le_bytes([data[offset], data[offset + 1]]))
    } else {
        None
    }
}

fn read_u32_le(data: &[u8], offset: usize) -> Option<u32> {
    if offset + 4 <= data.len() {
        Some(u32::from_le_bytes([
            data[offset],
            data[offset + 1],
            data[offset + 2],
            data[offset + 3],
        ]))
    } else {
        None
    }
}

fn read_null_terminated_string(slice: &[u8]) -> Option<String> {
    let null_idx = slice.iter().position(|&b| b == 0).unwrap_or(slice.len());
    let s = String::from_utf8_lossy(&slice[..null_idx])
        .trim()
        .to_string();
    if s.is_empty() {
        None
    } else {
        Some(s)
    }
}

fn read_null_terminated_utf16(slice: &[u8]) -> Option<String> {
    let mut u16_chars = Vec::new();
    let mut i = 0;
    while i + 1 < slice.len() {
        let code = u16::from_le_bytes([slice[i], slice[i + 1]]);
        if code == 0 {
            break;
        }
        u16_chars.push(code);
        i += 2;
    }
    let s = String::from_utf16_lossy(&u16_chars).trim().to_string();
    if s.is_empty() {
        None
    } else {
        Some(s)
    }
}

fn read_string_data(data: &[u8], offset: usize, is_unicode: bool) -> Option<(String, usize)> {
    let char_count = read_u16_le(data, offset)? as usize;
    let byte_len = if is_unicode {
        char_count * 2
    } else {
        char_count
    };
    let start = offset + 2;
    let end = start.checked_add(byte_len)?;

    if end > data.len() {
        return None;
    }

    let string_slice = &data[start..end];
    let result_str = if is_unicode {
        let mut u16_vec = Vec::with_capacity(char_count);
        for chunk in string_slice.chunks_exact(2) {
            u16_vec.push(u16::from_le_bytes([chunk[0], chunk[1]]));
        }
        String::from_utf16_lossy(&u16_vec)
    } else {
        String::from_utf8_lossy(string_slice).to_string()
    };

    Some((result_str.trim().to_string(), end))
}

fn skip_string_data(data: &[u8], offset: usize, is_unicode: bool) -> Option<usize> {
    let char_count = read_u16_le(data, offset)? as usize;
    let byte_len = if is_unicode {
        char_count * 2
    } else {
        char_count
    };
    offset.checked_add(2)?.checked_add(byte_len)
}
