import { ACHIEVEMENTS } from '../utils/constants.js';
import { showNotification } from '../utils/helpers.js';
import { todayKey } from '../utils/helpers.js';
import { saveData } from '../utils/storage.js';

export function unlockAchievement(appState, achievementId) {
    if (appState.globalMeta.achievements[achievementId]) return false;
    appState.globalMeta.achievements[achievementId] = Date.now();

    const a = ACHIEVEMENTS.find(x => x.id === achievementId);
    if (a) {
        showNotification(`Logro: ${a.title}`);
        particleBurst(document.body, '#ed8936');
        playPing(640);
    }

    saveData(appState, true);
    return true;
}

export function checkAchievements(appState) {
    const totalFocus = appState.globalMeta.totalFocusSeconds;
    
    // Obtener estadísticas globales
    let totalTopics = 0;
    let completedTopics = 0;
    
    for (const subject of appState.subjects) {
        for (const category of subject.categories) {
            totalTopics += category.topics.length;
            completedTopics += category.topics.filter(t => t.completed).length;
        }
    }
    
    const completionPercentage = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;
    const unlockedCount = Object.keys(appState.globalMeta.achievements).length;
    const sessionsCount = appState.globalMeta.sessionsCount;
    
    for (const a of ACHIEVEMENTS) {
        if (appState.globalMeta.achievements[a.id]) continue;
        
        // Logros de tiempo total de enfoque
        if (a.kind === 'total' && totalFocus >= a.seconds) {
            unlockAchievement(appState, a.id);
            continue;
        }
        
        // Logros de progreso académico
        if (a.kind === 'progress') {
            if (a.condition === 'first_topic' && completedTopics >= 1) {
                unlockAchievement(appState, a.id);
            } else if (a.condition === '25_percent' && completionPercentage >= 25) {
                unlockAchievement(appState, a.id);
            } else if (a.condition === '50_percent' && completionPercentage >= 50) {
                unlockAchievement(appState, a.id);
            } else if (a.condition === '75_percent' && completionPercentage >= 75) {
                unlockAchievement(appState, a.id);
            } else if (a.condition === '100_percent' && completionPercentage >= 100) {
                unlockAchievement(appState, a.id);
            }
            continue;
        }
        
        // Logros de categorías específicas
        if (a.kind === 'topic') {
            let categoryCompleted = false;
            const categoryNames = {
                'complete_architecture': 'Estructura del Computador',
                'complete_memory': 'Jerarquía de Memoria',
                'complete_instructions': 'Repertorio de Instrucciones',
                'complete_io_buses': 'Control de E/S y Buses',
                'complete_pipeline': 'Segmentación y Paralelismo',
                'complete_multiproc': 'Sistemas de Múltiples Procesadores'
            };
            
            const categoryName = categoryNames[a.condition];
            if (categoryName) {
                for (const subject of appState.subjects) {
                    const category = subject.categories.find(c => c.name.includes(categoryName));
                    if (category && category.topics.every(t => t.completed)) {
                        categoryCompleted = true;
                        break;
                    }
                }
            }
            
            if (categoryCompleted) {
                unlockAchievement(appState, a.id);
            }
            continue;
        }
        
        // Logros especiales
        if (a.kind === 'special') {
            if (a.condition === 'first_10_xp' && appState.globalMeta.xp >= 10) {
                unlockAchievement(appState, a.id);
            } else if (a.condition === '5_achievements' && unlockedCount >= 5) {
                unlockAchievement(appState, a.id);
            } else if (a.condition === '15_achievements' && unlockedCount >= 15) {
                unlockAchievement(appState, a.id);
            } else if (a.condition === '10_sessions' && sessionsCount >= 10) {
                unlockAchievement(appState, a.id);
            } else if (a.condition === '50_sessions' && sessionsCount >= 50) {
                unlockAchievement(appState, a.id);
            }
            continue;
        }
    }
}

// Funciones auxiliares de efectos visuales
function particleBurst(target, color) {
    const rect = (target && target.getBoundingClientRect) ? target.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
    const originX = rect.left + rect.width * 0.6;
    const originY = rect.top + rect.height * 0.2;

    const count = 12;
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.background = color;
        p.style.left = `${originX}px`;
        p.style.top = `${originY}px`;
        p.style.setProperty('--dx', `${rand(-120, 120)}px`);
        p.style.setProperty('--dy', `${rand(-160, 60)}px`);
        p.style.opacity = String(0.9);
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 700);
    }
}

function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function playPing(freq = 540) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = freq;
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(ctx.destination);
        o.start();
        g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
        o.stop(ctx.currentTime + 0.13);
        o.onended = () => ctx.close();
    } catch {
        // ignore
    }
}
