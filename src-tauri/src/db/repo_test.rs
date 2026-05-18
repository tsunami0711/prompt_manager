use rusqlite::Connection;

use crate::db::{migrations::migrate, repo::Repository};
use crate::domain::PassFail;

fn repo() -> Repository {
    let conn = Connection::open_in_memory().expect("open in-memory sqlite");
    migrate(&conn).expect("migrate sqlite");
    Repository::new(conn)
}

#[test]
fn creates_prompt_version_and_case() {
    let repo = repo();
    let prompt = repo
        .create_prompt("Memory Extractor", "Extract durable memories")
        .expect("create prompt");
    let version = repo
        .create_prompt_version(&prompt.id, "v1", "Extract memories", Some("first version"))
        .expect("create version");
    let case = repo
        .create_test_case(
            &prompt.id,
            "City preference",
            "I prefer Shanghai events",
            "memory",
            None,
        )
        .expect("create case");

    assert_eq!(version.prompt_id, prompt.id);
    assert_eq!(case.prompt_id, prompt.id);
}

#[test]
fn stores_latest_case_result_with_judgements_and_labels() {
    let repo = repo();
    let prompt = repo.create_prompt("Prompt", "").expect("prompt");
    let version = repo
        .create_prompt_version(&prompt.id, "v1", "Say hello", None)
        .expect("version");
    let case = repo
        .create_test_case(&prompt.id, "Greeting", "Leo", "", None)
        .expect("case");
    let model = repo
        .create_model_config(
            "Local",
            "run",
            "http://localhost:8000/v1",
            "test-model",
            "key-ref",
            0.0,
            512,
        )
        .expect("model");
    let run = repo
        .create_evaluation_run(
            &prompt.id,
            &version.id,
            &model.id,
            "human",
            None,
            None,
            "selected",
        )
        .expect("run");
    let result = repo
        .create_case_result(
            &run.id,
            &version.id,
            &case.id,
            "Hello Leo",
            "completed",
            None,
            42,
        )
        .expect("result");

    repo.create_llm_judgement(
        &result.id,
        &model.id,
        "judge prompt",
        PassFail::Pass,
        "good",
        r#"{"result":"pass","reason":"good"}"#,
    )
    .expect("llm judgement");
    repo.upsert_human_label(&result.id, PassFail::Fail, Some("too terse"))
        .expect("human label");

    let latest = repo
        .latest_case_result(&version.id, &case.id)
        .expect("latest result")
        .expect("result exists");

    assert_eq!(latest.case_result_id, result.id);
    assert_eq!(
        latest.human_label.expect("human label").result,
        PassFail::Fail
    );
    assert_eq!(
        latest.llm_judgement.expect("llm judgement").result,
        PassFail::Pass
    );
}
