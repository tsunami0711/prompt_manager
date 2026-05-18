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
  return invoke<PromptRecord>("create_prompt", input);
}

export async function createPromptVersion(input: {
  promptId: string;
  versionName: string;
  content: string;
  note?: string | null;
}) {
  return invoke<PromptVersionRecord>("create_prompt_version", input);
}

export async function createTestCase(input: {
  promptId: string;
  title: string;
  input: string;
  tags: string;
  note?: string | null;
}) {
  return invoke<TestCaseRecord>("create_test_case", input);
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
