import { ACHIEVEMENTS } from '../utils/constants.js';
import { showNotification } from '../utils/helpers.js';
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

function dateKeyFromDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function addDays(date, deltaDays) {
    const d = new Date(date);
    d.setDate(d.getDate() + deltaDays);
    return d;
}

function getConsecutiveDayStreak(dailyFocusSeconds, now) {
    if (!dailyFocusSeconds || typeof dailyFocusSeconds !== 'object') return 0;

    let streak = 0;
    for (let i = 0; i < 370; i++) {
        const key = dateKeyFromDate(addDays(now, -i));
        const seconds = dailyFocusSeconds[key] ?? 0;
        if (seconds > 0) streak += 1;
        else break;
    }
    return streak;
}

function getDaysStudiedInMonth(dailyFocusSeconds, now) {
    if (!dailyFocusSeconds || typeof dailyFocusSeconds !== 'object') return 0;

    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `${y}-${m}-`;

    let days = 0;
    for (const [key, seconds] of Object.entries(dailyFocusSeconds)) {
        if (!key.startsWith(prefix)) continue;
        if ((seconds ?? 0) > 0) days += 1;
    }
    return days;
}

function getSubjectCompletionPercentage(subject) {
    if (!subject || !Array.isArray(subject.categories)) return 0;

    let totalTopics = 0;
    let completedTopics = 0;

    for (const category of subject.categories) {
        totalTopics += category.topics.length;
        completedTopics += category.topics.filter(t => t.completed).length;
    }

    return totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;
}

export function checkAchievements(appState, context = null) {
    const totalFocus = appState.globalMeta.totalFocusSeconds;
    const now = new Date(context?.nowMs ?? Date.now());
    const activity = context?.activity ?? 'generic';
    const isTimerEvent = activity.startsWith('timer');
    const streakSeconds =
        context?.streakSeconds ??
        context?.timer?.streakSeconds ??
        context?.currentSubject?.meta?.timer?.streakSeconds ??
        0;

    let totalTopics = 0;
    let completedTopics = 0;

    for (const subject of appState.subjects) {
        for (const category of subject.categories) {
            totalTopics += category.topics.length;
            completedTopics += category.topics.filter(t => t.completed).length;
        }
    }

    const completionPercentage = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;
    const sessionsCount = appState.globalMeta.sessionsCount;

    const currentSubjectPercentage = context?.currentSubject ? getSubjectCompletionPercentage(context.currentSubject) : 0;
    const bestSubjectPercentage = appState.subjects.reduce((max, s) => Math.max(max, getSubjectCompletionPercentage(s)), 0);
    const progressPercentage = Math.max(completionPercentage, currentSubjectPercentage, bestSubjectPercentage);

    for (const a of ACHIEVEMENTS) {
        if (appState.globalMeta.achievements[a.id]) continue;

        if (a.kind === 'total' && totalFocus >= a.seconds) {
            unlockAchievement(appState, a.id);
            continue;
        }

        if (a.kind === 'streak' && isTimerEvent && streakSeconds >= a.seconds) {
            unlockAchievement(appState, a.id);
            continue;
        }

        if (a.kind === 'progress') {
            if (a.condition === 'first_topic' && completedTopics >= 1) {
                unlockAchievement(appState, a.id);
            } else if (a.condition === '25_percent' && progressPercentage >= 25) {
                unlockAchievement(appState, a.id);
            } else if (a.condition === '50_percent' && progressPercentage >= 50) {
                unlockAchievement(appState, a.id);
            } else if (a.condition === '75_percent' && progressPercentage >= 75) {
                unlockAchievement(appState, a.id);
            } else if (a.condition === '100_percent' && progressPercentage >= 100) {
                unlockAchievement(appState, a.id);
            }
            continue;
        }

        if (a.kind === 'time' && isTimerEvent) {
            if (a.condition === 'before_8am' && now.getHours() < 8) {
                unlockAchievement(appState, a.id);
            } else if (a.condition === 'after_10pm' && now.getHours() >= 22) {
                unlockAchievement(appState, a.id);
            } else if (a.condition === '3_days_streak') {
                const dayStreak = getConsecutiveDayStreak(appState.globalMeta.dailyFocusSeconds, now);
                if (dayStreak >= 3) unlockAchievement(appState, a.id);
            } else if (a.condition === '7_days_streak') {
                const dayStreak = getConsecutiveDayStreak(appState.globalMeta.dailyFocusSeconds, now);
                if (dayStreak >= 7) unlockAchievement(appState, a.id);
            } else if (a.condition === '20_days_month') {
                const daysInMonth = getDaysStudiedInMonth(appState.globalMeta.dailyFocusSeconds, now);
                if (daysInMonth >= 20) unlockAchievement(appState, a.id);
            }
            continue;
        }

        if (a.kind === 'topic') {
            const categoryIdByCondition = {
                complete_architecture: 1,
                complete_memory: 2,
                complete_instructions: 3,
                complete_io_buses: 4,
                complete_pipeline: 5,
                complete_multiproc: 6
            };

            const categoryId = categoryIdByCondition[a.condition] ?? null;
            if (categoryId) {
                for (const subject of appState.subjects) {
                    const category = subject.categories.find(c => c.id === categoryId);
                    if (category && category.topics.every(t => t.completed)) {
                        unlockAchievement(appState, a.id);
                        break;
                    }
                }
            }
            continue;
        }

        if (a.kind === 'special') {
            if (a.condition === 'first_10_xp' && appState.globalMeta.xp >= 10) {
                unlockAchievement(appState, a.id);
            } else if (a.condition === '5_achievements' && Object.keys(appState.globalMeta.achievements).length >= 5) {
                unlockAchievement(appState, a.id);
            } else if (a.condition === '15_achievements' && Object.keys(appState.globalMeta.achievements).length >= 15) {
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
