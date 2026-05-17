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
