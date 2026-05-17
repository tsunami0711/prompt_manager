# Prompt Manager MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local desktop Prompt Manager MVP for pure-text prompt versions, pure-text test cases, pass/fail evaluation, LLM-as-Judge, manual labelling, version matrix comparison, and single-version case review.

**Architecture:** Use a Tauri desktop shell with a React/TypeScript frontend and a Rust backend. Rust owns SQLite persistence, OS keychain access, OpenAI-compatible HTTP calls, run orchestration, and judgement parsing; React owns navigation, tables, editing forms, and review workflows.

**Tech Stack:** Tauri 2, React, TypeScript, Vite, Vitest, Testing Library, Rust, rusqlite, reqwest, serde, keyring, tempfile, wiremock.

---

## Source Spec

Implement from `docs/superpowers/specs/2026-05-17-prompt-manager-mvp-design.md`.

## Planned File Structure

### Project Configuration

- Create `package.json`: npm scripts, frontend dependencies, Tauri CLI, Vitest.
- Create `index.html`: Vite root.
- Create `tsconfig.json`: strict TypeScript config.
- Create `tsconfig.node.json`: Vite config TypeScript config.
- Create `vite.config.ts`: React/Vite/Vitest setup.
- Create `src-tauri/Cargo.toml`: Rust dependencies.
- Create `src-tauri/tauri.conf.json`: Tauri app config.
- Create `src-tauri/build.rs`: Tauri build hook.
- Create `src-tauri/capabilities/default.json`: Tauri command permissions.

### Backend

- Create `src-tauri/src/main.rs`: Tauri application entry and command registration.
- Create `src-tauri/src/state.rs`: application state with SQLite path and connection helpers.
- Create `src-tauri/src/error.rs`: shared error type and command result conversion.
- Create `src-tauri/src/domain.rs`: backend domain types shared by commands.
- Create `src-tauri/src/db/mod.rs`: database module exports.
- Create `src-tauri/src/db/migrations.rs`: SQLite schema creation.
- Create `src-tauri/src/db/repo.rs`: CRUD and query functions.
- Create `src-tauri/src/secrets.rs`: OS keychain storage and lookup.
- Create `src-tauri/src/model_client.rs`: OpenAI-compatible chat completion client.
- Create `src-tauri/src/judge.rs`: judge JSON parsing and judge request building.
- Create `src-tauri/src/evaluation.rs`: run orchestration.
- Create `src-tauri/src/analytics.rs`: final result, pass rate, trend calculation.
- Create `src-tauri/src/commands.rs`: Tauri command handlers.

### Frontend

- Create `src/main.tsx`: React entry.
- Create `src/App.tsx`: app shell and state wiring.
- Create `src/styles.css`: application styling.
- Create `src/types.ts`: frontend types.
- Create `src/lib/api.ts`: typed Tauri command wrapper.
- Create `src/domain/finalResult.ts`: frontend final-result helpers.
- Create `src/domain/matrix.ts`: frontend matrix filtering and trend helpers.
- Create `src/components/Sidebar.tsx`: prompt and version navigation.
- Create `src/components/Tabs.tsx`: workspace tabs.
- Create `src/components/PromptEditor.tsx`: prompt version editor and case list entry point.
- Create `src/components/CaseManager.tsx`: pure-text case management.
- Create `src/components/RunControls.tsx`: run selected/all and judge mode controls.
- Create `src/components/VersionMatrix.tsx`: cross-version result matrix.
- Create `src/components/VersionCaseResults.tsx`: single-version case review page.
- Create `src/components/RunHistory.tsx`: run history list.
- Create `src/components/ModelConfigDialog.tsx`: run and judge model configuration UI.
- Create `src/components/ResultBadge.tsx`: status badge rendering.

### Tests

- Create `src/domain/finalResult.test.ts`.
- Create `src/domain/matrix.test.ts`.
- Create `src/components/VersionMatrix.test.tsx`.
- Create `src/components/VersionCaseResults.test.tsx`.
- Create `src-tauri/src/analytics_test.rs`.
- Create `src-tauri/src/judge_test.rs`.
- Create `src-tauri/src/db/repo_test.rs`.
- Create `src-tauri/src/evaluation_test.rs`.

## Task 1: Bootstrap Tauri, React, TypeScript, and Test Tooling

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Create: `src-tauri/Cargo.toml`
- Create: `src-tauri/tauri.conf.json`
- Create: `src-tauri/build.rs`
- Create: `src-tauri/src/main.rs`
- Create: `src-tauri/capabilities/default.json`

- [ ] **Step 1: Create frontend package configuration**

Create `package.json` with this content:

```json
{
  "name": "prompt-manager",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "tauri": "tauri",
    "desktop": "tauri dev"
  },
  "dependencies": {
    "@tauri-apps/api": "^2.0.0",
    "clsx": "^2.1.1",
    "lucide-react": "^0.468.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.0.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "jsdom": "^25.0.1",
    "typescript": "^5.6.3",
    "vite": "^5.4.11",
    "vitest": "^2.1.5"
  }
}
```

- [ ] **Step 2: Create Vite and TypeScript configuration**

Create `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Prompt Manager</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

Create `vite.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true
  },
  envPrefix: ["VITE_", "TAURI_"],
  build: {
    target: "es2020",
    minify: false,
    sourcemap: true
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: []
  }
});
```

- [ ] **Step 3: Create minimal React shell**

Create `src/main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

Create `src/App.tsx`:

```tsx
export default function App() {
  return (
    <main className="app-shell">
      <section className="empty-state">
        <h1>Prompt Manager</h1>
        <p>Local prompt version evaluation workbench.</p>
      </section>
    </main>
  );
}
```

Create `src/styles.css`:

```css
:root {
  color: #111827;
  background: #f8fafc;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 960px;
  min-height: 100vh;
}

button,
input,
textarea,
select {
  font: inherit;
}

.app-shell {
  min-height: 100vh;
  background: #f8fafc;
}

.empty-state {
  display: grid;
  min-height: 100vh;
  place-content: center;
  text-align: center;
}

.empty-state h1 {
  margin: 0 0 8px;
  font-size: 32px;
}

.empty-state p {
  margin: 0;
  color: #64748b;
}
```

- [ ] **Step 4: Create Tauri configuration**

Create `src-tauri/Cargo.toml`:

```toml
[package]
name = "prompt-manager"
version = "0.1.0"
description = "Local prompt version evaluation workbench"
authors = ["Prompt Manager"]
license = ""
repository = ""
edition = "2021"

[build-dependencies]
tauri-build = { version = "2.0.0", features = [] }

[dependencies]
chrono = { version = "0.4", features = ["serde"] }
keyring = "3.6"
reqwest = { version = "0.12", features = ["json"] }
rusqlite = { version = "0.32", features = ["bundled"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tauri = { version = "2.0.0", features = [] }
thiserror = "2"
tokio = { version = "1", features = ["macros", "rt-multi-thread"] }
uuid = { version = "1", features = ["v4", "serde"] }

[dev-dependencies]
tempfile = "3"
wiremock = "0.6"
```

Create `src-tauri/tauri.conf.json`:

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "Prompt Manager",
  "version": "0.1.0",
  "identifier": "com.promptmanager.app",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:1420",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "Prompt Manager",
        "width": 1280,
        "height": 820,
        "minWidth": 960,
        "minHeight": 680
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": []
  }
}
```

Create `src-tauri/build.rs`:

```rust
fn main() {
    tauri_build::build();
}
```

Create `src-tauri/src/main.rs`:

```rust
fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("failed to run Prompt Manager");
}
```

Create `src-tauri/capabilities/default.json`:

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Default app capability",
  "windows": ["main"],
  "permissions": ["core:default"]
}
```

- [ ] **Step 5: Install dependencies**

Run:

```bash
npm install
```

Expected: npm installs dependencies and creates `package-lock.json`.

- [ ] **Step 6: Verify frontend build**

Run:

```bash
npm run build
```

Expected: TypeScript and Vite finish successfully and create `dist/`.

- [ ] **Step 7: Verify backend compiles**

Run:

```bash
cargo test --manifest-path src-tauri/Cargo.toml
```

Expected: Cargo compiles the Tauri backend and reports zero test failures.

- [ ] **Step 8: Commit scaffold**

```bash
git add package.json package-lock.json index.html tsconfig.json tsconfig.node.json vite.config.ts src src-tauri
git commit -m "chore: scaffold Tauri React app"
```

## Task 2: Add Domain Types and Final Result Rules

**Files:**
- Create: `src/types.ts`
- Create: `src/domain/finalResult.ts`
- Create: `src/domain/finalResult.test.ts`
- Create: `src-tauri/src/domain.rs`
- Create: `src-tauri/src/analytics.rs`
- Create: `src-tauri/src/analytics_test.rs`
- Modify: `src-tauri/src/main.rs`

- [ ] **Step 1: Write frontend final-result tests**

