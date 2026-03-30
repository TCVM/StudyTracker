import { loadTheme, showNotification } from '../utils/helpers.js';
import { setCurrentSubject } from './core/state.mjs';
import { checkAchievementsV2 } from './features/achievements/core.mjs';
import { setupAdditionalEventListeners, setupEventListeners } from './ui/events.mjs';
import { initMiniTimerObserver, updateMiniTimerUi } from './features/timer/mini-timer.mjs';
import { loadData } from './core/storage.mjs';
import { loadMapViewMode } from './features/subject/view.mjs';
import { loadSharedSubjects } from './shared/core.mjs';
import { renderAll } from './ui/render.mjs';
import { setActiveView } from './ui/flow.mjs';
import { setIsDarkMode } from './core/ui-state.mjs';
import { claimCloudSyncTokenFromUrl, getCloudSessionInfo } from './sync/cloud-sync.mjs';
import { initCloudWatch } from './sync/cloud-watch.mjs';
import { initSidebarSyncAccount } from './ui/sidebar-sync-account.mjs';

function openHomeView() {
  setCurrentSubject(null);
  setActiveView('homeView');
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === 'homeView');
  });
}

function initApp() {
  const claimed = claimCloudSyncTokenFromUrl();
  if (claimed) {
    const info = getCloudSessionInfo();
    if (info?.login) showNotification(`Conectado como @${info.login}.`);
    else showNotification('Conectado para sincronizar.');
  }
  initSidebarSyncAccount();
  initCloudWatch();
  loadData();
  checkAchievementsV2({ activity: 'generic', nowMs: Date.now(), silent: true });
  void loadSharedSubjects();

  setIsDarkMode(loadTheme());

  loadMapViewMode();
  renderAll();
  initMiniTimerObserver();
  updateMiniTimerUi();
  setupEventListeners();
  setupAdditionalEventListeners();
  openHomeView();
}

let bootstrapped = false;
if (!bootstrapped) {
  bootstrapped = true;
  document.addEventListener('DOMContentLoaded', initApp);
}
