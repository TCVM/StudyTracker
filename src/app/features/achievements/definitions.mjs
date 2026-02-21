import { ACHIEVEMENTS } from '../../core/constants.mjs';

function topicAchievementCategoryIdFromCondition(condition) {
  const categoryIdByCondition = {
    complete_architecture: 1,
    complete_memory: 2,
    complete_instructions: 3,
    complete_io_buses: 4,
    complete_pipeline: 5,
    complete_multiproc: 6
  };

  return categoryIdByCondition[String(condition ?? '')] ?? null;
}

function topicAchievementCategoryIdForSubjectV2(achievement, subject) {
  if (achievement.kind !== 'topic') return null;
  if (!subject || !Array.isArray(subject.categories)) return null;

  const categoryId = topicAchievementCategoryIdFromCondition(achievement.condition);
  if (!categoryId) return null;
  const exists = subject.categories.some((c) => c && c.id === categoryId);
  return exists ? categoryId : null;
}

export function globalAchievementDefinitionsV2() {
  return ACHIEVEMENTS.filter((a) => a.kind !== 'topic');
}

export function subjectAchievementDefinitionsV2(subject) {
  if (!subject) return [];
  const defs = [];

  for (const a of ACHIEVEMENTS) {
    const categoryId = topicAchievementCategoryIdForSubjectV2(a, subject);
    if (categoryId) defs.push({ ...a, categoryId });
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
