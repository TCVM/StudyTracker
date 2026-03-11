import { showNotification } from '../../../utils/helpers.js';
import { getCurrentSubject } from '../../core/state.mjs';
import { checkAchievementsV2 } from '../achievements/core.mjs';
import { saveData } from '../../core/storage.mjs';
import { awardXp, deductXp, getDifficultyConfigForSubject, nextReviewDueAtMs } from '../xp/xp.mjs';
import { renderAllNonTimer } from '../../ui/render.mjs';

export function toggleTopicCompleted(categoryId, topicIndex) {
  const subject = getCurrentSubject();
  if (!subject) return;

  const category = subject.categories.find((c) => String(c?.id) === String(categoryId));
  if (!category) return;
  const topic = category.topics[topicIndex];
  if (!topic) return;

  const now = Date.now();
  const wasCompleted = !!topic.completed;
  topic.completed = !topic.completed;

  if (topic.completed) {
    topic.completedAt = now;
    topic.reviews = [];

    // only award xp the first time or after a previous uncompletion
    if (!topic.completionXp) {
      const diff = getDifficultyConfigForSubject(subject);
      const base = diff?.xpTopicComplete ?? 0;
      const gained = awardXp(subject, base, { reason: 'topic_complete' }) ?? 0;
      topic.completionXp = base;
      showNotification(`Tema completado! +${gained} XP`);
    }
  } else {
    // user unmarked the topic: deduct xp if it had been awarded
    if (topic.completionXp) {
      deductXp(subject, topic.completionXp);
      showNotification(`XP revertida (-${topic.completionXp})`);
      topic.completionXp = null;
    }
    topic.completedAt = null;
    topic.reviews = [];
  }

  if (wasCompleted !== topic.completed) {
    checkAchievementsV2({ activity: 'topic', nowMs: now });
    renderAllNonTimer();
    saveData(true);
  }
}

export function completeTopicReview(categoryId, topicIndex) {
  const subject = getCurrentSubject();
  if (!subject) return;

  const category = subject.categories.find((c) => String(c?.id) === String(categoryId));
  if (!category) return;
  const topic = category.topics[topicIndex];
  if (!topic || !topic.completed) return;

  if (!Array.isArray(topic.reviews)) topic.reviews = [];

  const now = Date.now();
  const dueAt = nextReviewDueAtMs(topic);
  const onTime = dueAt != null && now <= (Number(dueAt) + 24 * 60 * 60 * 1000);

  topic.reviews.push(now);

  const diff = getDifficultyConfigForSubject(subject);
  const gained = awardXp(subject, diff?.xpReviewComplete ?? 0, { reason: onTime ? 'review_ontime' : 'review' }) ?? 0;

  const label = onTime ? 'Repaso a tiempo' : 'Repaso registrado';
  showNotification(`${label}! +${gained} XP`);

  checkAchievementsV2({ activity: 'review', nowMs: now });
  renderAllNonTimer();
  saveData(true);
}
