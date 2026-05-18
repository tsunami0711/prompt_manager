import type { FinalResultValue } from "../types";

export type Trend = "stable" | "regression" | "improved" | "failing" | "mixed";

export function classifyTrend(values: FinalResultValue[]): Trend {
  const nonPending = values.filter((value) => value !== "pending");
  if (nonPending.length === 0) return "mixed";

  const first = nonPending[0];
  const last = nonPending[nonPending.length - 1];

  if (first === "pass" && (last === "fail" || last === "error")) return "regression";
  if ((first === "fail" || first === "error") && last === "pass") return "improved";
  if (nonPending.every((value) => value === "pass")) return "stable";
  if (nonPending.every((value) => value === "fail")) return "failing";
  if (nonPending.some((value) => value === "error")) return "mixed";

  return "mixed";
}
