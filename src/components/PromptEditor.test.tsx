import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { PromptEditor } from "./PromptEditor";

describe("PromptEditor", () => {
  it("shows the selected prompt version content", () => {
    render(
      <PromptEditor
        version={{ id: "v1", promptId: "p1", versionName: "v1", content: "Extract durable memories", note: null }}
        onContentChange={() => undefined}
      />
    );

    expect(screen.getByDisplayValue("Extract durable memories")).toBeInTheDocument();
  });
});
