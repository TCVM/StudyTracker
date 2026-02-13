import { updateMiniTimerVisibility } from '../features/timer/mini-timer.mjs';

export function setActiveView(viewId) {
  // Remove active class from all views and tabs
  document.querySelectorAll('.tab-btn').forEach((btn) => btn.classList.remove('active'));

  // If it's a subject view tab (listView, mapView, notesView, statsView)
  if (['listView', 'mapView', 'notesView', 'statsView'].includes(viewId)) {
    // Only affect the nested views inside subjectView
    const root = document.querySelector('#subjectView .main-content');
    const nestedViews = root ? root.querySelectorAll('.view') : [];
    nestedViews.forEach((v) => v.classList.remove('view-active'));

    const view = document.getElementById(viewId);
    if (view) {
      view.classList.add('view-active');
    }
  } else {
    // For top-level views (homeView, subjectView, sharedView, globalSkillTreeView)
    document.querySelectorAll('.main-content > .view').forEach((v) => v.classList.remove('view-active'));

    const view = document.getElementById(viewId);
    if (view) {
      view.classList.add('view-active');
    }
  }

  // Update tab button state
  const activeTab = document.querySelector(`.tab-btn[data-view="${viewId}"]`);
  if (activeTab) {
    activeTab.classList.add('active');
  }

  updateMiniTimerVisibility();
}
