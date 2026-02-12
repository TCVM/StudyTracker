import { todayKey, xpToNextLevel, showNotification } from '../utils/helpers.js';
import { saveData } from '../utils/storage.js';
import { recordSession, updateDailyStats } from '../modules/stats.js';

let timerIntervalId = null;
let currentSubject = null;
let appState = null;

export function setCurrentSubject(subject) {
    currentSubject = subject;
}

export function setAppState(state) {
    appState = state;
}

export function startOrPauseTimer() {
    if (!currentSubject) {
        showNotification('Selecciona una materia primero');
        return;
    }

    const t = currentSubject.meta.timer;
    if (t.running) {
        pauseTimer();
    } else {
        startTimer();
    }
}

export function startTimer() {
    if (!currentSubject) return;
    
    const t = currentSubject.meta.timer;
    const now = Date.now();

    t.running = true;
    t.lastTickMs = now;
    t.pausedAtMs = null;

    if (!t.currentSessionStartMs) {
        t.currentSessionStartMs = now;
    }

    currentSubject.meta.sessionsCount += 1;
    appState.globalMeta.sessionsCount += 1;

    if (!timerIntervalId) {
        timerIntervalId = setInterval(onTimerTick, 1000);
    }

    updateTimerUi();
    if (appState) saveData(appState, true);
}

export function pauseTimer() {
    if (!currentSubject) return;
    
    const t = currentSubject.meta.timer;
    if (!t.running) return;
    t.running = false;
    t.pausedAtMs = Date.now();
    t.lastTickMs = null;
    updateTimerUi();
    if (appState) saveData(appState, true);
}

export function stopTimer() {
    if (!currentSubject) return;
    
    const t = currentSubject.meta.timer;
    t.running = false;
    t.lastTickMs = null;
    t.pausedAtMs = null;

    if (t.sessionSeconds > currentSubject.meta.longestSessionSeconds) {
        currentSubject.meta.longestSessionSeconds = t.sessionSeconds;
    }

    if (t.sessionSeconds > 0 && t.currentSessionStartMs) {
        const xpEarned = Math.floor(t.sessionSeconds / 60) * 6;
        
        // Registrar sesión con globalMeta actualizado
        recordSession(appState, currentSubject, t.currentSessionStartMs, t.sessionSeconds, xpEarned);
        
        // Agregar XP ganado
        currentSubject.meta.xp += xpEarned;
        appState.globalMeta.xp += xpEarned;
        
        // Actualizar niveles del subject
        while (currentSubject.meta.xp >= xpToNextLevel(currentSubject.meta.level)) {
            currentSubject.meta.xp -= xpToNextLevel(currentSubject.meta.level);
            currentSubject.meta.level += 1;
            currentSubject.meta.skillPoints += 1;
        }
        
        // Actualizar niveles global
        while (appState.globalMeta.xp >= xpToNextLevel(appState.globalMeta.level)) {
            appState.globalMeta.xp -= xpToNextLevel(appState.globalMeta.level);
            appState.globalMeta.level += 1;
            appState.globalMeta.skillPoints += 1;
        }
    }

    t.sessionSeconds = 0;
    t.streakSeconds = 0;
    t.xpCarrySeconds = 0;
    t.currentSessionStartMs = null;

    updateTimerUi();
    if (appState) saveData(appState, true);
}

function onTimerTick() {
    if (!currentSubject) return;
    
    const t = currentSubject.meta.timer;
    if (!t.running) return;

    const now = Date.now();
    if (!t.lastTickMs) t.lastTickMs = now;

    const deltaSeconds = Math.min(5, Math.max(0, (now - t.lastTickMs) / 1000));
    t.lastTickMs = now;

    t.sessionSeconds += deltaSeconds;
    t.streakSeconds += deltaSeconds;
    t.xpCarrySeconds += deltaSeconds;

    // Actualizar estadísticas diarias en ambos niveles
    updateDailyStats(appState, currentSubject, deltaSeconds);

    if (t.xpCarrySeconds >= 60) {
        const minutes = Math.floor(t.xpCarrySeconds / 60);
        t.xpCarrySeconds -= minutes * 60;
        const gained = Math.floor(minutes * 6);
        currentSubject.meta.xp += gained;
        
        while (currentSubject.meta.xp >= xpToNextLevel(currentSubject.meta.level)) {
            currentSubject.meta.xp -= xpToNextLevel(currentSubject.meta.level);
            currentSubject.meta.level += 1;
            currentSubject.meta.skillPoints += 1;
        }
        
        updateXpUi();
    }

    updateTimerUi();
    if (appState) saveData(appState);
}

