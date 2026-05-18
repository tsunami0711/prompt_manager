import { useEffect, useMemo, useState } from "react";
import { CaseManager } from "./components/CaseManager";
import { ModelConfigDialog, type ModelConfigDraft } from "./components/ModelConfigDialog";
import { PromptEditor } from "./components/PromptEditor";
import { RunControls } from "./components/RunControls";
import { RunHistory } from "./components/RunHistory";
import { Sidebar } from "./components/Sidebar";
import { Tabs, type WorkspaceTab } from "./components/Tabs";
import { VersionCaseResults } from "./components/VersionCaseResults";
import { VersionMatrix } from "./components/VersionMatrix";
import {
  createModelConfig,
  listLatestCaseResults,
  listPromptVersions,
  listPrompts,
  listRunHistory,
  listTestCases,
  updatePromptVersionContent,
  upsertHumanLabel
} from "./lib/api";
import type {
  CaseResultSummary,
  JudgeMode,
  PassFail,
  PromptRecord,
  PromptVersionRecord,
  RunCaseScope,
  RunHistoryItem,
  TestCaseRecord
} from "./types";

const fallbackPrompts: PromptRecord[] = [
  { id: "p1", name: "Memory Extractor", description: "Extract durable memories" }
];

const fallbackVersions: PromptVersionRecord[] = [
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

const fallbackCases: TestCaseRecord[] = [
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

const fallbackRunHistory: RunHistoryItem[] = [
  {
    id: "demo-run-1",
    status: "completed",
    promptVersionName: "v4",
    caseScope: "all",
    judgeMode: "llm",
    startedAt: new Date(Date.now() - 1000 * 60 * 23).toISOString(),
    finishedAt: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
    successCount: 3,
    errorCount: 1
  },
  {
    id: "demo-run-2",
    status: "error",
    promptVersionName: "v3",
    caseScope: "selected",
    judgeMode: "human",
    startedAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    finishedAt: new Date(Date.now() - 1000 * 60 * 54).toISOString(),
    successCount: 1,
    errorCount: 1
  }
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

function fallbackVersionsForPrompt(promptId: string) {
  return fallbackVersions.map((version) => ({ ...version, promptId }));
}

function fallbackCasesForPrompt(promptId: string) {
  return fallbackCases.map((testCase) => ({ ...testCase, promptId }));
}

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("editor");
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>("p1");
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>("v1");
  const [prompts, setPrompts] = useState<PromptRecord[]>(fallbackPrompts);
  const [versions, setVersions] = useState<PromptVersionRecord[]>(fallbackVersions);
  const [cases, setCases] = useState<TestCaseRecord[]>(fallbackCases);
  const [resultSummaries, setResultSummaries] = useState<CaseResultSummary[]>(fixtureResults);
  const [runHistory, setRunHistory] = useState<RunHistoryItem[]>(fallbackRunHistory);
  const [judgeMode, setJudgeMode] = useState<JudgeMode>("human");
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPromptRecords() {
      try {
        const loadedPrompts = await listPrompts();
        if (cancelled || loadedPrompts.length === 0) return;
        setPrompts(loadedPrompts);
        setSelectedPromptId((current) => current ?? loadedPrompts[0]?.id ?? null);
      } catch {
        if (cancelled) return;
        setPrompts(fallbackPrompts);
        setSelectedPromptId((current) => current ?? fallbackPrompts[0]?.id ?? null);
      }
    }

    void loadPromptRecords();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedPromptId) return;
    let cancelled = false;

    async function loadPromptWorkspace(promptId: string) {
      try {
        const [loadedVersions, loadedCases, loadedResults, loadedHistory] = await Promise.all([
          listPromptVersions(promptId),
          listTestCases(promptId),
          listLatestCaseResults(promptId),
          listRunHistory(promptId)
        ]);
        if (cancelled) return;
        const nextVersions =
          loadedVersions.length > 0 ? loadedVersions : fallbackVersionsForPrompt(promptId);
        setVersions(nextVersions);
        setCases(loadedCases.length > 0 ? loadedCases : fallbackCasesForPrompt(promptId));
        setResultSummaries(loadedResults.length > 0 ? loadedResults : fixtureResults);
        setRunHistory(loadedHistory.length > 0 ? loadedHistory : fallbackRunHistory);
        setSelectedVersionId((current) => {
          if (current && nextVersions.some((version) => version.id === current)) return current;
          return nextVersions[0]?.id ?? null;
        });
      } catch {
        if (cancelled) return;
        setVersions(fallbackVersionsForPrompt(promptId));
        setCases(fallbackCasesForPrompt(promptId));
        setResultSummaries(fixtureResults);
        setRunHistory(fallbackRunHistory);
        setSelectedVersionId((current) => current ?? fallbackVersions[0]?.id ?? null);
      }
    }

    void loadPromptWorkspace(selectedPromptId);

    return () => {
      cancelled = true;
    };
  }, [selectedPromptId]);

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
    const promptVersionId = selectedVersionId;
    setVersions((current) =>
      current.map((version) =>
        version.id === promptVersionId ? { ...version, content } : version
      )
    );
    if (promptVersionId) {
      void updatePromptVersionContent({ promptVersionId, content }).catch(() => undefined);
    }
  }

  function labelCaseResult(caseResultId: string, result: PassFail) {
    setResultSummaries((current) =>
      current.map((summary) =>
        summary.caseResultId === caseResultId
          ? { ...summary, humanLabel: { result, note: null } }
        : summary
      )
    );
    void upsertHumanLabel({ caseResultId, result, note: null }).catch(() => undefined);
  }

  async function saveJudgeConfig(draft: ModelConfigDraft) {
    try {
      await createModelConfig({
        ...draft,
        configType: "judge",
        temperature: 0,
        maxTokens: 1024
      });
    } catch {
      // Browser/Vite mode has no Tauri backend; keep the dialog useful for smoke testing.
    } finally {
      setIsConfigOpen(false);
    }
  }

  function recordRun(caseIds: string[], mode: JudgeMode, scope: RunCaseScope) {
    const startedAt = new Date().toISOString();
    const promptVersionName = selectedVersion?.versionName ?? "No version selected";
    setRunHistory((current) => [
      {
        id: `local-run-${startedAt}`,
        status: selectedVersion && caseIds.length > 0 ? "completed" : "error",
        promptVersionName,
        caseScope: scope,
        judgeMode: mode,
        startedAt,
        finishedAt: new Date().toISOString(),
        successCount: selectedVersion ? caseIds.length : 0,
        errorCount: selectedVersion ? 0 : 1
      },
      ...current
    ]);
    setActiveTab("history");
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
        <div className="workspace-toolbar">
          <button className="button" onClick={() => setIsConfigOpen(true)}>
            Judge Config
          </button>
        </div>
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
            onRunSelected={(caseIds, mode) => recordRun(caseIds, mode, "selected")}
            onRunAll={(caseIds, mode) => recordRun(caseIds, mode, "all")}
          />
        )}
        {activeTab === "results" && (
          <div className="results-stack">
            <div className="matrix-toolbar">
              <div>
                <p className="eyebrow">Selected Version</p>
                <strong>{selectedVersion?.versionName ?? "None"}</strong>
              </div>
              <div className="matrix-actions">
                <RunControls
                  selectedCount={visibleCases.length}
                  judgeMode={judgeMode}
                  onJudgeModeChange={setJudgeMode}
                  onRunSelected={() =>
                    recordRun(
                      visibleCases.map((testCase) => testCase.id),
                      judgeMode,
                      "selected"
                    )
                  }
                  onRunAll={() =>
                    recordRun(
                      visibleCases.map((testCase) => testCase.id),
                      judgeMode,
                      "all"
                    )
                  }
                />
              </div>
            </div>
            <VersionCaseResults
              cases={visibleCases}
              results={resultSummaries}
              selectedVersionId={selectedVersionId}
              onLabel={labelCaseResult}
            />
          </div>
        )}
        {activeTab === "history" && <RunHistory runs={runHistory} />}
      </section>
      <ModelConfigDialog
        open={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onSave={saveJudgeConfig}
      />
    </main>
  );
}
