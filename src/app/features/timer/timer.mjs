import { formatHMS, formatMS, showNotification, todayKey, xpToNextLevel } from '../../../utils/helpers.js';
import { getAppState, getCurrentSubject } from '../../core/state.mjs';
import { DIFFICULTY_CONFIG } from '../../core/constants.mjs';
import { checkAchievementsV2 } from '../achievements/core.mjs';
import { saveData } from '../../core/storage.mjs';
import { awardXp, getDifficultyConfigForSubject, getGlobalUnlockedSkillsSet, globalXpMultiplier, timerMultiplierInfo } from '../xp/xp.mjs';
import { updateMiniTimerUi } from './mini-timer.mjs';
import { renderStats } from '../notes/notes-skilltree-stats.mjs';
import { recordSession, renderSessions } from '../../ui/render.mjs';

let timerIntervalId = null;
let lastAchievementsCheckMs = 0;

function byId(id) {
  return document.getElementById(id);
}

function updateXpUiImpl() {
  const levelText = byId('levelText');
  const xpText = byId('xpText');
  const xpFill = byId('xpFill');
  const skillPointsText = byId('skillPointsText');

  if (!levelText || !xpText || !xpFill || !skillPointsText) return;

  const subject = getCurrentSubject();
  const appState = getAppState();
  if (!subject) {
    levelText.textContent = '1';
    xpText.textContent = '0';
    skillPointsText.textContent = String(appState?.globalMeta?.skillPoints ?? 0);
    xpFill.style.width = '0%';
    return;
  }

  levelText.textContent = String(subject.meta.level);
  xpText.textContent = String(subject.meta.xp);
  skillPointsText.textContent = String(appState?.globalMeta?.skillPoints ?? 0);

  const toNext = xpToNextLevel(subject.meta.level) ?? 0;
  const pct = toNext > 0 ? Math.min(100, Math.round((subject.meta.xp / toNext) * 100)) : 0;
  xpFill.style.width = `${pct}%`;
}

function setAvatarTier(tier) {
  const streakAvatar = byId('streakAvatar');
  const avatarCaption = byId('avatarCaption');
  if (!streakAvatar || !avatarCaption) return;

  const capped = Math.min(5, tier);
  streakAvatar.className = `streak-avatar streak-tier-${capped}`;

  const labels = ['En frío', 'Tibio', 'Caliente', 'Ardiendo', 'En llamas', 'Infernal'];
  avatarCaption.textContent = labels[capped] ?? 'En foco';
}

