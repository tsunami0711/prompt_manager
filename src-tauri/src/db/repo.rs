use chrono::Utc;
use rusqlite::{params, Connection};
use serde::Serialize;
use uuid::Uuid;

use crate::domain::{HumanLabel, LlmJudgement, PassFail};
use crate::error::AppResult;

#[derive(Debug, Clone, Serialize)]
pub struct PromptRecord {
    pub id: String,
    pub name: String,
    pub description: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PromptVersionRecord {
    pub id: String,
    pub prompt_id: String,
    pub version_name: String,
    pub content: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TestCaseRecord {
    pub id: String,
    pub prompt_id: String,
    pub title: String,
    pub input: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelConfigRecord {
    pub id: String,
    pub name: String,
    pub config_type: String,
    pub base_url: String,
    pub model: String,
    pub api_key_ref: String,
    pub temperature: f64,
    pub max_tokens: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EvaluationRunRecord {
    pub id: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CaseResultRecord {
    pub id: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LatestCaseResultSummary {
    pub case_result_id: String,
    pub prompt_version_id: String,
    pub test_case_id: String,
    pub run_status: String,
    pub human_label: Option<HumanLabel>,
    pub llm_judgement: Option<LlmJudgement>,
}

pub struct Repository {
    conn: Connection,
}

impl Repository {
    pub fn new(conn: Connection) -> Self {
        Self { conn }
    }

    fn now() -> String {
        Utc::now().to_rfc3339()
    }

    fn id() -> String {
        Uuid::new_v4().to_string()
    }

    pub fn create_prompt(&self, name: &str, description: &str) -> AppResult<PromptRecord> {
        let id = Self::id();
        let now = Self::now();
        self.conn.execute(
            "INSERT INTO prompts (id, name, description, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![id, name, description, now, now],
        )?;
        Ok(PromptRecord {
            id,
            name: name.to_string(),
            description: description.to_string(),
        })
    }

    pub fn create_prompt_version(
        &self,
        prompt_id: &str,
        version_name: &str,
        content: &str,
        note: Option<&str>,
    ) -> AppResult<PromptVersionRecord> {
        let id = Self::id();
        let now = Self::now();
        self.conn.execute(
            "INSERT INTO prompt_versions (id, prompt_id, version_name, content, note, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![id, prompt_id, version_name, content, note, now, now],
        )?;
        Ok(PromptVersionRecord {
            id,
            prompt_id: prompt_id.to_string(),
            version_name: version_name.to_string(),
            content: content.to_string(),
        })
    }

    pub fn create_test_case(
        &self,
        prompt_id: &str,
        title: &str,
        input: &str,
        tags: &str,
        note: Option<&str>,
    ) -> AppResult<TestCaseRecord> {
        let id = Self::id();
        let now = Self::now();
        self.conn.execute(
            "INSERT INTO test_cases (id, prompt_id, title, input, tags, note, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![id, prompt_id, title, input, tags, note, now, now],
        )?;
        Ok(TestCaseRecord {
            id,
            prompt_id: prompt_id.to_string(),
            title: title.to_string(),
            input: input.to_string(),
        })
    }

    pub fn create_model_config(
        &self,
        name: &str,
        config_type: &str,
        base_url: &str,
        model: &str,
        api_key_ref: &str,
        temperature: f64,
        max_tokens: i64,
    ) -> AppResult<ModelConfigRecord> {
        let id = Self::id();
        let now = Self::now();
        self.conn.execute(
            "INSERT INTO model_configs (id, name, config_type, base_url, model, api_key_ref, temperature, max_tokens, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![id, name, config_type, base_url, model, api_key_ref, temperature, max_tokens, now, now],
        )?;
        Ok(ModelConfigRecord {
            id,
            name: name.to_string(),
            config_type: config_type.to_string(),
            base_url: base_url.to_string(),
            model: model.to_string(),
            api_key_ref: api_key_ref.to_string(),
            temperature,
            max_tokens,
        })
    }

    pub fn create_evaluation_run(
        &self,
        prompt_id: &str,
        version_id: &str,
        run_model_config_id: &str,
        judge_mode: &str,
        judge_model_config_id: Option<&str>,
        judge_prompt: Option<&str>,
        case_scope: &str,
    ) -> AppResult<EvaluationRunRecord> {
        let id = Self::id();
        let now = Self::now();
        self.conn.execute(
            "INSERT INTO evaluation_runs (id, prompt_id, prompt_version_id, run_model_config_id, judge_mode, judge_model_config_id, judge_prompt, case_scope, status, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'running', ?9)",
            params![id, prompt_id, version_id, run_model_config_id, judge_mode, judge_model_config_id, judge_prompt, case_scope, now],
        )?;
        Ok(EvaluationRunRecord { id })
    }

    pub fn create_case_result(
        &self,
        run_id: &str,
        version_id: &str,
        case_id: &str,
        output: &str,
        status: &str,
        error_message: Option<&str>,
        latency_ms: i64,
    ) -> AppResult<CaseResultRecord> {
        let id = Self::id();
        let now = Self::now();
        self.conn.execute(
            "INSERT INTO case_results (id, evaluation_run_id, prompt_version_id, test_case_id, output, status, error_message, latency_ms, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![id, run_id, version_id, case_id, output, status, error_message, latency_ms, now],
        )?;
        Ok(CaseResultRecord { id })
    }

    pub fn create_llm_judgement(
        &self,
        case_result_id: &str,
        judge_model_config_id: &str,
        judge_prompt: &str,
        result: PassFail,
        reason: &str,
        raw_response: &str,
    ) -> AppResult<()> {
        let id = Self::id();
        let now = Self::now();
        self.conn.execute(
            "INSERT INTO llm_judgements (id, case_result_id, judge_model_config_id, judge_prompt, result, reason, raw_response, status, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'completed', ?8)",
            params![id, case_result_id, judge_model_config_id, judge_prompt, result.as_str(), reason, raw_response, now],
        )?;
        Ok(())
    }

    pub fn upsert_human_label(
        &self,
        case_result_id: &str,
        result: PassFail,
        note: Option<&str>,
    ) -> AppResult<()> {
        let id = Self::id();
        let now = Self::now();
        self.conn.execute(
            "INSERT INTO human_labels (id, case_result_id, result, note, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?5)
             ON CONFLICT(case_result_id) DO UPDATE SET result = excluded.result, note = excluded.note, updated_at = excluded.updated_at",
            params![id, case_result_id, result.as_str(), note, now],
        )?;
        Ok(())
    }

    pub fn latest_case_result(
        &self,
        prompt_version_id: &str,
        test_case_id: &str,
    ) -> AppResult<Option<LatestCaseResultSummary>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, prompt_version_id, test_case_id, status FROM case_results WHERE prompt_version_id = ?1 AND test_case_id = ?2 ORDER BY created_at DESC LIMIT 1",
        )?;
        let mut rows = stmt.query(params![prompt_version_id, test_case_id])?;
        let Some(row) = rows.next()? else {
            return Ok(None);
        };
        let case_result_id: String = row.get(0)?;
        let prompt_version_id: String = row.get(1)?;
        let test_case_id: String = row.get(2)?;
        let run_status: String = row.get(3)?;
        let human_label = self.load_human_label(&case_result_id)?;
        let llm_judgement = self.load_llm_judgement(&case_result_id)?;
        Ok(Some(LatestCaseResultSummary {
            case_result_id,
            prompt_version_id,
            test_case_id,
            run_status,
            human_label,
            llm_judgement,
        }))
    }

    fn parse_pass_fail(value: String) -> PassFail {
        match value.as_str() {
            "pass" => PassFail::Pass,
            "fail" => PassFail::Fail,
            other => panic!("invalid stored pass/fail value: {other}"),
        }
    }

    fn load_human_label(&self, case_result_id: &str) -> AppResult<Option<HumanLabel>> {
        let mut stmt = self
            .conn
            .prepare("SELECT result, note FROM human_labels WHERE case_result_id = ?1")?;
        let mut rows = stmt.query(params![case_result_id])?;
        let Some(row) = rows.next()? else {
            return Ok(None);
        };
        let result: String = row.get(0)?;
        let note: Option<String> = row.get(1)?;
        Ok(Some(HumanLabel::new(Self::parse_pass_fail(result), note)))
    }

    fn load_llm_judgement(&self, case_result_id: &str) -> AppResult<Option<LlmJudgement>> {
        let mut stmt = self
            .conn
            .prepare("SELECT result, reason FROM llm_judgements WHERE case_result_id = ?1 AND status = 'completed' ORDER BY created_at DESC LIMIT 1")?;
        let mut rows = stmt.query(params![case_result_id])?;
        let Some(row) = rows.next()? else {
            return Ok(None);
        };
        let result: String = row.get(0)?;
        let reason: String = row.get(1)?;
        Ok(Some(LlmJudgement::new(Self::parse_pass_fail(result), reason)))
    }
}
