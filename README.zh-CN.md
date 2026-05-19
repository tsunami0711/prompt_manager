# Prompt Manager

Prompt Manager 是一个本地桌面端工作台，用于管理 Prompt 版本、维护测试用例、运行准确率评测、查看不同版本的 case 结果，并支持人工标注和 LLM as Judge。

## 开发环境

安装 JavaScript 依赖：

```sh
npm install
```

如果本机还没有 Rust 工具链，先安装 Rust：

```sh
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
rustup default stable
```

启动浏览器开发版本：

```sh
npm run dev
```

启动 Tauri 桌面端应用：

```sh
npm run desktop
```

浏览器开发版本在无法调用 Tauri 命令时会使用 demo 数据。验证 SQLite 持久化、系统钥匙串中的 API Key、真实模型调用和评测运行链路时，请使用 Tauri 桌面端应用。

## 部署

构建生产桌面端应用：

```sh
npm install
npm run tauri -- build
```

Tauri 构建会先执行前端生产构建，然后编译 Rust 桌面端外壳。构建产物会生成在：

```text
src-tauri/target/release/bundle/
```

在 macOS 上，可以在对应的 macOS bundle 子目录中找到 `.app` 应用包和安装器产物。正式打包前如需本地测试，可以运行：

```sh
npm run desktop
```

### 部署前置条件

- Node.js 和 npm
- Rust stable 工具链，即 `cargo` 和 `rustc`
- 目标操作系统所需的本地构建工具
- 能够访问应用中配置的 OpenAI-compatible 模型服务地址

### 运行时配置

模型服务在应用内通过 Judge Config 配置。可以按需要分别添加运行模型和 Judge 模型配置：

- 名称
- Base URL
- 模型名
- API Key
- Temperature 和 Max tokens

API Key 会通过桌面端后端存储，而不是浏览器 fallback 模式。生产验证时，请配置并运行打包后的 Tauri 应用，不要只依赖 Vite 浏览器版本。

## 检查命令

前端构建：

```sh
npm run build
```

前端测试：

```sh
npm run test
```

Rust 测试：

```sh
cargo test --manifest-path src-tauri/Cargo.toml
```

如果没有安装 Rust 工具链，`cargo` 命令会在测试开始前失败。浏览器模式下的 Vite 应用仍然可以在 Tauri 命令不可用时使用 demo 数据。

## MVP 验收路径

1. 启动 `npm run dev`，打开终端中打印的 localhost 地址，通常是 `http://localhost:1420`。
2. 选择 Memory Extractor prompt，并在 Prompt Editor、Version Matrix、Version Case Results、Run History 之间切换。
3. 编辑 prompt 内容，确认编辑器在浏览器 fallback 模式下仍然响应正常。
4. 在 Version Matrix 中选择一个或多个 case，点击 Run Selected 或 Run All。确认 Run History 中出现一次运行记录，并展示状态、运行范围、judge 模式和成功/错误数量。
5. 在 Version Case Results 中，确认单版本 review 页面上方仍然保留运行控制区。
6. 打开 Judge Config，填写 Name、Base URL、Model 和 API Key，然后保存。
7. 对已有结果的 case 使用人工 Pass/Fail 按钮，确认最终结果展示会更新。

## MVP 功能范围

- 管理多个 prompt
- 管理 prompt 的多个版本
- 管理纯文本测试用例
- 对比不同 prompt 版本在各个 case 上的结果
- 横向滚动查看较多版本
- Run Selected 和 Run All
- 人工标注 pass/fail
- LLM as Judge 自动判定
- 单版本 case 结果 review 页面
- 运行历史记录

当前版本聚焦本地桌面端 MVP，不包含团队协作、云端同步、权限管理和复杂报表。