export function updateTimerUi() {
  const timerDisplay = byId('timerDisplay');
  const streakDisplay = byId('streakDisplay');
  const multiplierDisplay = byId('multiplierDisplay');
  const timerToggleBtn = byId('timerToggleBtn');
  const timerStopBtn = byId('timerStopBtn');
  const difficultySelect = byId('difficultySelect');
  const pomodoroModeSelect = byId('pomodoroMode');
  const alarmModeSelect = byId('alarmMode');
  const pomodoroCustomControls = byId('pomodoroCustomControls');
  const pomodoroWorkMin = byId('pomodoroWorkMin');
  const pomodoroBreakMin = byId('pomodoroBreakMin');
  const alarmCustomControls = byId('alarmCustomControls');
  const alarmCustomMin = byId('alarmCustomMin');

  const subject = getCurrentSubject();
  if (!subject) {
    if (timerDisplay) timerDisplay.textContent = '00:00:00';
    if (streakDisplay) streakDisplay.textContent = '00:00';
    if (multiplierDisplay) multiplierDisplay.textContent = 'x1.00';
    if (timerToggleBtn) timerToggleBtn.textContent = 'Iniciar';
    if (timerStopBtn) timerStopBtn.disabled = true;
    if (difficultySelect) difficultySelect.value = 'normal';
    if (pomodoroModeSelect) pomodoroModeSelect.value = 'off';
    if (alarmModeSelect) alarmModeSelect.value = 'off';
    if (pomodoroCustomControls) pomodoroCustomControls.hidden = true;
    if (alarmCustomControls) alarmCustomControls.hidden = true;
    updateXpUiImpl();
    updateMiniTimerUi();
    return;
  }

  const t = subject.meta.timer;
  if (timerDisplay) timerDisplay.textContent = formatHMS(t.sessionSeconds) ?? '00:00:00';
  if (streakDisplay) streakDisplay.textContent = formatMS(t.streakSeconds) ?? '00:00';

  const mult = timerMultiplierInfo(subject, t.streakSeconds) ?? { multiplier: 1, tier: 0 };
  if (multiplierDisplay) multiplierDisplay.textContent = `x${Number(mult.multiplier ?? 1).toFixed(2)}`;

  setAvatarTier(Number(mult.tier ?? 0));

  if (timerToggleBtn) {
    timerToggleBtn.textContent = t.running ? 'Pausar' : (t.sessionSeconds > 0 ? 'Reanudar' : 'Iniciar');
  }
  if (timerStopBtn) {
    timerStopBtn.disabled = !t.running && t.sessionSeconds === 0;
  }

  if (difficultySelect) difficultySelect.value = subject.meta.difficulty;
  if (pomodoroModeSelect) {
    pomodoroModeSelect.value = String(subject?.meta?.pomodoro?.mode ?? 'off');
    if (pomodoroModeSelect.value === 'custom') {
      const w = Math.round(Number(subject?.meta?.pomodoro?.workSeconds ?? 0) / 60);
      const b = Math.round(Number(subject?.meta?.pomodoro?.breakSeconds ?? 0) / 60);
      pomodoroModeSelect.title = `Personalizado: ${w}/${b} min`;
      if (pomodoroCustomControls) pomodoroCustomControls.hidden = false;
      if (pomodoroWorkMin) pomodoroWorkMin.value = String(Math.max(1, w || 25));
      if (pomodoroBreakMin) pomodoroBreakMin.value = String(Math.max(1, b || 5));
    } else {
      pomodoroModeSelect.title = '';
      if (pomodoroCustomControls) pomodoroCustomControls.hidden = true;
    }
  }
  if (alarmModeSelect) {
    alarmModeSelect.value = String(subject?.meta?.alarm?.mode ?? 'off');
    if (alarmModeSelect.value === 'custom') {
      const m = Math.round(Number(subject?.meta?.alarm?.seconds ?? 0) / 60);
      alarmModeSelect.title = `Personalizado: ${m} min`;
      if (alarmCustomControls) alarmCustomControls.hidden = false;
      if (alarmCustomMin) alarmCustomMin.value = String(Math.max(1, m || 30));
    } else {
      alarmModeSelect.title = '';
      if (alarmCustomControls) alarmCustomControls.hidden = true;
    }
  }

  updateXpUiImpl();
  updateMiniTimerUi();
}

function startTimer() {
  const subject = getCurrentSubject();
  if (!subject) return;

  const t = subject.meta.timer;
  const now = Date.now();

  if (t.sessionSeconds === 0) {
    t.alarmFired = false;
    t.pomodoroPhase = 'work';
    t.pomodoroPhaseStartSessionSeconds = 0;
    t.pomodoroLastSignal = null;
  }

  t.running = true;
  t.lastTickMs = now;
  t.pausedAtMs = null;

  if (!t.currentSessionStartMs) {
    t.currentSessionStartMs = now;
  }

  subject.meta.sessionsCount += 1;
  const appState = getAppState();
  if (appState?.globalMeta) appState.globalMeta.sessionsCount += 1;
  saveData();

  if (!timerIntervalId) {
    timerIntervalId = setInterval(onTimerTick, 1000);
  }

  checkAchievementsV2({ activity: 'timer_start', nowMs: now, streakSeconds: t.streakSeconds });
  updateTimerUi();
}

function pauseTimer() {
  const subject = getCurrentSubject();
  if (!subject) return;

  const t = subject.meta.timer;
  if (!t.running) return;
  t.running = false;
  t.pausedAtMs = Date.now();
  t.lastTickMs = null;
  updateTimerUi();
  saveData(true);
}

export function startOrPauseTimer() {
  const subject = getCurrentSubject();
  if (!subject) {
    showNotification('Selecciona una materia primero');
    return;
  }

  const t = subject.meta.timer;
  if (t.running) {
    pauseTimer();
  } else {
    startTimer();
  }
}

