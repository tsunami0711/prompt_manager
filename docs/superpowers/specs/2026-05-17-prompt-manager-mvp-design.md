# Prompt Manager MVP Design

Date: 2026-05-17

## Summary

Prompt Manager is a local desktop workbench for managing prompt test cases, prompt versions, and pass/fail evaluation results. The first version targets a generic prompt evaluation workflow rather than a memory-system-specific tool.

The MVP focuses on one repeatable loop:

1. Create a prompt.
2. Add pure text test cases.
3. Create multiple prompt versions.
4. Run selected cases or all cases against one prompt version.
5. Optionally run LLM-as-Judge.
6. Review results manually and mark pass/fail.
7. Compare pass/fail outcomes across versions.

The app stores data locally in SQLite and supports OpenAI-compatible model endpoints for both the tested prompt and the judge model.

## Goals

- Manage prompts, prompt versions, and test cases in one local desktop app.
- Compare prompt versions by pass/fail outcomes on the same case set.
- Support both manual judgement and LLM-as-Judge.
- Let human labels and LLM judgements coexist.
- Provide a version matrix for cross-version comparison.
- Provide a single-version review page for efficient manual labelling.
- Keep the MVP generic enough for many prompt types, while simple enough to build quickly.

## Non-Goals

- Multi-user collaboration.
- Cloud sync or hosted accounts.
- Provider-specific integrations beyond OpenAI-compatible APIs.
- Custom HTTP request mapping.
- Multi-turn chat test cases.
- Prompt template variables.
- Structured JSON case inputs.
- Exact cost accounting.
- A judge prompt version library.
- Complex role-based prompt editing.

These are future extensions, not first-version requirements.

## Product Decisions

- The first case input type is pure text.
- The first prompt content type is pure text.
- Evaluation result type is pass/fail.
- The tested model uses an OpenAI-compatible configuration.
- The judge model uses a separate OpenAI-compatible configuration.
- Each prompt has a default run model configuration.
- Each run may override the prompt default run model configuration.
- LLM-as-Judge is optional.
- Manual judgement is always available.
- Final displayed result is computed from stored judgements:
  - human label first
  - LLM judgement second
  - pending if neither exists
- For the same prompt version and test case, the default UI shows the latest result.
- Historical runs remain available in run history and detail views.

## Core Information Architecture

The app has a persistent left sidebar and a tabbed main workspace.

### Left Sidebar

The left sidebar manages navigation across prompts and versions:

- Search prompts.
- Create a new prompt.
- Select a prompt.
- Show available versions for the selected prompt.
- Open a specific version.
- Provide entry points for model configuration.

When a prompt is selected, its versions can appear as a popup or secondary list. Clicking a version opens that prompt version in the main workspace.

### Main Workspace Tabs

The MVP uses four primary tabs:

- Prompt Editor
- Version Matrix
- Version Case Results
- Run History

#### Prompt Editor

The Prompt Editor edits one pure text prompt version at a time.

Expected capabilities:

- View prompt metadata.
- Edit prompt text.
- Create a new version from the current version.
- Rename or annotate a version.
- Select the prompt's default run model configuration.

#### Version Matrix

The Version Matrix compares many prompt versions against the same test case set.

Expected capabilities:

- Display cases as rows.
- Display prompt versions as horizontally scrollable columns.
- Keep case identity columns fixed while version columns scroll.
- Show each version/case cell's latest final result.
- Highlight regression, improvement, stable passing, stable failing, pending, and error states.
- Filter by all cases, failed only, regression, improved, and unreviewed.
- Search cases.
- Filter by status and tags.
- Sort by regression first or other useful orders.
- Select cases with checkboxes.
- Run selected cases.
- Run all enabled cases.

The Version Matrix should not have a dedicated Judge column. Instead, it shows the current judge mode near the filter controls, such as "Judge by LLM" or "Judge by Human".

#### Version Case Results

The Version Case Results tab focuses on one prompt version and all cases run against that version.

Expected capabilities:

- List all cases for the selected prompt version.
- Show LLM judgement result when available.
- Show human label when available.
- Show final result.
- Filter all cases, failed only, unlabeled, and LLM/human disagreements.
- Select a case and view full details.
- Mark a case result as pass or fail manually.
- Add or update a reviewer note.
- View LLM judge reason.

This is the primary page for manual review and labelling.

#### Run History

Run History records past execution attempts.

Expected capabilities:

- Show run status, start time, end time, selected version, case scope, run model, judge mode, and success/error counts.
- Open a run to inspect outputs and errors.
- Let users understand which configuration produced a result.

## Data Model

The MVP uses SQLite. The data model is organized around prompt versions, shared test cases, and result cells.

### prompts

Represents a prompt project.

Fields:

- id
- name
- description
- default_run_model_config_id
- created_at
- updated_at

### prompt_versions

Represents one version of a prompt.

Fields:

- id
- prompt_id
- version_name
- content
- note
- created_at
- updated_at

MVP stores pure text prompt content. It does not store structured chat messages or template variables.

### test_cases

Represents a pure text test case owned by a prompt.

Fields:

- id
- prompt_id
- title
- input
- tags
- note
- enabled
- created_at
- updated_at

All prompt versions under the same prompt share the same case set.

### model_configs

Represents an OpenAI-compatible model configuration.

Fields:

- id
- name
- config_type: run or judge
- base_url
- model
- api_key_ref
- temperature
- max_tokens
- created_at
- updated_at

The app should avoid copying raw API keys into run records, result records, exports, logs, or visible error messages. The concrete desktop secret-storage mechanism can be selected during implementation.

### evaluation_runs

Represents one run action.

