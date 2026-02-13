import { formatHMS } from '../../../utils/helpers.js';
import { getCurrentSubject } from '../../core/state.mjs';
import { getSessionPanelInView, setSessionPanelInView } from '../../core/ui-state.mjs';

export function isSubjectViewActive() {
  const view = document.getElementById('subjectView');
  return !!(view && view.classList.contains('view-active'));
}

export function updateMiniTimerVisibility() {
  const miniTimerBar = document.getElementById('miniTimerBar');
  if (!miniTimerBar) return;

  const subject = getCurrentSubject();
  const t = subject?.meta?.timer ?? null;
  const hasActiveTimer = !!(t && (t.running || t.sessionSeconds > 0));
  const shouldShow = isSubjectViewActive() && !getSessionPanelInView() && !!subject && hasActiveTimer;

  miniTimerBar.hidden = !shouldShow;
}

export function updateMiniTimerUi() {
  const miniTimerBar = document.getElementById('miniTimerBar');
  const miniTimerSubject = document.getElementById('miniTimerSubject');
  const miniTimerDisplay = document.getElementById('miniTimerDisplay');
  const miniTimerToggleBtn = document.getElementById('miniTimerToggleBtn');
  const miniTimerStopBtn = document.getElementById('miniTimerStopBtn');
  if (!miniTimerBar || !miniTimerDisplay || !miniTimerToggleBtn || !miniTimerStopBtn) return;

  const subject = getCurrentSubject();
  if (!subject) {
    miniTimerDisplay.textContent = '00:00:00';
    miniTimerToggleBtn.textContent = 'Iniciar';
    miniTimerStopBtn.disabled = true;
    if (miniTimerSubject) miniTimerSubject.textContent = 'Materia';
    miniTimerBar.hidden = true;
    return;
  }

  const t = subject.meta.timer;
  miniTimerDisplay.textContent = formatHMS(t.sessionSeconds);
  miniTimerToggleBtn.textContent = t.running ? 'Pausar' : (t.sessionSeconds > 0 ? 'Reanudar' : 'Iniciar');
  miniTimerStopBtn.disabled = !t.running && t.sessionSeconds === 0;
  if (miniTimerSubject) miniTimerSubject.textContent = subject.name ?? 'Materia';

  updateMiniTimerVisibility();
}

export function initMiniTimerObserver() {
  const sessionPanel = document.getElementById('sessionPanel');
  if (!sessionPanel) return;

  if (!('IntersectionObserver' in window)) {
    addEventListener(
      'scroll',
      () => {
        // Fallback: if user scrolls beyond the top of the panel, consider it "out of view"
        try {
          const r = sessionPanel.getBoundingClientRect();
          setSessionPanelInView(r.top < window.innerHeight && r.bottom > 0);
        } catch {
          setSessionPanelInView(true);
        }
        updateMiniTimerVisibility();
      },
      { passive: true }
    );
    return;
  }

  const obs = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (!entry) return;
      setSessionPanelInView(entry.isIntersecting && entry.intersectionRatio > 0.12);
      updateMiniTimerVisibility();
    },
    { threshold: [0, 0.12, 0.25, 0.5, 0.75, 1] }
  );

  obs.observe(sessionPanel);
}
