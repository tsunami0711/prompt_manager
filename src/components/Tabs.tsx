export type WorkspaceTab = "editor" | "matrix" | "results" | "history" | "config";

const labels: Record<WorkspaceTab, string> = {
  editor: "Prompt Editor",
  matrix: "Version Matrix",
  results: "Version Case Results",
  history: "Run History",
  config: "Model Config"
};

export function Tabs({
  active,
  onChange
}: {
  active: WorkspaceTab;
  onChange: (tab: WorkspaceTab) => void;
}) {
  return (
    <nav className="tabs" aria-label="Workspace views">
      {(Object.keys(labels) as WorkspaceTab[]).map((tab) => (
        <button
          key={tab}
          className={active === tab ? "tab active" : "tab"}
          aria-current={active === tab ? "page" : undefined}
          onClick={() => onChange(tab)}
        >
          {labels[tab]}
        </button>
      ))}
    </nav>
  );
}
