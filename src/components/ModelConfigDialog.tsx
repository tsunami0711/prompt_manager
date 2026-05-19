import { FormEvent, useState } from "react";

export interface ModelConfigDraft {
  configType: "run" | "judge";
  name: string;
  baseUrl: string;
  model: string;
  apiKey: string;
}

const emptyDraft: ModelConfigDraft = {
  configType: "judge",
  name: "",
  baseUrl: "",
  model: "",
  apiKey: ""
};

export function ModelConfigDialog({
  open,
  onClose,
  onSave
}: {
  open: boolean;
  onClose: () => void;
  onSave: (draft: ModelConfigDraft) => void;
}) {
  const [draft, setDraft] = useState<ModelConfigDraft>(emptyDraft);

  if (!open) return null;

  function update(field: keyof ModelConfigDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(draft);
    setDraft(emptyDraft);
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <section
        className="config-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="config-dialog-title"
      >
        <div className="panel-header">
          <div>
            <p className="eyebrow">Judge Config</p>
            <h2 id="config-dialog-title">Model Configuration</h2>
          </div>
          <button className="icon-button" aria-label="Close model config" onClick={onClose}>
            x
          </button>
        </div>

        <form className="config-form" onSubmit={submit}>
          <label>
            <span>Type</span>
            <select
              className="input"
              value={draft.configType}
              onChange={(event) =>
                update("configType", event.target.value as ModelConfigDraft["configType"])
              }
            >
              <option value="judge">Judge Model</option>
              <option value="run">Run Model</option>
            </select>
          </label>
          <label>
            <span>Name</span>
            <input
              className="input"
              value={draft.name}
              onChange={(event) => update("name", event.target.value)}
              required
            />
          </label>
          <label>
            <span>Base URL</span>
            <input
              className="input"
              value={draft.baseUrl}
              onChange={(event) => update("baseUrl", event.target.value)}
              placeholder="https://api.openai.com/v1"
              required
            />
          </label>
          <label>
            <span>Model</span>
            <input
              className="input"
              value={draft.model}
              onChange={(event) => update("model", event.target.value)}
              required
            />
          </label>
          <label>
            <span>API Key</span>
            <input
              className="input"
              type="password"
              value={draft.apiKey}
              onChange={(event) => update("apiKey", event.target.value)}
              required
            />
          </label>
          <div className="config-actions">
            <button className="button" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="button primary" type="submit">
              Save Config
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
