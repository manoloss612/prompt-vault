const elements = {
  apiBaseUrl: document.querySelector('#apiBaseUrl'),
  apiKey: document.querySelector('#apiKey'),
  model: document.querySelector('#model'),
  optimizationInstruction: document.querySelector('#optimizationInstruction'),
  saveSettings: document.querySelector('#saveSettings'),
  categoryName: document.querySelector('#categoryName'),
  categoryColor: document.querySelector('#categoryColor'),
  addCategory: document.querySelector('#addCategory'),
  categoryList: document.querySelector('#categoryList'),
  status: document.querySelector('#status')
};

let state = { categories: [], settings: {} };

elements.saveSettings.addEventListener('click', saveSettings);
elements.addCategory.addEventListener('click', addCategory);

await load();

async function load() {
  const [appState, settings] = await Promise.all([
    sendMessage({ type: 'state:get' }),
    sendMessage({ type: 'settings:get' })
  ]);
  state = { ...appState, settings };
  elements.apiBaseUrl.value = settings.apiBaseUrl || '';
  elements.apiKey.value = settings.apiKey || '';
  elements.model.value = settings.model || '';
  elements.optimizationInstruction.value = settings.optimizationInstruction || '';
  renderCategories();
}

async function saveSettings() {
  await sendMessage({
    type: 'settings:save',
    settings: {
      apiBaseUrl: elements.apiBaseUrl.value,
      model: elements.model.value,
      optimizationInstruction: elements.optimizationInstruction.value
    }
  });
  await sendMessage({ type: 'settings:saveApiKey', apiKey: elements.apiKey.value });
  setStatus('Settings saved.');
}

async function addCategory() {
  await sendMessage({
    type: 'category:create',
    category: {
      name: elements.categoryName.value,
      color: elements.categoryColor.value
    }
  });
  elements.categoryName.value = '';
  setStatus('Category added.');
  await load();
}

function renderCategories() {
  elements.categoryList.textContent = '';
  if (state.categories.length === 0) {
    elements.categoryList.textContent = 'No categories yet.';
    return;
  }
  for (const category of state.categories) {
    const row = document.createElement('div');
    row.className = 'category-row';
    row.innerHTML = `
      <span class="category-swatch"></span>
      <strong></strong>
      <button type="button">Delete</button>
    `;
    row.querySelector('.category-swatch').style.background = category.color;
    row.querySelector('strong').textContent = category.name;
    row.querySelector('button').addEventListener('click', async () => {
      await sendMessage({ type: 'category:delete', id: category.id });
      setStatus('Category deleted.');
      await load();
    });
    elements.categoryList.append(row);
  }
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

