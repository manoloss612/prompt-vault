export async function optimizePrompt({ prompt, settings, apiKey, fetchImpl = globalThis.fetch }) {
  const cleanPrompt = String(prompt || '').trim();
  const cleanApiKey = String(apiKey || '').trim();
  const apiBaseUrl = String(settings?.apiBaseUrl || '').trim().replace(/\/+$/, '');
  const model = String(settings?.model || '').trim();
  const instruction = String(settings?.optimizationInstruction || defaultInstruction()).trim();

  if (!cleanPrompt) {
    throw new Error('Prompt is required.');
  }
  if (!cleanApiKey) {
    throw new Error('API key is required.');
  }
  if (!apiBaseUrl) {
    throw new Error('API base URL is required.');
  }
  if (!model) {
    throw new Error('Model is required.');
  }
  if (typeof fetchImpl !== 'function') {
    throw new Error('A fetch implementation is required.');
  }

  const response = await fetchImpl(`${apiBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cleanApiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: instruction
        },
        {
          role: 'user',
          content: cleanPrompt
        }
      ],
      temperature: 0.3
    })
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.error?.message || `LLM request failed with status ${response.status || 'unknown'}.`;
    throw new Error(message);
  }

  const optimized = data?.choices?.[0]?.message?.content?.trim();
  if (!optimized) {
    throw new Error('No optimized prompt was returned by the provider.');
  }
  return optimized;
}

function defaultInstruction() {
  return 'Optimize the prompt for clarity, specificity, structure, and useful constraints. Return only the improved prompt.';
}

