export function RunControls({
  selectedCount,
  judgeMode,
  onJudgeModeChange,
  onRunSelected,
  onRunAll
}: {
  selectedCount: number;
  judgeMode: "human" | "llm";
  onJudgeModeChange: (mode: "human" | "llm") => void;
  onRunSelected: () => void;
  onRunAll: () => void;
}) {
  return (
    <div className="run-controls">
      <span className="judge-pill">
        Judge by {judgeMode === "llm" ? "LLM" : "Human"}
      </span>
      <select
        aria-label="Judge mode"
        value={judgeMode}
        onChange={(event) => onJudgeModeChange(event.target.value as "human" | "llm")}
      >
        <option value="human">Judge by Human</option>
        <option value="llm">Judge by LLM</option>
      </select>
      <button className="button" disabled={selectedCount === 0} onClick={onRunSelected}>
        Run Selected
      </button>
      <button className="button primary" onClick={onRunAll}>
        Run All
      </button>
    </div>
  );
}
