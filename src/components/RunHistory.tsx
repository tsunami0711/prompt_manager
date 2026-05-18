import type { RunHistoryItem } from "../types";

export function RunHistory({ runs }: { runs: RunHistoryItem[] }) {
  return (
    <section className="history-panel panel" aria-label="Run history">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Evaluation Runs</p>
          <h2>Run History</h2>
        </div>
        <span className="selection-count">{runs.length} runs</span>
      </div>

      {runs.length > 0 ? (
        <ul className="history-list">
          {runs.map((run) => (
            <li
              key={run.id}
              className="history-row"
              aria-label={`${run.promptVersionName} ${label(run.status)} run`}
            >
              <span className={`status-dot status-${run.status}`} aria-hidden="true" />
              <span className="history-main">
                <strong>{run.promptVersionName}</strong>
                <small>
                  {formatDate(run.startedAt)}
                  {run.finishedAt ? ` - ${formatDate(run.finishedAt)}` : ""}
                </small>
              </span>
              <span className="history-meta">{label(run.status)}</span>
              <span className="history-meta">{label(run.caseScope)}</span>
              <span className="history-meta">{run.judgeMode === "llm" ? "LLM" : "Human"}</span>
              <span className="history-count success">{run.successCount} ok</span>
              <span className="history-count error">{run.errorCount} error</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-panel">No runs recorded yet.</p>
      )}
    </section>
  );
}

function label(value: string) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
