import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { createPrompt, createPromptVersion, createTestCase, listPrompts } from "./lib/api";

vi.mock("./lib/api", () => ({
  createModelConfig: vi.fn(),
  createPrompt: vi.fn(),
  createPromptVersion: vi.fn(),
  createTestCase: vi.fn(),
  listLatestCaseResults: vi.fn().mockResolvedValue([]),
  listModelConfigs: vi.fn().mockResolvedValue([]),
  listPromptVersions: vi.fn().mockResolvedValue([]),
  listPrompts: vi.fn().mockResolvedValue([]),
  listRunHistory: vi.fn().mockResolvedValue([]),
  listTestCases: vi.fn().mockResolvedValue([]),
  runSelectedCases: vi.fn(),
  updatePromptVersionContent: vi.fn(),
  upsertHumanLabel: vi.fn()
}));

describe("App prompt creation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens an in-app form when creating a prompt", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "New prompt" }));

    expect(screen.getByRole("dialog", { name: "Create Prompt" })).toBeInTheDocument();
    expect(screen.getByLabelText("Prompt name")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
  });

  it("creates a prompt from the in-app form", async () => {
    const user = userEvent.setup();
    vi.mocked(createPrompt).mockResolvedValueOnce({
      id: "p-new",
      name: "Recall Prompt",
      description: "Recall useful memories"
    });
    render(<App />);

    await user.click(screen.getByRole("button", { name: "New prompt" }));
    await user.type(screen.getByLabelText("Prompt name"), "Recall Prompt");
    await user.type(screen.getByLabelText("Description"), "Recall useful memories");
    await user.click(screen.getByRole("button", { name: "Create Prompt" }));

    expect(createPrompt).toHaveBeenCalledWith({
      name: "Recall Prompt",
      description: "Recall useful memories"
    });
    expect(await screen.findByRole("button", { name: "Recall Prompt" })).toBeInTheDocument();
  });

  it("opens an in-app form when creating a prompt version", async () => {
    const user = userEvent.setup();
    vi.mocked(listPrompts).mockResolvedValueOnce([
      { id: "p1", name: "Memory Prompt", description: "" }
    ]);
    render(<App />);

    await screen.findByRole("button", { name: "Memory Prompt" });
    await user.click(screen.getByRole("button", { name: "Create Version" }));

    expect(screen.getByRole("dialog", { name: "Create Version" })).toBeInTheDocument();
    expect(screen.getByLabelText("Version name")).toBeInTheDocument();
    expect(screen.getByLabelText("Prompt content")).toBeInTheDocument();
  });

  it("opens an in-app form when creating a test case", async () => {
    const user = userEvent.setup();
    vi.mocked(listPrompts).mockResolvedValueOnce([
      { id: "p1", name: "Memory Prompt", description: "" }
    ]);
    render(<App />);

    await screen.findByRole("button", { name: "Memory Prompt" });
    await user.click(screen.getByRole("button", { name: "New Case" }));

    expect(screen.getByRole("dialog", { name: "Create Test Case" })).toBeInTheDocument();
    expect(screen.getByLabelText("Case title")).toBeInTheDocument();
    expect(screen.getByLabelText("Case input")).toBeInTheDocument();
    expect(screen.getByLabelText("Tags")).toBeInTheDocument();
  });

  it("creates a prompt version from the in-app form", async () => {
    const user = userEvent.setup();
    vi.mocked(listPrompts).mockResolvedValueOnce([
      { id: "p1", name: "Memory Prompt", description: "" }
    ]);
    vi.mocked(createPromptVersion).mockResolvedValueOnce({
      id: "v-new",
      promptId: "p1",
      versionName: "v1",
      content: "Extract durable facts.",
      note: null
    });
    render(<App />);

    await screen.findByRole("button", { name: "Memory Prompt" });
    await user.click(screen.getByRole("button", { name: "Create Version" }));
    const dialog = screen.getByRole("dialog", { name: "Create Version" });
    await user.clear(within(dialog).getByLabelText("Version name"));
    await user.type(within(dialog).getByLabelText("Version name"), "v1");
    await user.clear(within(dialog).getByLabelText("Prompt content"));
    await user.type(within(dialog).getByLabelText("Prompt content"), "Extract durable facts.");
    await user.click(within(dialog).getByRole("button", { name: "Create Version" }));

    expect(createPromptVersion).toHaveBeenCalledWith({
      promptId: "p1",
      versionName: "v1",
      content: "Extract durable facts.",
      note: null
    });
    expect(await screen.findByRole("button", { name: "v1" })).toBeInTheDocument();
  });

  it("creates a test case from the in-app form", async () => {
    const user = userEvent.setup();
    vi.mocked(listPrompts).mockResolvedValueOnce([
      { id: "p1", name: "Memory Prompt", description: "" }
    ]);
    vi.mocked(createTestCase).mockResolvedValueOnce({
      id: "c-new",
      promptId: "p1",
      title: "User name",
      input: "My name is Mira.",
      tags: "identity",
      note: null,
      enabled: true
    });
    render(<App />);

    await screen.findByRole("button", { name: "Memory Prompt" });
    await user.click(screen.getByRole("button", { name: "New Case" }));
    await user.type(screen.getByLabelText("Case title"), "User name");
    await user.type(screen.getByLabelText("Case input"), "My name is Mira.");
    await user.type(screen.getByLabelText("Tags"), "identity");
    await user.click(screen.getByRole("button", { name: "Create Case" }));

    expect(createTestCase).toHaveBeenCalledWith({
      promptId: "p1",
      title: "User name",
      input: "My name is Mira.",
      tags: "identity",
      note: null
    });
    expect(await screen.findByText("User name")).toBeInTheDocument();
  });
});