Fields:

- id
- prompt_id
- prompt_version_id
- run_model_config_id
- judge_mode: human or llm
- judge_model_config_id
- judge_prompt
- case_scope: selected or all
- status: queued, running, completed, completed_with_errors, failed, cancelled
- started_at
- finished_at
- created_at

For MVP, cancellation can be represented in the model even if full cancellation UI is deferred.

When judge_mode is human, judge_model_config_id and judge_prompt are empty. When judge_mode is llm, both are required.

### case_results

Represents a prompt output for one prompt version and one test case during one run.

Fields:

- id
- evaluation_run_id
- prompt_version_id
- test_case_id
- output
- status: pending, running, completed, error
- error_message
- latency_ms
- token_usage_json
- created_at

The Version Matrix displays the latest case_result per prompt_version_id and test_case_id by default.

### llm_judgements

Represents LLM-as-Judge output for a case_result.

Fields:

- id
- case_result_id
- judge_model_config_id
- judge_prompt
- result: pass or fail
- reason
- raw_response
- status: completed or error
- error_message
- created_at

The judge prompt must ask the model to return parseable JSON:

```json
{
  "result": "pass",
  "reason": "short explanation"
}
```

The accepted result values are `pass` and `fail`.

### human_labels

Represents the latest manual judgement for a case_result.

Fields:

- id
- case_result_id
- result: pass or fail
- note
- created_at
- updated_at

Human labels do not delete or overwrite LLM judgements. They only take priority when the UI computes the final result.

## Final Result Rule

The UI computes a final result for display and analytics:

1. If the prompt run failed, show error.
2. Else if a human label exists, use the human label.
3. Else if an LLM judgement exists, use the LLM judgement.
4. Else show pending.
5. If the prompt run succeeded but judging failed, show the prompt output and mark the judge state as judge error.

Pass rate, regression, and improvement calculations use this final result.

## Run Flow

### Run Selected Case

1. User selects one or more cases in the matrix or single-version results page.
2. User clicks Run Selected Case.
3. App opens or confirms run settings.
4. User chooses the run model configuration or accepts the prompt default.
5. User chooses judge mode:
   - Judge by Human
   - Judge by LLM
6. If Judge by LLM is selected, user must provide or select:
   - judge model configuration
   - judge prompt
7. App creates an evaluation_run.
8. App runs the prompt version against each selected case.
9. App writes case_results independently for each case.
10. If Judge by LLM is enabled, app runs judge evaluation for each completed case_result.
11. UI updates the matrix and single-version results page.

### Run All Case

Run All Case follows the same flow, but uses all enabled cases for the selected prompt.

Partial success is allowed. A run may complete with errors if some cases fail and others succeed.

## Model Invocation

The MVP uses an OpenAI-compatible Chat Completions style API.

For each test case:

- The prompt version's pure text content becomes the main prompt instruction.
- The test case input is passed as the user input.
- The model output is saved as the case_result output.

The exact request shape can be chosen during implementation, but it must support base_url, api_key, model, temperature, and max_tokens.

## Judge Invocation

When Judge by LLM is enabled, the app sends the judge model enough context to decide pass/fail:

- test case input
- prompt version content
- prompt output
- judge prompt

The judge response must be parsed into:

- result: pass or fail
- reason: string

If parsing fails:

- case_result remains available
- llm_judgement stores an error state
- UI shows Judge Error
- user may manually label the case

## Error Handling

### Prompt Run Errors

The app records prompt run errors per case_result.

Examples:

- network failure
- timeout
- invalid API key
- invalid base URL
- invalid model name
- rate limit
- provider response error

The table cell should show Error. The detail panel should show the error message and run configuration summary.

### Judge Errors

Judge failures must not invalidate successful prompt outputs.

If prompt execution succeeds but judge execution fails:

- output remains visible
- LLM judgement shows Judge Error
- human labelling remains available

### Partial Runs

Run All Case and Run Selected Case should persist each case result independently. A failed case must not prevent successful cases from being saved.

### History

The app keeps multiple runs. Default views show the latest result for each version/case pair, while Run History and detail views can show older attempts.

## Testing Strategy

### Unit Tests

Cover core business rules:

- final result priority
- human label priority over LLM judgement
- pending state calculation
- error state calculation
- LLM judge JSON parsing
- pass rate calculation
- regression calculation
- improvement calculation
- latest result selection for a version/case pair

### Integration Tests

Use a test SQLite database and a mock OpenAI-compatible server.

Cover:

- prompt creation
- prompt version creation
- test case creation
- evaluation run creation
- case_result persistence
- llm_judgement persistence
- human_label persistence
- model configuration read/write
- prompt run success
- prompt run failure
- judge success
- judge parsing failure

### UI Tests

Cover critical workflows:

- select prompt from sidebar
- open a prompt version
- edit prompt text
- create a prompt version
- create and edit test cases
- view Version Matrix
- horizontally scroll many version columns
- filter failed only
- filter regressions
- select cases
- run selected cases
- run all cases
- open Version Case Results
- mark pass/fail manually
- show LLM judgement result and reason
- show final result correctly

### Manual QA Scenario

Use this smoke test before considering the MVP complete:

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

## Future Extensions

The design intentionally leaves room for:

- template variables
- structured JSON case input
- multi-turn message cases
- provider-specific adapters
- custom HTTP mapping
- judge prompt versioning
- batch import/export
- Git-friendly project file export
- cost tracking
- run retries and concurrency controls
- keyboard-first manual labelling
- disagreement review between LLM and human labels
- richer analytics and failure clustering

These should be added after the MVP proves the core prompt-version evaluation loop.
