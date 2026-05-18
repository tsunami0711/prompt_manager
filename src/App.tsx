import { useMemo, useState } from "react";
import { CaseManager } from "./components/CaseManager";
import { PromptEditor } from "./components/PromptEditor";
import { Sidebar } from "./components/Sidebar";
import { Tabs, type WorkspaceTab } from "./components/Tabs";
import type { PromptRecord, PromptVersionRecord, TestCaseRecord } from "./types";

const prompts: PromptRecord[] = [
  { id: "p1", name: "Memory Extractor", description: "Extract durable memories" }
];

const initialVersions: PromptVersionRecord[] = [
  {
    id: "v1",
    promptId: "p1",
    versionName: "v1",
    content: "Extract durable user memories from the input.",
    note: null
  }
];

const cases: TestCaseRecord[] = [
  {
    id: "c1",
    promptId: "p1",
    title: "City preference",
    input: "I prefer Shanghai events.",
    tags: "memory",
    note: null,
    enabled: true
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("editor");
  const [selectedPromptId, setSelectedPromptId] = useState("p1");
  const [selectedVersionId, setSelectedVersionId] = useState("v1");
  const [versions, setVersions] = useState(initialVersions);

  const selectedVersion = useMemo(
    () => versions.find((version) => version.id === selectedVersionId) ?? null,
    [selectedVersionId, versions]
  );

  function updateVersionContent(content: string) {
    setVersions((current) =>
      current.map((version) =>
        version.id === selectedVersionId ? { ...version, content } : version
      )
    );
  }

  return (
    <main className="app-layout">
      <Sidebar
        prompts={prompts}
        versions={versions}
        selectedPromptId={selectedPromptId}
        selectedVersionId={selectedVersionId}
        onSelectPrompt={setSelectedPromptId}
        onSelectVersion={setSelectedVersionId}
      />
      <section className="workspace">
        <Tabs active={activeTab} onChange={setActiveTab} />
        {activeTab === "editor" && (
          <div className="editor-grid">
            <PromptEditor version={selectedVersion} onContentChange={updateVersionContent} />
            <CaseManager cases={cases} />
          </div>
        )}
      </section>
    </main>
  );
}
