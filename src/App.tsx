import { useMemo, useState } from "react";
import { CaseManager } from "./components/CaseManager";
import { PromptEditor } from "./components/PromptEditor";
import { Sidebar } from "./components/Sidebar";
import { Tabs, type WorkspaceTab } from "./components/Tabs";
import { VersionCaseResults } from "./components/VersionCaseResults";
import { VersionMatrix } from "./components/VersionMatrix";
import type {
  CaseResultSummary,
  PassFail,
  PromptRecord,
  PromptVersionRecord,
  TestCaseRecord
} from "./types";

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
  },
  {
    id: "v2",
    promptId: "p1",
    versionName: "v2",
    content: "Extract durable user memories with explicit preference signals.",
    note: "Tightened preference capture"
  },
  {
    id: "v3",
    promptId: "p1",
    versionName: "v3",
    content: "Extract durable memories and ignore short-lived context.",
    note: "Reduced ephemeral facts"
  },
  {
    id: "v4",
    promptId: "p1",
    versionName: "v4",
    content: "Extract durable memories with confidence and source snippets.",
    note: "Adds evidence"
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
  },
  {
    id: "c2",
    promptId: "p1",
    title: "Temporary errand",
    input: "Remind me to buy tea tonight.",
    tags: "ephemeral",
    note: null,
    enabled: true
  },
  {
    id: "c3",
    promptId: "p1",
    title: "Diet restriction",
    input: "I am allergic to peanuts.",
    tags: "safety",
    note: null,
    enabled: true
  },
  {
    id: "c4",
    promptId: "p1",
    title: "Name correction",
    input: "Actually, call me Mira, not Mia.",
    tags: "identity",
    note: null,
    enabled: true
  }
];

const fixtureResults: CaseResultSummary[] = [
  fixtureResult("v1", "c1", "pass"),
  fixtureResult("v2", "c1", "pass"),
  fixtureResult("v3", "c1", "pass"),
  fixtureResult("v4", "c1", "pass"),
  fixtureResult("v1", "c2", "pass"),
  fixtureResult("v2", "c2", "pass"),
  fixtureResult("v3", "c2", "fail"),
  fixtureResult("v4", "c2", "fail"),
  fixtureResult("v1", "c3", "fail"),
  fixtureResult("v2", "c3", "fail"),
  fixtureResult("v3", "c3", "pass"),
  fixtureResult("v4", "c3", "pass"),
  fixtureResult("v1", "c4", "fail"),
  fixtureResult("v2", "c4", "pass"),
  {
    caseResultId: "v3-c4",
    promptVersionId: "v3",
    testCaseId: "c4",
    runStatus: "error",
    llmJudgement: null,
    humanLabel: null
  },
  fixtureResult("v4", "c4", "pass", "human")
];

function fixtureResult(
  promptVersionId: string,
  testCaseId: string,
  result: PassFail,
  source: "llm" | "human" = "llm"
): CaseResultSummary {
  return {
    caseResultId: `${promptVersionId}-${testCaseId}`,
    promptVersionId,
    testCaseId,
    runStatus: "completed",
    llmJudgement: source === "llm" ? { result, reason: "Fixture judgement" } : null,
    humanLabel: source === "human" ? { result, note: "Fixture human review" } : null
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("editor");
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>("p1");
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>("v1");
  const [versions, setVersions] = useState<PromptVersionRecord[]>(initialVersions);
  const [resultSummaries, setResultSummaries] = useState<CaseResultSummary[]>(fixtureResults);

  const visibleVersions = useMemo(
    () => versions.filter((version) => version.promptId === selectedPromptId),
    [selectedPromptId, versions]
  );

  const visibleCases = useMemo(
    () => cases.filter((testCase) => testCase.promptId === selectedPromptId),
    [selectedPromptId]
  );

  const selectedVersion = useMemo(
    () => visibleVersions.find((version) => version.id === selectedVersionId) ?? null,
    [selectedVersionId, visibleVersions]
  );

  function selectPrompt(id: string) {
    setSelectedPromptId(id);
    const firstVersion = versions.find((version) => version.promptId === id);
    setSelectedVersionId(firstVersion?.id ?? null);
  }

  function updateVersionContent(content: string) {
    setVersions((current) =>
      current.map((version) =>
        version.id === selectedVersionId ? { ...version, content } : version
      )
    );
  }

  function labelCaseResult(caseResultId: string, result: PassFail) {
    setResultSummaries((current) =>
      current.map((summary) =>
        summary.caseResultId === caseResultId
          ? { ...summary, humanLabel: { result, note: null } }
          : summary
      )
    );
  }

  return (
    <main className="app-layout">
      <Sidebar
        prompts={prompts}
        versions={visibleVersions}
        selectedPromptId={selectedPromptId}
        selectedVersionId={selectedVersionId}
        onSelectPrompt={selectPrompt}
        onSelectVersion={setSelectedVersionId}
      />
      <section className="workspace">
        <Tabs active={activeTab} onChange={setActiveTab} />
        {activeTab === "editor" && (
          <div className="editor-grid">
            <PromptEditor version={selectedVersion} onContentChange={updateVersionContent} />
            <CaseManager cases={visibleCases} />
          </div>
        )}
        {activeTab === "matrix" && (
          <VersionMatrix
            versions={visibleVersions}
            cases={visibleCases}
            results={resultSummaries}
          />
        )}
        {activeTab === "results" && (
          <VersionCaseResults
            cases={visibleCases}
            results={resultSummaries}
            selectedVersionId={selectedVersionId}
            onLabel={labelCaseResult}
          />
        )}
      </section>
    </main>
  );
}
