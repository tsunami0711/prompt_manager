import { useMemo, useState } from "react";
import { computeFinalResult } from "../domain/finalResult";
import type { CaseResultSummary, PassFail, TestCaseRecord } from "../types";
import { ResultBadge } from "./ResultBadge";

interface CaseReviewRow {
  testCase: TestCaseRecord;
  result: CaseResultSummary | null;
}

type ReviewFilter = "all" | "failed" | "unreviewed" | "disagreement";

const reviewFilters: Array<{ label: string; value: ReviewFilter }> = [
  { label: "All", value: "all" },
  { label: "Failed", value: "failed" },
  { label: "Unreviewed", value: "unreviewed" },
  { label: "Disagreement", value: "disagreement" }
];

export function VersionCaseResults({
  cases,
  results,
  selectedVersionId,
  onLabel,
  onSelectedCaseChange
}: {
  cases: TestCaseRecord[];
  results: CaseResultSummary[];
  selectedVersionId: string | null;
  onLabel: (caseResultId: string, result: PassFail) => void;
  onSelectedCaseChange?: (caseId: string | null) => void;
}) {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(cases[0]?.id ?? null);
  const [filter, setFilter] = useState<ReviewFilter>("all");

  const resultByCaseId = useMemo(() => {
    const map = new Map<string, CaseResultSummary>();

    if (!selectedVersionId) return map;

    results.forEach((result) => {
      if (result.promptVersionId === selectedVersionId) {
        map.set(result.testCaseId, result);
      }
    });

    return map;
  }, [results, selectedVersionId]);

  const rows = useMemo<CaseReviewRow[]>(
    () =>
      cases.map((testCase) => ({
        testCase,
        result: resultByCaseId.get(testCase.id) ?? null
      })),
    [cases, resultByCaseId]
  );

  const selectedRow =
    rows.find((row) => row.testCase.id === selectedCaseId) ?? rows[0] ?? null;
  const visibleRows = rows.filter((row) => {
    const finalResult = row.result ? computeFinalResult(row.result).result : "pending";
    if (filter === "failed") return finalResult === "fail" || finalResult === "error";
    if (filter === "unreviewed") return Boolean(row.result?.caseResultId && !row.result.humanLabel);
    if (filter === "disagreement") {
      return Boolean(
        row.result?.humanLabel &&
          row.result.llmJudgement &&
          row.result.humanLabel.result !== row.result.llmJudgement.result
      );
    }
    return true;
  });
  const selectedResult = selectedRow?.result ?? null;
  const canLabel = Boolean(selectedResult?.caseResultId);

  function label(result: PassFail) {
    if (!selectedResult?.caseResultId) return;
    onLabel(selectedResult.caseResultId, result);
  }

  function selectCase(caseId: string) {
    setSelectedCaseId(caseId);
    onSelectedCaseChange?.(caseId);
  }

  if (!selectedVersionId) {
    return <p className="empty-panel">Select a prompt version to review case results.</p>;
  }

  return (
    <section className="case-results-view" aria-label="Version case results">
      <div className="case-results-list" aria-label="Cases for selected version">
        <div className="case-results-list-header">
          <span>Case</span>
          <span>Status</span>
        </div>
        <div className="review-filter-group" aria-label="Review filters">
          {reviewFilters.map((item) => (
            <button
              key={item.value}
              className={filter === item.value ? "filter-button active" : "filter-button"}
              aria-pressed={filter === item.value}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
        {visibleRows.map((row) => {
          const finalResult = row.result ? computeFinalResult(row.result).result : "pending";
          const isSelected = selectedRow?.testCase.id === row.testCase.id;

          return (
            <button
              key={row.testCase.id}
              className={isSelected ? "case-result-row selected" : "case-result-row"}
              aria-pressed={isSelected}
              onClick={() => selectCase(row.testCase.id)}
            >
              <span className="case-result-title">
                <strong>{row.testCase.title}</strong>
                {row.testCase.tags && <small>{row.testCase.tags}</small>}
              </span>
              <ResultBadge value={finalResult} />
            </button>
          );
        })}
        {visibleRows.length === 0 && <p className="case-results-empty">No cases match this filter.</p>}
      </div>

      <section className="case-review-detail panel" aria-label="Case review detail">
        {selectedRow ? (
          <>
            <div className="panel-header">
              <div>
                <p className="eyebrow">Selected Case</p>
                <h2>{selectedRow.testCase.title}</h2>
              </div>
              <ResultBadge
                value={selectedResult ? computeFinalResult(selectedResult).result : "pending"}
              />
            </div>

            <div className="review-block">
              <h3>Input</h3>
              <pre>{selectedRow.testCase.input}</pre>
            </div>

            <div className="review-block">
              <h3>Output</h3>
              {selectedResult?.output ? (
                <pre>{selectedResult.output}</pre>
              ) : selectedResult?.errorMessage ? (
                <p className="muted-copy">{selectedResult.errorMessage}</p>
              ) : (
                <p className="muted-copy">No output recorded.</p>
              )}
            </div>

            <div className="review-block">
              <h3>LLM Judge</h3>
              {selectedResult?.llmJudgement ? (
                <div className="judge-summary">
                  <ResultBadge value={selectedResult.llmJudgement.result} />
                  <p>{selectedResult.llmJudgement.reason}</p>
                </div>
              ) : selectedResult?.llmJudgementError ? (
                <div className="judge-summary">
                  <ResultBadge value="error" />
                  <p>{selectedResult.llmJudgementError}</p>
                </div>
              ) : (
                <p className="muted-copy">No LLM judgement recorded.</p>
              )}
            </div>

            <div className="manual-label-actions" aria-label="Manual label">
              <button className="button" disabled={!canLabel} onClick={() => label("pass")}>
                Pass
              </button>
              <button className="button" disabled={!canLabel} onClick={() => label("fail")}>
                Fail
              </button>
              {!canLabel && (
                <span className="manual-label-hint">Run result required before labelling.</span>
              )}
            </div>
          </>
        ) : (
          <p className="empty-panel">No case selected.</p>
        )}
      </section>
    </section>
  );
}
