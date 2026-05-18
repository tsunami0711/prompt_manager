import type { PromptVersionRecord } from "../types";

interface PromptEditorProps {
  version: PromptVersionRecord | null;
  onContentChange: (content: string) => void;
}

export function PromptEditor({ version, onContentChange }: PromptEditorProps) {
  if (!version) {
    return <section className="panel empty-panel">Select a prompt version to edit.</section>;
  }

  return (
    <section className="panel prompt-editor">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Prompt Editor</p>
          <h2>{version.versionName}</h2>
        </div>
        <button className="button primary">Create Version</button>
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
