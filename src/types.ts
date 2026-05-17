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
