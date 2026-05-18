import type { FinalResultValue } from "../types";

export function ResultBadge({ value }: { value: FinalResultValue }) {
  return <span className={`result-badge ${value}`}>{value}</span>;
}
