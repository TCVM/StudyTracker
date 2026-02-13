export function escAttr(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function addSubjectDraftId() {
  return Date.now() + Math.floor(Math.random() * 1000000);
}

export function createDraftTopic(depth = 1) {
  return {
    id: addSubjectDraftId(),
    name: '',
    depth: Math.max(1, Math.min(20, depth)),
    collapsed: false,
    sourceIndex: null
  };
}

export function createDraftCategory() {
  return {
    id: addSubjectDraftId(),
    name: '',
    icon: '📍',
    collapsed: false,
    topics: [createDraftTopic(1)]
  };
}

export function findTopicIndexById(cat, topicId) {
  if (!cat || !Array.isArray(cat.topics)) return -1;
  return cat.topics.findIndex((t) => t.id === topicId);
}

export function draftLastDescendantIndex(topics, index) {
  if (!Array.isArray(topics) || index < 0 || index >= topics.length) return index;
  const depth = topics[index].depth;
  let i = index + 1;
  while (i < topics.length && topics[i].depth > depth) i++;
  return i - 1;
}

export function normalizeImportedTopicListToLevels(topics) {
  const out = [];

  const pushTopic = (name, level) => {
    const n = String(name ?? '').trim();
    if (!n) return;
    out.push({ name: n, level: Math.max(1, Math.min(20, Number(level) || 1)) });
  };

  const walk = (node, level) => {
    if (node == null) return;
    if (typeof node === 'string' || typeof node === 'number') {
      pushTopic(String(node), level);
      return;
    }

    if (Array.isArray(node)) {
      for (const child of node) walk(child, level);
      return;
    }

    if (typeof node === 'object') {
      const name = node.name ?? node.title ?? '';
      const ownLevel = node.level != null ? node.level : level;
      pushTopic(name, ownLevel);
      if (Array.isArray(node.children)) {
        for (const child of node.children) walk(child, (Number(ownLevel) || level) + 1);
      }
    }
  };

  walk(topics, 1);
  return out;
}
