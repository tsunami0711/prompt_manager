import { describe, expect, it } from "vitest";
import { classifyTrend } from "./matrix";

describe("classifyTrend", () => {
  it("detects regression from pass to fail", () => {
    expect(classifyTrend(["pass", "pass", "fail"])).toBe("regression");
  });

  it("detects improvement from fail to pass", () => {
    expect(classifyTrend(["fail", "fail", "pass"])).toBe("improved");
  });

  it("detects stable passing", () => {
    expect(classifyTrend(["pass", "pass"])).toBe("stable");
  });

  it("detects failing when all completed results fail", () => {
    expect(classifyTrend(["fail", "fail"])).toBe("failing");
  });
});