Create `src/domain/finalResult.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { computeFinalResult } from "./finalResult";
import type { CaseResultSummary } from "../types";

const base: CaseResultSummary = {
  caseResultId: "result-1",
  promptVersionId: "version-1",
  testCaseId: "case-1",
  runStatus: "completed",
  llmJudgement: null,
  humanLabel: null
};

describe("computeFinalResult", () => {
  it("returns error when the prompt run failed", () => {
    expect(computeFinalResult({ ...base, runStatus: "error" })).toEqual({
      result: "error",
      source: "run"
    });
  });

  it("uses human label before LLM judgement", () => {
    expect(
      computeFinalResult({
        ...base,
        llmJudgement: { result: "pass", reason: "judge approved" },
        humanLabel: { result: "fail", note: "reviewer rejected" }
      })
    ).toEqual({ result: "fail", source: "human" });
  });

  it("uses LLM judgement when no human label exists", () => {
    expect(
      computeFinalResult({
        ...base,
        llmJudgement: { result: "pass", reason: "judge approved" }
      })
    ).toEqual({ result: "pass", source: "llm" });
  });

  it("returns pending when no judgement exists", () => {
    expect(computeFinalResult(base)).toEqual({
      result: "pending",
      source: "none"
    });
  });
});
```

- [ ] **Step 2: Run frontend test to verify it fails**

Run:

```bash
npm run test -- src/domain/finalResult.test.ts
```

Expected: FAIL because `src/domain/finalResult.ts` and `src/types.ts` do not exist.

- [ ] **Step 3: Add frontend domain types and final-result helper**

Create `src/types.ts`:

```ts
export type PassFail = "pass" | "fail";
export type FinalResultValue = PassFail | "pending" | "error";
export type FinalResultSource = "human" | "llm" | "run" | "none";
export type CaseRunStatus = "pending" | "running" | "completed" | "error";

export interface LlmJudgementSummary {
  result: PassFail;
  reason: string;
}

export interface HumanLabelSummary {
  result: PassFail;
  note: string | null;
}

export interface CaseResultSummary {
  caseResultId: string | null;
  promptVersionId: string;
  testCaseId: string;
  runStatus: CaseRunStatus;
  llmJudgement: LlmJudgementSummary | null;
  humanLabel: HumanLabelSummary | null;
}

export interface FinalResult {
  result: FinalResultValue;
  source: FinalResultSource;
}
```

Create `src/domain/finalResult.ts`:

```ts
import type { CaseResultSummary, FinalResult } from "../types";

export function computeFinalResult(summary: CaseResultSummary): FinalResult {
  if (summary.runStatus === "error") {
    return { result: "error", source: "run" };
  }

  if (summary.humanLabel) {
    return { result: summary.humanLabel.result, source: "human" };
  }

  if (summary.llmJudgement) {
    return { result: summary.llmJudgement.result, source: "llm" };
  }

  return { result: "pending", source: "none" };
}
```

- [ ] **Step 4: Run frontend test to verify it passes**

Run:

```bash
npm run test -- src/domain/finalResult.test.ts
```

Expected: PASS.

- [ ] **Step 5: Write backend analytics tests**

Create `src-tauri/src/analytics_test.rs`:

```rust
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
```

- [ ] **Step 6: Run backend test to verify it fails**

Run:

```bash
cargo test --manifest-path src-tauri/Cargo.toml analytics
```

Expected: FAIL because `analytics`, `domain`, and `PassFailOrState` are not defined.

- [ ] **Step 7: Add backend domain and analytics implementation**

Create `src-tauri/src/domain.rs`:

```rust
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
```

Create `src-tauri/src/analytics.rs`:

```rust
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
    pub value: PassFailOrState,
    pub source: FinalResultSource,
}

impl FinalResult {
    pub fn new(value: PassFailOrState, source: FinalResultSource) -> Self {
        Self { value, source }
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
```

Modify `src-tauri/src/main.rs`:

```rust
mod analytics;
mod domain;

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("failed to run Prompt Manager");
}
```

- [ ] **Step 8: Run backend tests**

Run:

```bash
cargo test --manifest-path src-tauri/Cargo.toml analytics
```

Expected: PASS.

- [ ] **Step 9: Commit domain rules**

```bash
git add src/types.ts src/domain src-tauri/src/domain.rs src-tauri/src/analytics.rs src-tauri/src/analytics_test.rs src-tauri/src/main.rs
git commit -m "feat: add final result domain rules"
```

## Task 3: Add SQLite Schema and Repository Layer

**Files:**
- Create: `src-tauri/src/error.rs`
- Create: `src-tauri/src/state.rs`
- Create: `src-tauri/src/db/mod.rs`
- Create: `src-tauri/src/db/migrations.rs`
- Create: `src-tauri/src/db/repo.rs`
- Create: `src-tauri/src/db/repo_test.rs`
- Modify: `src-tauri/src/main.rs`

- [ ] **Step 1: Write repository tests**

Create `src-tauri/src/db/repo_test.rs` with tests for prompt, version, case, model config, run, result, LLM judgement, and human label persistence:

```rust
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
        .create_test_case(&prompt.id, "City preference", "I prefer Shanghai events", "memory", None)
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
        .create_model_config("Local", "run", "http://localhost:8000/v1", "test-model", "key-ref", 0.0, 512)
        .expect("model");
    let run = repo
        .create_evaluation_run(&prompt.id, &version.id, &model.id, "human", None, None, "selected")
        .expect("run");
    let result = repo
        .create_case_result(&run.id, &version.id, &case.id, "Hello Leo", "completed", None, 42)
        .expect("result");

    repo.create_llm_judgement(&result.id, &model.id, "judge prompt", PassFail::Pass, "good", r#"{"result":"pass","reason":"good"}"#)
        .expect("llm judgement");
    repo.upsert_human_label(&result.id, PassFail::Fail, Some("too terse"))
        .expect("human label");

    let latest = repo
        .latest_case_result(&version.id, &case.id)
        .expect("latest result")
        .expect("result exists");

    assert_eq!(latest.case_result_id, result.id);
    assert_eq!(latest.human_label.expect("human label").result, PassFail::Fail);
    assert_eq!(latest.llm_judgement.expect("llm judgement").result, PassFail::Pass);
}
```

- [ ] **Step 2: Run repository tests to verify they fail**

Run:

```bash
cargo test --manifest-path src-tauri/Cargo.toml db
```

Expected: FAIL because database modules do not exist.

- [ ] **Step 3: Add shared error and migration module**

Create `src-tauri/src/error.rs`:

```rust
use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("database error: {0}")]
    Database(#[from] rusqlite::Error),
    #[error("http error: {0}")]
    Http(#[from] reqwest::Error),
    #[error("json error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("{0}")]
    Validation(String),
}

#[derive(Debug, Serialize)]
pub struct CommandError {
    pub message: String,
}

impl From<AppError> for CommandError {
    fn from(value: AppError) -> Self {
        Self {
            message: value.to_string(),
        }
    }
}

pub type AppResult<T> = Result<T, AppError>;
```

Create `src-tauri/src/db/mod.rs`:

```rust
pub mod migrations;
pub mod repo;
```

Create `src-tauri/src/db/migrations.rs`:

```rust
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
          status TEXT NOT NULL,
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
          created_at TEXT NOT NULL
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
        "#,
    )
}
```

- [ ] **Step 4: Add repository implementation**

Create `src-tauri/src/db/repo.rs` with concrete CRUD methods. Use this skeleton and add the methods referenced by the tests:

```rust
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
        Ok(PromptRecord { id, name: name.to_string(), description: description.to_string() })
    }

    pub fn create_prompt_version(&self, prompt_id: &str, version_name: &str, content: &str, note: Option<&str>) -> AppResult<PromptVersionRecord> {
        let id = Self::id();
        let now = Self::now();
        self.conn.execute(
            "INSERT INTO prompt_versions (id, prompt_id, version_name, content, note, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![id, prompt_id, version_name, content, note, now, now],
        )?;
        Ok(PromptVersionRecord { id, prompt_id: prompt_id.to_string(), version_name: version_name.to_string(), content: content.to_string() })
    }

    pub fn create_test_case(&self, prompt_id: &str, title: &str, input: &str, tags: &str, note: Option<&str>) -> AppResult<TestCaseRecord> {
        let id = Self::id();
        let now = Self::now();
        self.conn.execute(
            "INSERT INTO test_cases (id, prompt_id, title, input, tags, note, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![id, prompt_id, title, input, tags, note, now, now],
        )?;
        Ok(TestCaseRecord { id, prompt_id: prompt_id.to_string(), title: title.to_string(), input: input.to_string() })
    }
}
```

Extend the same `impl Repository` block with the persistence methods used by the tests:

```rust
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
```

Add these private helper methods inside the same `impl Repository` block:

```rust
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
```

- [ ] **Step 5: Wire modules**

Modify `src-tauri/src/main.rs`:

```rust
mod analytics;
mod db;
mod domain;
mod error;

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("failed to run Prompt Manager");
}
```

