import { FormEvent, useState } from "react";
import type { ModelConfigRecord } from "../types";

export interface ModelConfigDraft {
  configType: "run" | "judge";
  name: string;
  baseUrl: string;
  model: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
}

const emptyDraft: ModelConfigDraft = {
  configType: "judge",
  name: "",
  baseUrl: "",
  model: "",
  apiKey: "",
  temperature: 0,
  maxTokens: 1024
};

export function ModelConfigPanel({
  runConfigs,
  judgeConfigs,
  onSave
}: {
  runConfigs: ModelConfigRecord[];
  judgeConfigs: ModelConfigRecord[];
  onSave: (draft: ModelConfigDraft) => void;
}) {
  const [draft, setDraft] = useState<ModelConfigDraft>(emptyDraft);

  function update(field: keyof ModelConfigDraft, value: string | number) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(draft);
    setDraft(emptyDraft);
  }

  return (
    <section className="model-config-view" aria-label="Model configuration">
      <div className="model-config-grid">
        <section className="panel config-panel" aria-labelledby="config-panel-title">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Providers</p>
              <h2 id="config-panel-title">Model Config</h2>
            </div>
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
            <div className="config-form-row">
              <label>
                <span>Temperature</span>
                <input
                  className="input"
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={draft.temperature}
                  onChange={(event) => update("temperature", Number(event.target.value))}
                />
              </label>
              <label>
                <span>Max tokens</span>
                <input
                  className="input"
                  type="number"
                  min="1"
                  step="1"
                  value={draft.maxTokens}
                  onChange={(event) => update("maxTokens", Number(event.target.value))}
                />
              </label>
            </div>
            <div className="config-actions">
              <button className="button primary" type="submit">
                Save Config
              </button>
            </div>
          </form>
        </section>

        <section className="panel saved-configs" aria-label="Saved model configs">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Saved</p>
              <h2>Configured Models</h2>
            </div>
          </div>
          <ConfigGroup title="Run Models" configs={runConfigs} />
          <ConfigGroup title="Judge Models" configs={judgeConfigs} />
        </section>
      </div>
    </section>
  );
}

function ConfigGroup({
  title,
  configs
}: {
  title: string;
  configs: ModelConfigRecord[];
}) {
  return (
    <div className="config-group">
      <h3>{title}</h3>
      {configs.length === 0 ? (
        <p className="config-empty">No configs yet.</p>
      ) : (
        <div className="config-card-list">
          {configs.map((config) => (
            <article className="config-card" key={config.id}>
              <strong>{config.name}</strong>
              <span>{config.model}</span>
              <small>{config.baseUrl}</small>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
