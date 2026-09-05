use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::UNIX_EPOCH;

const MAX_PREVIEW_BYTES: u64 = 40 * 1024 * 1024;
const MAX_SEARCH_HITS: usize = 400;
const MAX_SEARCH_VISITS: usize = 8000;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DirEntryDto {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size: u64,
    pub modified_ms: Option<u64>,
    pub ext: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SpecialFolders {
    pub home: Option<String>,
    pub documents: Option<String>,
    pub desktop: Option<String>,
    pub downloads: Option<String>,
}

fn existing_dir(path: PathBuf) -> Option<String> {
    if path.is_dir() {
        Some(path.to_string_lossy().to_string())
    } else {
        None
    }
}

fn home_dir() -> Option<PathBuf> {
    std::env::var_os("USERPROFILE")
        .or_else(|| std::env::var_os("HOME"))
        .map(PathBuf::from)
}

fn ext_of(name: &str) -> String {
    Path::new(name)
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_ascii_lowercase())
        .unwrap_or_default()
}

fn modified_ms(meta: &fs::Metadata) -> Option<u64> {
    meta.modified()
        .ok()
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as u64)
}

fn to_entry(path: &Path, name: String, is_dir: bool, meta: Option<fs::Metadata>) -> DirEntryDto {
    let size = meta
        .as_ref()
        .filter(|_| !is_dir)
        .map(|m| m.len())
        .unwrap_or(0);
    let modified = meta.as_ref().and_then(modified_ms);
    DirEntryDto {
        ext: if is_dir { String::new() } else { ext_of(&name) },
        name,
        path: path.to_string_lossy().to_string(),
        is_dir,
        size,
        modified_ms: modified,
    }
}

fn skip_name(name: &str) -> bool {
    name.starts_with('.')
        || name.eq_ignore_ascii_case("$recycle.bin")
        || name.eq_ignore_ascii_case("system volume information")
}

#[tauri::command]
pub fn special_folders() -> SpecialFolders {
    let home = home_dir();
    SpecialFolders {
        documents: home
            .as_ref()
            .and_then(|h| existing_dir(h.join("Documents"))),
        desktop: home.as_ref().and_then(|h| existing_dir(h.join("Desktop"))),
        downloads: home
            .as_ref()
            .and_then(|h| existing_dir(h.join("Downloads"))),
        home: home.and_then(existing_dir),
    }
}

#[tauri::command]
pub fn list_folder(path: String) -> Result<Vec<DirEntryDto>, String> {
    let root = PathBuf::from(path);
    if !root.is_dir() {
        return Err("That folder could not be opened.".into());
    }
    let mut out = Vec::new();
    let reader = fs::read_dir(&root).map_err(|_| "That folder could not be opened.".to_string())?;
    for entry in reader.flatten() {
        let name = entry.file_name().to_string_lossy().to_string();
        if skip_name(&name) {
            continue;
        }
        let path = entry.path();
        let meta = entry.metadata().ok();
        let is_dir = meta
            .as_ref()
            .map(|m| m.is_dir())
            .or_else(|| entry.file_type().ok().map(|t| t.is_dir()))
            .unwrap_or(false);
        out.push(to_entry(&path, name, is_dir, meta));
    }
    out.sort_by(|a, b| match (a.is_dir, b.is_dir) {
        (true, false) => std::cmp::Ordering::Less,
        (false, true) => std::cmp::Ordering::Greater,
        _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
    });
    Ok(out)
}

#[tauri::command]
pub fn search_folder(path: String, query: String) -> Result<Vec<DirEntryDto>, String> {
    let q = query.trim().to_lowercase();
    if q.is_empty() {
        return Ok(Vec::new());
    }
    let root = PathBuf::from(path);
    if !root.is_dir() {
        return Err("That folder could not be searched.".into());
    }
    let mut out = Vec::new();
    let mut stack = vec![root];
    let mut visits = 0usize;
    while let Some(dir) = stack.pop() {
        if visits >= MAX_SEARCH_VISITS || out.len() >= MAX_SEARCH_HITS {
            break;
        }
        let Ok(reader) = fs::read_dir(&dir) else {
            continue;
        };
        for entry in reader.flatten() {
            visits += 1;
            if visits >= MAX_SEARCH_VISITS || out.len() >= MAX_SEARCH_HITS {
                break;
            }
            let name = entry.file_name().to_string_lossy().to_string();
            if skip_name(&name) {
                continue;
            }
            let path = entry.path();
            let meta = entry.metadata().ok();
            let is_dir = meta
                .as_ref()
                .map(|m| m.is_dir())
                .or_else(|| entry.file_type().ok().map(|t| t.is_dir()))
                .unwrap_or(false);
            if name.to_lowercase().contains(&q) {
                out.push(to_entry(&path, name.clone(), is_dir, meta));
            }
            if is_dir {
                stack.push(path);
            }
        }
    }
    out.sort_by(|a, b| match (a.is_dir, b.is_dir) {
        (true, false) => std::cmp::Ordering::Less,
        (false, true) => std::cmp::Ordering::Greater,
        _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
    });
    Ok(out)
}

#[tauri::command]
pub fn read_file_bytes(path: String) -> Result<Vec<u8>, String> {
    let file = PathBuf::from(path);
    if !file.is_file() {
        return Err("That file could not be opened.".into());
    }
    let meta = fs::metadata(&file).map_err(|_| "That file could not be opened.".to_string())?;
    if meta.len() > MAX_PREVIEW_BYTES {
        return Err("This file is too large to preview here. Double-click to open it.".into());
    }
    fs::read(&file).map_err(|_| "That file could not be opened.".to_string())
}

#[tauri::command]
pub fn parent_path(path: String) -> Option<String> {
    Path::new(&path)
        .parent()
        .filter(|p| !p.as_os_str().is_empty())
        .map(|p| p.to_string_lossy().to_string())
}

#[tauri::command]
pub fn open_in_system(path: String) -> Result<(), String> {
    let target = PathBuf::from(&path);
    if !target.exists() {
        return Err("That file or folder is no longer there.".into());
    }
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/C", "start", "", &path])
            .spawn()
            .map_err(|_| "Could not open that file.".to_string())?;
        return Ok(());
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|_| "Could not open that file.".to_string())?;
        return Ok(());
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        std::process::Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|_| "Could not open that file.".to_string())?;
        Ok(())
    }
}
