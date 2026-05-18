use crate::evaluation::{run_prompt_for_case, PromptRunInput};

#[tokio::test]
async fn run_prompt_for_case_persists_output() {
    let input = PromptRunInput {
        prompt_content: "Say hello".to_string(),
        case_input: "Leo".to_string(),
    };

    let output = run_prompt_for_case(input, |system, user| async move {
        Ok(format!("{system}: {user}"))
    })
    .await
    .expect("run prompt");

    assert_eq!(output, "Say hello: Leo");
}
