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
  createPrompt,
  createPromptVersion,
  createTestCase,
  listLatestCaseResults,
  listModelConfigs,
  listPromptVersions,
  listPrompts,
  listRunHistory,
  listTestCases,
  runSelectedCases,
  updatePromptVersionContent,
  upsertHumanLabel
} from "./lib/api";
import type {
  CaseResultSummary,
  JudgeMode,
  ModelConfigRecord,
  PassFail,
  PromptRecord,
  PromptVersionRecord,
  RunCaseScope,
  RunHistoryItem,
  TestCaseRecord
} from "./types";

const defaultJudgePrompt =
  "Return JSON only with result as pass or fail and reason explaining whether the prompt output satisfies the test case.";

function isTauriRuntime() {
  return "__TAURI_INTERNALS__" in window;
}

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
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<PromptRecord[]>(fallbackPrompts);
  const [versions, setVersions] = useState<PromptVersionRecord[]>(fallbackVersions);
  const [cases, setCases] = useState<TestCaseRecord[]>(fallbackCases);
  const [resultSummaries, setResultSummaries] = useState<CaseResultSummary[]>(fixtureResults);
  const [runHistory, setRunHistory] = useState<RunHistoryItem[]>(fallbackRunHistory);
  const [runConfigs, setRunConfigs] = useState<ModelConfigRecord[]>([]);
  const [judgeConfigs, setJudgeConfigs] = useState<ModelConfigRecord[]>([]);
  const [judgeMode, setJudgeMode] = useState<JudgeMode>("human");
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [selectedReviewCaseId, setSelectedReviewCaseId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPromptRecords() {
      try {
        const loadedPrompts = await listPrompts();
        if (cancelled) return;
        setBackendAvailable(true);
        setPrompts(loadedPrompts);
        if (loadedPrompts.length === 0) {
          setSelectedPromptId(null);
          setSelectedVersionId(null);
          setVersions([]);
          setCases([]);
          setResultSummaries([]);
          setRunHistory([]);
          return;
        }
        setSelectedPromptId((current) =>
          current && loadedPrompts.some((prompt) => prompt.id === current)
            ? current
            : (loadedPrompts[0]?.id ?? null)
        );
      } catch {
        if (cancelled) return;
        if (isTauriRuntime()) {
          setBackendAvailable(true);
          setPrompts([]);
          setSelectedPromptId(null);
          setSelectedVersionId(null);
          setVersions([]);
          setCases([]);
          setResultSummaries([]);
          setRunHistory([]);
          setRunError("Could not load prompts from the local database.");
          return;
        }
        setBackendAvailable(false);
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
    if (backendAvailable !== true) return;
    let cancelled = false;

    async function loadModelConfigs() {
      try {
        const [loadedRunConfigs, loadedJudgeConfigs] = await Promise.all([
          listModelConfigs("run"),
          listModelConfigs("judge")
        ]);
        if (cancelled) return;
        setRunConfigs(loadedRunConfigs);
        setJudgeConfigs(loadedJudgeConfigs);
      } catch {
        if (cancelled) return;
        setRunConfigs([]);
        setJudgeConfigs([]);
      }
    }

    void loadModelConfigs();

    return () => {
      cancelled = true;
    };
  }, [backendAvailable]);

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
        setVersions(loadedVersions);
        setCases(loadedCases);
        setResultSummaries(loadedResults);
        setRunHistory(loadedHistory);
        setSelectedVersionId((current) => {
          if (current && loadedVersions.some((version) => version.id === current)) return current;
          return loadedVersions[0]?.id ?? null;
        });
      } catch {
        if (cancelled) return;
        if (backendAvailable === true) {
          setVersions([]);
          setCases([]);
          setResultSummaries([]);
          setRunHistory([]);
          setSelectedVersionId(null);
          setRunError("Could not load this prompt workspace from the local database.");
          return;
        }
        const nextVersions = fallbackVersionsForPrompt(promptId);
        setVersions(nextVersions);
        setCases(fallbackCasesForPrompt(promptId));
        setResultSummaries(fixtureResults);
        setRunHistory(fallbackRunHistory);
        setSelectedVersionId((current) =>
          current && nextVersions.some((version) => version.id === current)
            ? current
            : (nextVersions[0]?.id ?? null)
        );
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
    [cases, selectedPromptId]
  );

  const selectedVersion = useMemo(
    () => visibleVersions.find((version) => version.id === selectedVersionId) ?? null,
    [selectedVersionId, visibleVersions]
  );

  const selectedReviewCase = useMemo(
    () =>
      visibleCases.find((testCase) => testCase.id === selectedReviewCaseId) ??
      visibleCases[0] ??
      null,
    [selectedReviewCaseId, visibleCases]
  );

  function selectPrompt(id: string) {
    setSelectedPromptId(id);
    const firstVersion = versions.find((version) => version.promptId === id);
    setSelectedVersionId(firstVersion?.id ?? null);
  }

  async function createPromptFromInput() {
    const name = window.prompt("Prompt name");
    if (!name?.trim()) return;
    const description = window.prompt("Description") ?? "";

    if (backendAvailable === false) {
      const prompt = {
        id: `local-prompt-${Date.now()}`,
        name: name.trim(),
        description
      };
      setPrompts((current) => [...current, prompt]);
      setSelectedPromptId(prompt.id);
      setSelectedVersionId(null);
      setVersions([]);
      setCases([]);
      setResultSummaries([]);
      setRunHistory([]);
      return;
    }

    try {
      const prompt = await createPrompt({ name: name.trim(), description });
      setPrompts((current) => [...current, prompt]);
      setSelectedPromptId(prompt.id);
      setSelectedVersionId(null);
      setRunError(null);
    } catch (error) {
      setRunError(error instanceof Error ? error.message : String(error));
    }
  }

  async function createVersionFromInput() {
    if (!selectedPromptId) {
      setRunError("Create or select a prompt before adding a version.");
      return;
    }
    const versionName = window.prompt("Version name", `v${visibleVersions.length + 1}`);
    if (!versionName?.trim()) return;
    const content =
      window.prompt("Prompt content", selectedVersion?.content ?? "Write the prompt here.") ?? "";

    if (backendAvailable === false) {
      const version = {
        id: `local-version-${Date.now()}`,
        promptId: selectedPromptId,
        versionName: versionName.trim(),
        content,
        note: null
      };
      setVersions((current) => [...current, version]);
      setSelectedVersionId(version.id);
      return;
    }

    try {
      const version = await createPromptVersion({
        promptId: selectedPromptId,
        versionName: versionName.trim(),
        content,
        note: null
      });
      setVersions((current) => [...current, version]);
      setSelectedVersionId(version.id);
      setRunError(null);
    } catch (error) {
      setRunError(error instanceof Error ? error.message : String(error));
    }
  }

  async function createCaseFromInput() {
    if (!selectedPromptId) {
      setRunError("Create or select a prompt before adding a case.");
      return;
    }
    const title = window.prompt("Case title");
    if (!title?.trim()) return;
    const input = window.prompt("Case input") ?? "";
    const tags = window.prompt("Tags", "") ?? "";

    if (backendAvailable === false) {
      const testCase = {
        id: `local-case-${Date.now()}`,
        promptId: selectedPromptId,
        title: title.trim(),
        input,
        tags,
        note: null,
        enabled: true
      };
      setCases((current) => [...current, testCase]);
      return;
    }

    try {
      const testCase = await createTestCase({
        promptId: selectedPromptId,
        title: title.trim(),
        input,
        tags,
        note: null
      });
      setCases((current) => [...current, testCase]);
      setRunError(null);
    } catch (error) {
      setRunError(error instanceof Error ? error.message : String(error));
    }
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
      const created = await createModelConfig({
        ...draft,
        temperature: 0,
        maxTokens: 1024
      });
      if (created.configType === "run") {
        setRunConfigs((current) => [...current.filter((config) => config.id !== created.id), created]);
      } else {
        setJudgeConfigs((current) => [
          ...current.filter((config) => config.id !== created.id),
          created
        ]);
      }
    } catch {
      // Browser/Vite mode has no Tauri backend; keep the dialog useful for smoke testing.
    } finally {
      setIsConfigOpen(false);
    }
  }

  function recordLocalRun(caseIds: string[], mode: JudgeMode, scope: RunCaseScope) {
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

  async function refreshRunData(promptId: string) {
    const [loadedResults, loadedHistory] = await Promise.all([
      listLatestCaseResults(promptId),
      listRunHistory(promptId)
    ]);
    setResultSummaries(loadedResults);
    setRunHistory(loadedHistory);
  }

  async function handleRun(caseIds: string[], mode: JudgeMode, scope: RunCaseScope) {
    setRunError(null);

    if (!selectedPromptId || !selectedVersionId || caseIds.length === 0) {
      setRunError("Select a prompt version and at least one case before running.");
      return;
    }

    if (backendAvailable === false) {
      recordLocalRun(caseIds, mode, scope);
      return;
    }

    const runModelConfig = runConfigs[0];
    if (!runModelConfig) {
      setRunError("Add a Run Model config before running cases.");
      setIsConfigOpen(true);
      return;
    }

    const judgeModelConfig = mode === "llm" ? judgeConfigs[0] : null;
    if (mode === "llm" && !judgeModelConfig) {
      setRunError("Add a Judge Model config before running with LLM judge.");
      setIsConfigOpen(true);
      return;
    }

    try {
      await runSelectedCases({
        promptVersionId: selectedVersionId,
        caseIds,
        runModelConfigId: runModelConfig.id,
        caseScope: scope,
        judgeMode: mode,
        judgeModelConfigId: judgeModelConfig?.id ?? null,
        judgePrompt: mode === "llm" ? defaultJudgePrompt : null
      });
      await refreshRunData(selectedPromptId);
      setActiveTab("history");
    } catch (error) {
      setRunError(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <main className="app-layout">
      <Sidebar
        prompts={prompts}
        versions={visibleVersions}
        selectedPromptId={selectedPromptId}
        selectedVersionId={selectedVersionId}
        onCreatePrompt={() => void createPromptFromInput()}
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
        {runError && <div className="error-banner">{runError}</div>}
        {activeTab === "editor" && (
          <div className="editor-grid">
            <PromptEditor
              version={selectedVersion}
              canCreateVersion={Boolean(selectedPromptId)}
              onContentChange={updateVersionContent}
              onCreateVersion={() => void createVersionFromInput()}
            />
            <CaseManager
              cases={visibleCases}
              canCreateCase={Boolean(selectedPromptId)}
              onCreateCase={() => void createCaseFromInput()}
            />
          </div>
        )}
        {activeTab === "matrix" && (
          <VersionMatrix
            versions={visibleVersions}
            cases={visibleCases}
            results={resultSummaries}
            onRunSelected={(caseIds, mode) => void handleRun(caseIds, mode, "selected")}
            onRunAll={(caseIds, mode) => void handleRun(caseIds, mode, "all")}
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
                  selectedCount={
                    selectedReviewCase && selectedReviewCase.enabled !== false ? 1 : 0
                  }
                  judgeMode={judgeMode}
                  onJudgeModeChange={setJudgeMode}
                  onRunSelected={() =>
                    void handleRun(
                      selectedReviewCase && selectedReviewCase.enabled !== false
                        ? [selectedReviewCase.id]
                        : [],
                      judgeMode,
                      "selected"
                    )
                  }
                  onRunAll={() =>
                    void handleRun(
                      visibleCases
                        .filter((testCase) => testCase.enabled !== false)
                        .map((testCase) => testCase.id),
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
              onSelectedCaseChange={setSelectedReviewCaseId}
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
