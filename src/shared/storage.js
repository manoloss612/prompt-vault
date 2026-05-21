export const STORAGE_KEYS = {
  prompts: 'prompts',
  categories: 'categories',
  settings: 'settings',
  apiKey: 'apiKey',
  promptsIndex: 'promptsIndex'
};

export const DEFAULT_SETTINGS = {
  apiBaseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4.1-mini',
  optimizationInstruction:
    'Optimize the prompt for clarity, specificity, structure, and useful constraints. Return only the improved prompt.'
};

const DEFAULT_CATEGORY_COLOR = '#2563eb';
const MAX_SYNC_CHUNK_BYTES = 7600;

export function createMemoryAdapter(initial = {}) {
  const data = { ...initial };
  return {
    async get(keys) {
      if (Array.isArray(keys)) {
        return Object.fromEntries(keys.map((key) => [key, data[key]]));
      }
      if (typeof keys === 'string') {
        return { [keys]: data[keys] };
      }
      if (keys && typeof keys === 'object') {
        return Object.fromEntries(Object.keys(keys).map((key) => [key, data[key] ?? keys[key]]));
      }
      return { ...data };
    },
    async set(values) {
      Object.assign(data, values);
    },
    async remove(keys) {
      for (const key of Array.isArray(keys) ? keys : [keys]) {
        delete data[key];
      }
    }
  };
}

export function createChromeAdapter(area) {
  return {
    get: (keys) => area.get(keys),
    set: (values) => area.set(values),
    remove: (keys) => area.remove(keys)
  };
}

