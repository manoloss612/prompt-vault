import { createChromeAdapter, createPromptStore } from './shared/storage.js';
import { optimizePrompt } from './shared/llm.js';

const store = createPromptStore({
  sync: createChromeAdapter(chrome.storage.sync),
  local: createChromeAdapter(chrome.storage.local)
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'open-prompt-vault',
    title: 'Open Prompt Vault',
    contexts: ['editable']
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === 'open-prompt-vault') {
    chrome.action.openPopup?.();
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message)
    .then((data) => sendResponse({ ok: true, data }))
    .catch((error) => sendResponse({ ok: false, error: error.message }));
  return true;
});

async function handleMessage(message) {
  switch (message?.type) {
    case 'prompt:list':
      return store.searchPrompts(message.query || '', message.categoryId || '');
    case 'prompt:create':
      return store.createPrompt(message.prompt);
    case 'prompt:update':
      return store.updatePrompt(message.id, message.updates);
    case 'prompt:delete':
      await store.deletePrompt(message.id);
      return true;
    case 'category:create':
      return store.createCategory(message.category);
    case 'category:update':
      return store.updateCategory(message.id, message.updates);
    case 'category:delete':
      await store.deleteCategory(message.id);
      return true;
    case 'state:get':
      return store.getState();
    case 'settings:get':
      return store.getSettings();
    case 'settings:save':
      return store.saveSettings(message.settings);
    case 'settings:saveApiKey':
      await store.saveApiKey(message.apiKey);
      return true;
    case 'prompt:optimize': {
      const settings = await store.getSettings();
      return optimizePrompt({
        prompt: message.prompt,
        settings,
        apiKey: settings.apiKey
      });
    }
    case 'data:export':
      return store.exportData();
    case 'data:import':
      return store.importData(message.data);
    default:
      throw new Error(`Unknown message type: ${message?.type}`);
  }
}

