import { showNotification } from '../utils/helpers.js';
import { saveData } from '../utils/storage.js';

export function xpToNextLevel(level) {
    return Math.floor(120 + (level - 1) * 55 + (level - 1) * (level - 1) * 4);
}

export function addXpToSubject(appState, subject, amount) {
    if (!Number.isFinite(amount) || amount <= 0) return;

    subject.meta.xp += amount;
    
    let leveledUp = false;
    while (subject.meta.xp >= xpToNextLevel(subject.meta.level)) {
        subject.meta.xp -= xpToNextLevel(subject.meta.level);
        subject.meta.level += 1;
        subject.meta.skillPoints += 1;
        leveledUp = true;
    }

    if (leveledUp) {
        showNotification(`¡Nivel ${subject.meta.level}! (+1 SP)`);
    }

    return leveledUp;
}

export function addXpGlobally(appState, amount) {
    if (!Number.isFinite(amount) || amount <= 0) return;

    appState.globalMeta.xp += amount;
    
    let leveledUp = false;
    while (appState.globalMeta.xp >= xpToNextLevel(appState.globalMeta.level)) {
        appState.globalMeta.xp -= xpToNextLevel(appState.globalMeta.level);
        appState.globalMeta.level += 1;
        appState.globalMeta.skillPoints += 1;
        leveledUp = true;
    }

    return leveledUp;
}

export function completeTopicXp(appState, currentSubject, amount = 22) {
    addXpToSubject(appState, currentSubject, amount);
    addXpGlobally(appState, amount);
    showNotification(`Tema completado! +${amount} XP`);
    saveData(appState, true);
}
