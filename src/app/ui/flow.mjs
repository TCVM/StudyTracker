import { updateMiniTimerVisibility } from '../features/timer/mini-timer.mjs';

const activationHandlers = new Map(); // viewId -> Set<fn>

export function registerViewActivationHandler(viewId, handler) {
  const id = String(viewId ?? '').trim();
  if (!id) return () => {};
  if (typeof handler !== 'function') return () => {};

  const set = activationHandlers.get(id) ?? new Set();
  set.add(handler);
  activationHandlers.set(id, set);

  return () => {
    const s = activationHandlers.get(id);
    s?.delete(handler);
    if (s && s.size === 0) activationHandlers.delete(id);
  };
}

export function setActiveView(viewId) {
  const id = String(viewId ?? '').trim();
  if (!id) return;

  // Remove active class from all views and tabs
  const view = document.getElementById(id);
  if (!view) return;

  document.querySelectorAll('.tab-btn').forEach((btn) => btn.classList.remove('active'));

  // If it's a nested subject tab (e.g. listView/mapView/notesView/examsView/statsView),
  // only affect the nested views inside subjectView.
  const subjectRoot = document.querySelector('#subjectView .main-content');
  const isNestedSubjectView = !!(subjectRoot && view && subjectRoot.contains(view));

  if (isNestedSubjectView) {
    subjectRoot.querySelectorAll('.view').forEach((v) => v.classList.remove('view-active'));
    view.classList.add('view-active');
  } else {
    // For top-level views (homeView, subjectView, sharedView, globalSkillTreeView)
    document.querySelectorAll('.main-content > .view').forEach((v) => v.classList.remove('view-active'));

    if (view) view.classList.add('view-active');
  }

  // Update tab button state
  const activeTab = document.querySelector(`.tab-btn[data-view="${id}"]`);
  if (activeTab) {
    activeTab.classList.add('active');
  }

  updateMiniTimerVisibility();

  const handlers = activationHandlers.get(id);
  if (handlers && handlers.size) {
    for (const fn of handlers) {
      try {
        fn(id);
      } catch (err) {
        console.error(err);
      }
    }
  }
}