export function stopTimer() {
  const subject = getCurrentSubject();
  if (!subject) return;

  const t = subject.meta.timer;
  t.running = false;
  t.lastTickMs = null;
  t.pausedAtMs = null;

  if (t.sessionSeconds > subject.meta.longestSessionSeconds) {
    subject.meta.longestSessionSeconds = t.sessionSeconds;
    const appState = getAppState();
    if (t.sessionSeconds > (appState?.globalMeta?.longestSessionSeconds ?? 0)) {
      if (appState?.globalMeta) appState.globalMeta.longestSessionSeconds = t.sessionSeconds;
    }
  }

  if (t.sessionSeconds > 0 && t.currentSessionStartMs) {
    const diff = getDifficultyConfigForSubject(subject) ?? { xpPerMinute: 0 };
    const minutes = Math.floor(t.sessionSeconds / 60);
    const mult = timerMultiplierInfo(subject, t.streakSeconds) ?? { multiplier: 1 };
    const base = minutes * Number(diff.xpPerMinute ?? 0) * Number(mult.multiplier ?? 1);
    const xpEarned = Math.floor(base * (globalXpMultiplier(getGlobalUnlockedSkillsSet()) ?? 1));
    recordSession(t.currentSessionStartMs, t.sessionSeconds, xpEarned);
  }

  checkAchievementsV2({ activity: 'timer_stop', nowMs: Date.now(), streakSeconds: t.streakSeconds });

  t.sessionSeconds = 0;
  t.streakSeconds = 0;
  t.xpCarrySeconds = 0;
  t.currentSessionStartMs = null;
  t.alarmFired = false;
  t.pomodoroPhase = 'work';
  t.pomodoroPhaseStartSessionSeconds = 0;
  t.pomodoroLastSignal = null;

  updateTimerUi();
  renderSessions();
  saveData(true);
}

function onTimerTick() {
  const subject = getCurrentSubject();
  if (!subject) return;

  const t = subject.meta.timer;
  if (!t.running) return;

  const now = Date.now();
  if (!t.lastTickMs) t.lastTickMs = now;

  const deltaSeconds = Math.min(5, Math.max(0, (now - t.lastTickMs) / 1000));
  t.lastTickMs = now;

  t.sessionSeconds += deltaSeconds;
  t.streakSeconds += deltaSeconds;
  t.xpCarrySeconds += deltaSeconds;

  subject.meta.totalFocusSeconds += deltaSeconds;
  const appState = getAppState();
  if (appState?.globalMeta) appState.globalMeta.totalFocusSeconds += deltaSeconds;

  const today = todayKey();
  if (today) {
    subject.meta.dailyFocusSeconds[today] = (subject.meta.dailyFocusSeconds[today] ?? 0) + deltaSeconds;
    if (appState?.globalMeta) {
      appState.globalMeta.dailyFocusSeconds[today] = (appState.globalMeta.dailyFocusSeconds[today] ?? 0) + deltaSeconds;
    }
  }

  if (now - lastAchievementsCheckMs >= 10000) {
    lastAchievementsCheckMs = now;
    checkAchievementsV2({ activity: 'timer_tick', nowMs: now, streakSeconds: t.streakSeconds });
  }

  if (t.xpCarrySeconds >= 60) {
    const minutes = Math.floor(t.xpCarrySeconds / 60);
    t.xpCarrySeconds -= minutes * 60;
    const diff = getDifficultyConfigForSubject(subject) ?? { xpPerMinute: 0 };
    const mult = timerMultiplierInfo(subject, t.streakSeconds) ?? { multiplier: 1 };
    awardXp(subject, minutes * Number(diff.xpPerMinute ?? 0) * Number(mult.multiplier ?? 1), { reason: 'timer' });
    updateXpUiImpl();
  }

  tickPomodoroAndAlarm();
  if (!t.running) return;

  updateTimerUi();
  renderStats();
  saveData();
}

