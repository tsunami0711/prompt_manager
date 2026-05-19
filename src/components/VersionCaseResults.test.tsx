import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { VersionCaseResults } from "./VersionCaseResults";
import type { CaseResultSummary, TestCaseRecord } from "../types";

const cases: TestCaseRecord[] = [
  {
    id: "c1",
    promptId: "p1",
    title: "Known preference",
    input: "I prefer Shanghai events.",
    tags: "memory",
    note: null,
    enabled: true
  },
  {
    id: "c2",
    promptId: "p1",
    title: "Missing result",
    input: "No run has completed for this case yet.",
    tags: "pending",
    note: null,
    enabled: true
  }
];

const results: CaseResultSummary[] = [
  {
    caseResultId: "r1",
    promptVersionId: "v1",
    testCaseId: "c1",
    runStatus: "completed",
    output: "Shanghai events are a durable preference.",
    llmJudgement: { result: "pass", reason: "Contains a durable preference." },
    humanLabel: null
  }
];

describe("VersionCaseResults", () => {
  it('clicking Fail on a selected result calls onLabel("r1", "fail")', async () => {
    const user = userEvent.setup();
    const onLabel = vi.fn();

    render(
      <VersionCaseResults
        cases={cases}
        results={results}
        selectedVersionId="v1"
        onLabel={onLabel}
      />
    );

    await user.click(screen.getByRole("button", { name: /Known preference/ }));
    await user.click(screen.getByRole("button", { name: "Fail" }));

    expect(onLabel).toHaveBeenCalledWith("r1", "fail");
  });

  it("disables manual label buttons when the selected case has no result", async () => {
    const user = userEvent.setup();

    render(
      <VersionCaseResults
        cases={cases}
        results={results}
        selectedVersionId="v1"
        onLabel={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /Missing result/ }));

    const reviewPanel = screen.getByRole("region", { name: "Case review detail" });
    expect(within(reviewPanel).getByRole("button", { name: "Pass" })).toBeDisabled();
    expect(within(reviewPanel).getByRole("button", { name: "Fail" })).toBeDisabled();
  });

  it("shows the LLM judge error message when judgement fails", async () => {
    render(
      <VersionCaseResults
        cases={cases}
        results={[
          {
            caseResultId: "r2",
            promptVersionId: "v1",
            testCaseId: "c1",
            runStatus: "error",
            llmJudgement: null,
            llmJudgementError: "Judge response was not valid JSON.",
            humanLabel: null
          }
        ]}
        selectedVersionId="v1"
        onLabel={vi.fn()}
      />
    );

    expect(screen.getByText("Judge response was not valid JSON.")).toBeInTheDocument();
  });

  it("shows prompt output and run error messages in the detail panel", () => {
    const { rerender } = render(
      <VersionCaseResults
        cases={cases}
        results={results}
        selectedVersionId="v1"
        onLabel={vi.fn()}
      />
    );

    expect(screen.getByText("Shanghai events are a durable preference.")).toBeInTheDocument();

    rerender(
      <VersionCaseResults
        cases={cases}
        results={[
          {
            caseResultId: "r3",
            promptVersionId: "v1",
            testCaseId: "c1",
            runStatus: "error",
            output: "",
            errorMessage: "Run model timed out.",
            llmJudgement: null,
            humanLabel: null
          }
        ]}
        selectedVersionId="v1"
        onLabel={vi.fn()}
      />
    );

    expect(screen.getByText("Run model timed out.")).toBeInTheDocument();
  });
});
