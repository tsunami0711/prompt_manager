use crate::domain::PassFail;
use crate::judge::parse_judge_response;

#[test]
fn parses_pass_response() {
    let parsed = parse_judge_response(r#"{"result":"pass","reason":"matches criteria"}"#)
        .expect("parse judge response");

    assert_eq!(parsed.result, PassFail::Pass);
    assert_eq!(parsed.reason, "matches criteria");
}

#[test]
fn rejects_unknown_result() {
    let error = parse_judge_response(r#"{"result":"maybe","reason":"unclear"}"#)
        .expect_err("reject invalid result");

    assert!(error.to_string().contains("judge result must be pass or fail"));
}
