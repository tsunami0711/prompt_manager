use std::future::Future;
use std::time::Instant;

use tauri::State;

use crate::commands::RunCasesInput;
use crate::db::repo::{ModelConfigRecord, RunPlan};
use crate::error::{AppError, AppResult};
use crate::judge::{build_judge_user_message, parse_judge_response};
use crate::model_client::{complete_chat, ChatModelConfig};
use crate::state::AppState;

#[derive(Debug, Clone)]
pub struct PromptRunInput {
    pub prompt_content: String,
    pub case_input: String,
}

pub async fn run_prompt_for_case<C, F>(input: PromptRunInput, complete: C) -> AppResult<String>
where
    C: FnOnce(String, String) -> F,
    F: Future<Output = AppResult<String>>,
{
    complete(input.prompt_content, input.case_input).await
}

pub async fn run_selected_cases(
    state: &State<'_, AppState>,
    input: RunCasesInput,
) -> AppResult<()> {
    if input.judge_mode == "llm"
        && (input.judge_model_config_id.is_none()
            || input
                .judge_prompt
                .as_deref()
                .map(str::trim)
                .unwrap_or_default()
                .is_empty())
    {
        return Err(AppError::Validation(
            "LLM judge requires a judge model and prompt".to_string(),
        ));
    }

    let plan = state.with_repo(|repo| repo.build_run_plan(&input))?;
    if let Err(error) = run_plan(state, &plan).await {
        return mark_run_error(state, &plan.run.id, error);
    }

    Ok(())
}

async fn run_plan(state: &State<'_, AppState>, plan: &RunPlan) -> AppResult<()> {
    let run_api_key = crate::secrets::load_api_key(&plan.run_model.api_key_ref)?;
    let run_config = chat_config(&plan.run_model, run_api_key.clone());
    let judge_config = match &plan.judge {
        Some(judge) => {
            let api_key = crate::secrets::load_api_key(&judge.model.api_key_ref)?;
            Some((judge.clone(), chat_config(&judge.model, api_key.clone()), api_key))
        }
        None => None,
    };

    for test_case in &plan.cases {
        let started_at = Instant::now();
        let prompt_input = PromptRunInput {
            prompt_content: plan.prompt_version.content.clone(),
            case_input: test_case.input.clone(),
        };
        let config = run_config.clone();
        let output = run_prompt_for_case(prompt_input, |system, user| async move {
            complete_chat(&config, &system, &user).await
        })
        .await;
        let latency_ms = elapsed_ms(started_at);

        let output = match output {
            Ok(output) => output,
            Err(error) => {
                let message = sanitize_error(error, &[&run_api_key]);
                state.with_repo(|repo| {
                    repo.create_case_result(
                        &plan.run.id,
                        &plan.prompt_version.id,
                        &test_case.id,
                        "",
                        "error",
                        Some(&message),
                        latency_ms,
                    )
                })?;
                continue;
            }
        };

        let case_result = state.with_repo(|repo| {
            repo.create_case_result(
                &plan.run.id,
                &plan.prompt_version.id,
                &test_case.id,
                &output,
                "completed",
                None,
                latency_ms,
            )
        })?;

        if let Some((judge, config, judge_api_key)) = &judge_config {
            let judge_user_message = build_judge_user_message(
                &judge.prompt,
                &test_case.input,
                &plan.prompt_version.content,
                &output,
            );
            let raw_judgement =
                complete_chat(config, "You are an evaluation judge.", &judge_user_message).await;
            let raw_judgement = match raw_judgement {
                Ok(raw_judgement) => raw_judgement,
                Err(error) => {
                    let message = sanitize_error(error, &[&run_api_key, judge_api_key]);
                    state.with_repo(|repo| {
                        repo.create_llm_judgement_error(
                            &case_result.id,
                            &judge.model.id,
                            &judge.prompt,
                            "",
                            &message,
                        )
                    })?;
                    continue;
                }
            };

            let judgement = match parse_judge_response(&raw_judgement) {
                Ok(judgement) => judgement,
                Err(error) => {
                    let message = sanitize_error(error, &[&run_api_key, judge_api_key]);
                    state.with_repo(|repo| {
                        repo.create_llm_judgement_error(
                            &case_result.id,
                            &judge.model.id,
                            &judge.prompt,
                            &raw_judgement,
                            &message,
                        )
                    })?;
                    continue;
                }
            };

            state.with_repo(|repo| {
                repo.create_llm_judgement(
                    &case_result.id,
                    &judge.model.id,
                    &judge.prompt,
                    judgement.result,
                    &judgement.reason,
                    &raw_judgement,
                )?;
                Ok(())
            })?;
        }
    }

    state.with_repo(|repo| repo.finish_evaluation_run(&plan.run.id))?;
    Ok(())
}

fn mark_run_error(
    state: &State<'_, AppState>,
    run_id: &str,
    original_error: AppError,
) -> AppResult<()> {
    match state.with_repo(|repo| repo.mark_evaluation_run_error(run_id)) {
        Ok(()) => Err(original_error),
        Err(mark_error) => Err(AppError::Validation(format!(
            "{original_error}; additionally failed to mark evaluation run error: {mark_error}"
        ))),
    }
}

fn chat_config(model: &ModelConfigRecord, api_key: String) -> ChatModelConfig {
    ChatModelConfig {
        base_url: model.base_url.clone(),
        api_key,
        model: model.model.clone(),
        temperature: model.temperature,
        max_tokens: model.max_tokens,
    }
}

fn elapsed_ms(started_at: Instant) -> i64 {
    i64::try_from(started_at.elapsed().as_millis()).unwrap_or(i64::MAX)
}

fn sanitize_error(error: AppError, secrets: &[&String]) -> String {
    let mut message = error.to_string();
    for secret in secrets {
        if !secret.is_empty() {
            message = message.replace(secret.as_str(), "[redacted]");
        }
    }
    message
}

#[cfg(test)]
mod tests {
    include!("evaluation_test.rs");
}
