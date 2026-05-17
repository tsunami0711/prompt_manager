use serde::{Deserialize, Serialize};

use crate::domain::{CaseResultStatus, HumanLabel, LlmJudgement, PassFailOrState};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum FinalResultSource {
    Human,
    Llm,
    Run,
    None,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct FinalResult {
    pub result: PassFailOrState,
    pub source: FinalResultSource,
}

impl FinalResult {
    pub fn new(result: PassFailOrState, source: FinalResultSource) -> Self {
        Self { result, source }
    }
}

pub fn compute_final_result(
    run_status: CaseResultStatus,
    human_label: Option<HumanLabel>,
    llm_judgement: Option<LlmJudgement>,
) -> FinalResult {
    if run_status == CaseResultStatus::Error {
        return FinalResult::new(PassFailOrState::Error, FinalResultSource::Run);
    }

    if let Some(label) = human_label {
        return FinalResult::new(label.result.into(), FinalResultSource::Human);
    }

    if let Some(judgement) = llm_judgement {
        return FinalResult::new(judgement.result.into(), FinalResultSource::Llm);
    }

    FinalResult::new(PassFailOrState::Pending, FinalResultSource::None)
}

#[cfg(test)]
mod tests {
    include!("analytics_test.rs");
}
