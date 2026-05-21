import test from 'node:test';
import assert from 'node:assert/strict';
import { optimizePrompt } from '../src/shared/llm.js';

test('requires api configuration before optimizing', async () => {
  await assert.rejects(
    () => optimizePrompt({ prompt: 'Do work', settings: {}, apiKey: '', fetchImpl: async () => ({}) }),
    /API key is required/
  );
});

test('optimizes prompt through OpenAI-compatible chat completions', async () => {
  const calls = [];
  const result = await optimizePrompt({
    prompt: 'write blog',
    settings: {
      apiBaseUrl: 'https://api.example.com/v1',
      model: 'gpt-test',
      optimizationInstruction: 'Improve prompts.'
    },
    apiKey: 'key',
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'Write a concise blog post.' } }] })
      };
    }
  });

  assert.equal(result, 'Write a concise blog post.');
  assert.equal(calls[0].url, 'https://api.example.com/v1/chat/completions');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer key');
  assert.equal(JSON.parse(calls[0].options.body).model, 'gpt-test');
});

test('rejects malformed provider responses', async () => {
  await assert.rejects(
    () => optimizePrompt({
      prompt: 'write blog',
      settings: { apiBaseUrl: 'https://api.example.com/v1', model: 'gpt-test' },
      apiKey: 'key',
      fetchImpl: async () => ({ ok: true, json: async () => ({ choices: [] }) })
    }),
    /No optimized prompt/
  );
});

