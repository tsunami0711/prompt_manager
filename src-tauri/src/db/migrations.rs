use rusqlite::Connection;

pub fn migrate(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute_batch(
        r#"
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS prompts (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          default_run_model_config_id TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS prompt_versions (
          id TEXT PRIMARY KEY,
          prompt_id TEXT NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
          version_name TEXT NOT NULL,
          content TEXT NOT NULL,
          note TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS test_cases (
          id TEXT PRIMARY KEY,
          prompt_id TEXT NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          input TEXT NOT NULL,
          tags TEXT NOT NULL DEFAULT '',
          note TEXT,
          enabled INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS model_configs (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          config_type TEXT NOT NULL CHECK(config_type IN ('run', 'judge')),
          base_url TEXT NOT NULL,
          model TEXT NOT NULL,
          api_key_ref TEXT NOT NULL,
          temperature REAL NOT NULL,
          max_tokens INTEGER NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS evaluation_runs (
          id TEXT PRIMARY KEY,
          prompt_id TEXT NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
          prompt_version_id TEXT NOT NULL REFERENCES prompt_versions(id) ON DELETE CASCADE,
          run_model_config_id TEXT NOT NULL REFERENCES model_configs(id),
          judge_mode TEXT NOT NULL CHECK(judge_mode IN ('human', 'llm')),
          judge_model_config_id TEXT REFERENCES model_configs(id),
          judge_prompt TEXT,
          case_scope TEXT NOT NULL CHECK(case_scope IN ('selected', 'all')),
          status TEXT NOT NULL CHECK(status IN ('pending', 'running', 'completed', 'error')),
          started_at TEXT,
          finished_at TEXT,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS case_results (
          id TEXT PRIMARY KEY,
          evaluation_run_id TEXT NOT NULL REFERENCES evaluation_runs(id) ON DELETE CASCADE,
          prompt_version_id TEXT NOT NULL REFERENCES prompt_versions(id) ON DELETE CASCADE,
          test_case_id TEXT NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
          output TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL CHECK(status IN ('pending', 'running', 'completed', 'error')),
          error_message TEXT,
          latency_ms INTEGER NOT NULL DEFAULT 0,
          token_usage_json TEXT,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS llm_judgements (
          id TEXT PRIMARY KEY,
          case_result_id TEXT NOT NULL REFERENCES case_results(id) ON DELETE CASCADE,
          judge_model_config_id TEXT NOT NULL REFERENCES model_configs(id),
          judge_prompt TEXT NOT NULL,
          result TEXT CHECK(result IN ('pass', 'fail')),
          reason TEXT NOT NULL DEFAULT '',
          raw_response TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL CHECK(status IN ('completed', 'error')),
          error_message TEXT,
          created_at TEXT NOT NULL,
          CHECK((status = 'completed' AND result IS NOT NULL) OR status = 'error')
        );

        CREATE TABLE IF NOT EXISTS human_labels (
          id TEXT PRIMARY KEY,
          case_result_id TEXT NOT NULL UNIQUE REFERENCES case_results(id) ON DELETE CASCADE,
          result TEXT NOT NULL CHECK(result IN ('pass', 'fail')),
          note TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_versions_prompt ON prompt_versions(prompt_id);
        CREATE INDEX IF NOT EXISTS idx_cases_prompt ON test_cases(prompt_id);
        CREATE INDEX IF NOT EXISTS idx_results_version_case ON case_results(prompt_version_id, test_case_id, created_at);
        CREATE INDEX IF NOT EXISTS idx_llm_judgements_case_status_created ON llm_judgements(case_result_id, status, created_at);
        "#,
    )
}
