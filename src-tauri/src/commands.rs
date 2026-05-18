use tauri::State;

use crate::db::repo::{
    LatestCaseResultSummary, ModelConfigRecord, PromptRecord, PromptVersionRecord, TestCaseRecord,
};
use crate::error::CommandError;
use crate::state::AppState;

#[tauri::command]
pub fn create_prompt(
    state: State<'_, AppState>,
    name: String,
    description: String,
) -> Result<PromptRecord, CommandError> {
    state
        .with_repo(|repo| repo.create_prompt(&name, &description))
        .map_err(Into::into)
}

#[tauri::command]
pub fn create_prompt_version(
    state: State<'_, AppState>,
    prompt_id: String,
    version_name: String,
    content: String,
    note: Option<String>,
) -> Result<PromptVersionRecord, CommandError> {
    state
        .with_repo(|repo| {
            repo.create_prompt_version(&prompt_id, &version_name, &content, note.as_deref())
        })
        .map_err(Into::into)
}

#[tauri::command]
pub fn create_test_case(
    state: State<'_, AppState>,
    prompt_id: String,
    title: String,
    input: String,
    tags: String,
    note: Option<String>,
) -> Result<TestCaseRecord, CommandError> {
    state
        .with_repo(|repo| repo.create_test_case(&prompt_id, &title, &input, &tags, note.as_deref()))
        .map_err(Into::into)
}

#[tauri::command]
pub fn list_prompts(state: State<'_, AppState>) -> Result<Vec<PromptRecord>, CommandError> {
    state.with_repo(|repo| repo.list_prompts()).map_err(Into::into)
}

#[tauri::command]
pub fn list_prompt_versions(
    state: State<'_, AppState>,
    prompt_id: String,
) -> Result<Vec<PromptVersionRecord>, CommandError> {
    state
        .with_repo(|repo| repo.list_prompt_versions(&prompt_id))
        .map_err(Into::into)
}

#[tauri::command]
pub fn list_test_cases(
    state: State<'_, AppState>,
    prompt_id: String,
) -> Result<Vec<TestCaseRecord>, CommandError> {
    state
        .with_repo(|repo| repo.list_test_cases(&prompt_id))
        .map_err(Into::into)
}

#[tauri::command]
pub fn update_prompt_version_content(
    state: State<'_, AppState>,
    prompt_version_id: String,
    content: String,
) -> Result<PromptVersionRecord, CommandError> {
    state
        .with_repo(|repo| repo.update_prompt_version_content(&prompt_version_id, &content))
        .map_err(Into::into)
}

#[tauri::command]
pub fn create_model_config(
    state: State<'_, AppState>,
    name: String,
    config_type: String,
    base_url: String,
    model: String,
    api_key: String,
    temperature: f64,
    max_tokens: i64,
) -> Result<ModelConfigRecord, CommandError> {
    let api_key_ref = format!("model-config-{}", uuid::Uuid::new_v4());
    crate::secrets::save_api_key(&api_key_ref, &api_key).map_err(CommandError::from)?;
    state
        .with_repo(|repo| {
            repo.create_model_config(
                &name,
                &config_type,
                &base_url,
                &model,
                &api_key_ref,
                temperature,
                max_tokens,
            )
        })
        .map_err(Into::into)
}

#[tauri::command]
pub fn list_model_configs(
    state: State<'_, AppState>,
    config_type: String,
) -> Result<Vec<ModelConfigRecord>, CommandError> {
    state
        .with_repo(|repo| repo.list_model_configs(&config_type))
        .map_err(Into::into)
}

#[tauri::command]
pub fn list_latest_case_results(
    state: State<'_, AppState>,
    prompt_id: String,
) -> Result<Vec<LatestCaseResultSummary>, CommandError> {
    state
        .with_repo(|repo| repo.list_latest_case_results_for_prompt(&prompt_id))
        .map_err(Into::into)
}
