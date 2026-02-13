import { getAppState, getCurrentSubject } from '../../core/state.mjs';
import { showNotification } from '../../../utils/helpers.js';
import { ACHIEVEMENTS } from '../../core/constants.mjs';
import { renderAchievementsV2 } from './ui.mjs';
import { renderHomePage } from '../../ui/home.mjs';
import { saveData } from '../../core/storage.mjs';
import { subjectAchievementDefinitionsV2 } from './definitions.mjs';

function getAchievementsDefs() {
  return Array.isArray(ACHIEVEMENTS) ? ACHIEVEMENTS : [];
}

export function achV2DateKeyFromDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function achV2AddDays(date, deltaDays) {
  const d = new Date(date);
  d.setDate(d.getDate() + deltaDays);
  return d;
}

export function achV2ConsecutiveDayStreak(dailyFocusSeconds, now) {
  if (!dailyFocusSeconds || typeof dailyFocusSeconds !== 'object') return 0;

  let streak = 0;
  for (let i = 0; i < 370; i++) {
    const key = achV2DateKeyFromDate(achV2AddDays(now, -i));
    const seconds = dailyFocusSeconds[key] ?? 0;
    if (seconds > 0) streak += 1;
    else break;
  }
  return streak;
}

export function achV2DaysStudiedInMonth(dailyFocusSeconds, now) {
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

export function achV2SubjectCompletionPercentage(subject) {
  if (!subject || !Array.isArray(subject.categories)) return 0;

  let total = 0;
  let done = 0;
  for (const category of subject.categories) {
    total += category.topics.length;
    done += category.topics.filter((t) => t.completed).length;
  }
  return total > 0 ? (done / total) * 100 : 0;
}

export function unlockAchievementV2(achievementId, options = null) {
  const appState = getAppState();
  if (!appState?.globalMeta?.achievements) return false;
  if (appState.globalMeta.achievements[achievementId]) return false;

  appState.globalMeta.achievements[achievementId] = Date.now();

  const a = getAchievementsDefs().find((x) => x.id === achievementId);
  if (a && !options?.silent) {
    showNotification(`🏆 Logro: ${a.title}`);
  }

  renderAchievementsV2();
  renderHomePage();
  saveData(true);
  return true;
}

export function unlockSubjectAchievementV2(subject, achievementId, options = null) {
  if (!subject) return false;
  if (!subject.meta) subject.meta = {};
  if (!subject.meta.achievements) subject.meta.achievements = {};
  if (subject.meta.achievements[achievementId]) return false;

  subject.meta.achievements[achievementId] = Date.now();

  if (!options?.silent) {
    const defs = subjectAchievementDefinitionsV2(subject) ?? [];
    const a = defs.find((x) => x.id === achievementId);
    if (a) showNotification(`🏆 Logro (${subject.name ?? 'Materia'}): ${a.title}`);
  }

  renderAchievementsV2();
  renderHomePage();
  saveData(true);
  return true;
}

export function subjectTopicStatsV2(subject) {
  let total = 0;
  let done = 0;

  for (const category of subject?.categories ?? []) {
    if (!category || !Array.isArray(category.topics)) continue;
    total += category.topics.length;
    done += category.topics.filter((t) => t.completed).length;
  }

  const pct = total > 0 ? (done / total) * 100 : 0;
  return { total, done, pct };
}

export function checkSubjectAchievementsV2(subject, context = null) {
  if (!subject) return;
  const silent = !!context?.silent;

  const defs = subjectAchievementDefinitionsV2(subject) ?? [];
  if (defs.length === 0) return;

  const { done, pct } = subjectTopicStatsV2(subject);
  const focusMinutes = Math.floor((subject?.meta?.totalFocusSeconds ?? 0) / 60);

  for (const a of defs) {
    if (subject?.meta?.achievements?.[a.id]) continue;

    if (a.kind === 'progress') {
      if (a.condition === 'first_topic' && done >= 1) {
        unlockSubjectAchievementV2(subject, a.id, { silent });
      } else if (a.condition === '25_percent' && pct >= 25) {
        unlockSubjectAchievementV2(subject, a.id, { silent });
      } else if (a.condition === '50_percent' && pct >= 50) {
        unlockSubjectAchievementV2(subject, a.id, { silent });
      } else if (a.condition === '75_percent' && pct >= 75) {
        unlockSubjectAchievementV2(subject, a.id, { silent });
      } else if (a.condition === '100_percent' && pct >= 100) {
        unlockSubjectAchievementV2(subject, a.id, { silent });
      }
      continue;
    }

    if (a.kind === 'custom') {
      const t = String(a.type ?? '');
      const threshold = Number(a.value);
      if (t === 'pct') {
        if (Number.isFinite(threshold) && pct >= threshold) unlockSubjectAchievementV2(subject, a.id, { silent });
      } else if (t === 'focus_minutes') {
        if (Number.isFinite(threshold) && focusMinutes >= threshold) unlockSubjectAchievementV2(subject, a.id, { silent });
      } else if (t === 'topic_complete') {
        const targetName = String(a.topicName ?? '').trim();
        if (!targetName) continue;
        for (const category of subject.categories ?? []) {
          for (const topic of category.topics ?? []) {
            if (topic?.completed && String(topic?.name ?? '') === targetName) {
              unlockSubjectAchievementV2(subject, a.id, { silent });
              break;
            }
          }
        }
      }
      continue;
    }
  }
}

export function checkAchievementsV2(context = null) {
  const appState = getAppState();
  if (!appState?.globalMeta) return;

  const activity = String(context?.activity ?? 'generic');
  const nowMs = Number.isFinite(Number(context?.nowMs)) ? Number(context.nowMs) : Date.now();
  const now = new Date(nowMs);
  const silent = !!context?.silent;
  const streakSeconds = Number(context?.streakSeconds ?? 0);
  const isTimerEvent = activity.startsWith('timer');

  let totalTopics = 0;
  let completedTopics = 0;
  for (const subject of appState.subjects ?? []) {
    if (!subject || !Array.isArray(subject.categories)) continue;
    for (const category of subject.categories) {
      totalTopics += category.topics.length;
      completedTopics += category.topics.filter((t) => t.completed).length;
    }
  }

  const completionPercentage = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;
  const currentSubject = getCurrentSubject();
  const currentSubjectPercentage = currentSubject ? achV2SubjectCompletionPercentage(currentSubject) : 0;
  const bestSubjectPercentage = (appState.subjects ?? []).reduce((max, s) => Math.max(max, achV2SubjectCompletionPercentage(s)), 0);
  const progressPercentage = Math.max(completionPercentage, currentSubjectPercentage, bestSubjectPercentage);

  const totalFocus = appState.globalMeta.totalFocusSeconds;
  const sessionsCount = appState.globalMeta.sessionsCount;
  const unlockedCount = Object.keys(appState.globalMeta.achievements ?? {}).length;

  for (const a of getAchievementsDefs()) {
    if (appState.globalMeta.achievements[a.id]) continue;

    if (a.kind === 'total' && totalFocus >= a.seconds) {
      unlockAchievementV2(a.id, { silent });
      continue;
    }

    if (a.kind === 'streak' && isTimerEvent && streakSeconds >= a.seconds) {
      unlockAchievementV2(a.id, { silent });
      continue;
    }

    if (a.kind === 'progress') {
      if (a.condition === 'first_topic' && completedTopics >= 1) {
        unlockAchievementV2(a.id, { silent });
      } else if (a.condition === '25_percent' && progressPercentage >= 25) {
        unlockAchievementV2(a.id, { silent });
      } else if (a.condition === '50_percent' && progressPercentage >= 50) {
        unlockAchievementV2(a.id, { silent });
      } else if (a.condition === '75_percent' && progressPercentage >= 75) {
        unlockAchievementV2(a.id, { silent });
      } else if (a.condition === '100_percent' && progressPercentage >= 100) {
        unlockAchievementV2(a.id, { silent });
      }
      continue;
    }

    if (a.kind === 'time' && isTimerEvent) {
      if (a.condition === 'before_8am' && now.getHours() < 8) {
        unlockAchievementV2(a.id, { silent });
      } else if (a.condition === 'after_10pm' && now.getHours() >= 22) {
        unlockAchievementV2(a.id, { silent });
      } else if (a.condition === '3_days_streak') {
        const dayStreak = achV2ConsecutiveDayStreak(appState.globalMeta.dailyFocusSeconds, now);
        if (dayStreak >= 3) unlockAchievementV2(a.id, { silent });
      } else if (a.condition === '7_days_streak') {
        const dayStreak = achV2ConsecutiveDayStreak(appState.globalMeta.dailyFocusSeconds, now);
        if (dayStreak >= 7) unlockAchievementV2(a.id, { silent });
      } else if (a.condition === '20_days_month') {
        const daysInMonth = achV2DaysStudiedInMonth(appState.globalMeta.dailyFocusSeconds, now);
        if (daysInMonth >= 20) unlockAchievementV2(a.id, { silent });
      }
      continue;
    }

    if (a.kind === 'topic') {
      continue;
    }

    if (a.kind === 'special') {
      if (a.condition === 'first_10_xp' && appState.globalMeta.xp >= 10) {
        unlockAchievementV2(a.id, { silent });
      } else if (a.condition === '5_achievements' && unlockedCount >= 5) {
        unlockAchievementV2(a.id, { silent });
      } else if (a.condition === '15_achievements' && unlockedCount >= 15) {
        unlockAchievementV2(a.id, { silent });
      } else if (a.condition === '10_sessions' && sessionsCount >= 10) {
        unlockAchievementV2(a.id, { silent });
      } else if (a.condition === '50_sessions' && sessionsCount >= 50) {
        unlockAchievementV2(a.id, { silent });
      }
      continue;
    }
  }

  // Logros dinámicos por materia
  const targets = (activity === 'generic' || silent) ? (appState.subjects ?? []) : (currentSubject ? [currentSubject] : []);
  for (const s of targets) {
    checkSubjectAchievementsV2(s, { silent });
  }
}
