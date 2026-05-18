export type WorkspaceTab = "editor" | "matrix" | "results" | "history";

const labels: Record<WorkspaceTab, string> = {
  editor: "Prompt Editor",
  matrix: "Version Matrix",
  results: "Version Case Results",
  history: "Run History"
};

export function Tabs({
  active,
  onChange
}: {
  active: WorkspaceTab;
  onChange: (tab: WorkspaceTab) => void;
}) {
  return (
    <nav className="tabs">
      {(Object.keys(labels) as WorkspaceTab[]).map((tab) => (
        <button
          key={tab}
          className={active === tab ? "tab active" : "tab"}
          onClick={() => onChange(tab)}
        >
          {labels[tab]}
        </button>
      ))}
    </nav>
  );
}
