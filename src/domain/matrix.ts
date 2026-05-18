import type { FinalResultValue } from "../types";

export type Trend = "stable" | "regression" | "improved" | "failing" | "mixed";

export function classifyTrend(values: FinalResultValue[]): Trend {
  const completed = values.filter((value) => value === "pass" || value === "fail");
  if (completed.length === 0) return "mixed";

  const first = completed[0];
  const last = completed[completed.length - 1];

  if (first === "pass" && last === "fail") return "regression";
  if (first === "fail" && last === "pass") return "improved";
  if (completed.every((value) => value === "pass")) return "stable";
  if (completed.every((value) => value === "fail")) return "failing";

  return "mixed";
}