function updateXpUi() {
    if (!currentSubject) {
        const levelText = document.getElementById('levelText');
        const xpText = document.getElementById('xpText');
        const skillPointsText = document.getElementById('skillPointsText');
        const xpFill = document.getElementById('xpFill');
        
        levelText.textContent = '1';
        xpText.textContent = '0';
        skillPointsText.textContent = '0';
        xpFill.style.width = '0%';
        return;
    }

    const levelText = document.getElementById('levelText');
    const xpText = document.getElementById('xpText');
    const skillPointsText = document.getElementById('skillPointsText');
    const xpFill = document.getElementById('xpFill');

    levelText.textContent = String(currentSubject.meta.level);
    xpText.textContent = String(currentSubject.meta.xp);
    skillPointsText.textContent = String(currentSubject.meta.skillPoints);

    const toNext = xpToNextLevel(currentSubject.meta.level);
    const pct = toNext > 0 ? Math.min(100, Math.round((currentSubject.meta.xp / toNext) * 100)) : 0;
    xpFill.style.width = `${pct}%`;
}

function updateTimerUi() {
    if (!currentSubject) {
        const timerDisplay = document.getElementById('timerDisplay');
        const streakDisplay = document.getElementById('streakDisplay');
        const multiplierDisplay = document.getElementById('multiplierDisplay');
        const timerToggleBtn = document.getElementById('timerToggleBtn');
        const timerStopBtn = document.getElementById('timerStopBtn');
        const difficultySelect = document.getElementById('difficultySelect');
        
        timerDisplay.textContent = '00:00:00';
        streakDisplay.textContent = '00:00';
        multiplierDisplay.textContent = 'x1.00';
        timerToggleBtn.textContent = 'Iniciar';
        timerStopBtn.disabled = true;
        difficultySelect.value = 'normal';
        updateXpUi();
        return;
    }

    const t = currentSubject.meta.timer;
    const timerDisplay = document.getElementById('timerDisplay');
    const streakDisplay = document.getElementById('streakDisplay');
    const multiplierDisplay = document.getElementById('multiplierDisplay');
    const timerToggleBtn = document.getElementById('timerToggleBtn');
    const timerStopBtn = document.getElementById('timerStopBtn');
    const difficultySelect = document.getElementById('difficultySelect');

    timerDisplay.textContent = formatHMS(t.sessionSeconds);
    streakDisplay.textContent = formatHMS(t.streakSeconds);
    multiplierDisplay.textContent = 'x1.00';

    setAvatarTier(0);

    timerToggleBtn.textContent = t.running ? 'Pausar' : (t.sessionSeconds > 0 ? 'Reanudar' : 'Iniciar');
    timerStopBtn.disabled = !t.running && t.sessionSeconds === 0;

    difficultySelect.value = currentSubject.meta.difficulty;
    updateXpUi();
}

function formatHMS(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds));
    const hh = String(Math.floor(s / 3600)).padStart(2, '0');
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
}

function setAvatarTier(tier) {
    const capped = Math.min(5, tier);
    const streakAvatar = document.getElementById('streakAvatar');
    streakAvatar.className = `streak-avatar streak-tier-${capped}`;

    const labels = ['En frío', 'Tibio', 'Caliente', 'Ardiendo', 'En llamas', 'Infernal'];
    const avatarCaption = document.getElementById('avatarCaption');
    avatarCaption.textContent = labels[capped] ?? 'En foco';
}