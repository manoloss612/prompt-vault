# Prompt Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Chrome and Edge compatible Manifest V3 prompt manager extension.

**Architecture:** Use plain Manifest V3 extension files with shared ES modules for storage and LLM behavior. The popup and options page provide the management UI, while a content script provides page-level insertion.

**Tech Stack:** Manifest V3, vanilla JavaScript modules, CSS, Node built-in test runner.

---

### Task 1: Project Metadata And Manifest

**Files:**
- Create: `package.json`
- Create: `manifest.json`
- Create: `README.md`

- [ ] Create package scripts using Node test runner.
- [ ] Create Manifest V3 config with popup, options, background worker, content script, storage permission, context menu permission, and host permissions for LLM API calls.
- [ ] Document how to load the unpacked extension in Chrome and Edge.

### Task 2: Tested Storage Core

**Files:**
- Create: `src/shared/storage.js`
- Create: `tests/storage.test.js`

- [ ] Write failing tests for prompt creation, update, deletion, category creation, search, import validation, export shape, and local-only API key handling.
- [ ] Implement storage core with injectable browser storage adapters.
- [ ] Run `npm test` and verify storage tests pass.

### Task 3: Tested LLM Core

**Files:**
- Create: `src/shared/llm.js`
- Create: `tests/llm.test.js`

- [ ] Write failing tests for missing config, successful OpenAI-compatible optimization, and malformed response handling.
- [ ] Implement `optimizePrompt` with injected `fetch`.
- [ ] Run `npm test` and verify all tests pass.

### Task 4: Extension Runtime

**Files:**
- Create: `src/background.js`
- Create: `src/contentScript.js`
- Create: `src/contentScript.css`

- [ ] Implement message handlers for listing prompts, copying text, optimizing prompts, and inserting prompt text.
- [ ] Implement context menu setup for opening the extension.
- [ ] Implement content picker near focused editable fields.

### Task 5: Popup And Options UI

**Files:**
- Create: `src/popup/popup.html`
- Create: `src/popup/popup.css`
- Create: `src/popup/popup.js`
- Create: `src/options/options.html`
- Create: `src/options/options.css`
- Create: `src/options/options.js`

- [ ] Implement prompt list, search, category filter, copy, insert, edit, delete, optimize, import, and export.
- [ ] Implement API settings and category management.
- [ ] Keep UI compact and keyboard-friendly.

### Task 6: Verification

**Files:**
- Modify: `README.md`

- [ ] Run `npm test`.
- [ ] Validate manifest JSON parses.
- [ ] Document manual browser verification steps.