export function setDifficulty(value) {
  const subject = getCurrentSubject();
  if (!subject || !DIFFICULTY_CONFIG?.[value]) return;
  subject.meta.difficulty = value;
  saveData(true);
  updateTimerUi();
  showNotification(`Modo: ${DIFFICULTY_CONFIG[value].label}`);
}

function playBeep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.value = 0.05;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      try { osc.stop(); } catch {}
      try { ctx.close(); } catch {}
    }, 180);
  } catch {
    // ignore
  }
}

function parsePomodoroPreset(mode) {
  const m = String(mode ?? 'off');
  if (m === 'off') return { mode: 'off', workSeconds: 0, breakSeconds: 0 };
  if (m === '25-5') return { mode: m, workSeconds: 25 * 60, breakSeconds: 5 * 60 };
  if (m === '50-10') return { mode: m, workSeconds: 50 * 60, breakSeconds: 10 * 60 };
  if (m === '15-5') return { mode: m, workSeconds: 15 * 60, breakSeconds: 5 * 60 };
  return null;
}

export function setPomodoroMode(mode) {
  const subject = getCurrentSubject();
  const pomodoroModeSelect = byId('pomodoroMode');
  if (!subject) {
    showNotification('Selecciona una materia primero');
    if (pomodoroModeSelect) pomodoroModeSelect.value = 'off';
    return;
  }
  if (!subject.meta.pomodoro || typeof subject.meta.pomodoro !== 'object') {
    subject.meta.pomodoro = { mode: 'off', workSeconds: 25 * 60, breakSeconds: 5 * 60 };
  }

  const m = String(mode ?? 'off');
  const prev = String(subject.meta.pomodoro.mode ?? 'off');

  if (m === 'custom') {
    // Values are edited via dedicated UI inputs.
    const workSeconds = Number(subject?.meta?.pomodoro?.workSeconds ?? 25 * 60);
    const breakSeconds = Number(subject?.meta?.pomodoro?.breakSeconds ?? 5 * 60);
    subject.meta.pomodoro = {
      mode: 'custom',
      workSeconds: Number.isFinite(workSeconds) && workSeconds > 0 ? workSeconds : (25 * 60),
      breakSeconds: Number.isFinite(breakSeconds) && breakSeconds > 0 ? breakSeconds : (5 * 60)
    };
  } else {
    const preset = parsePomodoroPreset(m);
    if (!preset) {
      showNotification('Pomodoro inválido.');
      if (pomodoroModeSelect) pomodoroModeSelect.value = prev;
      return;
    }
    subject.meta.pomodoro = preset;
  }

  const t = subject.meta.timer;
  t.pomodoroPhase = 'work';
  t.pomodoroPhaseStartSessionSeconds = Number(t.sessionSeconds) || 0;
  t.pomodoroLastSignal = null;

  saveData(true);
  updateTimerUi();
}

export function setCustomPomodoroMinutes(workMinutes, breakMinutes) {
  const subject = getCurrentSubject();
  if (!subject) {
    showNotification('Selecciona una materia primero');
    return;
  }

  const workMin = Math.max(1, Math.min(240, Math.floor(Number(workMinutes))));
  const breakMin = Math.max(1, Math.min(120, Math.floor(Number(breakMinutes))));
  if (!Number.isFinite(workMin) || !Number.isFinite(breakMin)) {
    showNotification('Valores inválidos para Pomodoro.');
    return;
  }

  if (!subject.meta.pomodoro || typeof subject.meta.pomodoro !== 'object') {
    subject.meta.pomodoro = { mode: 'custom', workSeconds: 25 * 60, breakSeconds: 5 * 60 };
  }

  subject.meta.pomodoro.mode = 'custom';
  subject.meta.pomodoro.workSeconds = workMin * 60;
  subject.meta.pomodoro.breakSeconds = breakMin * 60;

  const t = subject.meta.timer;
  t.pomodoroPhase = 'work';
  t.pomodoroPhaseStartSessionSeconds = Number(t.sessionSeconds) || 0;
  t.pomodoroLastSignal = null;

  saveData(true);
  updateTimerUi();
}

