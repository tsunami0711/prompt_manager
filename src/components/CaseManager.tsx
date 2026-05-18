import type { TestCaseRecord } from "../types";

export function CaseManager({ cases }: { cases: TestCaseRecord[] }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Test Cases</p>
          <h2>{cases.length} cases</h2>
        </div>
        <button className="button">New Case</button>
      </div>
      <div className="case-list">
        {cases.map((testCase) => (
          <article key={testCase.id} className="case-row">
            <strong>{testCase.title}</strong>
            <span>{testCase.input}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
