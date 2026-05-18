import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { PromptEditor } from "./PromptEditor";
import type { PromptVersionRecord } from "../types";

describe("PromptEditor", () => {
  it("shows the selected prompt version content", () => {
    render(
      <PromptEditor
        version={{
          id: "v1",
          promptId: "p1",
          versionName: "v1",
          content: "Extract durable memories",
          note: null
        }}
        onContentChange={() => undefined}
      />
    );

    expect(screen.getByDisplayValue("Extract durable memories")).toBeInTheDocument();
  });

  it("shows an empty panel when no prompt version is selected", () => {
    render(<PromptEditor version={null} onContentChange={() => undefined} />);

    expect(screen.getByText("Select a prompt version to edit.")).toBeInTheDocument();
  });

  it("calls onContentChange when the prompt content changes", async () => {
    const user = userEvent.setup();
    const onContentChange = vi.fn();
    const version: PromptVersionRecord = {
      id: "v1",
      promptId: "p1",
      versionName: "v1",
      content: "Extract",
      note: null
    };

    function ControlledPromptEditor() {
      const [content, setContent] = useState(version.content);

      return (
        <PromptEditor
          version={{ ...version, content }}
          onContentChange={(nextContent) => {
            onContentChange(nextContent);
            setContent(nextContent);
          }}
        />
      );
    }

    render(<ControlledPromptEditor />);

    await user.type(screen.getByLabelText("Prompt content"), " memories");

    expect(onContentChange).toHaveBeenLastCalledWith("Extract memories");
  });
});
