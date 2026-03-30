import { showNotification } from '../../utils/helpers.js';
import { buildCloudAuthStartUrl, getCloudSessionInfo, getCloudSyncConfig } from '../sync/cloud-sync.mjs';

function byId(id) {
  return document.getElementById(id);
}

function startConnectFlow() {
  const cfg = getCloudSyncConfig();
  let url;
  try {
    url = buildCloudAuthStartUrl({ baseUrl: cfg.baseUrl, redirectUrl: window.location.href });
  } catch (e) {
    showNotification(String(e?.message ?? e ?? 'URL inválida.'));
    return;
  }
  showNotification('Redirigiendo a GitHub…');
  window.location.assign(url);
}

function renderInlineStatus({ avatarId, textId }) {
  const avatar = byId(avatarId);
  const text = byId(textId);
  if (!text && !avatar) return;

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
}

export function renderSidebarSyncAccount() {
  renderInlineStatus({ avatarId: 'sidebarSyncMiniAvatar', textId: 'sidebarSyncMiniText' });
  renderInlineStatus({ avatarId: 'homeSyncInlineAvatar', textId: 'homeSyncInlineText' });
  renderInlineStatus({ avatarId: 'settingsSyncInlineAvatar', textId: 'settingsSyncInlineText' });

  const session = getCloudSessionInfo();
  const btn = byId('sidebarSyncMiniConnectBtn');
  if (btn) btn.hidden = !!session;
}

export function initSidebarSyncAccount() {
  const btn = byId('sidebarSyncMiniConnectBtn');
  if (btn && btn.getAttribute('data-sync-bound') !== '1') {
    btn.setAttribute('data-sync-bound', '1');
    btn.addEventListener('click', () => startConnectFlow());
  }
  document.addEventListener('cloud-sync-updated', () => renderSidebarSyncAccount());
  renderSidebarSyncAccount();
}
