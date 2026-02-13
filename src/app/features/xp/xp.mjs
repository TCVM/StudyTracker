import { DIFFICULTY_CONFIG, REVIEW_SCHEDULE_DAYS } from '../../core/constants.mjs';
import { xpToNextLevel } from '../../../utils/helpers.js';
import { getAppState } from '../../core/state.mjs';

export function getGlobalUnlockedSkillsSet() {
  const appState = getAppState();
  const unlocked = Array.isArray(appState?.globalMeta?.unlockedSkills) ? appState.globalMeta.unlockedSkills : [];
  return new Set(unlocked.map(String));
}

export function globalXpMultiplier(skillsSet) {
  if (skillsSet.has('skill_xp_boost_2')) return 1.2;
  if (skillsSet.has('skill_xp_boost_1')) return 1.1;
  return 1.0;
}

export function getDifficultyConfigForSubject(subject) {
  const key = String(subject?.meta?.difficulty ?? 'normal');
  return DIFFICULTY_CONFIG[key] ?? DIFFICULTY_CONFIG.normal;
}

export function awardXp(subject, baseXp, opts = null) {
  if (!subject || !subject.meta) return 0;
  const base = Math.max(0, Math.floor(Number(baseXp) || 0));
  if (base <= 0) return 0;

  const skills = getGlobalUnlockedSkillsSet();
  const mult = globalXpMultiplier(skills);
  let gained = Math.floor(base * mult);

  const reason = String(opts?.reason ?? '');
  if (reason === 'review' && skills.has('skill_review_bonus')) {
    gained = Math.floor(gained * 1.25);
  }
  if (reason === 'review_ontime' && skills.has('skill_review_master')) {
    gained += 5;
  }
  if (reason === 'topic_complete' && skills.has('skill_topic_bonus')) {
    gained += 5;
  }

  subject.meta.xp += gained;
  const appState = getAppState();
  if (appState?.globalMeta) {
    appState.globalMeta.xp += gained;
  }

  while (subject.meta.xp >= xpToNextLevel(subject.meta.level)) {
    subject.meta.xp -= xpToNextLevel(subject.meta.level);
    subject.meta.level += 1;
  }

  while (appState?.globalMeta && appState.globalMeta.xp >= xpToNextLevel(appState.globalMeta.level)) {
    appState.globalMeta.xp -= xpToNextLevel(appState.globalMeta.level);
    appState.globalMeta.level += 1;
    appState.globalMeta.skillPoints += 1;
  }

  return gained;
}

export function timerMultiplierInfo(subject, streakSeconds) {
  const diff = getDifficultyConfigForSubject(subject);
  const skills = getGlobalUnlockedSkillsSet();

  const tierMinutes = Array.isArray(diff?.tierMinutes) ? diff.tierMinutes.slice() : [0];
  if (tierMinutes.length >= 2 && skills.has('skill_multiplier_cap')) {
    const last = Number(tierMinutes[tierMinutes.length - 1]) || 0;
    const prev = Number(tierMinutes[tierMinutes.length - 2]) || 0;
    const step = Math.max(1, last - prev);
    tierMinutes.push(last + step);
  }

  const minutes = Math.max(0, Math.floor(Number(streakSeconds) / 60));
  let tier = 0;
  for (let i = 0; i < tierMinutes.length; i++) {
    const th = Number(tierMinutes[i]);
    if (Number.isFinite(th) && minutes >= th) tier = i;
  }

  const multStep = Number(diff?.tierMultiplierStep) || 0;
  const multiplier = 1 + Math.max(0, tier) * Math.max(0, multStep);
  return { tier, multiplier };
}

export function nextReviewDueAtMs(topic) {
  if (!topic || !topic.completedAt) return null;
  const completedAt = Number(topic.completedAt);
  if (!Number.isFinite(completedAt)) return null;

  const reviews = Array.isArray(topic.reviews) ? topic.reviews : [];
  const idx = Math.max(0, Math.min(REVIEW_SCHEDULE_DAYS.length, reviews.length));
  if (idx >= REVIEW_SCHEDULE_DAYS.length) return null;

  const baseTs = reviews.length ? Number(reviews[reviews.length - 1]) : completedAt;
  if (!Number.isFinite(baseTs)) return null;

  const days = REVIEW_SCHEDULE_DAYS[idx];
  return baseTs + days * 24 * 60 * 60 * 1000;
}

export function isTopicReviewDue(topic, nowMs) {
  const dueAt = nextReviewDueAtMs(topic);
  if (dueAt == null) return false;
  return Number(nowMs) >= dueAt;
}
