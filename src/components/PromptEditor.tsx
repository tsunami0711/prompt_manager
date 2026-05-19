import type { PromptVersionRecord } from "../types";

interface PromptEditorProps {
  version: PromptVersionRecord | null;
  canCreateVersion?: boolean;
  onContentChange: (content: string) => void;
  onCreateVersion: () => void;
}

export function PromptEditor({
  version,
  canCreateVersion = false,
  onContentChange,
  onCreateVersion
}: PromptEditorProps) {
  if (!version) {
    return (
      <section className="panel empty-panel">
        <p>Select a prompt version to edit.</p>
        <button className="button primary" disabled={!canCreateVersion} onClick={onCreateVersion}>
          Create Version
        </button>
      </section>
    );
  }

  return (
    <section className="panel prompt-editor">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Prompt Editor</p>
          <h2>{version.versionName}</h2>
        </div>
        <button className="button primary" onClick={onCreateVersion}>
          Create Version
        </button>
      </div>
      <textarea
        className="prompt-textarea"
        aria-label="Prompt content"
        value={version.content}
        onChange={(event) => onContentChange(event.target.value)}
      />
    </section>
  );
}
