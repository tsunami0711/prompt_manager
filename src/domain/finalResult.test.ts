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