function parseAlarmPreset(mode) {
  const m = String(mode ?? 'off');
  if (m === 'off') return { mode: 'off', seconds: 0 };
  if (m === '15m') return { mode: m, seconds: 15 * 60 };
  if (m === '30m') return { mode: m, seconds: 30 * 60 };
  if (m === '45m') return { mode: m, seconds: 45 * 60 };
  if (m === '60m') return { mode: m, seconds: 60 * 60 };
  return null;
}

export function setAlarmMode(mode) {
  const subject = getCurrentSubject();
  const alarmModeSelect = byId('alarmMode');
  if (!subject) {
    showNotification('Selecciona una materia primero');
    if (alarmModeSelect) alarmModeSelect.value = 'off';
    return;
  }
  if (!subject.meta.alarm || typeof subject.meta.alarm !== 'object') {
    subject.meta.alarm = { mode: 'off', seconds: 0 };
  }

  const m = String(mode ?? 'off');
  const prev = String(subject.meta.alarm.mode ?? 'off');

  if (m === 'custom') {
    // Values are edited via dedicated UI inputs.
    const seconds = Number(subject?.meta?.alarm?.seconds ?? 30 * 60);
    subject.meta.alarm = { mode: 'custom', seconds: (Number.isFinite(seconds) && seconds > 0) ? seconds : (30 * 60) };
  } else {
    const preset = parseAlarmPreset(m);
    if (!preset) {
      showNotification('Alarma inválida.');
      if (alarmModeSelect) alarmModeSelect.value = prev;
      return;
    }
    subject.meta.alarm = preset;
  }

  const t = subject.meta.timer;
  t.alarmFired = false;

  saveData(true);
  updateTimerUi();
}

export function setCustomAlarmMinutes(minutes) {
  const subject = getCurrentSubject();
  if (!subject) {
    showNotification('Selecciona una materia primero');
    return;
  }

  const min = Math.max(1, Math.min(240, Math.floor(Number(minutes))));
  if (!Number.isFinite(min)) {
    showNotification('Valor inválido para alarma.');
    return;
  }

  if (!subject.meta.alarm || typeof subject.meta.alarm !== 'object') {
    subject.meta.alarm = { mode: 'custom', seconds: min * 60 };
  }

  subject.meta.alarm.mode = 'custom';
  subject.meta.alarm.seconds = min * 60;

  const t = subject.meta.timer;
  t.alarmFired = false;

  saveData(true);
  updateTimerUi();
}

function tickPomodoroAndAlarm() {
  const subject = getCurrentSubject();
  if (!subject) return;
  const t = subject.meta.timer;
  const alarmSeconds = Number(subject?.meta?.alarm?.seconds ?? 0);

  if (alarmSeconds > 0 && !t.alarmFired && Number(t.sessionSeconds) >= alarmSeconds) {
    t.alarmFired = true;
    playBeep();
    showNotification('⏰ Alarma!');
  }

  const pomodoro = subject?.meta?.pomodoro;
  const work = Number(pomodoro?.workSeconds ?? 0);
  const brk = Number(pomodoro?.breakSeconds ?? 0);
  const enabled = String(pomodoro?.mode ?? 'off') !== 'off' && work > 0 && brk > 0;
  if (!enabled) return;

  if (!t.pomodoroPhase) t.pomodoroPhase = 'work';
  if (t.pomodoroPhaseStartSessionSeconds == null) t.pomodoroPhaseStartSessionSeconds = 0;

  const phase = t.pomodoroPhase;
  const phaseStart = Number(t.pomodoroPhaseStartSessionSeconds) || 0;
  const elapsed = Math.max(0, Number(t.sessionSeconds) - phaseStart);

  if (phase === 'work' && elapsed >= work) {
    t.pomodoroPhase = 'break';
    t.pomodoroPhaseStartSessionSeconds = Number(t.sessionSeconds) || 0;
    playBeep();
    showNotification('• Pomodoro: descanso');
    pauseTimer();
    return;
  }

  if (phase === 'break' && elapsed >= brk) {
    t.pomodoroPhase = 'work';
    t.pomodoroPhaseStartSessionSeconds = Number(t.sessionSeconds) || 0;
    playBeep();
    showNotification('Pomodoro: foco');
    pauseTimer();
  }
}

export function updateXpUi() {
  updateXpUiImpl();
}
