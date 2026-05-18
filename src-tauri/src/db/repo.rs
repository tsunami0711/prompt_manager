use chrono::Utc;
use rusqlite::{params, Connection, OptionalExtension};
use serde::Serialize;
use uuid::Uuid;

use crate::domain::{HumanLabel, LlmJudgement, PassFail};
use crate::error::{AppError, AppResult};

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

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RunHistoryItem {
    pub id: String,
    pub status: String,
    pub prompt_version_name: String,
    pub case_scope: String,
    pub judge_mode: String,
    pub started_at: String,
    pub finished_at: Option<String>,
    pub success_count: i64,
    pub error_count: i64,
}

#[derive(Debug, Clone)]
pub struct JudgePlan {
    pub model: ModelConfigRecord,
    pub prompt: String,
}

#[derive(Debug, Clone)]
pub struct RunPlan {
    pub run: EvaluationRunRecord,
    pub prompt_version: PromptVersionRecord,
    pub run_model: ModelConfigRecord,
    pub judge: Option<JudgePlan>,
    pub cases: Vec<TestCaseRecord>,
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

    pub fn list_prompts(&self) -> AppResult<Vec<PromptRecord>> {
        let mut stmt = self
            .conn
            .prepare("SELECT id, name, description FROM prompts ORDER BY updated_at DESC")?;
        let rows = stmt.query_map([], |row| {
            Ok(PromptRecord {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
            })
        })?;
        rows.collect::<Result<Vec<_>, _>>().map_err(Into::into)
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

    pub fn list_prompt_versions(&self, prompt_id: &str) -> AppResult<Vec<PromptVersionRecord>> {
        let mut stmt = self.conn.prepare("SELECT id, prompt_id, version_name, content FROM prompt_versions WHERE prompt_id = ?1 ORDER BY created_at DESC")?;
        let rows = stmt.query_map(params![prompt_id], |row| {
            Ok(PromptVersionRecord {
                id: row.get(0)?,
                prompt_id: row.get(1)?,
                version_name: row.get(2)?,
                content: row.get(3)?,
            })
        })?;
        rows.collect::<Result<Vec<_>, _>>().map_err(Into::into)
    }

    pub fn update_prompt_version_content(
        &self,
        prompt_version_id: &str,
        content: &str,
    ) -> AppResult<PromptVersionRecord> {
        let now = Self::now();
        let updated = self.conn.execute(
            "UPDATE prompt_versions SET content = ?1, updated_at = ?2 WHERE id = ?3",
            params![content, now, prompt_version_id],
        )?;
        if updated == 0 {
            return Err(AppError::Validation(
                "prompt version does not exist".to_string(),
            ));
        }

        let mut stmt = self.conn.prepare(
            "SELECT id, prompt_id, version_name, content FROM prompt_versions WHERE id = ?1",
        )?;
        let record = stmt.query_row(params![prompt_version_id], |row| {
            Ok(PromptVersionRecord {
                id: row.get(0)?,
                prompt_id: row.get(1)?,
                version_name: row.get(2)?,
                content: row.get(3)?,
            })
        })?;
        Ok(record)
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

    pub fn list_test_cases(&self, prompt_id: &str) -> AppResult<Vec<TestCaseRecord>> {
        let mut stmt = self.conn.prepare("SELECT id, prompt_id, title, input FROM test_cases WHERE prompt_id = ?1 ORDER BY created_at ASC")?;
        let rows = stmt.query_map(params![prompt_id], |row| {
            Ok(TestCaseRecord {
                id: row.get(0)?,
                prompt_id: row.get(1)?,
                title: row.get(2)?,
                input: row.get(3)?,
            })
        })?;
        rows.collect::<Result<Vec<_>, _>>().map_err(Into::into)
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

    pub fn list_model_configs(&self, config_type: &str) -> AppResult<Vec<ModelConfigRecord>> {
        let mut stmt = self.conn.prepare("SELECT id, name, config_type, base_url, model, api_key_ref, temperature, max_tokens FROM model_configs WHERE config_type = ?1 ORDER BY name ASC")?;
        let rows = stmt.query_map(params![config_type], |row| {
            Ok(ModelConfigRecord {
                id: row.get(0)?,
                name: row.get(1)?,
                config_type: row.get(2)?,
                base_url: row.get(3)?,
                model: row.get(4)?,
                api_key_ref: row.get(5)?,
                temperature: row.get(6)?,
                max_tokens: row.get(7)?,
            })
        })?;
        rows.collect::<Result<Vec<_>, _>>().map_err(Into::into)
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
        if !self.prompt_version_belongs_to_prompt(version_id, prompt_id)? {
            return Err(AppError::Validation(
                "prompt version does not belong to prompt".to_string(),
            ));
        }

        let id = Self::id();
        let now = Self::now();
        self.conn.execute(
            "INSERT INTO evaluation_runs (id, prompt_id, prompt_version_id, run_model_config_id, judge_mode, judge_model_config_id, judge_prompt, case_scope, status, started_at, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'running', ?9, ?9)",
            params![id, prompt_id, version_id, run_model_config_id, judge_mode, judge_model_config_id, judge_prompt, case_scope, now],
        )?;
        Ok(EvaluationRunRecord { id })
    }

    pub fn build_run_plan(
        &self,
        input: &crate::commands::RunCasesInput,
    ) -> AppResult<RunPlan> {
        if input.case_ids.is_empty() {
            return Err(AppError::Validation(
                "select at least one case".to_string(),
            ));
        }

        let prompt_version = self.get_prompt_version(&input.prompt_version_id)?;
        let run_model = self.get_model_config(&input.run_model_config_id)?;
        if run_model.config_type != "run" {
            return Err(AppError::Validation(
                "run model config must have type 'run'".to_string(),
            ));
        }

        let cases = self.get_test_cases_by_ids(&input.case_ids)?;
        for test_case in &cases {
            if test_case.prompt_id != prompt_version.prompt_id {
                return Err(AppError::Validation(
                    "selected case does not belong to prompt version prompt".to_string(),
                ));
            }
        }

        let judge = match input.judge_mode.as_str() {
            "human" => None,
            "llm" => {
                let judge_model_id = input.judge_model_config_id.as_deref().ok_or_else(|| {
                    AppError::Validation("judge model is required for LLM judge".to_string())
                })?;
                let judge_prompt = input
                    .judge_prompt
                    .as_deref()
                    .map(str::trim)
                    .filter(|prompt| !prompt.is_empty())
                    .ok_or_else(|| {
                        AppError::Validation("judge prompt is required for LLM judge".to_string())
                    })?;
                let model = self.get_model_config(judge_model_id)?;
                if model.config_type != "judge" {
                    return Err(AppError::Validation(
                        "judge model config must have type 'judge'".to_string(),
                    ));
                }
                Some(JudgePlan {
                    model,
                    prompt: judge_prompt.to_string(),
                })
            }
            _ => {
                return Err(AppError::Validation(
                    "judge_mode must be either 'human' or 'llm'".to_string(),
                ))
            }
        };

        let run = self.create_evaluation_run(
            &prompt_version.prompt_id,
            &prompt_version.id,
            &run_model.id,
            &input.judge_mode,
            judge.as_ref().map(|plan| plan.model.id.as_str()),
            judge.as_ref().map(|plan| plan.prompt.as_str()),
            "selected",
        )?;

        Ok(RunPlan {
            run,
            prompt_version,
            run_model,
            judge,
            cases,
        })
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
        let Some((run_prompt_id, run_version_id)) = self.run_prompt_and_version(run_id)? else {
            return Err(AppError::Validation(
                "evaluation run does not exist".to_string(),
            ));
        };
        if run_version_id != version_id {
            return Err(AppError::Validation(
                "case result version does not match evaluation run version".to_string(),
            ));
        }
        if !self.prompt_version_belongs_to_prompt(version_id, &run_prompt_id)? {
            return Err(AppError::Validation(
                "prompt version does not belong to evaluation run prompt".to_string(),
            ));
        }
        if !self.test_case_belongs_to_prompt(case_id, &run_prompt_id)? {
            return Err(AppError::Validation(
                "test case does not belong to evaluation run prompt".to_string(),
            ));
        }

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

    pub fn create_llm_judgement_error(
        &self,
        case_result_id: &str,
        judge_model_config_id: &str,
        judge_prompt: &str,
        raw_response: &str,
        error_message: &str,
    ) -> AppResult<()> {
        let id = Self::id();
        let now = Self::now();
        self.conn.execute(
            "INSERT INTO llm_judgements (id, case_result_id, judge_model_config_id, judge_prompt, result, reason, raw_response, status, error_message, created_at) VALUES (?1, ?2, ?3, ?4, NULL, '', ?5, 'error', ?6, ?7)",
            params![id, case_result_id, judge_model_config_id, judge_prompt, raw_response, error_message, now],
        )?;
        Ok(())
    }

    pub fn finish_evaluation_run(&self, run_id: &str) -> AppResult<()> {
        let now = Self::now();
        let updated = self.conn.execute(
            "UPDATE evaluation_runs SET status = 'completed', finished_at = ?1 WHERE id = ?2",
            params![now, run_id],
        )?;
        if updated == 0 {
            return Err(AppError::Validation(
                "evaluation run does not exist".to_string(),
            ));
        }
        Ok(())
    }

    pub fn mark_evaluation_run_error(&self, run_id: &str) -> AppResult<()> {
        let now = Self::now();
        let changed = self.conn.execute(
            "UPDATE evaluation_runs SET status = 'error', finished_at = ?1 WHERE id = ?2",
            params![now, run_id],
        )?;
        if changed == 0 {
            return Err(AppError::Validation(
                "evaluation run not found".to_string(),
            ));
        }
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
            "SELECT id, prompt_version_id, test_case_id, status FROM case_results WHERE prompt_version_id = ?1 AND test_case_id = ?2 ORDER BY created_at DESC, rowid DESC LIMIT 1",
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

    pub fn list_latest_case_results_for_prompt(
        &self,
        prompt_id: &str,
    ) -> AppResult<Vec<LatestCaseResultSummary>> {
        let versions = self.list_prompt_versions(prompt_id)?;
        let cases = self.list_test_cases(prompt_id)?;
        let mut summaries = Vec::new();
        for version in versions {
            for test_case in &cases {
                if let Some(summary) = self.latest_case_result(&version.id, &test_case.id)? {
                    summaries.push(summary);
                }
            }
        }
        Ok(summaries)
    }

    pub fn list_run_history_for_prompt(&self, prompt_id: &str) -> AppResult<Vec<RunHistoryItem>> {
        let mut stmt = self.conn.prepare(
            "SELECT
                er.id,
                er.status,
                pv.version_name,
                er.case_scope,
                er.judge_mode,
                COALESCE(er.started_at, er.created_at) AS started_at,
                er.finished_at,
                COALESCE(SUM(CASE WHEN cr.status = 'completed' THEN 1 ELSE 0 END), 0) AS success_count,
                COALESCE(SUM(CASE WHEN cr.status = 'error' THEN 1 ELSE 0 END), 0) AS error_count
             FROM evaluation_runs er
             JOIN prompt_versions pv ON pv.id = er.prompt_version_id
             LEFT JOIN case_results cr ON cr.evaluation_run_id = er.id
             WHERE er.prompt_id = ?1
             GROUP BY er.id, er.status, pv.version_name, er.case_scope, er.judge_mode, er.started_at, er.created_at, er.finished_at
             ORDER BY er.created_at DESC
             LIMIT 50",
        )?;
        let rows = stmt.query_map(params![prompt_id], |row| {
            Ok(RunHistoryItem {
                id: row.get(0)?,
                status: row.get(1)?,
                prompt_version_name: row.get(2)?,
                case_scope: row.get(3)?,
                judge_mode: row.get(4)?,
                started_at: row.get(5)?,
                finished_at: row.get(6)?,
                success_count: row.get(7)?,
                error_count: row.get(8)?,
            })
        })?;
        rows.collect::<Result<Vec<_>, _>>().map_err(Into::into)
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

    fn prompt_version_belongs_to_prompt(
        &self,
        version_id: &str,
        prompt_id: &str,
    ) -> AppResult<bool> {
        let count: i64 = self.conn.query_row(
            "SELECT COUNT(*) FROM prompt_versions WHERE id = ?1 AND prompt_id = ?2",
            params![version_id, prompt_id],
            |row| row.get(0),
        )?;
        Ok(count == 1)
    }

    fn run_prompt_and_version(&self, run_id: &str) -> AppResult<Option<(String, String)>> {
        self.conn
            .query_row(
                "SELECT prompt_id, prompt_version_id FROM evaluation_runs WHERE id = ?1",
                params![run_id],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .optional()
            .map_err(AppError::from)
    }

    fn test_case_belongs_to_prompt(&self, case_id: &str, prompt_id: &str) -> AppResult<bool> {
        let count: i64 = self.conn.query_row(
            "SELECT COUNT(*) FROM test_cases WHERE id = ?1 AND prompt_id = ?2",
            params![case_id, prompt_id],
            |row| row.get(0),
        )?;
        Ok(count == 1)
    }

    fn get_prompt_version(&self, prompt_version_id: &str) -> AppResult<PromptVersionRecord> {
        self.conn
            .query_row(
                "SELECT id, prompt_id, version_name, content FROM prompt_versions WHERE id = ?1",
                params![prompt_version_id],
                |row| {
                    Ok(PromptVersionRecord {
                        id: row.get(0)?,
                        prompt_id: row.get(1)?,
                        version_name: row.get(2)?,
                        content: row.get(3)?,
                    })
                },
            )
            .optional()?
            .ok_or_else(|| AppError::Validation("prompt version does not exist".to_string()))
    }

    fn get_model_config(&self, model_config_id: &str) -> AppResult<ModelConfigRecord> {
        self.conn
            .query_row(
                "SELECT id, name, config_type, base_url, model, api_key_ref, temperature, max_tokens FROM model_configs WHERE id = ?1",
                params![model_config_id],
                |row| {
                    Ok(ModelConfigRecord {
                        id: row.get(0)?,
                        name: row.get(1)?,
                        config_type: row.get(2)?,
                        base_url: row.get(3)?,
                        model: row.get(4)?,
                        api_key_ref: row.get(5)?,
                        temperature: row.get(6)?,
                        max_tokens: row.get(7)?,
                    })
                },
            )
            .optional()?
            .ok_or_else(|| AppError::Validation("model config does not exist".to_string()))
    }

    fn get_test_cases_by_ids(&self, case_ids: &[String]) -> AppResult<Vec<TestCaseRecord>> {
        let mut cases = Vec::with_capacity(case_ids.len());
        for case_id in case_ids {
            let test_case = self
                .conn
                .query_row(
                    "SELECT id, prompt_id, title, input FROM test_cases WHERE id = ?1",
                    params![case_id],
                    |row| {
                        Ok(TestCaseRecord {
                            id: row.get(0)?,
                            prompt_id: row.get(1)?,
                            title: row.get(2)?,
                            input: row.get(3)?,
                        })
                    },
                )
                .optional()?
                .ok_or_else(|| AppError::Validation("test case does not exist".to_string()))?;
            cases.push(test_case);
        }
        Ok(cases)
    }

    #[cfg(test)]
    pub fn set_case_result_created_at_for_test(
        &self,
        case_result_id: &str,
        created_at: &str,
    ) -> AppResult<()> {
        self.conn.execute(
            "UPDATE case_results SET created_at = ?1 WHERE id = ?2",
            params![created_at, case_result_id],
        )?;
        Ok(())
    }

    #[cfg(test)]
    pub fn evaluation_run_status_for_test(&self, run_id: &str) -> AppResult<String> {
        self.conn
            .query_row(
                "SELECT status FROM evaluation_runs WHERE id = ?1",
                params![run_id],
                |row| row.get(0),
            )
            .map_err(Into::into)
    }

    #[cfg(test)]
    pub fn llm_judgement_error_for_test(
        &self,
        case_result_id: &str,
    ) -> AppResult<Option<(String, String, String)>> {
        self.conn
            .query_row(
                "SELECT raw_response, error_message, status FROM llm_judgements WHERE case_result_id = ?1",
                params![case_result_id],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
            )
            .optional()
            .map_err(Into::into)
    }
}
