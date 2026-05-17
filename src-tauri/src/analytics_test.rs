use crate::analytics::{compute_final_result, FinalResult, FinalResultSource};
use crate::domain::{CaseResultStatus, HumanLabel, LlmJudgement, PassFail, PassFailOrState};

#[test]
fn run_error_wins_over_judgements() {
    let result = compute_final_result(
        CaseResultStatus::Error,
        Some(HumanLabel::new(PassFail::Pass, None)),
        Some(LlmJudgement::new(PassFail::Pass, "ok".to_string())),
    );

    assert_eq!(result, FinalResult::new(PassFailOrState::Error, FinalResultSource::Run));
}

#[test]
fn human_label_wins_over_llm_judgement() {
    let result = compute_final_result(
        CaseResultStatus::Completed,
        Some(HumanLabel::new(PassFail::Fail, Some("bad output".to_string()))),
        Some(LlmJudgement::new(PassFail::Pass, "ok".to_string())),
    );

    assert_eq!(result.value.as_str(), "fail");
    assert_eq!(result.source, FinalResultSource::Human);
}

#[test]
fn llm_judgement_is_used_when_human_label_is_absent() {
    let result = compute_final_result(
        CaseResultStatus::Completed,
        None,
        Some(LlmJudgement::new(PassFail::Pass, "ok".to_string())),
    );

    assert_eq!(result.value.as_str(), "pass");
    assert_eq!(result.source, FinalResultSource::Llm);
}
