use serde_json::json;
use wiremock::matchers::{body_json, header, method, path};
use wiremock::{Mock, MockServer, ResponseTemplate};

use crate::model_client::{complete_chat, ChatModelConfig};

fn test_config(base_url: String) -> ChatModelConfig {
    ChatModelConfig {
        base_url,
        api_key: "test-key".to_string(),
        model: "test-model".to_string(),
        temperature: 0.2,
        max_tokens: 128,
    }
}

#[tokio::test]
async fn sends_chat_request_and_returns_first_choice_content() {
    let server = MockServer::start().await;
    let expected_body = json!({
        "model": "test-model",
        "messages": [
            {
                "role": "system",
                "content": "system prompt"
            },
            {
                "role": "user",
                "content": "user input"
            }
        ],
        "temperature": 0.2,
        "max_tokens": 128
    });

    Mock::given(method("POST"))
        .and(path("/chat/completions"))
        .and(header("authorization", "Bearer test-key"))
        .and(body_json(expected_body))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "choices": [
                {
                    "message": {
                        "content": "model output"
                    }
                }
            ]
        })))
        .mount(&server)
        .await;

    let content = complete_chat(&test_config(server.uri()), "system prompt", "user input")
        .await
        .expect("complete chat");

    assert_eq!(content, "model output");
}

#[tokio::test]
async fn includes_status_and_body_snippet_for_non_success_response() {
    let server = MockServer::start().await;

    Mock::given(method("POST"))
        .and(path("/chat/completions"))
        .respond_with(ResponseTemplate::new(500).set_body_string("provider exploded"))
        .mount(&server)
        .await;

    let error = complete_chat(&test_config(server.uri()), "system prompt", "user input")
        .await
        .expect_err("reject provider error");

    let message = error.to_string();
    assert!(message.contains("model request failed with status 500"));
    assert!(message.contains("provider exploded"));
}

#[tokio::test]
async fn rejects_response_with_no_choices() {
    let server = MockServer::start().await;

    Mock::given(method("POST"))
        .and(path("/chat/completions"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "choices": []
        })))
        .mount(&server)
        .await;

    let error = complete_chat(&test_config(server.uri()), "system prompt", "user input")
        .await
        .expect_err("reject no choices");

    assert!(error
        .to_string()
        .contains("model response contained no choices"));
}
