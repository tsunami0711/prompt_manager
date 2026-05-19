import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ModelConfigDialog } from "./ModelConfigDialog";

describe("ModelConfigDialog", () => {
  it("collects judge model config fields and saves them", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(<ModelConfigDialog open={true} onClose={vi.fn()} onSave={onSave} />);

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
      apiKey: "test-key"
    });
  });

  it("can save a run model config", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(<ModelConfigDialog open={true} onClose={vi.fn()} onSave={onSave} />);

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
      apiKey: "test-key"
    });
  });

  it("does not render when closed", () => {
    render(<ModelConfigDialog open={false} onClose={vi.fn()} onSave={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
