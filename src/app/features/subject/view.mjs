import { getCurrentSubject } from '../../core/state.mjs';
import { escapeHtml } from '../../../utils/helpers.js';
import { setActiveView } from '../../ui/flow.mjs';
import { isTopicReviewDue } from '../xp/xp.mjs';

let mapViewMode = 'grid';

function byId(id) {
  return document.getElementById(id);
}

export function renderCategories() {
  const categoriesContainer = byId('categoriesContainer');
  if (!categoriesContainer) return;

  const subject = getCurrentSubject();
  if (!subject) {
    categoriesContainer.innerHTML = '';
    return;
  }

  categoriesContainer.innerHTML = '';
  const nowMs = Date.now();

  for (const category of subject.categories) {
    const card = document.createElement('div');
    card.className = 'category-card';

    const totalTopics = category.topics.length;
    const completedTopics = category.topics.filter((t) => t.completed).length;
    const progress = totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0;

    card.innerHTML = `
            <div class="category-header">
                <div class="category-title">
                    <div class="category-icon">${category.icon}</div>
                    ${escapeHtml(category.name ?? '')}
                </div>
            </div>

            <div class="category-progress">
                <div class="progress-header">
                    <span>Progreso</span>
                    <span class="progress-percentage">${progress}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
            </div>

            <ul class="topics-list" id="topics-${category.id}">
                ${category.topics.map((topic, topicIndex) => {
                  const id = `topic-${category.id}-${topicIndex}`;
                  const due = !!topic.completed && isTopicReviewDue(topic, nowMs);
                  const cls = [
                    'topic-item',
                    topic.completed ? 'completed' : '',
                    due ? 'review-due' : ''
                  ].filter(Boolean).join(' ');
                  const reviewBtn = topic.completed ? `
                        <button class="topic-action topic-review-btn" type="button" data-action="review"
                            title="${due ? 'Repaso pendiente' : 'Registrar repaso'}"
                            aria-label="${due ? 'Repaso pendiente' : 'Registrar repaso'}">⟳</button>
                    ` : '';
                  return `
                        <li class="${cls}"
                            id="${id}"
                            data-category-id="${category.id}"
                            data-topic-index="${topicIndex}"
                            style="padding-left: ${12 + ((topic.level - 1) * 20)}px">
                            <div class="topic-checkbox"></div>
                            <div class="topic-name">${escapeHtml(topic.name ?? '')}</div>
                            ${reviewBtn}
                        </li>
                    `;
                }).join('')}
            </ul>
        `;

    categoriesContainer.appendChild(card);
  }
}

export function updateSubjectProgress() {
  const subjectPercentage = byId('subjectPercentage');
  const subjectProgress = byId('subjectProgress');
  if (!subjectPercentage || !subjectProgress) return;

  const subject = getCurrentSubject();
  if (!subject) {
    subjectPercentage.textContent = '0%';
    subjectProgress.style.width = '0%';
    return;
  }

  let totalTopics = 0;
  let completedTopics = 0;

  for (const category of subject.categories) {
    totalTopics += category.topics.length;
    completedTopics += category.topics.filter((t) => t.completed).length;
  }

  const subjectProgressPct = totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0;
  subjectPercentage.textContent = `${subjectProgressPct}%`;
  subjectProgress.style.width = `${subjectProgressPct}%`;
}

const MAP_VIEW_MODE_STORAGE_KEY = 'studyTrackerMapViewMode';

export function loadMapViewMode() {
  try {
    const saved = localStorage.getItem(MAP_VIEW_MODE_STORAGE_KEY);
    if (saved === 'grid' || saved === 'mindmap') {
      mapViewMode = saved;
    }
  } catch {
    // ignore
  }
  updateMapViewToggleUi();
}

function updateMapViewToggleUi() {
  const mapViewGridBtn = byId('mapViewGridBtn');
  const mapViewMindmapBtn = byId('mapViewMindmapBtn');
  if (!mapViewGridBtn || !mapViewMindmapBtn) return;
  const isGrid = mapViewMode !== 'mindmap';

  mapViewGridBtn.classList.toggle('active', isGrid);
  mapViewMindmapBtn.classList.toggle('active', !isGrid);

  mapViewGridBtn.setAttribute('aria-pressed', String(isGrid));
  mapViewMindmapBtn.setAttribute('aria-pressed', String(!isGrid));
}

