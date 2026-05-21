# Prompt Vault Extension

Prompt Vault is a Manifest V3 extension for Google Chrome and Microsoft Edge. It saves prompts, keeps them categorized, copies them with one click, inserts them into focused web page inputs, optimizes them through an OpenAI-compatible API, and syncs prompt data with the browser account.

## Features

- Save, edit, delete, search, and categorize prompts.
- One-click copy from the popup.
- Page-level prompt picker for inserting prompts into text fields.
- LLM prompt optimization with configurable API Base URL, API key, model, and instruction.
- Browser sync for prompts, categories, and non-secret settings.
- Local-only API key storage.
- JSON import and export.

## Load In Chrome

1. Open `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select this folder: `F:\prompt插件`.

## Load In Microsoft Edge

1. Open `edge://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select this folder: `F:\prompt插件`.

## Configure LLM Optimization

Open the extension options page and fill:

- API Base URL: `https://api.openai.com/v1` or another OpenAI-compatible endpoint.
- API Key: stored in local browser storage only.
- Model: for example `gpt-4.1-mini`.
- Optimization instruction: the default instruction can be edited.

## Development

Run tests:

```powershell
npm test
```

Validate the manifest:

```powershell
npm run check:manifest
```

## Manual Verification

1. Load the unpacked extension.
2. Add a category in the options page.
3. Add a prompt in the popup.
4. Copy the prompt from the popup.
5. Focus a textarea on any page and use the floating `P` button to insert a prompt.
6. Configure an API key and run prompt optimization.
7. Export the backup JSON and import it again.