- [ ] **Step 6: Run database tests**

Run:

```bash
cargo test --manifest-path src-tauri/Cargo.toml db
```

Expected: PASS.

- [ ] **Step 7: Commit database layer**

```bash
git add src-tauri/src
git commit -m "feat: add SQLite persistence layer"
```

## Task 4: Add Tauri Commands for CRUD and App State

**Files:**
- Create: `src-tauri/src/commands.rs`
- Create: `src-tauri/src/secrets.rs`
- Modify: `src-tauri/src/state.rs`
- Modify: `src-tauri/src/main.rs`
- Create: `src/lib/api.ts`
- Modify: `src/types.ts`

- [ ] **Step 1: Add app state**

Create `src-tauri/src/state.rs`:

```rust
use std::path::PathBuf;
use std::sync::Mutex;

use rusqlite::Connection;
use tauri::{AppHandle, Manager};

use crate::db::migrations::migrate;
use crate::db::repo::Repository;
use crate::error::{AppError, AppResult};

pub struct AppState {
    db_path: PathBuf,
    lock: Mutex<()>,
}

impl AppState {
    pub fn new(app: &AppHandle) -> AppResult<Self> {
        let app_dir = app
            .path()
            .app_data_dir()
            .map_err(|err| AppError::Validation(err.to_string()))?;
        std::fs::create_dir_all(&app_dir).map_err(|err| AppError::Validation(err.to_string()))?;
        let db_path = app_dir.join("prompt-manager.sqlite3");
        let conn = Connection::open(&db_path)?;
        migrate(&conn)?;
        Ok(Self {
            db_path,
            lock: Mutex::new(()),
        })
    }

    pub fn with_repo<T>(&self, f: impl FnOnce(&Repository) -> AppResult<T>) -> AppResult<T> {
        let _guard = self.lock.lock().expect("database mutex poisoned");
        let conn = Connection::open(&self.db_path)?;
        migrate(&conn)?;
        let repo = Repository::new(conn);
        f(&repo)
    }
}
```

- [ ] **Step 2: Add keychain helper**

Create `src-tauri/src/secrets.rs`:

```rust
use crate::error::{AppError, AppResult};

const SERVICE: &str = "prompt-manager";

pub fn save_api_key(api_key_ref: &str, api_key: &str) -> AppResult<()> {
    let entry = keyring::Entry::new(SERVICE, api_key_ref)
        .map_err(|err| AppError::Validation(err.to_string()))?;
    entry
        .set_password(api_key)
        .map_err(|err| AppError::Validation(err.to_string()))
}

pub fn load_api_key(api_key_ref: &str) -> AppResult<String> {
    let entry = keyring::Entry::new(SERVICE, api_key_ref)
        .map_err(|err| AppError::Validation(err.to_string()))?;
    entry
        .get_password()
        .map_err(|err| AppError::Validation(err.to_string()))
}
```

- [ ] **Step 3: Add command handlers**

Create `src-tauri/src/commands.rs`:

```rust
use tauri::State;

use crate::db::repo::{LatestCaseResultSummary, PromptRecord, PromptVersionRecord, TestCaseRecord};
use crate::error::CommandError;
use crate::state::AppState;

#[tauri::command]
pub fn create_prompt(
    state: State<'_, AppState>,
    name: String,
    description: String,
) -> Result<PromptRecord, CommandError> {
    state
        .with_repo(|repo| repo.create_prompt(&name, &description))
        .map_err(Into::into)
}

#[tauri::command]
pub fn create_prompt_version(
    state: State<'_, AppState>,
    prompt_id: String,
    version_name: String,
    content: String,
    note: Option<String>,
) -> Result<PromptVersionRecord, CommandError> {
    state
        .with_repo(|repo| {
            repo.create_prompt_version(&prompt_id, &version_name, &content, note.as_deref())
        })
        .map_err(Into::into)
}

#[tauri::command]
pub fn create_test_case(
    state: State<'_, AppState>,
    prompt_id: String,
    title: String,
    input: String,
    tags: String,
    note: Option<String>,
) -> Result<TestCaseRecord, CommandError> {
    state
        .with_repo(|repo| repo.create_test_case(&prompt_id, &title, &input, &tags, note.as_deref()))
        .map_err(Into::into)
}
```

Add list and update commands in the same file:

```rust
#[tauri::command]
pub fn list_prompts(state: State<'_, AppState>) -> Result<Vec<PromptRecord>, CommandError> {
    state.with_repo(|repo| repo.list_prompts()).map_err(Into::into)
}

#[tauri::command]
pub fn list_prompt_versions(
    state: State<'_, AppState>,
    prompt_id: String,
) -> Result<Vec<PromptVersionRecord>, CommandError> {
    state
        .with_repo(|repo| repo.list_prompt_versions(&prompt_id))
        .map_err(Into::into)
}

#[tauri::command]
pub fn list_test_cases(
    state: State<'_, AppState>,
    prompt_id: String,
) -> Result<Vec<TestCaseRecord>, CommandError> {
    state
        .with_repo(|repo| repo.list_test_cases(&prompt_id))
        .map_err(Into::into)
}

#[tauri::command]
pub fn update_prompt_version_content(
    state: State<'_, AppState>,
    prompt_version_id: String,
    content: String,
) -> Result<PromptVersionRecord, CommandError> {
    state
        .with_repo(|repo| repo.update_prompt_version_content(&prompt_version_id, &content))
        .map_err(Into::into)
}

#[tauri::command]
pub fn create_model_config(
    state: State<'_, AppState>,
    name: String,
    config_type: String,
    base_url: String,
    model: String,
    api_key: String,
    temperature: f64,
    max_tokens: i64,
) -> Result<ModelConfigRecord, CommandError> {
    let api_key_ref = format!("model-config-{}", uuid::Uuid::new_v4());
    crate::secrets::save_api_key(&api_key_ref, &api_key).map_err(CommandError::from)?;
    state
        .with_repo(|repo| {
            repo.create_model_config(
                &name,
                &config_type,
                &base_url,
                &model,
                &api_key_ref,
                temperature,
                max_tokens,
            )
        })
        .map_err(Into::into)
}

#[tauri::command]
pub fn list_model_configs(
    state: State<'_, AppState>,
    config_type: String,
) -> Result<Vec<ModelConfigRecord>, CommandError> {
    state
        .with_repo(|repo| repo.list_model_configs(&config_type))
        .map_err(Into::into)
}

#[tauri::command]
pub fn list_latest_case_results(
    state: State<'_, AppState>,
    prompt_id: String,
) -> Result<Vec<LatestCaseResultSummary>, CommandError> {
    state
        .with_repo(|repo| repo.list_latest_case_results_for_prompt(&prompt_id))
        .map_err(Into::into)
}
```

Add the referenced repository read/update methods to `repo.rs` in the same task:

```rust
    pub fn list_prompts(&self) -> AppResult<Vec<PromptRecord>> {
        let mut stmt = self.conn.prepare("SELECT id, name, description FROM prompts ORDER BY updated_at DESC")?;
        let rows = stmt.query_map([], |row| {
            Ok(PromptRecord {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
            })
        })?;
        rows.collect::<Result<Vec<_>, _>>().map_err(Into::into)
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

    pub fn update_prompt_version_content(&self, prompt_version_id: &str, content: &str) -> AppResult<PromptVersionRecord> {
        let now = Self::now();
        self.conn.execute(
            "UPDATE prompt_versions SET content = ?1, updated_at = ?2 WHERE id = ?3",
            params![content, now, prompt_version_id],
        )?;
        let mut stmt = self.conn.prepare("SELECT id, prompt_id, version_name, content FROM prompt_versions WHERE id = ?1")?;
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

    pub fn list_latest_case_results_for_prompt(&self, prompt_id: &str) -> AppResult<Vec<LatestCaseResultSummary>> {
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
```

- [ ] **Step 4: Register commands and state**

Modify `src-tauri/src/main.rs`:

```rust
mod analytics;
mod commands;
mod db;
mod domain;
mod error;
mod secrets;
mod state;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let state = state::AppState::new(app.handle())?;
            app.manage(state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::create_prompt,
            commands::create_prompt_version,
            commands::create_test_case,
            commands::list_prompts,
            commands::list_prompt_versions,
            commands::list_test_cases,
            commands::update_prompt_version_content,
            commands::create_model_config,
            commands::list_model_configs,
            commands::list_latest_case_results
        ])
        .run(tauri::generate_context!())
        .expect("failed to run Prompt Manager");
}
```

- [ ] **Step 5: Add frontend API wrapper**

Create `src/lib/api.ts`:

