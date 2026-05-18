# Prompt Manager

Operational desktop workbench for editing prompt versions, managing test cases,
reviewing version/case results, and tracking evaluation runs.

## Development

Install dependencies:

```sh
npm install
```

Run the browser dev app:

```sh
npm run dev
```

Run the Tauri desktop app:

```sh
npm run desktop
```

## Checks

Frontend build:

```sh
npm run build
```

Frontend tests:

```sh
npm run test
```

Rust tests:

```sh
cargo test --manifest-path src-tauri/Cargo.toml
```

If the Rust toolchain is not installed, the cargo command will fail before tests
start. The Vite app still keeps demo data available in browser mode when Tauri
commands are unavailable.

## MVP Smoke Path

1. Start `npm run dev` and open the printed localhost URL, commonly
   `http://localhost:1420`.
2. Select the Memory Extractor prompt and switch between Prompt Editor, Version
   Matrix, Version Case Results, and Run History.
3. Edit prompt content and confirm the editor remains responsive in browser
   fallback mode.
4. In Version Matrix, select one or more cases and use Run Selected or Run All.
   Confirm a run appears in Run History with status, scope, judge mode, and
   success/error counts.
5. In Version Case Results, confirm the run controls remain visible above the
   single-version review surface.
6. Open Judge Config, enter Name, Base URL, Model, and API Key, then save.
7. Use the manual Pass/Fail buttons on a case with a result and confirm the
   displayed final result updates.
