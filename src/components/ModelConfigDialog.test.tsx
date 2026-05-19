import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ModelConfigPanel } from "./ModelConfigDialog";

describe("ModelConfigPanel", () => {
  it("collects judge model config fields and saves them", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(<ModelConfigPanel runConfigs={[]} judgeConfigs={[]} onSave={onSave} />);

    await user.type(screen.getByLabelText("Name"), "Local Judge");
    await user.type(screen.getByLabelText("Base URL"), "http://localhost:11434/v1");
    await user.type(screen.getByLabelText("Model"), "llama3.1");
    await user.type(screen.getByLabelText("API Key"), "test-key");
    await user.click(screen.getByRole("button", { name: "Save Config" }));

    expect(onSave).toHaveBeenCalledWith({
      configType: "judge",
      name: "Local Judge",
      baseUrl: "http://localhost:11434/v1",
      model: "llama3.1",
      apiKey: "test-key",
      temperature: 0,
      maxTokens: 1024
    });
  });

  it("can save a run model config", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(<ModelConfigPanel runConfigs={[]} judgeConfigs={[]} onSave={onSave} />);

    await user.selectOptions(screen.getByLabelText("Type"), "run");
    await user.type(screen.getByLabelText("Name"), "Local Runner");
    await user.type(screen.getByLabelText("Base URL"), "http://localhost:11434/v1");
    await user.type(screen.getByLabelText("Model"), "llama3.1");
    await user.type(screen.getByLabelText("API Key"), "test-key");
    await user.click(screen.getByRole("button", { name: "Save Config" }));

    expect(onSave).toHaveBeenCalledWith({
      configType: "run",
      name: "Local Runner",
      baseUrl: "http://localhost:11434/v1",
      model: "llama3.1",
      apiKey: "test-key",
      temperature: 0,
      maxTokens: 1024
    });
  });

  it("shows saved run and judge configs", () => {
    render(
      <ModelConfigPanel
        onSave={vi.fn()}
        runConfigs={[
          {
            id: "run-1",
            name: "Runner",
            configType: "run",
            baseUrl: "http://localhost:11434/v1",
            model: "llama3.1",
            apiKeyRef: "key-1",
            temperature: 0,
            maxTokens: 1024
          }
        ]}
        judgeConfigs={[
          {
            id: "judge-1",
            name: "Judge",
            configType: "judge",
            baseUrl: "https://api.example.com/v1",
            model: "gpt-4.1",
            apiKeyRef: "key-2",
            temperature: 0,
            maxTokens: 1024
          }
        ]}
      />
    );

    expect(screen.getByText("Runner")).toBeInTheDocument();
    expect(screen.getByText("Judge")).toBeInTheDocument();
  });
});
