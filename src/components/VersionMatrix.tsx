import { useMemo, useState } from "react";
import { computeFinalResult } from "../domain/finalResult";
import { classifyTrend, type Trend } from "../domain/matrix";
import type {
  CaseResultSummary,
  FinalResultValue,
  PromptVersionRecord,
  TestCaseRecord
} from "../types";
import { ResultBadge } from "./ResultBadge";
import { RunControls } from "./RunControls";

type MatrixFilter = "all" | "failed" | "regression";
type JudgeMode = "human" | "llm";

interface MatrixRow {
  testCase: TestCaseRecord;
  values: FinalResultValue[];
  trend: Trend;
}

const filters: Array<{ label: string; value: MatrixFilter }> = [
  { label: "All", value: "all" },
  { label: "Failed only", value: "failed" },
  { label: "Regression", value: "regression" }
];

export function VersionMatrix({
  versions,
  cases,
  results
}: {
  versions: PromptVersionRecord[];
  cases: TestCaseRecord[];
  results: CaseResultSummary[];
}) {
  const [selectedCaseIds, setSelectedCaseIds] = useState<Set<string>>(() => new Set());
  const [filter, setFilter] = useState<MatrixFilter>("all");
  const [judgeMode, setJudgeMode] = useState<JudgeMode>("human");

  const resultByVersionAndCase = useMemo(() => {
    const map = new Map<string, CaseResultSummary>();

    results.forEach((result) => {
      map.set(getResultKey(result.promptVersionId, result.testCaseId), result);
    });

    return map;
  }, [results]);

  const rows = useMemo<MatrixRow[]>(
    () =>
      cases.map((testCase) => {
        const values = versions.map((version) => {
          const result = resultByVersionAndCase.get(getResultKey(version.id, testCase.id));
          return result ? computeFinalResult(result).result : "pending";
        });

        return {
          testCase,
          values,
          trend: classifyTrend(values)
        };
      }),
    [cases, resultByVersionAndCase, versions]
  );

  const visibleRows = rows.filter((row) => {
    if (filter === "failed") return row.values.includes("fail") || row.values.includes("error");
    if (filter === "regression") return row.trend === "regression";
    return true;
  });

  const visibleCaseIds = visibleRows.map((row) => row.testCase.id);
  const allVisibleSelected =
    visibleCaseIds.length > 0 && visibleCaseIds.every((id) => selectedCaseIds.has(id));

  function toggleCase(id: string) {
    setSelectedCaseIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleVisibleCases() {
    setSelectedCaseIds((current) => {
      const next = new Set(current);

      if (allVisibleSelected) {
        visibleCaseIds.forEach((id) => next.delete(id));
      } else {
        visibleCaseIds.forEach((id) => next.add(id));
      }

      return next;
    });
  }

  return (
    <section className="matrix-view" aria-label="Version matrix">
      <div className="matrix-toolbar">
        <div className="matrix-filter-group" aria-label="Matrix filters">
          {filters.map((item) => (
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
        <div className="matrix-actions">
          <span className="selection-count">{selectedCaseIds.size} selected</span>
          <RunControls
            selectedCount={selectedCaseIds.size}
            judgeMode={judgeMode}
            onJudgeModeChange={setJudgeMode}
            onRunSelected={() => undefined}
            onRunAll={() => undefined}
          />
        </div>
      </div>

      <div className="matrix-scroll">
        <table className="version-matrix">
          <thead>
            <tr>
              <th className="select-column">
                <input
                  type="checkbox"
                  aria-label="Select all cases"
                  checked={allVisibleSelected}
                  onChange={toggleVisibleCases}
                />
              </th>
              <th className="case-column">Case</th>
              <th className="trend-column">Trend</th>
              {versions.map((version) => (
                <th key={version.id} className="version-column">
                  {version.versionName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.testCase.id}>
                <td className="select-column">
                  <input
                    type="checkbox"
                    aria-label={`Select ${row.testCase.title}`}
                    checked={selectedCaseIds.has(row.testCase.id)}
                    onChange={() => toggleCase(row.testCase.id)}
                  />
                </td>
                <th scope="row" className="case-column">
                  <span>{row.testCase.title}</span>
                  {row.testCase.tags && <small>{row.testCase.tags}</small>}
                </th>
                <td className={`trend-column trend-${row.trend}`}>{row.trend}</td>
                {row.values.map((value, index) => (
                  <td key={versions[index]?.id ?? index} className="result-column">
                    <ResultBadge value={value} />
                  </td>
                ))}
              </tr>
            ))}
            {visibleRows.length === 0 && (
              <tr>
                <td className="matrix-empty" colSpan={versions.length + 3}>
                  No cases match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function getResultKey(promptVersionId: string, testCaseId: string) {
  return `${promptVersionId}:${testCaseId}`;
}
