import { loadTheme } from '../utils/helpers.js';
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

function openHomeView() {
  setCurrentSubject(null);
  setActiveView('homeView');
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === 'homeView');
  });
}

function initApp() {
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
