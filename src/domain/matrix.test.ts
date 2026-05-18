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

  it("detects regression from pass to error", () => {
    expect(classifyTrend(["pass", "error"])).toBe("regression");
  });

  it("detects improvement from error to pass", () => {
    expect(classifyTrend(["error", "pass"])).toBe("improved");
  });

  it("returns mixed when all values are pending", () => {
    expect(classifyTrend(["pending", "pending"])).toBe("mixed");
  });

  it("returns mixed when failures end in error", () => {
    expect(classifyTrend(["fail", "error"])).toBe("mixed");
  });
});
