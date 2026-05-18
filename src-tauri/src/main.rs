mod analytics;
mod db;
mod domain;
mod error;

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("failed to run Prompt Manager");
}
