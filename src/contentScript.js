let activeField = null;
let launcher = null;
let panel = null;

document.addEventListener('focusin', (event) => {
  const target = event.target;
  if (!isEditable(target)) {
    return;
  }
  activeField = target;
  showLauncher(target);
});

document.addEventListener('click', (event) => {
  if (panel && !panel.contains(event.target) && event.target !== launcher) {
    panel.remove();
    panel = null;
  }
});

function showLauncher(target) {
  if (!launcher) {
    launcher = document.createElement('button');
    launcher.className = 'prompt-vault-button';
    launcher.type = 'button';
    launcher.title = 'Prompt Vault';
    launcher.textContent = 'P';
    launcher.addEventListener('mousedown', (event) => event.preventDefault());
    launcher.addEventListener('click', () => togglePanel());
    document.body.append(launcher);
  }
  const rect = target.getBoundingClientRect();
  launcher.style.left = `${Math.min(window.innerWidth - 40, rect.right - 32)}px`;
  launcher.style.top = `${Math.max(8, rect.top - 38)}px`;
}

async function togglePanel() {
  if (panel) {
    panel.remove();
    panel = null;
    return;
  }

  panel = document.createElement('div');
  panel.className = 'prompt-vault-panel';
  panel.innerHTML = `
    <input type="search" placeholder="Search prompts" aria-label="Search prompts">
    <div class="prompt-vault-list">Loading...</div>
  `;
  document.body.append(panel);
  positionPanel();

  const input = panel.querySelector('input');
  input.addEventListener('input', () => renderList(input.value));
  await renderList('');
  input.focus();
}

async function renderList(query) {
  const list = panel.querySelector('.prompt-vault-list');
  const response = await sendMessage({ type: 'prompt:list', query });
  const prompts = response || [];
  if (prompts.length === 0) {
    list.textContent = 'No prompts found.';
    return;
  }
  list.textContent = '';
  for (const prompt of prompts) {
    const item = document.createElement('div');
    item.className = 'prompt-vault-item';
    item.innerHTML = `
      <div>
        <div class="prompt-vault-title"></div>
        <div class="prompt-vault-body"></div>
      </div>
      <button type="button">Insert</button>
    `;
    item.querySelector('.prompt-vault-title').textContent = prompt.title;
    item.querySelector('.prompt-vault-body').textContent = prompt.body;
    item.querySelector('button').addEventListener('click', () => {
      insertText(activeField, prompt.body);
      panel.remove();
      panel = null;
    });
    list.append(item);
  }
}

function positionPanel() {
  const rect = launcher.getBoundingClientRect();
  panel.style.left = `${Math.min(window.innerWidth - 372, Math.max(12, rect.left))}px`;
  panel.style.top = `${Math.min(window.innerHeight - 432, rect.bottom + 8)}px`;
}

function isEditable(element) {
  if (!element) {
    return false;
  }
  if (element.isContentEditable) {
    return true;
  }
  const tag = element.tagName?.toLowerCase();
  return tag === 'textarea' || (tag === 'input' && /^(text|search|url|email|number)?$/.test(element.type));
}

function insertText(element, text) {
  if (!element) {
    return;
  }
  element.focus();
  if (element.isContentEditable) {
    document.execCommand('insertText', false, text);
    return;
  }
  const start = element.selectionStart ?? element.value.length;
  const end = element.selectionEnd ?? element.value.length;
  element.value = `${element.value.slice(0, start)}${text}${element.value.slice(end)}`;
  element.selectionStart = element.selectionEnd = start + text.length;
  element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
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