```ts
import { invoke } from "@tauri-apps/api/core";
import type {
  CaseResultSummary,
  ModelConfigRecord,
  PromptRecord,
  PromptVersionRecord,
  TestCaseRecord
} from "../types";

export async function listPrompts() {
  return invoke<PromptRecord[]>("list_prompts");
}

export async function listPromptVersions(promptId: string) {
  return invoke<PromptVersionRecord[]>("list_prompt_versions", { promptId });
}

export async function listTestCases(promptId: string) {
  return invoke<TestCaseRecord[]>("list_test_cases", { promptId });
}

export async function createPrompt(input: {
  name: string;
  description: string;
}) {
  return invoke("create_prompt", input);
}

export async function createPromptVersion(input: {
  promptId: string;
  versionName: string;
  content: string;
  note?: string | null;
}) {
  return invoke("create_prompt_version", input);
}

export async function createTestCase(input: {
  promptId: string;
  title: string;
  input: string;
  tags: string;
  note?: string | null;
}) {
  return invoke("create_test_case", input);
}

export async function updatePromptVersionContent(input: {
  promptVersionId: string;
  content: string;
}) {
  return invoke<PromptVersionRecord>("update_prompt_version_content", input);
}

export async function createModelConfig(input: {
  name: string;
  configType: "run" | "judge";
  baseUrl: string;
  model: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
}) {
  return invoke<ModelConfigRecord>("create_model_config", input);
}

export async function listModelConfigs(configType: "run" | "judge") {
  return invoke<ModelConfigRecord[]>("list_model_configs", { configType });
}

export async function listLatestCaseResults(promptId: string) {
  return invoke<CaseResultSummary[]>("list_latest_case_results", { promptId });
}
```

- [ ] **Step 6: Run checks**

Run:

```bash
npm run build
cargo test --manifest-path src-tauri/Cargo.toml
```

Expected: both commands pass.

- [ ] **Step 7: Commit commands**

```bash
git add src/lib/api.ts src/types.ts src-tauri/src
git commit -m "feat: expose prompt CRUD commands"
```

## Task 5: Build App Shell, Sidebar, Tabs, Prompt Editor, and Case Manager

**Files:**
- Create: `src/components/Sidebar.tsx`
- Create: `src/components/Tabs.tsx`
- Create: `src/components/PromptEditor.tsx`
- Create: `src/components/CaseManager.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Modify: `src/types.ts`

- [ ] **Step 1: Write component smoke tests**

Create `src/components/PromptEditor.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PromptEditor } from "./PromptEditor";

