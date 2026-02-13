import { ACHIEVEMENTS } from '../../core/constants.mjs';

function isTopicAchievementForSubjectV2(achievement, subject) {
  if (achievement.kind !== 'topic') return false;
  if (!subject || !Array.isArray(subject.categories)) return false;

  const categoryIdByCondition = {
    complete_architecture: 1,
    complete_memory: 2,
    complete_instructions: 3,
    complete_io_buses: 4,
    complete_pipeline: 5,
    complete_multiproc: 6
  };

  const categoryId = categoryIdByCondition[achievement.condition] ?? null;
  if (!categoryId) return false;
  return subject.categories.some((c) => c.id === categoryId);
}

export function globalAchievementDefinitionsV2() {
  return ACHIEVEMENTS.filter((a) => a.kind !== 'topic');
}

export function subjectAchievementDefinitionsV2(subject) {
  if (!subject) return [];
  const defs = [];

  for (const a of ACHIEVEMENTS) {
    if (isTopicAchievementForSubjectV2(a, subject)) defs.push(a);
  }

  const categories = Array.isArray(subject.categories) ? subject.categories : [];
  for (const category of categories) {
    if (!category || !Array.isArray(category.topics) || category.topics.length === 0) continue;
    const catName = String(category.name ?? 'Tema');
    defs.push({
      id: `category_${subject.id}_${category.id}`,
      title: `Dominio: ${catName}`,
      desc: `Completar todos los subtemas de "${catName}"`,
      kind: 'category',
      condition: 'category_complete',
      categoryId: category.id
    });
  }

  const custom = Array.isArray(subject?.meta?.customAchievements) ? subject.meta.customAchievements : [];
  for (const a of custom) {
    if (!a || !a.id) continue;
    defs.push({
      id: String(a.id),
      title: String(a.title ?? 'Logro personalizado'),
      desc: String(a.desc ?? ''),
      kind: 'custom',
      type: a.type,
      value: a.value,
      categoryId: a.categoryId
    });
  }

  return defs;
}
