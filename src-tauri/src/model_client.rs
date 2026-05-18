use serde::{Deserialize, Serialize};
use std::time::Duration;

use crate::error::{AppError, AppResult};

#[derive(Debug, Clone)]
pub struct ChatModelConfig {
    pub base_url: String,
    pub api_key: String,
    pub model: String,
    pub temperature: f64,
    pub max_tokens: i64,
}

#[derive(Debug, Clone, Serialize)]
struct ChatRequest {
    model: String,
    messages: Vec<ChatMessage>,
    temperature: f64,
    max_tokens: i64,
}

#[derive(Debug, Clone, Serialize)]
struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct ChatResponse {
    choices: Vec<ChatChoice>,
}

#[derive(Debug, Deserialize)]
struct ChatChoice {
    message: ChatChoiceMessage,
}

#[derive(Debug, Deserialize)]
struct ChatChoiceMessage {
    content: String,
}

pub async fn complete_chat(
    config: &ChatModelConfig,
    system_prompt: &str,
    user_input: &str,
) -> AppResult<String> {
    let url = format!("{}/chat/completions", config.base_url.trim_end_matches('/'));
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(60))
        .build()?;
    let request = ChatRequest {
        model: config.model.clone(),
        messages: vec![
            ChatMessage {
                role: "system".to_string(),
                content: system_prompt.to_string(),
            },
            ChatMessage {
                role: "user".to_string(),
                content: user_input.to_string(),
            },
        ],
        temperature: config.temperature,
        max_tokens: config.max_tokens,
    };

    let response = client
        .post(url)
        .bearer_auth(&config.api_key)
        .json(&request)
        .send()
        .await?;

    let status = response.status();
    if !status.is_success() {
        let body = response.text().await.unwrap_or_default();
        if body.is_empty() {
            return Err(AppError::Validation(format!(
                "model request failed with status {status}"
            )));
        }

        let detail: String = body.chars().take(500).collect();
        return Err(AppError::Validation(format!(
            "model request failed with status {status}: {detail}"
        )));
    }

    let body: ChatResponse = response.json().await?;
    let content = body
        .choices
        .first()
        .map(|choice| choice.message.content.clone())
        .ok_or_else(|| AppError::Validation("model response contained no choices".to_string()))?;

    Ok(content)
}

#[cfg(test)]
mod tests {
    include!("model_client_test.rs");
}
