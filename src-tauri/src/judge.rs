use serde::Deserialize;

use crate::domain::{LlmJudgement, PassFail};
use crate::error::{AppError, AppResult};

#[derive(Debug, Deserialize)]
struct JudgeResponse {
    result: String,
    reason: String,
}

pub fn parse_judge_response(raw: &str) -> AppResult<LlmJudgement> {
    let parsed: JudgeResponse = serde_json::from_str(raw)?;
    let result = match parsed.result.as_str() {
        "pass" => PassFail::Pass,
        "fail" => PassFail::Fail,
        _ => {
            return Err(AppError::Validation(
                "judge result must be pass or fail".to_string(),
            ))
        }
    };

    Ok(LlmJudgement::new(result, parsed.reason))
}

pub fn build_judge_user_message(
    judge_prompt: &str,
    test_case_input: &str,
    prompt_content: &str,
    prompt_output: &str,
) -> String {
    format!(
        "{judge_prompt}\n\nTest case input:\n{test_case_input}\n\nPrompt content:\n{prompt_content}\n\nPrompt output:\n{prompt_output}\n\nReturn JSON with result and reason."
    )
}

#[cfg(test)]
mod tests {
    include!("judge_test.rs");
}
