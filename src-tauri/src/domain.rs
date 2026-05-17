use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PassFail {
    Pass,
    Fail,
}

impl PassFail {
    pub fn as_str(&self) -> &'static str {
        match self {
            PassFail::Pass => "pass",
            PassFail::Fail => "fail",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PassFailOrState {
    Pass,
    Fail,
    Pending,
    Error,
}

impl PassFailOrState {
    pub fn as_str(&self) -> &'static str {
        match self {
            PassFailOrState::Pass => "pass",
            PassFailOrState::Fail => "fail",
            PassFailOrState::Pending => "pending",
            PassFailOrState::Error => "error",
        }
    }
}

impl From<PassFail> for PassFailOrState {
    fn from(value: PassFail) -> Self {
        match value {
            PassFail::Pass => PassFailOrState::Pass,
            PassFail::Fail => PassFailOrState::Fail,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CaseResultStatus {
    Pending,
    Running,
    Completed,
    Error,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct HumanLabel {
    pub result: PassFail,
    pub note: Option<String>,
}

impl HumanLabel {
    pub fn new(result: PassFail, note: Option<String>) -> Self {
        Self { result, note }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct LlmJudgement {
    pub result: PassFail,
    pub reason: String,
}

impl LlmJudgement {
    pub fn new(result: PassFail, reason: String) -> Self {
        Self { result, reason }
    }
}
