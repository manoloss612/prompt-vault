let state = { prompts: [], categories: [], settings: {} };
let editingId = null;

const elements = {
  addPrompt: document.querySelector('#addPrompt'),
  openOptions: document.querySelector('#openOptions'),
  search: document.querySelector('#search'),
  categoryFilter: document.querySelector('#categoryFilter'),
  promptList: document.querySelector('#promptList'),
  editor: document.querySelector('#editor'),
  title: document.querySelector('#title'),
  category: document.querySelector('#category'),
  tags: document.querySelector('#tags'),
  body: document.querySelector('#body'),
  notes: document.querySelector('#notes'),
  savePrompt: document.querySelector('#savePrompt'),
  optimizePrompt: document.querySelector('#optimizePrompt'),
  cancelEdit: document.querySelector('#cancelEdit'),
  optimizedBox: document.querySelector('#optimizedBox'),
  optimizedText: document.querySelector('#optimizedText'),
  acceptOptimized: document.querySelector('#acceptOptimized'),
  exportData: document.querySelector('#exportData'),
  importData: document.querySelector('#importData'),
  status: document.querySelector('#status')
};

elements.addPrompt.addEventListener('click', () => openEditor());
elements.openOptions.addEventListener('click', () => chrome.runtime.openOptionsPage());
elements.search.addEventListener('input', renderPrompts);
elements.categoryFilter.addEventListener('change', renderPrompts);
elements.savePrompt.addEventListener('click', savePrompt);
elements.optimizePrompt.addEventListener('click', optimizeCurrentPrompt);
elements.cancelEdit.addEventListener('click', closeEditor);
elements.acceptOptimized.addEventListener('click', () => {
  elements.body.value = elements.optimizedText.value;
  elements.optimizedBox.classList.add('hidden');
});
elements.exportData.addEventListener('click', exportData);
elements.importData.addEventListener('change', importData);

await load();

async function load() {
  state = await sendMessage({ type: 'state:get' });
  renderCategories();
  renderPrompts();
}

function renderCategories() {
  const options = ['<option value="">All categories</option>']
    .concat(state.categories.map((category) => option(category.id, category.name)))
    .join('');
  elements.categoryFilter.innerHTML = options;
  elements.category.innerHTML = '<option value="">No category</option>' + state.categories.map((category) => option(category.id, category.name)).join('');
}

function renderPrompts() {
  const query = elements.search.value.trim().toLowerCase();
  const categoryId = elements.categoryFilter.value;
  const categoryMap = new Map(state.categories.map((category) => [category.id, category]));
  const prompts = state.prompts.filter((prompt) => {
    if (categoryId && prompt.categoryId !== categoryId) {
      return false;
    }
    if (!query) {
      return true;
    }
    const categoryName = categoryMap.get(prompt.categoryId)?.name || '';
    return [prompt.title, prompt.body, prompt.notes, categoryName, ...prompt.tags].join(' ').toLowerCase().includes(query);
  });

  elements.promptList.textContent = '';
  if (prompts.length === 0) {
    elements.promptList.textContent = 'No prompts yet.';
    return;
  }

  for (const prompt of prompts) {
    const category = categoryMap.get(prompt.categoryId);
    const card = document.createElement('article');
    card.className = 'prompt-card';
    card.innerHTML = `
      <div class="prompt-title-row">
        <span class="swatch"></span>
        <div class="prompt-title"></div>
      </div>
      <div class="prompt-body"></div>
      <div class="tag-row"></div>
      <div class="card-actions">
        <button type="button" data-action="copy">Copy</button>
        <button type="button" data-action="edit">Edit</button>
        <button type="button" data-action="optimize">Optimize</button>
        <button type="button" data-action="delete">Delete</button>
      </div>
    `;
    card.querySelector('.swatch').style.background = category?.color || '#94a3b8';
    card.querySelector('.prompt-title').textContent = prompt.title;
    card.querySelector('.prompt-body').textContent = prompt.body;
    const tagRow = card.querySelector('.tag-row');
    for (const tag of prompt.tags) {
      const tagNode = document.createElement('span');
      tagNode.className = 'tag';
      tagNode.textContent = tag;
      tagRow.append(tagNode);
    }
    card.querySelector('[data-action="copy"]').addEventListener('click', () => copyPrompt(prompt.body));
    card.querySelector('[data-action="edit"]').addEventListener('click', () => openEditor(prompt));
    card.querySelector('[data-action="optimize"]').addEventListener('click', () => openEditor(prompt, true));
    card.querySelector('[data-action="delete"]').addEventListener('click', () => deletePrompt(prompt.id));
    elements.promptList.append(card);
  }
}

function openEditor(prompt = null, optimizeAfterOpen = false) {
  editingId = prompt?.id || null;
  elements.title.value = prompt?.title || '';
  elements.category.value = prompt?.categoryId || '';
  elements.tags.value = prompt?.tags?.join(', ') || '';
  elements.body.value = prompt?.body || '';
  elements.notes.value = prompt?.notes || '';
  elements.optimizedBox.classList.add('hidden');
  elements.editor.classList.remove('hidden');
  elements.title.focus();
  if (optimizeAfterOpen) {
    optimizeCurrentPrompt();
  }
}

function closeEditor() {
  editingId = null;
  elements.editor.classList.add('hidden');
}

async function savePrompt() {
  const prompt = readForm();
  if (editingId) {
    await sendMessage({ type: 'prompt:update', id: editingId, updates: prompt });
    setStatus('Prompt updated.');
  } else {
    await sendMessage({ type: 'prompt:create', prompt });
    setStatus('Prompt saved.');
  }
  closeEditor();
  await load();
}

async function optimizeCurrentPrompt() {
  try {
    setStatus('Optimizing...');
    const result = await sendMessage({ type: 'prompt:optimize', prompt: elements.body.value });
    elements.optimizedText.value = result;
    elements.optimizedBox.classList.remove('hidden');
    setStatus('Optimization complete.');
  } catch (error) {
    setStatus(error.message);
  }
}

async function deletePrompt(id) {
  await sendMessage({ type: 'prompt:delete', id });
  setStatus('Prompt deleted.');
  await load();
}

async function copyPrompt(text) {
  await navigator.clipboard.writeText(text);
  setStatus('Copied.');
}

async function exportData() {
  const data = await sendMessage({ type: 'data:export' });
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `prompt-vault-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function importData(event) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }
  try {
    const data = JSON.parse(await file.text());
    await sendMessage({ type: 'data:import', data });
    setStatus('Import complete.');
    await load();
  } catch (error) {
    setStatus(error.message);
  } finally {
    event.target.value = '';
  }
}

function readForm() {
  return {
    title: elements.title.value,
    categoryId: elements.category.value,
    tags: elements.tags.value,
    body: elements.body.value,
    notes: elements.notes.value
  };
}

function option(value, label) {
  return `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function setStatus(message) {
  elements.status.textContent = message;
}

function sendMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (!response?.ok) {
        reject(new Error(response?.error || 'Prompt Vault request failed.'));
        return;
      }
      resolve(response.data);
    });
  });
}