export function createPromptStore({ sync, local, now = () => new Date(), idFactory = defaultId } = {}) {
  if (!sync || !local) {
    throw new Error('Both sync and local storage adapters are required.');
  }

  async function getState() {
    const data = await sync.get([
      STORAGE_KEYS.prompts,
      STORAGE_KEYS.promptsIndex,
      STORAGE_KEYS.categories,
      STORAGE_KEYS.settings
    ]);
    const prompts = await readPromptCollection(data);
    return {
      prompts,
      categories: Array.isArray(data.categories) ? data.categories.map(normalizeCategoryFromStorage) : [],
      settings: { ...DEFAULT_SETTINGS, ...(data.settings || {}) }
    };
  }

  async function saveStatePatch(patch) {
    if (patch.prompts) {
      const { prompts, ...rest } = patch;
      if (Object.keys(rest).length > 0) {
        await sync.set(rest);
      }
      await savePromptCollection(prompts);
      return;
    }
    await sync.set(patch);
  }

  async function readPromptCollection(existingData = {}) {
    if (Array.isArray(existingData.promptsIndex)) {
      const chunkData = await sync.get(existingData.promptsIndex);
      return existingData.promptsIndex
        .flatMap((key) => (Array.isArray(chunkData[key]) ? chunkData[key] : []))
        .map(normalizePromptFromStorage);
    }
    return Array.isArray(existingData.prompts) ? existingData.prompts.map(normalizePromptFromStorage) : [];
  }

  async function savePromptCollection(prompts) {
    const previous = await sync.get(STORAGE_KEYS.promptsIndex);
    const previousKeys = Array.isArray(previous.promptsIndex) ? previous.promptsIndex : [];
    const chunks = chunkItems(prompts, 'promptsChunk');
    const values = Object.fromEntries(chunks.map((chunk) => [chunk.key, chunk.items]));
    await sync.set({ ...values, promptsIndex: chunks.map((chunk) => chunk.key) });
    await sync.remove([...previousKeys.filter((key) => !values[key]), STORAGE_KEYS.prompts]);
  }

  return {
    async getState() {
      return getState();
    },

    async createPrompt(input) {
      const state = await getState();
      const createdAt = now().toISOString();
      const prompt = normalizePromptInput(input, {
        id: idFactory('prompt'),
        createdAt,
        updatedAt: createdAt
      });
      state.prompts.unshift(prompt);
      await saveStatePatch({ prompts: state.prompts });
      return prompt;
    },

    async updatePrompt(id, updates) {
      const state = await getState();
      const index = state.prompts.findIndex((prompt) => prompt.id === id);
      if (index === -1) {
        throw new Error(`Prompt not found: ${id}`);
      }
      const previous = state.prompts[index];
      const updated = normalizePromptInput(
        { ...previous, ...updates },
        {
          id: previous.id,
          createdAt: previous.createdAt,
          updatedAt: now().toISOString()
        }
      );
      state.prompts[index] = updated;
      await saveStatePatch({ prompts: state.prompts });
      return updated;
    },

    async deletePrompt(id) {
      const state = await getState();
      await saveStatePatch({ prompts: state.prompts.filter((prompt) => prompt.id !== id) });
    },

    async createCategory(input) {
      const state = await getState();
      const category = normalizeCategoryInput(input, {
        id: idFactory('category'),
        createdAt: now().toISOString()
      });
      state.categories.push(category);
      await saveStatePatch({ categories: state.categories });
      return category;
    },

    async updateCategory(id, updates) {
      const state = await getState();
      const index = state.categories.findIndex((category) => category.id === id);
      if (index === -1) {
        throw new Error(`Category not found: ${id}`);
      }
      state.categories[index] = normalizeCategoryInput(
        { ...state.categories[index], ...updates },
        { id, createdAt: state.categories[index].createdAt }
      );
      await saveStatePatch({ categories: state.categories });
      return state.categories[index];
    },

    async deleteCategory(id) {
      const state = await getState();
      await saveStatePatch({
        categories: state.categories.filter((category) => category.id !== id),
        prompts: state.prompts.map((prompt) =>
          prompt.categoryId === id ? { ...prompt, categoryId: '', updatedAt: now().toISOString() } : prompt
        )
      });
    },

    async searchPrompts(query, categoryId = '') {
      const state = await getState();
      const normalizedQuery = String(query || '').trim().toLowerCase();
      const categoryNames = new Map(state.categories.map((category) => [category.id, category.name]));
      return state.prompts.filter((prompt) => {
        if (categoryId && prompt.categoryId !== categoryId) {
          return false;
        }
        if (!normalizedQuery) {
          return true;
        }
        const haystack = [
          prompt.title,
          prompt.body,
          prompt.notes,
          categoryNames.get(prompt.categoryId) || '',
          ...prompt.tags
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      });
    },

    async saveSettings(settings) {
      const state = await getState();
      const nextSettings = sanitizeSettings({ ...state.settings, ...settings });
      await saveStatePatch({ settings: nextSettings });
      return nextSettings;
    },

    async getSettings() {
      const state = await getState();
      const secret = await local.get(STORAGE_KEYS.apiKey);
      return { ...state.settings, apiKey: secret.apiKey || '' };
    },

    async saveApiKey(apiKey) {
      await local.set({ apiKey: String(apiKey || '').trim() });
    },

    async exportData() {
      const state = await getState();
      return {
        version: 1,
        exportedAt: now().toISOString(),
        prompts: state.prompts,
        categories: state.categories,
        settings: state.settings
      };
    },

    async importData(data) {
      if (!data || typeof data !== 'object') {
        throw new Error('Import data must be an object.');
      }
      const prompts = ensureArray(data.prompts, 'prompts').map((prompt) => normalizePromptFromImport(prompt));
      const categories = ensureArray(data.categories || [], 'categories').map((category) =>
        normalizeCategoryFromImport(category)
      );
      const settings = sanitizeSettings({ ...DEFAULT_SETTINGS, ...(data.settings || {}) });
      await saveStatePatch({ prompts, categories, settings });
      return { prompts, categories, settings };
    }
  };
}

function normalizePromptInput(input, fallback) {
  const title = requiredString(input.title, 'Prompt title is required.');
  const body = requiredString(input.body ?? input.prompt, 'Prompt body is required.');
  return {
    id: String(input.id || fallback.id),
    title,
    body,
    categoryId: String(input.categoryId || ''),
    tags: normalizeTags(input.tags ?? input.remark),
    notes: String(input.notes || '').trim(),
    createdAt: input.createdAt || fallback.createdAt,
    updatedAt: fallback.updatedAt
  };
}

function normalizePromptFromImport(input) {
  return normalizePromptInput(input, {
    id: input.id || defaultId('prompt'),
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: input.updatedAt || input.createdAt || new Date().toISOString()
  });
}

function normalizePromptFromStorage(input) {
  return normalizePromptFromImport(input);
}

function normalizeCategoryInput(input, fallback) {
  return {
    id: String(input.id || fallback.id),
    name: requiredString(input.name, 'Category name is required.'),
    color: normalizeColor(input.color),
    createdAt: input.createdAt || fallback.createdAt
  };
}

function normalizeCategoryFromImport(input) {
  return normalizeCategoryInput(input, {
    id: input.id || defaultId('category'),
    createdAt: input.createdAt || new Date().toISOString()
  });
}

function normalizeCategoryFromStorage(input) {
  return normalizeCategoryFromImport(input);
}

function normalizeTags(tags) {
  const list = Array.isArray(tags) ? tags : String(tags || '').split(/[,;；，]/);
  return [...new Set(list.map((tag) => String(tag).trim()).filter(Boolean))];
}

function chunkItems(items, prefix) {
  const chunks = [];
  let current = [];

  for (const item of items) {
    const next = [...current, item];
    if (current.length > 0 && byteLength(next) > MAX_SYNC_CHUNK_BYTES) {
      chunks.push(current);
      current = [item];
    } else {
      current = next;
    }
  }
  if (current.length > 0 || chunks.length === 0) {
    chunks.push(current);
  }
  return chunks.map((chunk, index) => ({
    key: `${prefix}_${index}`,
    items: chunk
  }));
}

function byteLength(value) {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

function normalizeColor(color) {
  const value = String(color || DEFAULT_CATEGORY_COLOR).trim();
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : DEFAULT_CATEGORY_COLOR;
}

function sanitizeSettings(settings) {
  const { apiKey, ...safeSettings } = settings || {};
  return {
    apiBaseUrl: String(safeSettings.apiBaseUrl || DEFAULT_SETTINGS.apiBaseUrl).trim().replace(/\/+$/, ''),
    model: String(safeSettings.model || DEFAULT_SETTINGS.model).trim(),
    optimizationInstruction: String(
      safeSettings.optimizationInstruction || DEFAULT_SETTINGS.optimizationInstruction
    ).trim()
  };
}

function ensureArray(value, name) {
  if (!Array.isArray(value)) {
    throw new Error(`${name} must be an array.`);
  }
  return value;
}

function requiredString(value, message) {
  const text = String(value || '').trim();
  if (!text) {
    throw new Error(message);
  }
  return text;
}

function defaultId(prefix) {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.randomUUID) {
    return `${prefix}-${cryptoApi.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
