# Prompt Vault

中文 | [English](#english)

Prompt Vault 是一个适用于 Google Chrome 和 Microsoft Edge 的 Manifest V3 浏览器扩展，用来保存、分类、搜索、复制、插入和优化常用 prompt。它采用浏览器原生同步能力保存 prompt 数据，并支持通过 OpenAI 兼容接口一键优化 prompt。

## 功能特性

- 保存、编辑、删除和搜索 prompt。
- 按分类和标签管理 prompt。
- 在扩展弹窗中一键复制 prompt。
- 在网页输入框旁显示快捷按钮，将 prompt 插入当前输入区域。
- 通过 OpenAI 兼容 API 优化 prompt。
- 使用浏览器账号同步 prompt、分类和非敏感设置。
- API Key 仅保存在本机浏览器存储中，不参与云端同步。
- 支持 JSON 导入和导出，方便迁移和备份。
- 兼容旧版 prompt 导出格式，例如使用 `prompt` 字段作为正文的 JSON 文件。

## 安装方式

目前项目以“加载已解压扩展程序”的方式安装，适合本地使用、测试和二次开发。

### 1. 下载项目

任选一种方式获取项目文件：

```bash
git clone https://github.com/manoloss612/prompt-vault.git
```

或者在 GitHub 页面点击 `Code` -> `Download ZIP`，下载后解压到任意本地目录。

### 2. 在 Google Chrome 中加载

1. 打开 Chrome。
2. 在地址栏输入 `chrome://extensions` 并回车。
3. 打开右上角的 `Developer mode`。
4. 点击 `Load unpacked`。
5. 在文件选择窗口中，选择本项目的根目录，也就是包含 `manifest.json` 的文件夹。
6. 确认后，浏览器工具栏中会出现 Prompt Vault 扩展。

### 3. 在 Microsoft Edge 中加载

1. 打开 Microsoft Edge。
2. 在地址栏输入 `edge://extensions` 并回车。
3. 打开左侧或右侧的 `Developer mode`。
4. 点击 `Load unpacked`。
5. 在文件选择窗口中，选择本项目的根目录，也就是包含 `manifest.json` 的文件夹。
6. 确认后，浏览器工具栏中会出现 Prompt Vault 扩展。

## 基本使用

1. 点击浏览器工具栏中的 Prompt Vault 图标。
2. 点击 `+` 新建 prompt。
3. 填写标题、正文、分类、标签和备注。
4. 在列表中使用 `Copy` 快速复制 prompt。
5. 在任意网页的输入框中聚焦光标，点击旁边出现的 `P` 按钮，即可搜索并插入 prompt。

## 配置 LLM 优化

点击扩展弹窗中的 `Settings` 进入设置页，填写以下内容：

- `API Base URL`：OpenAI 或其他兼容服务的接口地址，例如 `https://api.openai.com/v1`。
- `API Key`：你的 API Key。该字段只保存在本地浏览器中。
- `Model`：模型名称，例如 `gpt-4.1-mini`。
- `Optimization instruction`：用于指导模型优化 prompt 的系统指令。

配置完成后，可以在 prompt 编辑区点击 `Optimize`，生成优化后的 prompt，并选择是否采用结果。

## 导入与导出

在扩展弹窗底部可以使用：

- `Export`：导出当前 prompt、分类和设置为 JSON 文件。
- `Import`：从 JSON 文件导入 prompt 数据。

导入器支持当前项目格式，也支持包含以下字段的旧格式：

```json
{
  "title": "Prompt title",
  "prompt": "Prompt body",
  "remark": "tag one; tag two"
}
```

其中 `prompt` 会转换为正文，`remark` 会转换为标签。

## 开发

需要 Node.js。安装依赖不是必需步骤，因为当前测试使用 Node.js 内置测试运行器。

运行测试：

```bash
npm test
```

检查 `manifest.json` 是否为合法 JSON：

```bash
npm run check:manifest
```

检查 JavaScript 语法：

```bash
node --check src/background.js
```

也可以对 `src` 和 `tests` 中的文件批量执行语法检查。

## 项目结构

```text
prompt-vault/
├── manifest.json
├── package.json
├── README.md
├── src/
│   ├── background.js
│   ├── contentScript.js
│   ├── contentScript.css
│   ├── options/
│   ├── popup/
│   └── shared/
└── tests/
```

主要模块：

- `src/shared/storage.js`：prompt、分类、设置、导入导出和同步存储逻辑。
- `src/shared/llm.js`：OpenAI 兼容接口调用逻辑。
- `src/popup/`：扩展弹窗界面。
- `src/options/`：设置页。
- `src/contentScript.js`：网页输入框快捷插入功能。
- `src/background.js`：扩展后台消息处理。

## 隐私说明

- Prompt、分类和非敏感设置使用浏览器的 `chrome.storage.sync` 保存，是否同步取决于你的浏览器账号同步设置。
- API Key 使用 `chrome.storage.local` 保存在本机，不会通过本扩展同步到云端。
- LLM 优化功能会将你正在优化的 prompt 发送到你配置的 API 服务商。

## License

MIT

---

## English

Prompt Vault is a Manifest V3 browser extension for Google Chrome and Microsoft Edge. It helps you save, categorize, search, copy, insert, and optimize reusable prompts. Prompt data is synced through the browser's native sync storage, and prompt optimization works with OpenAI-compatible APIs.

## Features

- Save, edit, delete, and search prompts.
- Organize prompts with categories and tags.
- Copy prompts from the popup with one click.
- Insert prompts into focused web page input fields through a floating shortcut button.
- Optimize prompts through an OpenAI-compatible API.
- Sync prompts, categories, and non-secret settings with the browser account.
- Store API keys locally only.
- Import and export JSON backups.
- Import legacy prompt JSON files that use `prompt` as the body field.

## Installation

This project is currently installed as an unpacked extension, which is suitable for local use, testing, and development.

### 1. Get The Project

Clone the repository:

```bash
git clone https://github.com/manoloss612/prompt-vault.git
```

Or click `Code` -> `Download ZIP` on GitHub, then extract the archive to any local folder.

### 2. Load In Google Chrome

1. Open Chrome.
2. Go to `chrome://extensions`.
3. Enable `Developer mode`.
4. Click `Load unpacked`.
5. In the file picker, select the project root folder, the folder that contains `manifest.json`.
6. The Prompt Vault extension should now appear in your browser toolbar.

### 3. Load In Microsoft Edge

1. Open Microsoft Edge.
2. Go to `edge://extensions`.
3. Enable `Developer mode`.
4. Click `Load unpacked`.
5. In the file picker, select the project root folder, the folder that contains `manifest.json`.
6. The Prompt Vault extension should now appear in your browser toolbar.

## Basic Usage

1. Click the Prompt Vault icon in the browser toolbar.
2. Click `+` to create a new prompt.
3. Fill in the title, body, category, tags, and notes.
4. Use `Copy` in the prompt list to copy a prompt.
5. Focus a text field on any web page, then click the floating `P` button to search and insert a prompt.

## LLM Optimization Setup

Open `Settings` from the extension popup and configure:

- `API Base URL`: an OpenAI-compatible endpoint, such as `https://api.openai.com/v1`.
- `API Key`: your API key. This is stored locally only.
- `Model`: a model name, such as `gpt-4.1-mini`.
- `Optimization instruction`: the instruction used to guide prompt optimization.

After setup, open or create a prompt and click `Optimize` to generate an improved version.

## Import And Export

The popup footer provides:

- `Export`: export prompts, categories, and settings as a JSON file.
- `Import`: import prompt data from a JSON file.

The importer supports the native Prompt Vault format and legacy entries like:

```json
{
  "title": "Prompt title",
  "prompt": "Prompt body",
  "remark": "tag one; tag two"
}
```

The `prompt` field is converted to the prompt body, and `remark` is converted to tags.

## Development

Node.js is required. No dependency installation is needed for the current test suite because it uses the built-in Node.js test runner.

Run tests:

```bash
npm test
```

Validate `manifest.json`:

```bash
npm run check:manifest
```

Check JavaScript syntax:

```bash
node --check src/background.js
```

You can also run syntax checks across files in `src` and `tests`.

## Project Structure

```text
prompt-vault/
├── manifest.json
├── package.json
├── README.md
├── src/
│   ├── background.js
│   ├── contentScript.js
│   ├── contentScript.css
│   ├── options/
│   ├── popup/
│   └── shared/
└── tests/
```

Key modules:

- `src/shared/storage.js`: prompt, category, settings, import/export, and sync storage logic.
- `src/shared/llm.js`: OpenAI-compatible optimization requests.
- `src/popup/`: extension popup UI.
- `src/options/`: settings page.
- `src/contentScript.js`: floating web page prompt insertion.
- `src/background.js`: extension runtime message handling.

## Privacy

- Prompts, categories, and non-secret settings are stored with `chrome.storage.sync`. Actual sync behavior depends on your browser account settings.
- API keys are stored with `chrome.storage.local` and are not synced by this extension.
- When using LLM optimization, the prompt being optimized is sent to the API provider you configured.

## License

MIT
