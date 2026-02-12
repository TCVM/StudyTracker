import { todayKey } from '../utils/helpers.js';
import { saveData } from '../utils/storage.js';

export function recordSession(appState, currentSubject, startTime, durationSeconds, xpEarned) {
    if (!currentSubject) return;
    
    const session = {
        startTime: startTime,
        endTime: Date.now(),
        durationSeconds: durationSeconds,
        xpEarned: xpEarned,
        difficulty: currentSubject.meta.difficulty
    };
    
    currentSubject.meta.sessions.unshift(session);
    
    if (currentSubject.meta.sessions.length > 20) {
        currentSubject.meta.sessions = currentSubject.meta.sessions.slice(0, 20);
    }
    
    saveData(appState, true);
}

export function updateDailyStats(appState, currentSubject, deltaSeconds) {
    const today = todayKey();
    
    currentSubject.meta.totalFocusSeconds += deltaSeconds;
    currentSubject.meta.dailyFocusSeconds[today] = (currentSubject.meta.dailyFocusSeconds[today] ?? 0) + deltaSeconds;
    
    appState.globalMeta.totalFocusSeconds += deltaSeconds;
    appState.globalMeta.dailyFocusSeconds[today] = (appState.globalMeta.dailyFocusSeconds[today] ?? 0) + deltaSeconds;
}

export function getSessionStats(appState) {
    let totalSessions = 0;
    let totalDuration = 0;
    let totalXpEarned = 0;
    
    for (const subject of appState.subjects) {
        totalSessions += subject.meta.sessions.length;
        for (const session of subject.meta.sessions) {
            totalDuration += session.durationSeconds;
            totalXpEarned += session.xpEarned;
        }
    }
    
    return {
        totalSessions,
        totalDuration,
        totalXpEarned
    };
}

export function getTodayStats(appState) {
    const today = todayKey();
    let todayFocus = appState.globalMeta.dailyFocusSeconds[today] ?? 0;
    
    return {
        todayFocus,
        todaySessions: 0 // Esto se puede mejorar si almacenamos sesiones por día
    };
}

export function getLongestSession(appState) {
    let longest = 0;
    
    for (const subject of appState.subjects) {
        if (subject.meta.longestSessionSeconds > longest) {
            longest = subject.meta.longestSessionSeconds;
        }
    }
    
    return longest;
}