export function setMapViewMode(mode) {
  if (mode !== 'grid' && mode !== 'mindmap') return;
  mapViewMode = mode;
  try {
    localStorage.setItem(MAP_VIEW_MODE_STORAGE_KEY, mode);
  } catch {
    // ignore
  }
  updateMapViewToggleUi();
  renderMap();
}

function buildTopicTreeFromLevels(topics) {
  const roots = [];
  const stack = [];

  for (let topicIndex = 0; topicIndex < topics.length; topicIndex++) {
    const topic = topics[topicIndex];
    const level = Math.max(1, Math.min(3, Number(topic.level) || 1));
    const node = { topic, topicIndex, children: [], level };

    while (stack.length >= level) stack.pop();

    if (level === 1 || stack.length === 0) {
      roots.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }

    stack.push(node);
  }

  return roots;
}

function renderMapGrid() {
  const mapContainer = byId('mapContainer');
  if (!mapContainer) return;
  const subject = getCurrentSubject();
  if (!subject) return;

  mapContainer.className = 'map-grid';
  mapContainer.innerHTML = '';
  const nowMs = Date.now();

  for (const category of subject.categories) {
    for (let i = 0; i < category.topics.length; i++) {
      const topic = category.topics[i];
      const status = topic.completed ? (isTopicReviewDue(topic, nowMs) ? 'due' : 'done') : 'pending';

      const marker = document.createElement('button');
      marker.type = 'button';
      marker.className = `map-marker ${status}`;
      marker.innerHTML = `
                <div class="marker-title">${escapeHtml(topic.name ?? '')}</div>
                <div class="marker-sub">${escapeHtml(category.name ?? '')}</div>
            `;

      marker.addEventListener('click', () => {
        setActiveView('listView');
        const el = document.getElementById(`topic-${category.id}-${i}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });

      mapContainer.appendChild(marker);
    }
  }
}

function renderMapMindmap() {
  const mapContainer = byId('mapContainer');
  if (!mapContainer) return;
  const subject = getCurrentSubject();
  if (!subject) return;

  mapContainer.className = 'mindmap';
  mapContainer.innerHTML = '';
  const nowMs = Date.now();

  const rootWrap = document.createElement('div');
  rootWrap.className = 'mindmap-root';

  const rootNode = document.createElement('div');
  rootNode.className = 'mindmap-root-node';
  rootNode.innerHTML = `${escapeHtml(subject.icon ?? '📚')} ${escapeHtml(subject.name ?? 'Materia')}`;

  rootWrap.appendChild(rootNode);
  mapContainer.appendChild(rootWrap);

  const branches = document.createElement('div');
  branches.className = 'mindmap-branches';

  const renderNodes = (nodes, category) => {
    const ul = document.createElement('ul');
    ul.className = 'mindmap-tree';

    for (const node of nodes) {
      const li = document.createElement('li');

      const status = node.topic.completed ? (isTopicReviewDue(node.topic, nowMs) ? 'due' : 'done') : 'pending';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `mindmap-node ${status} level-${node.level}`;
      btn.textContent = node.topic.name ?? '';

      btn.addEventListener('click', () => {
        setActiveView('listView');
        const el = document.getElementById(`topic-${category.id}-${node.topicIndex}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });

      li.appendChild(btn);

      if (node.children.length > 0) {
        li.appendChild(renderNodes(node.children, category));
      }

      ul.appendChild(li);
    }

    return ul;
  };

  for (const category of subject.categories) {
    const branch = document.createElement('div');
    branch.className = 'mindmap-branch';

    const catBtn = document.createElement('button');
    catBtn.type = 'button';
    catBtn.className = 'mindmap-node mindmap-category-node pending';
    catBtn.textContent = `${category.icon ? `${category.icon} ` : ''}${category.name ?? ''}`;

    catBtn.addEventListener('click', () => {
      setActiveView('listView');
      const el = document.getElementById(`topics-${category.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    branch.appendChild(catBtn);

    const tree = buildTopicTreeFromLevels(Array.isArray(category.topics) ? category.topics : []);
    branch.appendChild(renderNodes(tree, category));

    branches.appendChild(branch);
  }

  mapContainer.appendChild(branches);
}

export function renderMap() {
  const mapContainer = byId('mapContainer');
  if (!mapContainer) return;

  const subject = getCurrentSubject();
  if (!subject) {
    mapContainer.innerHTML = '';
    return;
  }

  if (mapViewMode === 'mindmap') {
    renderMapMindmap();
  } else {
    renderMapGrid();
  }
}
