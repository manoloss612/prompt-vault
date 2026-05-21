# Prompt Extension Design

## Goal

Build a Manifest V3 browser extension for Microsoft Edge and Google Chrome that lets the user save, classify, edit, copy, insert, optimize, import, export, and sync prompts.

## Product Scope

The first version is a personal prompt manager. It does not include team accounts, a custom backend, attachments, role permissions, or server-side sync. Sync uses the browser account through `chrome.storage.sync`; API credentials stay in `chrome.storage.local`.

## Core Features

- Save prompts with title, body, category, tags, timestamps, and optional notes.
- Copy any prompt from the popup or page overlay with one click.
- Insert a prompt into the currently focused text field from any web page.
- Edit and delete saved prompts.
- Create and filter by categories.
- Search prompt title, body, category, and tags.
- Optimize a prompt using a user-configured OpenAI-compatible API.
- Import and export all prompt data as JSON.
- Sync prompts, categories, and non-secret settings through browser sync storage.

## Architecture

The extension uses plain HTML, CSS, and JavaScript without a bundler so it can be loaded directly as an unpacked extension. Shared modules live under `src/shared`. Browser extension entry points are the popup, options page, background service worker, and content script.

`src/shared/storage.js` owns data shape, validation, serialization, and sync/local storage access. `src/shared/llm.js` owns the LLM optimization request. UI files call these modules through normal ES modules where possible. Content scripts communicate with the background worker using `chrome.runtime.sendMessage`.

## Data Model

Prompt:

- `id`: stable string id.
- `title`: non-empty string.
- `body`: non-empty string.
- `categoryId`: category id or empty string.
- `tags`: string array.
- `notes`: optional string.
- `createdAt`: ISO timestamp.
- `updatedAt`: ISO timestamp.

Category:

- `id`: stable string id.
- `name`: non-empty string.
- `color`: hex color string.
- `createdAt`: ISO timestamp.

Settings:

- `apiBaseUrl`: OpenAI-compatible endpoint base URL.
- `model`: model id.
- `optimizationInstruction`: system/user instruction used to optimize prompts.

Secrets:

- `apiKey`: stored only in `chrome.storage.local`.

## User Interface

The popup is the primary working surface. It has a toolbar with search, category filter, add, import/export, and settings buttons. The list shows compact prompt rows with category color, title, tags, copy, insert, edit, optimize, and delete actions.

The editor is displayed as an in-popup panel. It supports title, category, tags, body, notes, save, cancel, optimize, and accept optimized result.

The options page stores API configuration and category management. It warns when API key or model settings are missing.

The content script adds a small prompt button near focused textareas, text inputs, and contenteditable fields. Clicking it opens a lightweight picker, allowing search and insertion into the active field.

## Error Handling

Storage reads recover to empty defaults when no data exists. Invalid imports are rejected with a clear message. LLM optimization reports missing API settings, network failures, and malformed provider responses without overwriting the original prompt.

## Testing

Node tests cover storage normalization, prompt CRUD logic, import/export validation, and LLM request/response behavior using dependency injection for `fetch`.

