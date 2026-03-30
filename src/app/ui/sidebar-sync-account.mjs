import { showNotification } from '../../utils/helpers.js';
import { buildCloudAuthStartUrl, getCloudSessionInfo, getCloudSyncConfig } from '../sync/cloud-sync.mjs';
import { setActiveView } from './flow.mjs';
import { setCurrentSubject } from '../core/state.mjs';

function byId(id) {
  return document.getElementById(id);
}

function bindOnce(el, key) {
  if (!el) return false;
  const k = `data-${key}`;
  if (el.getAttribute(k) === '1') return false;
  el.setAttribute(k, '1');
  return true;
}

async function openSettingsView() {
  setCurrentSubject(null);
  setActiveView('settingsView');
  document.querySelectorAll('.nav-item').forEach((b) => {
    b.classList.toggle('active', b.dataset.view === 'settingsView');
  });
  try {
    const mod = await import('./settings.mjs');
    await mod.activateSettingsView?.();
  } catch (e) {
    console.error(e);
  }
}

function startConnectFlow() {
  const cfg = getCloudSyncConfig();
  let url;
  try {
    url = buildCloudAuthStartUrl({ baseUrl: cfg.baseUrl, redirectUrl: window.location.href });
  } catch (e) {
    showNotification(String(e?.message ?? e ?? 'URL inválida.'));
    void openSettingsView();
    return;
  }
  showNotification('Redirigiendo a GitHub…');
  window.location.assign(url);
}

function renderAccountBlock({ accountId, avatarId, textId, btnId }) {
  const account = byId(accountId);
  const avatar = byId(avatarId);
  const text = byId(textId);
  const btn = byId(btnId);
  if (!account && !btn && !text && !avatar) return;

  const session = getCloudSessionInfo();
  const connected = !!session;

  if (text) {
    if (session?.login) text.textContent = `Conectado como @${session.login}`;
    else if (connected) text.textContent = 'Conectado para sincronizar';
    else text.textContent = 'Sync: no conectado';
  }

  const avatarUrl = String(session?.avatarUrl ?? '').trim();
  if (avatar) {
    if (connected && avatarUrl) {
      avatar.hidden = false;
      avatar.alt = session?.login ? `@${session.login}` : 'Cuenta';
      if (avatar.getAttribute('src') !== avatarUrl) avatar.src = avatarUrl;
    } else {
      avatar.hidden = true;
      avatar.removeAttribute('src');
      avatar.alt = '';
    }
  }

  if (btn) {
    btn.textContent = connected ? 'Ajustes' : 'Conectar';
    btn.disabled = false;
  }

  if (account) {
    account.setAttribute('aria-label', connected ? 'Abrir ajustes de sincronización' : 'Conectar sincronización');
  }
}

export function renderSidebarSyncAccount() {
  renderAccountBlock({
    accountId: 'sidebarSyncAccount',
    avatarId: 'sidebarSyncAvatar',
    textId: 'sidebarSyncAccountText',
    btnId: 'sidebarSyncConnectBtn'
  });
  renderAccountBlock({
    accountId: 'topSyncAccount',
    avatarId: 'topSyncAvatar',
    textId: 'topSyncAccountText',
    btnId: 'topSyncConnectBtn'
  });
}

function initAccountBlock({ accountId, btnId }) {
  const account = byId(accountId);
  const btn = byId(btnId);

  const onConnectOrSettings = () => {
    const session = getCloudSessionInfo();
    if (session) void openSettingsView();
    else startConnectFlow();
  };

  if (account && bindOnce(account, 'sync-account-bound')) {
    account.addEventListener('click', () => onConnectOrSettings());
    account.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onConnectOrSettings();
      }
    });
  }

  if (btn && bindOnce(btn, 'sync-account-btn-bound')) {
    btn.addEventListener('click', () => onConnectOrSettings());
  }
}

export function initSidebarSyncAccount() {
  initAccountBlock({ accountId: 'sidebarSyncAccount', btnId: 'sidebarSyncConnectBtn' });
  initAccountBlock({ accountId: 'topSyncAccount', btnId: 'topSyncConnectBtn' });
  document.addEventListener('cloud-sync-updated', () => renderSidebarSyncAccount());
  renderSidebarSyncAccount();
}
