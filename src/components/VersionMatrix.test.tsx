import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { VersionMatrix } from "./VersionMatrix";
import type { CaseResultSummary, PromptVersionRecord, TestCaseRecord } from "../types";

const versions: PromptVersionRecord[] = [
  {
    id: "v1",
    promptId: "p1",
    versionName: "v1",
    content: "first",
    note: null
  },
  {
    id: "v2",
    promptId: "p1",
    versionName: "v2",
    content: "second",
    note: null
  },
  {
    id: "v3",
    promptId: "p1",
    versionName: "v3",
    content: "third",
    note: null
  }
];

const cases: TestCaseRecord[] = [
  {
    id: "c1",
    promptId: "p1",
    title: "Stable case",
    input: "Always passes",
    tags: "memory",
    note: null,
    enabled: true
  },
  {
    id: "c2",
    promptId: "p1",
    title: "Regression case",
    input: "Got worse",
    tags: "regression",
    note: null,
    enabled: true
  },
  {
    id: "c3",
    promptId: "p1",
    title: "Improving case",
    input: "Got better",
    tags: "quality",
    note: null,
    enabled: true
  }
];

const results: CaseResultSummary[] = [
  result("v1", "c1", "pass"),
  result("v2", "c1", "pass"),
  result("v3", "c1", "pass"),
  result("v1", "c2", "pass"),
  result("v2", "c2", "pass"),
  result("v3", "c2", "fail"),
  result("v1", "c3", "fail"),
  result("v2", "c3", "fail"),
  result("v3", "c3", "pass")
];

const failedResults: CaseResultSummary[] = [
  result("v1", "c1", "pass"),
  result("v2", "c1", "pass"),
  result("v3", "c1", "pass"),
  result("v1", "c2", "fail"),
  result("v2", "c2", "fail"),
  result("v3", "c2", "fail"),
  result("v1", "c3", "fail"),
  result("v2", "c3", "fail"),
  result("v3", "c3", "pass")
];

function result(
  promptVersionId: string,
  testCaseId: string,
  outcome: "pass" | "fail"
): CaseResultSummary {
  return {
    caseResultId: `${promptVersionId}-${testCaseId}`,
    promptVersionId,
    testCaseId,
    runStatus: "completed",
    llmJudgement: { result: outcome, reason: "fixture" },
    humanLabel: null
  };
}

describe("VersionMatrix", () => {
  it("renders a matrix of cases across prompt versions", () => {
    render(<VersionMatrix versions={versions} cases={cases} results={results} />);

    expect(screen.getByRole("columnheader", { name: "Case" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "v1" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "v2" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "v3" })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Regression case/ })).toHaveTextContent("regression");
  });

  it("filters failed and regression rows", async () => {
    const user = userEvent.setup();
    render(<VersionMatrix versions={versions} cases={cases} results={results} />);

    await user.click(screen.getByRole("button", { name: "Failed only" }));

    expect(screen.queryByRole("row", { name: /Stable case/ })).not.toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Regression case/ })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Improving case/ })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Regression" }));

    expect(screen.queryByRole("row", { name: /Improving case/ })).not.toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Regression case/ })).toBeInTheDocument();
  });

  it("selects visible cases and updates run controls", async () => {
    const user = userEvent.setup();
    render(<VersionMatrix versions={versions} cases={cases} results={results} />);

    await user.click(screen.getByLabelText("Select Stable case"));
    await user.click(screen.getByLabelText("Select Regression case"));

    expect(screen.getByRole("button", { name: "Run Selected" })).toBeEnabled();
    expect(screen.getByText("2 selected")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Select all visible cases"));

    const rows = screen.getAllByRole("row").slice(1);
    rows.forEach((row) => {
      expect(within(row).getByRole("checkbox")).toBeChecked();
    });
  });

  it("selects all visible cases without hidden selections controlling header state", async () => {
    const user = userEvent.setup();
    render(<VersionMatrix versions={versions} cases={cases} results={failedResults} />);

    await user.click(screen.getByLabelText("Select Stable case"));
    await user.click(screen.getByRole("button", { name: "Failed only" }));

    const headerCheckbox = screen.getByLabelText("Select all visible cases");

    expect(headerCheckbox).not.toBeChecked();
    expect(headerCheckbox).toHaveAttribute("aria-checked", "false");

    await user.click(screen.getByLabelText("Select Regression case"));

    expect(headerCheckbox).not.toBeChecked();
    expect(headerCheckbox).toHaveAttribute("aria-checked", "mixed");
    expect((headerCheckbox as HTMLInputElement).indeterminate).toBe(true);

    await user.click(headerCheckbox);

    expect(headerCheckbox).toBeChecked();
    expect(headerCheckbox).toHaveAttribute("aria-checked", "true");
    expect(screen.getByLabelText("Select Regression case")).toBeChecked();
    expect(screen.getByLabelText("Select Improving case")).toBeChecked();
    expect(screen.queryByLabelText("Select Stable case")).not.toBeInTheDocument();
  });
});
