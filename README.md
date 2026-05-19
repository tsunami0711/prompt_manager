# Prompt Manager

中文文档: [README.zh-CN.md](README.zh-CN.md)

Operational desktop workbench for editing prompt versions, managing test cases,
reviewing version/case results, and tracking evaluation runs.

## Development

Install JavaScript dependencies:

```sh
npm install
```

Install Rust if `cargo` is not available:

```sh
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
rustup default stable
```

Run the browser dev app:

```sh
npm run dev
```

Run the Tauri desktop app:

```sh
npm run desktop
```

The browser dev app uses demo data when Tauri commands are unavailable. Use the
desktop app when validating SQLite persistence, keychain-backed API keys, model
calls, and evaluation runs.

## Deployment

Build a production desktop app:

```sh
npm install
npm run tauri -- build
```

The Tauri build runs the frontend production build first, then compiles the Rust
desktop shell. Generated artifacts are written under:

```text
src-tauri/target/release/bundle/
```

On macOS, look for the `.app` bundle and installer artifacts in the macOS bundle
subdirectories. For local testing before packaging, run:

```sh
npm run desktop
```

### Deployment Prerequisites

- Node.js and npm
- Rust stable toolchain (`cargo` and `rustc`)
- Platform build tools for the target OS
- Network access to the OpenAI-compatible model endpoints configured in the app

### Runtime Configuration

Model providers are configured inside the app through Judge Config. Add separate
configs for run models and judge models as needed:

- Name
- Base URL
- Model name
- API key
- Temperature and max tokens

API keys are stored through the desktop backend rather than the browser fallback.
For production validation, configure and run the packaged Tauri app, not only the
Vite browser app.

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
