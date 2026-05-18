use serde::{Deserialize, Serialize};

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

    let response = reqwest::Client::new()
        .post(url)
        .bearer_auth(&config.api_key)
        .json(&request)
        .send()
        .await?;

    if !response.status().is_success() {
        return Err(AppError::Validation(format!(
            "model request failed with status {}",
            response.status()
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
