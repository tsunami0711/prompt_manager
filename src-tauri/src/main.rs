mod analytics;
mod commands;
mod db;
mod domain;
mod error;
mod evaluation;
mod judge;
mod model_client;
mod secrets;
mod state;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let state = state::AppState::new(app.handle())?;
            app.manage(state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::create_prompt,
            commands::create_prompt_version,
            commands::create_test_case,
            commands::list_prompts,
            commands::list_prompt_versions,
            commands::list_test_cases,
            commands::update_prompt_version_content,
            commands::create_model_config,
            commands::list_model_configs,
            commands::list_latest_case_results,
            commands::list_run_history,
            commands::upsert_human_label,
            commands::run_selected_cases
        ])
        .run(tauri::generate_context!())
        .expect("failed to run Prompt Manager");
}
