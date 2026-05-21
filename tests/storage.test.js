import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createMemoryAdapter,
  createPromptStore,
  DEFAULT_SETTINGS
} from '../src/shared/storage.js';

test('creates prompts with normalized fields and timestamps', async () => {
  const store = createPromptStore({ sync: createMemoryAdapter(), local: createMemoryAdapter() });

  const prompt = await store.createPrompt({
    title: '  Blog outline  ',
    body: '  Write an outline.  ',
    categoryId: 'cat-1',
    tags: ' writing, outline, writing ',
    notes: '  useful  '
  });

  assert.equal(prompt.title, 'Blog outline');
  assert.equal(prompt.body, 'Write an outline.');
  assert.equal(prompt.categoryId, 'cat-1');
  assert.deepEqual(prompt.tags, ['writing', 'outline']);
  assert.equal(prompt.notes, 'useful');
  assert.match(prompt.id, /^prompt-/);
  assert.match(prompt.createdAt, /^\d{4}-\d{2}-\d{2}T/);
});

test('updates and deletes prompts', async () => {
  const store = createPromptStore({ sync: createMemoryAdapter(), local: createMemoryAdapter() });
  const prompt = await store.createPrompt({ title: 'Old', body: 'Body' });

  const updated = await store.updatePrompt(prompt.id, { title: 'New', tags: ['a', 'b'] });
  assert.equal(updated.title, 'New');
  assert.deepEqual(updated.tags, ['a', 'b']);

  await store.deletePrompt(prompt.id);
  const state = await store.getState();
  assert.equal(state.prompts.length, 0);
});

test('creates categories and searches across prompt fields', async () => {
  const store = createPromptStore({ sync: createMemoryAdapter(), local: createMemoryAdapter() });
  const category = await store.createCategory({ name: 'Marketing', color: '#ef4444' });
  await store.createPrompt({
    title: 'Launch email',
    body: 'Create a SaaS launch email',
    categoryId: category.id,
    tags: ['campaign']
  });

  assert.equal((await store.searchPrompts('saas')).length, 1);
  assert.equal((await store.searchPrompts('marketing')).length, 1);
  assert.equal((await store.searchPrompts('campaign')).length, 1);
  assert.equal((await store.searchPrompts('missing')).length, 0);
});

test('imports valid backup data and rejects invalid prompt bodies', async () => {
  const store = createPromptStore({ sync: createMemoryAdapter(), local: createMemoryAdapter() });
  await store.importData({
    prompts: [{ id: 'p1', title: 'Prompt', body: 'Body', tags: ['x'] }],
    categories: [{ id: 'c1', name: 'General', color: '#2563eb' }],
    settings: { model: 'gpt-4.1-mini' }
  });

  const exported = await store.exportData();
  assert.equal(exported.prompts[0].id, 'p1');
  assert.equal(exported.settings.model, 'gpt-4.1-mini');

  await assert.rejects(
    () => store.importData({ prompts: [{ title: 'No body' }] }),
    /body is required/
  );
});

test('imports legacy prompt exports that use prompt and remark fields', async () => {
  const store = createPromptStore({ sync: createMemoryAdapter(), local: createMemoryAdapter() });

  await store.importData({
    exportTime: '2026-02-10T08:26:10.246Z',
    prompts: [
      {
        id: 8400,
        title: '论文评审',
        prompt: '请评审这篇论文。',
        remark: '论文; 文学',
        share: false
      }
    ],
    favorites: []
  });

  const state = await store.getState();
  assert.equal(state.prompts[0].id, '8400');
  assert.equal(state.prompts[0].body, '请评审这篇论文。');
  assert.deepEqual(state.prompts[0].tags, ['论文', '文学']);
});

test('stores prompt collections in sync-sized chunks instead of one large key', async () => {
  const sync = createMemoryAdapter();
  const store = createPromptStore({ sync, local: createMemoryAdapter() });
  const prompts = Array.from({ length: 8 }, (_, index) => ({
    id: `legacy-${index}`,
    title: `Prompt ${index}`,
    prompt: `Body ${index} `.repeat(300),
    remark: 'bulk'
  }));

  await store.importData({ prompts });

  const raw = await sync.get(null);
  assert.equal(raw.prompts, undefined);
  assert.ok(raw.promptsIndex.length > 1);
  for (const key of raw.promptsIndex) {
    assert.ok(Buffer.byteLength(JSON.stringify(raw[key]), 'utf8') < 7600);
  }
  assert.equal((await store.getState()).prompts.length, 8);
});

test('keeps api key local while syncing non-secret settings', async () => {
  const sync = createMemoryAdapter();
  const local = createMemoryAdapter();
  const store = createPromptStore({ sync, local });

  await store.saveSettings({ apiBaseUrl: 'https://api.openai.com/v1', model: 'gpt-4.1-mini' });
  await store.saveApiKey('secret-key');

  assert.equal((await store.getSettings()).apiKey, 'secret-key');
  assert.equal((await sync.get('settings')).settings.apiKey, undefined);
  assert.equal((await local.get('apiKey')).apiKey, 'secret-key');
  assert.equal(DEFAULT_SETTINGS.model.length > 0, true);
});
