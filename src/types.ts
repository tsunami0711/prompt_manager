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
  note?: string | null;
}

export interface TestCaseRecord {
  id: string;
  promptId: string;
  title: string;
  input: string;
  tags?: string;
  note?: string | null;
  enabled?: boolean;
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
