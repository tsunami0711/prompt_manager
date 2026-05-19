import type { PromptRecord, PromptVersionRecord } from "../types";

interface SidebarProps {
  prompts: PromptRecord[];
  versions: PromptVersionRecord[];
  selectedPromptId: string | null;
  selectedVersionId: string | null;
  onCreatePrompt: () => void;
  onSelectPrompt: (id: string) => void;
  onSelectVersion: (id: string) => void;
}

export function Sidebar({
  prompts,
  versions,
  selectedPromptId,
  selectedVersionId,
  onCreatePrompt,
  onSelectPrompt,
  onSelectVersion
}: SidebarProps) {
  const visibleVersions = selectedPromptId
    ? versions.filter((version) => version.promptId === selectedPromptId)
    : [];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <strong>Prompts</strong>
        <button className="icon-button" aria-label="New prompt" onClick={onCreatePrompt}>
          +
        </button>
      </div>
      <input className="input" aria-label="Search prompts" placeholder="Search prompt" />
      <div className="sidebar-list">
        {prompts.map((prompt) => (
          <button
            key={prompt.id}
            className={prompt.id === selectedPromptId ? "sidebar-item selected" : "sidebar-item"}
            onClick={() => onSelectPrompt(prompt.id)}
          >
            <span>{prompt.name}</span>
          </button>
        ))}
      </div>
      {selectedPromptId && (
        <div className="version-list">
          <p className="eyebrow">Versions</p>
          {visibleVersions.map((version) => (
            <button
              key={version.id}
              className={version.id === selectedVersionId ? "version-item selected" : "version-item"}
              onClick={() => onSelectVersion(version.id)}
            >
              {version.versionName}
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