describe("PromptEditor", () => {
  it("shows the selected prompt version content", () => {
    render(
      <PromptEditor
        version={{ id: "v1", promptId: "p1", versionName: "v1", content: "Extract durable memories", note: null }}
        onContentChange={() => undefined}
      />
    );

    expect(screen.getByDisplayValue("Extract durable memories")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- src/components/PromptEditor.test.tsx
```

Expected: FAIL because `PromptEditor` does not exist.

- [ ] **Step 3: Add frontend records**

Extend `src/types.ts`:

```ts
export interface PromptRecord {
  id: string;
  name: string;
  description: string;
}

export interface PromptVersionRecord {
  id: string;
  promptId: string;
  versionName: string;
  content: string;
  note: string | null;
}

export interface TestCaseRecord {
  id: string;
  promptId: string;
  title: string;
  input: string;
  tags: string;
  note: string | null;
  enabled: boolean;
}

export interface ModelConfigRecord {
  id: string;
  name: string;
  configType: "run" | "judge";
  baseUrl: string;
  model: string;
  apiKeyRef: string;
  temperature: number;
  maxTokens: number;
}
```

- [ ] **Step 4: Add PromptEditor component**

Create `src/components/PromptEditor.tsx`:

```tsx
import type { PromptVersionRecord } from "../types";

interface PromptEditorProps {
  version: PromptVersionRecord | null;
  onContentChange: (content: string) => void;
}

export function PromptEditor({ version, onContentChange }: PromptEditorProps) {
  if (!version) {
    return <section className="panel empty-panel">Select a prompt version to edit.</section>;
  }

  return (
    <section className="panel prompt-editor">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Prompt Editor</p>
          <h2>{version.versionName}</h2>
        </div>
        <button className="button primary">Create Version</button>
      </div>
      <textarea
        className="prompt-textarea"
        aria-label="Prompt content"
        value={version.content}
        onChange={(event) => onContentChange(event.target.value)}
      />
    </section>
  );
}
```

- [ ] **Step 5: Add sidebar, tabs, and case manager components**

Create `src/components/Sidebar.tsx`:

```tsx
import type { PromptRecord, PromptVersionRecord } from "../types";

interface SidebarProps {
  prompts: PromptRecord[];
  versions: PromptVersionRecord[];
  selectedPromptId: string | null;
  selectedVersionId: string | null;
  onSelectPrompt: (id: string) => void;
  onSelectVersion: (id: string) => void;
}

export function Sidebar({
  prompts,
  versions,
  selectedPromptId,
  selectedVersionId,
  onSelectPrompt,
  onSelectVersion
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <strong>Prompts</strong>
        <button className="icon-button" aria-label="New prompt">+</button>
      </div>
      <input className="input" placeholder="Search prompt" />
      <div className="sidebar-list">
        {prompts.map((prompt) => (
          <button
            key={prompt.id}
            className={prompt.id === selectedPromptId ? "sidebar-item selected" : "sidebar-item"}
            onClick={() => onSelectPrompt(prompt.id)}
          >
            <span>{prompt.name}</span>
          </button>
        ))}
      </div>
      {selectedPromptId && (
        <div className="version-list">
          <p className="eyebrow">Versions</p>
          {versions.map((version) => (
            <button
              key={version.id}
              className={version.id === selectedVersionId ? "version-item selected" : "version-item"}
              onClick={() => onSelectVersion(version.id)}
            >
              {version.versionName}
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
```

Create `src/components/Tabs.tsx`:

```tsx
export type WorkspaceTab = "editor" | "matrix" | "results" | "history";

const labels: Record<WorkspaceTab, string> = {
  editor: "Prompt Editor",
  matrix: "Version Matrix",
  results: "Version Case Results",
  history: "Run History"
};

export function Tabs({
  active,
  onChange
}: {
  active: WorkspaceTab;
  onChange: (tab: WorkspaceTab) => void;
}) {
  return (
    <nav className="tabs">
      {(Object.keys(labels) as WorkspaceTab[]).map((tab) => (
        <button
          key={tab}
          className={active === tab ? "tab active" : "tab"}
          onClick={() => onChange(tab)}
        >
          {labels[tab]}
        </button>
      ))}
    </nav>
  );
}
```

Create `src/components/CaseManager.tsx`:

```tsx
import type { TestCaseRecord } from "../types";

export function CaseManager({ cases }: { cases: TestCaseRecord[] }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Test Cases</p>
          <h2>{cases.length} cases</h2>
        </div>
        <button className="button">New Case</button>
      </div>
      <div className="case-list">
        {cases.map((testCase) => (
          <article key={testCase.id} className="case-row">
            <strong>{testCase.title}</strong>
            <span>{testCase.input}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Wire App with fixture data**

Modify `src/App.tsx` to use the shell with local fixture data until commands are connected:

```tsx
import { useMemo, useState } from "react";
import { CaseManager } from "./components/CaseManager";
import { PromptEditor } from "./components/PromptEditor";
import { Sidebar } from "./components/Sidebar";
import { Tabs, type WorkspaceTab } from "./components/Tabs";
import type { PromptRecord, PromptVersionRecord, TestCaseRecord } from "./types";

const prompts: PromptRecord[] = [
  { id: "p1", name: "Memory Extractor", description: "Extract durable memories" }
];

const initialVersions: PromptVersionRecord[] = [
  {
    id: "v1",
    promptId: "p1",
    versionName: "v1",
    content: "Extract durable user memories from the input.",
    note: null
  }
];

const cases: TestCaseRecord[] = [
  {
    id: "c1",
    promptId: "p1",
    title: "City preference",
    input: "I prefer Shanghai events.",
    tags: "memory",
    note: null,
    enabled: true
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("editor");
  const [selectedPromptId, setSelectedPromptId] = useState("p1");
  const [selectedVersionId, setSelectedVersionId] = useState("v1");
  const [versions, setVersions] = useState(initialVersions);

  const selectedVersion = useMemo(
    () => versions.find((version) => version.id === selectedVersionId) ?? null,
    [selectedVersionId, versions]
  );

  function updateVersionContent(content: string) {
    setVersions((current) =>
      current.map((version) =>
        version.id === selectedVersionId ? { ...version, content } : version
      )
    );
  }

  return (
    <main className="app-layout">
      <Sidebar
        prompts={prompts}
        versions={versions}
        selectedPromptId={selectedPromptId}
        selectedVersionId={selectedVersionId}
        onSelectPrompt={setSelectedPromptId}
        onSelectVersion={setSelectedVersionId}
      />
      <section className="workspace">
        <Tabs active={activeTab} onChange={setActiveTab} />
        {activeTab === "editor" && (
          <div className="editor-grid">
            <PromptEditor version={selectedVersion} onContentChange={updateVersionContent} />
            <CaseManager cases={cases} />
          </div>
        )}
      </section>
    </main>
  );
}
```

- [ ] **Step 7: Add layout CSS**

Extend `src/styles.css` with the classes used above:

```css
.app-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  min-height: 100vh;
}

.sidebar {
  border-right: 1px solid #e5e7eb;
  background: #ffffff;
  padding: 16px;
}

.sidebar-header,
.panel-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.input,
.prompt-textarea {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 10px 12px;
  width: 100%;
}

.sidebar-list,
.version-list,
.case-list {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}

.sidebar-item,
.version-item,
.button,
.icon-button,
.tab {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #ffffff;
  color: #111827;
  cursor: pointer;
  padding: 9px 12px;
}

.sidebar-item,
.version-item {
  text-align: left;
}

.selected,
.tab.active,
.button.primary {
  background: #111827;
  border-color: #111827;
  color: #ffffff;
}

.workspace {
  min-width: 0;
  padding: 18px;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.editor-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.8fr);
  gap: 16px;
}

.panel {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
}

.empty-panel {
  color: #64748b;
}

.eyebrow {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
  margin: 0 0 4px;
  text-transform: uppercase;
}

.prompt-textarea {
  min-height: 420px;
  resize: vertical;
}

.case-row {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  display: grid;
  gap: 4px;
  padding: 12px;
}

.case-row span {
  color: #64748b;
}
```

- [ ] **Step 8: Run frontend tests and build**

Run:

```bash
npm run test -- src/components/PromptEditor.test.tsx
npm run build
```

Expected: PASS.

- [ ] **Step 9: Commit shell UI**

```bash
git add src
git commit -m "feat: add prompt workspace shell"
```

## Task 6: Implement Judge Parser and OpenAI-Compatible Client

**Files:**
- Create: `src-tauri/src/judge.rs`
- Create: `src-tauri/src/judge_test.rs`
- Create: `src-tauri/src/model_client.rs`
- Modify: `src-tauri/src/main.rs`

- [ ] **Step 1: Write judge parser tests**

Create `src-tauri/src/judge_test.rs`:

```rust
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
```

- [ ] **Step 2: Run parser tests to verify they fail**

Run:

```bash
cargo test --manifest-path src-tauri/Cargo.toml judge
```

Expected: FAIL because `judge.rs` does not exist.

- [ ] **Step 3: Add judge parser**

Create `src-tauri/src/judge.rs`:

```rust
use serde::Deserialize;

use crate::domain::{LlmJudgement, PassFail};
use crate::error::{AppError, AppResult};

#[derive(Debug, Deserialize)]
struct JudgeResponse {
    result: String,
    reason: String,
}

pub fn parse_judge_response(raw: &str) -> AppResult<LlmJudgement> {
    let parsed: JudgeResponse = serde_json::from_str(raw)?;
    let result = match parsed.result.as_str() {
        "pass" => PassFail::Pass,
        "fail" => PassFail::Fail,
        _ => {
            return Err(AppError::Validation(
                "judge result must be pass or fail".to_string(),
            ))
        }
    };

    Ok(LlmJudgement::new(result, parsed.reason))
}

pub fn build_judge_user_message(
    judge_prompt: &str,
    test_case_input: &str,
    prompt_content: &str,
    prompt_output: &str,
) -> String {
    format!(
        "{judge_prompt}\n\nTest case input:\n{test_case_input}\n\nPrompt content:\n{prompt_content}\n\nPrompt output:\n{prompt_output}\n\nReturn JSON with result and reason."
    )
}

#[cfg(test)]
mod tests {
    include!("judge_test.rs");
}
```

- [ ] **Step 4: Add OpenAI-compatible client**

Create `src-tauri/src/model_client.rs`:

```rust
use serde::{Deserialize, Serialize};

use crate::error::{AppError, AppResult};

#[derive(Debug, Clone)]
pub struct ChatModelConfig {
    pub base_url: String,
    pub api_key: String,
    pub model: String,
    pub temperature: f64,
    pub max_tokens: i64,
}

#[derive(Debug, Clone, Serialize)]
struct ChatRequest {
    model: String,
    messages: Vec<ChatMessage>,
    temperature: f64,
    max_tokens: i64,
}

#[derive(Debug, Clone, Serialize)]
struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct ChatResponse {
    choices: Vec<ChatChoice>,
}

#[derive(Debug, Deserialize)]
struct ChatChoice {
    message: ChatChoiceMessage,
}

#[derive(Debug, Deserialize)]
struct ChatChoiceMessage {
    content: String,
}

pub async fn complete_chat(
    config: &ChatModelConfig,
    system_prompt: &str,
    user_input: &str,
) -> AppResult<String> {
    let url = format!("{}/chat/completions", config.base_url.trim_end_matches('/'));
    let request = ChatRequest {
        model: config.model.clone(),
        messages: vec![
            ChatMessage {
                role: "system".to_string(),
                content: system_prompt.to_string(),
            },
            ChatMessage {
                role: "user".to_string(),
                content: user_input.to_string(),
            },
        ],
        temperature: config.temperature,
        max_tokens: config.max_tokens,
    };

    let response = reqwest::Client::new()
        .post(url)
        .bearer_auth(&config.api_key)
        .json(&request)
        .send()
        .await?;

    if !response.status().is_success() {
        return Err(AppError::Validation(format!(
            "model request failed with status {}",
            response.status()
        )));
    }

    let body: ChatResponse = response.json().await?;
    let content = body
        .choices
        .first()
        .map(|choice| choice.message.content.clone())
        .ok_or_else(|| AppError::Validation("model response contained no choices".to_string()))?;

    Ok(content)
}
```

- [ ] **Step 5: Wire modules and run tests**

Modify `src-tauri/src/main.rs` to include:

```rust
mod judge;
mod model_client;
```

Run:

```bash
cargo test --manifest-path src-tauri/Cargo.toml judge
```

Expected: PASS.

- [ ] **Step 6: Commit judge and model client**

```bash
git add src-tauri/src/judge.rs src-tauri/src/judge_test.rs src-tauri/src/model_client.rs src-tauri/src/main.rs
git commit -m "feat: add judge parsing and model client"
```

## Task 7: Implement Evaluation Run Orchestration

**Files:**
- Create: `src-tauri/src/evaluation.rs`
- Create: `src-tauri/src/evaluation_test.rs`
- Modify: `src-tauri/src/commands.rs`
- Modify: `src-tauri/src/main.rs`
- Modify: `src/lib/api.ts`
- Create: `src/components/RunControls.tsx`

- [ ] **Step 1: Write evaluation test with mock model function**

Create `src-tauri/src/evaluation_test.rs`:

```rust
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
```

- [ ] **Step 2: Run evaluation test to verify it fails**

Run:

```bash
cargo test --manifest-path src-tauri/Cargo.toml evaluation
```

Expected: FAIL because evaluation module does not exist.

- [ ] **Step 3: Add evaluation module**

Create `src-tauri/src/evaluation.rs`:

```rust
use std::future::Future;

use crate::error::AppResult;

#[derive(Debug, Clone)]
pub struct PromptRunInput {
    pub prompt_content: String,
    pub case_input: String,
}

pub async fn run_prompt_for_case<F, Fut>(
    input: PromptRunInput,
    complete: F,
) -> AppResult<String>
where
    F: FnOnce(String, String) -> Fut,
    Fut: Future<Output = AppResult<String>>,
{
    complete(input.prompt_content, input.case_input).await
}

#[cfg(test)]
mod tests {
    include!("evaluation_test.rs");
}
```

- [ ] **Step 4: Add run commands**

Extend `src-tauri/src/commands.rs` with command inputs and handlers:

```rust
use serde::Deserialize;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RunCasesInput {
    pub prompt_version_id: String,
    pub case_ids: Vec<String>,
    pub run_model_config_id: String,
    pub judge_mode: String,
    pub judge_model_config_id: Option<String>,
    pub judge_prompt: Option<String>,
}

#[tauri::command]
pub async fn run_selected_cases(
    state: State<'_, AppState>,
    input: RunCasesInput,
) -> Result<(), CommandError> {
    if input.case_ids.is_empty() {
        return Err(CommandError {
            message: "select at least one case".to_string(),
        });
    }

    crate::evaluation::run_selected_cases(&state, input)
        .await
        .map_err(Into::into)
}
```

Add this orchestration entry point to `src-tauri/src/evaluation.rs`:

```rust
use tauri::State;

use crate::commands::RunCasesInput;
use crate::error::{AppError, AppResult};
use crate::judge::{build_judge_user_message, parse_judge_response};
use crate::model_client::{complete_chat, ChatModelConfig};
use crate::secrets::load_api_key;
use crate::state::AppState;

pub async fn run_selected_cases(state: &State<'_, AppState>, input: RunCasesInput) -> AppResult<()> {
    if input.judge_mode == "llm"
        && (input.judge_model_config_id.is_none()
            || input.judge_prompt.as_deref().unwrap_or("").is_empty())
    {
        return Err(AppError::Validation(
            "judge model and judge prompt are required for LLM judge".to_string(),
        ));
    }

    let plan = state.with_repo(|repo| repo.build_run_plan(&input))?;
    let run_api_key = load_api_key(&plan.run_model.api_key_ref)?;
    let run_config = ChatModelConfig {
        base_url: plan.run_model.base_url.clone(),
        api_key: run_api_key,
        model: plan.run_model.model.clone(),
        temperature: plan.run_model.temperature,
        max_tokens: plan.run_model.max_tokens,
    };

    for case in plan.cases {
        let started = std::time::Instant::now();
        let output = complete_chat(&run_config, &plan.prompt_version.content, &case.input).await;

        match output {
            Ok(output) => {
                let case_result = state.with_repo(|repo| {
                    repo.create_case_result(
                        &plan.run.id,
                        &plan.prompt_version.id,
                        &case.id,
                        &output,
                        "completed",
                        None,
                        started.elapsed().as_millis() as i64,
                    )
                })?;

                if let Some(judge) = &plan.judge {
                    let judge_api_key = load_api_key(&judge.model.api_key_ref)?;
                    let judge_config = ChatModelConfig {
                        base_url: judge.model.base_url.clone(),
                        api_key: judge_api_key,
                        model: judge.model.model.clone(),
                        temperature: judge.model.temperature,
                        max_tokens: judge.model.max_tokens,
                    };
                    let judge_input = build_judge_user_message(
                        &judge.prompt,
                        &case.input,
                        &plan.prompt_version.content,
                        &output,
                    );
                    let raw = complete_chat(
                        &judge_config,
                        "You are a strict pass/fail judge.",
                        &judge_input,
                    )
                    .await?;
                    let parsed = parse_judge_response(&raw)?;
                    state.with_repo(|repo| {
                        repo.create_llm_judgement(
                            &case_result.id,
                            &judge.model.id,
                            &judge.prompt,
                            parsed.result,
                            &parsed.reason,
                            &raw,
                        )
                    })?;
                }
            }
            Err(error) => {
                state.with_repo(|repo| {
                    repo.create_case_result(
                        &plan.run.id,
                        &plan.prompt_version.id,
                        &case.id,
                        "",
                        "error",
                        Some(&error.to_string()),
                        started.elapsed().as_millis() as i64,
                    )
                })?;
            }
        }
    }

    state.with_repo(|repo| repo.finish_evaluation_run(&plan.run.id))?;
    Ok(())
}
```

Add the run-plan records and repository methods to `src-tauri/src/db/repo.rs`:

```rust
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

impl Repository {
    pub fn build_run_plan(&self, input: &crate::commands::RunCasesInput) -> AppResult<RunPlan> {
        let prompt_version = self.get_prompt_version(&input.prompt_version_id)?;
        let run_model = self.get_model_config(&input.run_model_config_id)?;
        let judge = match (&input.judge_model_config_id, &input.judge_prompt) {
            (Some(model_id), Some(prompt)) if input.judge_mode == "llm" => Some(JudgePlan {
                model: self.get_model_config(model_id)?,
                prompt: prompt.clone(),
            }),
            _ => None,
        };
        let run = self.create_evaluation_run(
            &prompt_version.prompt_id,
            &prompt_version.id,
            &run_model.id,
            &input.judge_mode,
            input.judge_model_config_id.as_deref(),
            input.judge_prompt.as_deref(),
            "selected",
        )?;
        let cases = self.get_test_cases_by_ids(&input.case_ids)?;
        Ok(RunPlan {
            run,
            prompt_version,
            run_model,
            judge,
            cases,
        })
    }

    pub fn finish_evaluation_run(&self, run_id: &str) -> AppResult<()> {
        let now = Self::now();
        self.conn.execute(
            "UPDATE evaluation_runs SET status = 'completed', finished_at = ?1 WHERE id = ?2",
            params![now, run_id],
        )?;
        Ok(())
    }

    fn get_prompt_version(&self, id: &str) -> AppResult<PromptVersionRecord> {
        let mut stmt = self.conn.prepare(
            "SELECT id, prompt_id, version_name, content FROM prompt_versions WHERE id = ?1",
        )?;
        let record = stmt.query_row(params![id], |row| {
            Ok(PromptVersionRecord {
                id: row.get(0)?,
                prompt_id: row.get(1)?,
                version_name: row.get(2)?,
                content: row.get(3)?,
            })
        })?;
        Ok(record)
    }

    fn get_model_config(&self, id: &str) -> AppResult<ModelConfigRecord> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, config_type, base_url, model, api_key_ref, temperature, max_tokens FROM model_configs WHERE id = ?1",
        )?;
        let record = stmt.query_row(params![id], |row| {
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
        Ok(record)
    }

    fn get_test_cases_by_ids(&self, ids: &[String]) -> AppResult<Vec<TestCaseRecord>> {
        let mut cases = Vec::new();
        for id in ids {
            let mut stmt = self.conn.prepare(
                "SELECT id, prompt_id, title, input FROM test_cases WHERE id = ?1 AND enabled = 1",
            )?;
            let record = stmt.query_row(params![id], |row| {
                Ok(TestCaseRecord {
                    id: row.get(0)?,
                    prompt_id: row.get(1)?,
                    title: row.get(2)?,
                    input: row.get(3)?,
                })
            })?;
            cases.push(record);
        }
        Ok(cases)
    }
}
```

- [ ] **Step 5: Add frontend run controls**

Create `src/components/RunControls.tsx`:

```tsx
export function RunControls({
  selectedCount,
  judgeMode,
  onJudgeModeChange,
  onRunSelected,
  onRunAll
}: {
  selectedCount: number;
  judgeMode: "human" | "llm";
  onJudgeModeChange: (mode: "human" | "llm") => void;
  onRunSelected: () => void;
  onRunAll: () => void;
}) {
  return (
    <div className="run-controls">
      <span className="judge-pill">
        Judge by {judgeMode === "llm" ? "LLM" : "Human"}
      </span>
      <select
        aria-label="Judge mode"
        value={judgeMode}
        onChange={(event) => onJudgeModeChange(event.target.value as "human" | "llm")}
      >
        <option value="human">Judge by Human</option>
        <option value="llm">Judge by LLM</option>
      </select>
      <button className="button" disabled={selectedCount === 0} onClick={onRunSelected}>
        Run Selected Case
      </button>
      <button className="button primary" onClick={onRunAll}>
        Run All Case
      </button>
    </div>
  );
}
```

- [ ] **Step 6: Run checks**

Run:

```bash
cargo test --manifest-path src-tauri/Cargo.toml evaluation
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit run orchestration foundation**

```bash
git add src-tauri/src src/components/RunControls.tsx src/lib/api.ts
git commit -m "feat: add evaluation run foundation"
```

## Task 8: Build Version Matrix and Matrix Analytics

**Files:**
- Create: `src/domain/matrix.ts`
- Create: `src/domain/matrix.test.ts`
- Create: `src/components/ResultBadge.tsx`
- Create: `src/components/VersionMatrix.tsx`
- Create: `src/components/VersionMatrix.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write matrix analytics tests**

Create `src/domain/matrix.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { classifyTrend } from "./matrix";

describe("classifyTrend", () => {
  it("detects regression from pass to fail", () => {
    expect(classifyTrend(["pass", "pass", "fail"])).toBe("regression");
  });

  it("detects improvement from fail to pass", () => {
    expect(classifyTrend(["fail", "fail", "pass"])).toBe("improved");
  });

  it("detects stable passing", () => {
    expect(classifyTrend(["pass", "pass"])).toBe("stable");
  });

  it("detects failing when all completed results fail", () => {
    expect(classifyTrend(["fail", "fail"])).toBe("failing");
  });
});
```

- [ ] **Step 2: Run matrix test to verify it fails**

Run:

```bash
npm run test -- src/domain/matrix.test.ts
```

Expected: FAIL because `src/domain/matrix.ts` does not exist.

- [ ] **Step 3: Add matrix analytics helper**

Create `src/domain/matrix.ts`:

```ts
import type { FinalResultValue } from "../types";

export type Trend = "stable" | "regression" | "improved" | "failing" | "mixed";

export function classifyTrend(values: FinalResultValue[]): Trend {
  const completed = values.filter((value) => value === "pass" || value === "fail");
  if (completed.length === 0) return "mixed";

  const first = completed[0];
  const last = completed[completed.length - 1];

  if (first === "pass" && last === "fail") return "regression";
  if (first === "fail" && last === "pass") return "improved";
  if (completed.every((value) => value === "pass")) return "stable";
  if (completed.every((value) => value === "fail")) return "failing";

  return "mixed";
}
```

- [ ] **Step 4: Add ResultBadge and VersionMatrix**

Create `src/components/ResultBadge.tsx`:

```tsx
import type { FinalResultValue } from "../types";

export function ResultBadge({ value }: { value: FinalResultValue }) {
  return <span className={`result-badge ${value}`}>{value}</span>;
}
```

Create `src/components/VersionMatrix.tsx`:

```tsx
import { useMemo, useState } from "react";
import { computeFinalResult } from "../domain/finalResult";
import { classifyTrend } from "../domain/matrix";
import type { CaseResultSummary, PromptVersionRecord, TestCaseRecord } from "../types";
import { ResultBadge } from "./ResultBadge";
import { RunControls } from "./RunControls";

interface VersionMatrixProps {
  versions: PromptVersionRecord[];
  cases: TestCaseRecord[];
  results: CaseResultSummary[];
}

export function VersionMatrix({ versions, cases, results }: VersionMatrixProps) {
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<"all" | "failed" | "regression">("all");
  const [judgeMode, setJudgeMode] = useState<"human" | "llm">("llm");

  const visibleCases = useMemo(() => {
    return cases.filter((testCase) => {
      const rowValues = versions.map((version) => {
        const summary = results.find(
          (result) =>
            result.promptVersionId === version.id && result.testCaseId === testCase.id
        );
        return summary ? computeFinalResult(summary).result : "pending";
      });
      const trend = classifyTrend(rowValues);
      if (filter === "failed") return rowValues.includes("fail") || rowValues.includes("error");
      if (filter === "regression") return trend === "regression";
      return true;
    });
  }, [cases, filter, results, versions]);

  function toggleCase(id: string) {
    setSelectedCaseIds((current) =>
      current.includes(id) ? current.filter((caseId) => caseId !== id) : [...current, id]
    );
  }

  return (
    <section className="panel matrix-panel">
      <div className="matrix-toolbar">
        <div className="filter-group">
          <button className={filter === "all" ? "button primary" : "button"} onClick={() => setFilter("all")}>All Cases</button>
          <button className={filter === "failed" ? "button primary" : "button"} onClick={() => setFilter("failed")}>Failed Only</button>
          <button className={filter === "regression" ? "button primary" : "button"} onClick={() => setFilter("regression")}>Regression</button>
        </div>
        <RunControls
          selectedCount={selectedCaseIds.length}
          judgeMode={judgeMode}
          onJudgeModeChange={setJudgeMode}
          onRunSelected={() => undefined}
          onRunAll={() => undefined}
        />
      </div>
      <div className="matrix-scroll">
        <table className="matrix-table">
          <thead>
            <tr>
              <th className="sticky-col"><input aria-label="Select all cases" type="checkbox" /></th>
              <th className="sticky-col case-col">Case</th>
              <th>Trend</th>
              {versions.map((version) => (
                <th key={version.id}>{version.versionName}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleCases.map((testCase) => {
              const rowValues = versions.map((version) => {
                const summary = results.find(
                  (result) =>
                    result.promptVersionId === version.id && result.testCaseId === testCase.id
                );
                return summary ? computeFinalResult(summary).result : "pending";
              });
              return (
                <tr key={testCase.id}>
                  <td className="sticky-col"><input checked={selectedCaseIds.includes(testCase.id)} onChange={() => toggleCase(testCase.id)} type="checkbox" /></td>
                  <td className="sticky-col case-col">{testCase.title}</td>
                  <td>{classifyTrend(rowValues)}</td>
                  {rowValues.map((value, index) => (
                    <td key={`${testCase.id}-${versions[index].id}`}>
                      <ResultBadge value={value} />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Add matrix CSS**

Extend `src/styles.css`:

```css
.matrix-toolbar,
.run-controls,
.filter-group {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: space-between;
}

.matrix-scroll {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-top: 12px;
  max-height: 520px;
  overflow: auto;
}

.matrix-table {
  border-collapse: separate;
  border-spacing: 0;
  min-width: 1100px;
  width: 100%;
}

.matrix-table th,
.matrix-table td {
  border-bottom: 1px solid #e5e7eb;
  padding: 10px;
  text-align: left;
  white-space: nowrap;
}

.matrix-table th {
  background: #f8fafc;
  color: #64748b;
  font-size: 12px;
}

.sticky-col {
  background: #ffffff;
  left: 0;
  position: sticky;
  z-index: 1;
}

.case-col {
  left: 44px;
  min-width: 240px;
}

.result-badge {
  border-radius: 999px;
  display: inline-flex;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 8px;
  text-transform: capitalize;
}

.result-badge.pass {
  background: #dcfce7;
  color: #166534;
}

.result-badge.fail,
.result-badge.error {
  background: #fee2e2;
  color: #991b1b;
}

.result-badge.pending {
  background: #f1f5f9;
  color: #475569;
}

.judge-pill {
  border-radius: 999px;
  background: #eef2ff;
  color: #3730a3;
  font-size: 12px;
  font-weight: 700;
  padding: 6px 10px;
}
```

- [ ] **Step 6: Wire matrix tab**

Modify `src/App.tsx` so `activeTab === "matrix"` renders `VersionMatrix` with fixture results.

- [ ] **Step 7: Run tests and build**

Run:

```bash
npm run test -- src/domain/matrix.test.ts
npm run build
```

Expected: PASS.

- [ ] **Step 8: Commit matrix**

```bash
git add src
git commit -m "feat: add version matrix view"
```

## Task 9: Build Single-Version Case Results Review

**Files:**
- Create: `src/components/VersionCaseResults.tsx`
- Create: `src/components/VersionCaseResults.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Modify: `src/lib/api.ts`
- Modify: `src-tauri/src/commands.rs`

- [ ] **Step 1: Write review component test**

Create `src/components/VersionCaseResults.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { VersionCaseResults } from "./VersionCaseResults";

describe("VersionCaseResults", () => {
  it("lets a reviewer mark the selected case as fail", () => {
    const onLabel = vi.fn();
    render(
      <VersionCaseResults
        cases={[{ id: "c1", promptId: "p1", title: "City", input: "I prefer Shanghai", tags: "", note: null, enabled: true }]}
        results={[{ caseResultId: "r1", promptVersionId: "v1", testCaseId: "c1", runStatus: "completed", llmJudgement: { result: "pass", reason: "ok" }, humanLabel: null }]}
        selectedVersionId="v1"
        onLabel={onLabel}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Fail" }));
    expect(onLabel).toHaveBeenCalledWith("r1", "fail");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- src/components/VersionCaseResults.test.tsx
```

Expected: FAIL because component does not exist.

- [ ] **Step 3: Add review component**

Create `src/components/VersionCaseResults.tsx`:

```tsx
import { useMemo, useState } from "react";
import { computeFinalResult } from "../domain/finalResult";
import type { CaseResultSummary, PassFail, TestCaseRecord } from "../types";
import { ResultBadge } from "./ResultBadge";

interface VersionCaseResultsProps {
  cases: TestCaseRecord[];
  results: CaseResultSummary[];
  selectedVersionId: string;
  onLabel: (caseResultId: string, result: PassFail) => void;
}

export function VersionCaseResults({
  cases,
  results,
  selectedVersionId,
  onLabel
}: VersionCaseResultsProps) {
  const [selectedCaseId, setSelectedCaseId] = useState(cases[0]?.id ?? null);
  const rows = cases.map((testCase) => {
    const summary =
      results.find(
        (result) =>
          result.promptVersionId === selectedVersionId && result.testCaseId === testCase.id
      ) ?? null;
    return { testCase, summary };
  });
  const selected = useMemo(
    () => rows.find((row) => row.testCase.id === selectedCaseId) ?? rows[0] ?? null,
    [rows, selectedCaseId]
  );

  return (
    <section className="review-grid">
      <div className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Version Case Results</p>
            <h2>{rows.length} cases</h2>
          </div>
        </div>
        <div className="review-list">
          {rows.map(({ testCase, summary }) => {
            const final = summary ? computeFinalResult(summary) : { result: "pending" as const, source: "none" as const };
            return (
              <button key={testCase.id} className="review-row" onClick={() => setSelectedCaseId(testCase.id)}>
                <span>{testCase.title}</span>
                <ResultBadge value={final.result} />
              </button>
            );
          })}
        </div>
      </div>
      <aside className="panel detail-panel">
        {selected && (
          <>
            <p className="eyebrow">Case Detail</p>
            <h2>{selected.testCase.title}</h2>
            <div className="detail-block">
              <strong>Input</strong>
              <p>{selected.testCase.input}</p>
            </div>
            <div className="detail-block">
              <strong>LLM Judge</strong>
              <p>{selected.summary?.llmJudgement?.result ?? "No LLM judgement"}</p>
              <p>{selected.summary?.llmJudgement?.reason ?? ""}</p>
            </div>
            <div className="label-actions">
              <button className="button primary" disabled={!selected.summary?.caseResultId} onClick={() => selected.summary?.caseResultId && onLabel(selected.summary.caseResultId, "pass")}>Pass</button>
              <button className="button" disabled={!selected.summary?.caseResultId} onClick={() => selected.summary?.caseResultId && onLabel(selected.summary.caseResultId, "fail")}>Fail</button>
            </div>
          </>
        )}
      </aside>
    </section>
  );
}
```

- [ ] **Step 4: Add human label command**

Extend `src-tauri/src/commands.rs`:

```rust
#[tauri::command]
pub fn upsert_human_label(
    state: State<'_, AppState>,
    case_result_id: String,
    result: String,
    note: Option<String>,
) -> Result<(), CommandError> {
    let parsed = match result.as_str() {
        "pass" => crate::domain::PassFail::Pass,
        "fail" => crate::domain::PassFail::Fail,
        _ => {
            return Err(CommandError {
                message: "human label result must be pass or fail".to_string(),
            })
        }
    };

    state
        .with_repo(|repo| repo.upsert_human_label(&case_result_id, parsed, note.as_deref()).map(|_| ()))
        .map_err(Into::into)
}
```

Register the command in `src-tauri/src/main.rs`.

- [ ] **Step 5: Add frontend API wrapper**

Extend `src/lib/api.ts`:

```ts
import type { PassFail } from "../types";

export async function upsertHumanLabel(input: {
  caseResultId: string;
  result: PassFail;
  note?: string | null;
}) {
  return invoke("upsert_human_label", input);
}
```

- [ ] **Step 6: Add review CSS and wire tab**

Add CSS:

```css
.review-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  gap: 16px;
}

.review-list {
  display: grid;
  gap: 8px;
}

.review-row {
  align-items: center;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  padding: 12px;
  text-align: left;
}

.detail-panel {
  min-height: 520px;
}

.detail-block {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin: 12px 0;
  padding: 12px;
}

.label-actions {
  display: flex;
  gap: 8px;
}
```

Modify `src/App.tsx` so `activeTab === "results"` renders `VersionCaseResults`.

- [ ] **Step 7: Run tests and build**

Run:

```bash
npm run test -- src/components/VersionCaseResults.test.tsx
npm run build
cargo test --manifest-path src-tauri/Cargo.toml
```

Expected: PASS.

- [ ] **Step 8: Commit single-version review**

```bash
git add src src-tauri/src
git commit -m "feat: add single-version case review"
```

## Task 10: Add Run History, Error States, and End-to-End Smoke Path

**Files:**
- Create: `src/components/RunHistory.tsx`
- Create: `src/components/ModelConfigDialog.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Modify: `src-tauri/src/db/repo.rs`
- Modify: `src-tauri/src/commands.rs`
- Modify: `README.md`

- [ ] **Step 1: Add RunHistory component**

Create `src/components/RunHistory.tsx`:

```tsx
export interface RunHistoryItem {
  id: string;
  status: string;
  promptVersionName: string;
  caseScope: "selected" | "all";
  judgeMode: "human" | "llm";
  startedAt: string | null;
  finishedAt: string | null;
  successCount: number;
  errorCount: number;
}

export function RunHistory({ runs }: { runs: RunHistoryItem[] }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Run History</p>
          <h2>{runs.length} runs</h2>
        </div>
      </div>
      <div className="history-list">
        {runs.map((run) => (
          <article className="history-row" key={run.id}>
            <strong>{run.promptVersionName}</strong>
            <span>{run.status}</span>
            <span>{run.caseScope}</span>
            <span>Judge by {run.judgeMode === "llm" ? "LLM" : "Human"}</span>
            <span>{run.successCount} success</span>
            <span>{run.errorCount} error</span>
          </article>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Add model config dialog**

Create `src/components/ModelConfigDialog.tsx`:

```tsx
export function ModelConfigDialog({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <section className="modal">
        <div className="panel-header">
          <h2>Model Config</h2>
          <button className="icon-button" aria-label="Close model config" onClick={onClose}>x</button>
        </div>
        <label>
          Name
          <input className="input" />
        </label>
        <label>
          Base URL
          <input className="input" placeholder="https://api.openai.com/v1" />
        </label>
        <label>
          Model
          <input className="input" placeholder="gpt-4.1-mini" />
        </label>
        <label>
          API Key
          <input className="input" type="password" />
        </label>
        <button className="button primary">Save Config</button>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Add history and modal CSS**

Extend `src/styles.css`:

```css
.history-list {
  display: grid;
  gap: 8px;
}

.history-row {
  align-items: center;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  display: grid;
  gap: 10px;
  grid-template-columns: 1.2fr repeat(5, minmax(90px, auto));
  padding: 12px;
}

.modal-backdrop {
  align-items: center;
  background: rgb(15 23 42 / 40%);
  display: flex;
  inset: 0;
  justify-content: center;
  position: fixed;
}

.modal {
  background: #ffffff;
  border-radius: 8px;
  display: grid;
  gap: 12px;
  padding: 18px;
  width: 460px;
}
```

- [ ] **Step 4: Wire Run History tab and model config entry**

Modify `src/App.tsx` so it loads prompts, versions, and cases through Tauri commands instead of static fixture arrays:

```tsx
import { useEffect, useMemo, useState } from "react";
import {
  listPrompts,
  listPromptVersions,
  listTestCases,
  updatePromptVersionContent
} from "./lib/api";

// inside App()
const [prompts, setPrompts] = useState<PromptRecord[]>([]);
const [versions, setVersions] = useState<PromptVersionRecord[]>([]);
const [cases, setCases] = useState<TestCaseRecord[]>([]);
const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

useEffect(() => {
  listPrompts().then((loadedPrompts) => {
    setPrompts(loadedPrompts);
    setSelectedPromptId((current) => current ?? loadedPrompts[0]?.id ?? null);
  });
}, []);

useEffect(() => {
  if (!selectedPromptId) return;
  Promise.all([
    listPromptVersions(selectedPromptId),
    listTestCases(selectedPromptId)
  ]).then(([loadedVersions, loadedCases]) => {
    setVersions(loadedVersions);
    setCases(loadedCases);
    setSelectedVersionId((current) => current ?? loadedVersions[0]?.id ?? null);
  });
}, [selectedPromptId]);

async function updateVersionContent(content: string) {
  if (!selectedVersionId) return;
  const updated = await updatePromptVersionContent({
    promptVersionId: selectedVersionId,
    content
  });
  setVersions((current) =>
    current.map((version) => (version.id === updated.id ? updated : version))
  );
}
```

Then complete the visible tab wiring:

- `activeTab === "history"` renders `RunHistory`.
- A `Judge Config` button opens `ModelConfigDialog`.
- Run buttons remain visible on matrix and single-version review pages.

- [ ] **Step 5: Update README with local commands and smoke path**

Replace `README.md` with:

```md
# Prompt Manager

Local desktop workbench for prompt version evaluation.

## Development

```bash
npm install
npm run desktop
```

## Checks

```bash
npm run build
npm run test
cargo test --manifest-path src-tauri/Cargo.toml
```

## MVP Smoke Path

1. Create a prompt named Memory Extractor.
2. Add five pure text cases.
3. Create two prompt versions.
4. Configure one run model.
5. Configure one judge model and judge prompt.
6. Run all cases for both versions with Judge by LLM.
7. Manually correct at least two labels.
8. Confirm Version Matrix pass rates reflect human-priority final result.
9. Confirm regression and improvement highlighting works.
10. Confirm Run History shows the runs and their configurations.
```

- [ ] **Step 6: Run final checks**

Run:

```bash
npm run build
npm run test
cargo test --manifest-path src-tauri/Cargo.toml
```

Expected: all checks pass.

- [ ] **Step 7: Start desktop app for manual QA**

Run:

```bash
npm run desktop
```

Expected: Tauri opens a desktop window showing the Prompt Manager workspace.

- [ ] **Step 8: Commit final MVP shell**

```bash
git add README.md src src-tauri
git commit -m "feat: complete Prompt Manager MVP workflow"
```

## Self-Review Checklist

Spec coverage:

- Prompt management: Task 4 and Task 5.
- Prompt versions: Task 3, Task 4, Task 5.
- Pure text cases: Task 3, Task 4, Task 5.
- OpenAI-compatible run model: Task 6 and Task 7.
- Separate judge model: Task 6 and Task 7.
- LLM-as-Judge: Task 6, Task 7, Task 9.
- Manual pass/fail labels: Task 3, Task 9.
- Human-priority final result: Task 2 and Task 9.
- Version Matrix: Task 8.
- Single-version case review: Task 9.
- Run History: Task 10.
- SQLite local persistence: Task 3 and Task 4.
- Error states: Task 3, Task 6, Task 7, Task 10.
- Testing strategy: Tasks 2, 3, 5, 6, 7, 8, 9, and 10.

Implementation notes:

- Task 5 uses fixture data to establish layout quickly; Task 10 replaces fixture arrays with command-backed prompt, version, and case loading.
- Repository read methods are specified in Task 4 beside the create methods that feed the UI.
- API keys must be written through `secrets.rs`; only `api_key_ref` belongs in SQLite.
- The matrix should show the latest result for each prompt version and case pair.
- The single-version review page should show both LLM judgement and human label when both exist.
