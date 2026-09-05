mod fs_ops;

use fs_ops::{list_folder, open_in_system, parent_path, read_file_bytes, search_folder, special_folders};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            special_folders,
            list_folder,
            search_folder,
            read_file_bytes,
            open_in_system,
            parent_path
        ])
        .run(tauri::generate_context!())
        .expect("error while running Soph Explorer Debloat");
}
