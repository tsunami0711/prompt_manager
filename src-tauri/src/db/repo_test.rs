use rusqlite::Connection;

use crate::commands::RunCasesInput;
use crate::db::{migrations::migrate, repo::Repository};
use crate::domain::PassFail;
use crate::error::AppError;

fn repo() -> Repository {
    let conn = Connection::open_in_memory().expect("open in-memory sqlite");
    migrate(&conn).expect("migrate sqlite");
    Repository::new(conn)
}

struct RunFixture {
    repo: Repository,
    prompt_id: String,
    version_id: String,
    case_id: String,
    model_id: String,
    run_id: String,
}

fn run_fixture() -> RunFixture {
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

    RunFixture {
        repo,
        prompt_id: prompt.id,
        version_id: version.id,
        case_id: case.id,
        model_id: model.id,
        run_id: run.id,
    }
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
    let RunFixture {
        repo,
        version_id,
        case_id,
        model_id,
        run_id,
        ..
    } = run_fixture();
    let result = repo
        .create_case_result(
            &run_id,
            &version_id,
            &case_id,
            "Hello Leo",
            "completed",
            None,
            42,
        )
        .expect("result");

    repo.create_llm_judgement(
        &result.id,
        &model_id,
        "judge prompt",
        PassFail::Pass,
        "good",
        r#"{"result":"pass","reason":"good"}"#,
    )
    .expect("llm judgement");
    repo.upsert_human_label(&result.id, PassFail::Fail, Some("too terse"))
        .expect("human label");

    let latest = repo
        .latest_case_result(&version_id, &case_id)
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

#[test]
fn rejects_run_when_version_belongs_to_another_prompt() {
    let RunFixture {
        repo,
        prompt_id,
        model_id,
        ..
    } = run_fixture();
    let other_prompt = repo.create_prompt("Other", "").expect("other prompt");
    let other_version = repo
        .create_prompt_version(&other_prompt.id, "v1", "Other", None)
        .expect("other version");

    let err = repo
        .create_evaluation_run(
            &prompt_id,
            &other_version.id,
            &model_id,
            "human",
            None,
            None,
            "selected",
        )
        .expect_err("mismatched prompt/version should fail");

    assert!(matches!(err, AppError::Validation(_)));
}

#[test]
fn rejects_case_result_when_run_version_or_case_crosses_prompts() {
    let RunFixture {
        repo,
        run_id,
        version_id,
        ..
    } = run_fixture();
    let other_prompt = repo.create_prompt("Other", "").expect("other prompt");
    let other_case = repo
        .create_test_case(&other_prompt.id, "Other case", "input", "", None)
        .expect("other case");
    let other_version = repo
        .create_prompt_version(&other_prompt.id, "v1", "Other", None)
        .expect("other version");

    let wrong_version_err = repo
        .create_case_result(
            &run_id,
            &other_version.id,
            &other_case.id,
            "output",
            "completed",
            None,
            1,
        )
        .expect_err("mismatched run/version should fail");
    let wrong_case_err = repo
        .create_case_result(
            &run_id,
            &version_id,
            &other_case.id,
            "output",
            "completed",
            None,
            1,
        )
        .expect_err("mismatched run/case should fail");

    assert!(matches!(wrong_version_err, AppError::Validation(_)));
    assert!(matches!(wrong_case_err, AppError::Validation(_)));
}

#[test]
fn latest_case_result_prefers_second_result_when_created_at_matches() {
    let RunFixture {
        repo,
        run_id,
        version_id,
        case_id,
        ..
    } = run_fixture();
    let first = repo
        .create_case_result(
            &run_id,
            &version_id,
            &case_id,
            "first",
            "completed",
            None,
            1,
        )
        .expect("first result");
    let second = repo
        .create_case_result(
            &run_id,
            &version_id,
            &case_id,
            "second",
            "completed",
            None,
            2,
        )
        .expect("second result");
    repo.set_case_result_created_at_for_test(&first.id, "2026-05-18T00:00:00Z")
        .expect("pin first timestamp");
    repo.set_case_result_created_at_for_test(&second.id, "2026-05-18T00:00:00Z")
        .expect("pin second timestamp");

    let latest = repo
        .latest_case_result(&version_id, &case_id)
        .expect("latest result")
        .expect("result exists");

    assert_eq!(latest.case_result_id, second.id);
}

#[test]
fn upsert_human_label_overwrites_existing_label() {
    let RunFixture {
        repo,
        run_id,
        version_id,
        case_id,
        ..
    } = run_fixture();
    let result = repo
        .create_case_result(
            &run_id,
            &version_id,
            &case_id,
            "Hello Leo",
            "completed",
            None,
            42,
        )
        .expect("result");

    repo.upsert_human_label(&result.id, PassFail::Pass, Some("first"))
        .expect("first label");
    repo.upsert_human_label(&result.id, PassFail::Fail, Some("second"))
        .expect("second label");

    let latest = repo
        .latest_case_result(&version_id, &case_id)
        .expect("latest result")
        .expect("result exists");
    let label = latest.human_label.expect("human label");

    assert_eq!(label.result, PassFail::Fail);
    assert_eq!(label.note.as_deref(), Some("second"));
}

#[test]
fn build_run_plan_rejects_empty_case_selection() {
    let RunFixture {
        repo,
        version_id,
        model_id,
        ..
    } = run_fixture();
    let input = RunCasesInput {
        prompt_version_id: version_id,
        case_ids: vec![],
        run_model_config_id: model_id,
        case_scope: "selected".to_string(),
        judge_mode: "human".to_string(),
        judge_model_config_id: None,
        judge_prompt: None,
    };

    let err = repo
        .build_run_plan(&input)
        .expect_err("empty case selection should fail");

    assert!(matches!(err, AppError::Validation(_)));
}

#[test]
fn can_mark_evaluation_run_error() {
    let RunFixture { repo, run_id, .. } = run_fixture();

    repo.mark_evaluation_run_error(&run_id)
        .expect("mark run error");

    assert_eq!(
        repo.evaluation_run_status_for_test(&run_id)
            .expect("run status"),
        "error"
    );
}

#[test]
fn stores_llm_judgement_error() {
    let RunFixture {
        repo,
        run_id,
        version_id,
        case_id,
        model_id,
        ..
    } = run_fixture();
    let result = repo
        .create_case_result(
            &run_id,
            &version_id,
            &case_id,
            "Hello Leo",
            "completed",
            None,
            42,
        )
        .expect("case result");

    repo.create_llm_judgement_error(
        &result.id,
        &model_id,
        "judge prompt",
        "not json",
        "json error",
    )
    .expect("llm judgement error");

    let stored = repo
        .llm_judgement_error_for_test(&result.id)
        .expect("load judgement error")
        .expect("judgement error exists");

    assert_eq!(stored.0, "not json");
    assert_eq!(stored.1, "json error");
    assert_eq!(stored.2, "error");
}
