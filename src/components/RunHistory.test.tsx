import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { RunHistory } from "./RunHistory";
import type { RunHistoryItem } from "../types";

const runs: RunHistoryItem[] = [
  {
    id: "run-1",
    status: "completed",
    promptVersionName: "v2",
    caseScope: "selected",
    judgeMode: "llm",
    startedAt: "2026-05-19T08:00:00.000Z",
    finishedAt: "2026-05-19T08:00:12.000Z",
    successCount: 3,
    errorCount: 1
  },
  {
    id: "run-2",
    status: "error",
    promptVersionName: "v1",
    caseScope: "all",
    judgeMode: "human",
    startedAt: "2026-05-19T07:45:00.000Z",
    finishedAt: null,
    successCount: 0,
    errorCount: 2
  }
];

describe("RunHistory", () => {
  it("renders dense run rows with status, scope, judge, and counts", () => {
    render(<RunHistory runs={runs} />);

    expect(screen.getByRole("region", { name: "Run history" })).toBeInTheDocument();
    expect(screen.getByRole("listitem", { name: /v2/ })).toHaveTextContent("Completed");
    expect(screen.getByRole("listitem", { name: /v2/ })).toHaveTextContent("Selected");
    expect(screen.getByRole("listitem", { name: /v2/ })).toHaveTextContent("LLM");
    expect(screen.getByRole("listitem", { name: /v2/ })).toHaveTextContent("3 ok");
    expect(screen.getByRole("listitem", { name: /v2/ })).toHaveTextContent("1 error");
    expect(screen.getByRole("listitem", { name: /v1/ })).toHaveTextContent("All");
    expect(screen.getByRole("listitem", { name: /v1/ })).toHaveTextContent("Human");
  });
});
