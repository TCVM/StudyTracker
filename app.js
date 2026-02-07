const STORAGE_KEY_V2 = 'studyTrackerDataV2';
const STORAGE_KEY_V1 = 'studyTrackerData';
const APP_VERSION = 2;

const REVIEW_SCHEDULE_DAYS = [1, 3, 7, 14];

const DIFFICULTY_CONFIG = {
    normal: {
        label: 'Normal',
        pauseGraceSeconds: 60,
        xpPerMinute: 6,
        xpTopicComplete: 22,
        xpReviewComplete: 14,
        tierMinutes: [0, 5, 10, 15, 20, 25],
        tierMultiplierStep: 0.15
    },
    hardcore: {
        label: 'Hardcore',
        pauseGraceSeconds: 0,
        xpPerMinute: 7,
        xpTopicComplete: 26,
        xpReviewComplete: 16,
        tierMinutes: [0, 6, 12, 18, 24, 30],
        tierMultiplierStep: 0.14
    }
};

const ACHIEVEMENTS = [
    { id: 'focus_total_10m', title: 'Arranque', desc: '10 minutos de enfoque total', kind: 'total', seconds: 10 * 60 },
    { id: 'focus_total_30m', title: 'Ritmo', desc: '30 minutos de enfoque total', kind: 'total', seconds: 30 * 60 },
    { id: 'focus_total_60m', title: 'Una hora', desc: '60 minutos de enfoque total', kind: 'total', seconds: 60 * 60 },
    { id: 'focus_total_3h', title: 'En serio', desc: '3 horas de enfoque total', kind: 'total', seconds: 3 * 60 * 60 },
    { id: 'focus_total_10h', title: 'Modo máquina', desc: '10 horas de enfoque total', kind: 'total', seconds: 10 * 60 * 60 },
    { id: 'focus_streak_10m', title: 'Calentando', desc: '10 minutos de racha en una sesión', kind: 'streak', seconds: 10 * 60 },
    { id: 'focus_streak_25m', title: 'Pomodoro pro', desc: '25 minutos de racha en una sesión', kind: 'streak', seconds: 25 * 60 },
    { id: 'focus_streak_45m', title: 'En llamas', desc: '45 minutos de racha en una sesión', kind: 'streak', seconds: 45 * 60 }
];

const SKILLS = [
    {
        id: 'skill_xp_boost_1',
        title: 'XP +10%',
        desc: 'Ganas 10% más XP (timer + tareas).',
        cost: 1,
        reqLevel: 2
    },
    {
        id: 'skill_multiplier_cap',
        title: 'Combo estable',
        desc: '+1 tier máximo de racha (más multiplicador).',
        cost: 1,
        reqLevel: 4
    },
    {
        id: 'skill_review_bonus',
        title: 'Memoria reforzada',
        desc: '+25% XP por repasos espaciados.',
        cost: 1,
        reqLevel: 3
    }
];

// Datos iniciales del plan de estudios: Arquitectura y Organización de Computadoras (con jerarquía)
const initialData = {
    categories: [
        {
            id: 1,
            name: 'Estructura del Computador y Componentes',
            icon: '💻',
            topics: [
                { name: 'Arquitectura de Von Neumann (IAS)', level: 1 },
                { name: 'Memoria Principal (Datos/Instrucciones)', level: 2 },
                { name: 'Unidad Aritmético-Lógica (ALU)', level: 2 },
                { name: 'Unidad de Control (UC)', level: 2 },
                { name: 'Equipo de Entrada/Salida (E/S)', level: 2 },
                { name: 'Componentes de la CPU', level: 1 },
                { name: 'Unidad de Control (UC)', level: 2 },
                { name: 'ALU (Procesamiento de Datos)', level: 2 },
                { name: 'Registros (Almacenamiento Interno)', level: 2 },
                { name: 'Interconexiones CPU (Comunicación Interna)', level: 2 },
                { name: 'Evolución', level: 1 },
                { name: 'Microprocesador (Intel 4004, 1971)', level: 2 },
                { name: 'Memoria Caché (IBM S/360 Mod. 85, 1968)', level: 2 },
                { name: 'Concepto de Familia (IBM System/360, 1964)', level: 2 },
                { name: 'Unidad de Control Microprogramada (1964)', level: 2 }
            ]
        },
        {
            id: 2,
            name: 'Jerarquía de Memoria',
            icon: '📊',
            topics: [
                { name: '¿Por qué funciona?', level: 1 },
                { name: 'Principio de Localidad de Referencias', level: 2 },
                { name: 'Localidad Temporal', level: 3 },
                { name: 'Localidad Espacial', level: 3 },
                { name: 'Propiedades a Cumplir', level: 1 },
                { name: 'Inclusión', level: 2 },
                { name: 'Coherencia', level: 2 },
                { name: 'Memoria Caché', level: 1 },
                { name: 'Organización y Diseño', level: 2 },
                { name: 'Tamaño de Caché', level: 3 },
                { name: 'Función de Correspondencia', level: 3 },
                { name: 'Directa', level: 4 },
                { name: 'Asociativa', level: 4 },
                { name: 'Asociativa por Conjuntos (k-vías)', level: 4 },
                { name: 'Política de Escritura', level: 3 },
                { name: 'Escritura Inmediata (Write-Through)', level: 4 },
                { name: 'Post-Escritura (Write-Back)', level: 4 },
                { name: 'Política de Reemplazo', level: 3 },
                { name: 'LRU (Menos Recientemente Usado)', level: 4 },
                { name: 'FIFO', level: 4 },
                { name: 'LFU', level: 4 },
                { name: 'Aleatoria', level: 4 },
                { name: 'Múltiples Niveles (L1, L2, L3)', level: 3 },
                { name: 'Prestaciones', level: 2 },
                { name: 'Tasa de Aciertos (H)', level: 3 },
                { name: 'Tasa de Fallos (TF)', level: 3 },
                { name: 'Penalización por Fallo (PF)', level: 3 },
                { name: 'Tiempo Medio de Acceso', level: 3 },
                { name: 'Otros Niveles', level: 1 },
                { name: 'Memoria Principal (DRAM)', level: 2 },
                { name: 'Memoria Virtual (Disco Duro)', level: 2 },
                { name: 'Almacenamiento Local (RISC/GPUs)', level: 2 }
            ]
        },
        {
            id: 3,
            name: 'Repertorio de Instrucciones (RI)',
            icon: '📝',
            topics: [
                { name: 'Elementos de una Instrucción', level: 1 },
                { name: 'Código de Operación (Codop)', level: 2 },
                { name: 'Referencia a Operandos Fuente', level: 2 },
                { name: 'Referencia a Resultado', level: 2 },
                { name: 'Referencia a Siguiente Instrucción', level: 2 },
                { name: 'Decisiones de Diseño', level: 1 },
                { name: 'Formato de Instrucción', level: 2 },
                { name: 'Fijo (RISC)', level: 3 },
                { name: 'Variable (CISC)', level: 3 },
                { name: 'Cantidad de Direcciones', level: 2 },
                { name: 'Tipos de Operando (Numéricos, Caracteres, Lógicos)', level: 2 },
                { name: 'Repertorio de Operaciones (Cuántos, Cuáles, Complejidad)', level: 2 },
                { name: 'Registros (Número, Uso)', level: 2 },
                { name: 'Tipos de Operaciones', level: 1 },
                { name: 'Procesamiento de Datos (Aritméticas/Lógicas)', level: 2 },
                { name: 'Transferencia de Datos (Memoria/E/S)', level: 2 },
                { name: 'Control (Salto/Flujo)', level: 2 },
                { name: 'Conversión (Formato de Datos)', level: 2 },
                { name: 'Modos de Direccionamiento (MDD)', level: 1 },
                { name: 'Inmediato', level: 2 },
                { name: 'Directo', level: 2 },
                { name: 'Indirecto', level: 2 },
                { name: 'Registro', level: 2 },
                { name: 'Registro Indirecto', level: 2 },
                { name: 'Desplazamiento', level: 2 },
                { name: 'Pila', level: 2 }
            ]
        }
    ]
};

let appState = createDefaultState();
let timerIntervalId = null;
let lastSaveMs = 0;

// DOM
const categoriesContainer = document.getElementById('categoriesContainer');
const globalPercentage = document.getElementById('globalPercentage');
const globalProgress = document.getElementById('globalProgress');
const saveBtn = document.getElementById('saveBtn');
const resetBtn = document.getElementById('resetBtn');

const timerDisplay = document.getElementById('timerDisplay');
const streakDisplay = document.getElementById('streakDisplay');
const multiplierDisplay = document.getElementById('multiplierDisplay');
const difficultySelect = document.getElementById('difficultySelect');
const timerToggleBtn = document.getElementById('timerToggleBtn');
const timerStopBtn = document.getElementById('timerStopBtn');

const streakAvatar = document.getElementById('streakAvatar');
const avatarCaption = document.getElementById('avatarCaption');

const levelText = document.getElementById('levelText');
const xpText = document.getElementById('xpText');
const xpFill = document.getElementById('xpFill');
const skillPointsText = document.getElementById('skillPointsText');
const focusTodayText = document.getElementById('focusTodayText');

const mapContainer = document.getElementById('mapContainer');
const skillTreeContainer = document.getElementById('skillTreeContainer');
const statsContainer = document.getElementById('statsContainer');
const achievementsContainer = document.getElementById('achievementsContainer');

function createDefaultState() {
    return {
        version: APP_VERSION,
        categories: [],
        meta: {
            difficulty: 'normal',
            xp: 0,
            level: 1,
            skillPoints: 0,
            unlockedSkills: [],
            achievements: {},
            totalFocusSeconds: 0,
            sessionsCount: 0,
            longestSessionSeconds: 0,
            dailyFocusSeconds: {},
            timer: {
                running: false,
                sessionSeconds: 0,
                streakSeconds: 0,
                xpCarrySeconds: 0,
                lastTickMs: null,
                pausedAtMs: null
            }
        }
    };
}

function createCategoriesFromInitialData() {
    return initialData.categories.map(category => ({
        ...category,
        topics: category.topics.map(topic => ({
            name: topic.name,
            level: topic.level ?? 1,
            completed: false,
            completedAt: null,
            reviews: []
        }))
    }));
}

function normalizeLoadedState(loaded) {
    const base = createDefaultState();

    if (!loaded || typeof loaded !== 'object') {
        base.categories = createCategoriesFromInitialData();
        return base;
    }

    // V1 shape: { categories: [{topics:[{name,completed}]}] }
    if (!loaded.version && Array.isArray(loaded.categories) && loaded.categories.length) {
        base.categories = loaded.categories.map(category => ({
            id: category.id,
            name: category.name,
            icon: category.icon,
            topics: (category.topics || []).map(t => ({
                name: t.name ?? String(t),
                level: t.level ?? 1,
                completed: !!t.completed,
                completedAt: t.completedAt ?? (t.completed ? Date.now() : null),
                reviews: Array.isArray(t.reviews) ? t.reviews : []
            }))
        }));
        return base;
    }

    const merged = {
        ...base,
        ...loaded,
        meta: {
            ...base.meta,
            ...(loaded.meta || {}),
            timer: {
                ...base.meta.timer,
                ...((loaded.meta && loaded.meta.timer) ? loaded.meta.timer : {}),
                running: false,
                lastTickMs: null
            }
        }
    };

    if (!Array.isArray(merged.categories) || merged.categories.length === 0) {
        merged.categories = createCategoriesFromInitialData();
    } else {
        merged.categories = merged.categories.map(category => ({
            ...category,
            topics: (category.topics || []).map(t => ({
                name: t.name,
                level: t.level ?? 1,
                completed: !!t.completed,
                completedAt: t.completedAt ?? (t.completed ? Date.now() : null),
                reviews: Array.isArray(t.reviews) ? t.reviews : []
            }))
        }));
    }

    if (!DIFFICULTY_CONFIG[merged.meta.difficulty]) {
        merged.meta.difficulty = 'normal';
    }

    return merged;
}

function safeJsonParse(text) {
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

function loadData() {
    const savedV2 = localStorage.getItem(STORAGE_KEY_V2);
    if (savedV2) {
        appState = normalizeLoadedState(safeJsonParse(savedV2));
        return;
    }

    const savedV1 = localStorage.getItem(STORAGE_KEY_V1);
    if (savedV1) {
        appState = normalizeLoadedState(safeJsonParse(savedV1));
        saveData(true);
        return;
    }

    appState = createDefaultState();
    appState.categories = createCategoriesFromInitialData();
}

function saveData(force = false) {
    const now = Date.now();
    if (!force && now - lastSaveMs < 1500) return;
    lastSaveMs = now;
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(appState));
}

function resetData() {
    if (!confirm('¿Reiniciar todo? (temas, XP, logros, stats y rachas)')) return;
    appState = createDefaultState();
    appState.categories = createCategoriesFromInitialData();
    saveData(true);
    renderAll();
    showNotification('Progreso reiniciado.');
}

function getDifficulty() {
    return DIFFICULTY_CONFIG[appState.meta.difficulty] ?? DIFFICULTY_CONFIG.normal;
}

function todayKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function formatHMS(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds));
    const hh = String(Math.floor(s / 3600)).padStart(2, '0');
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
}

function formatMS(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds));
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
}

function getMaxTier() {
    const hasCapSkill = appState.meta.unlockedSkills.includes('skill_multiplier_cap');
    return hasCapSkill ? 6 : 5;
}

function getStreakTier(streakSeconds) {
    const cfg = getDifficulty();
    const minutes = streakSeconds / 60;
    let tier = 0;
    for (let i = 0; i < cfg.tierMinutes.length; i++) {
        if (minutes >= cfg.tierMinutes[i]) tier = i;
    }
    return Math.min(tier, getMaxTier());
}

function round2(n) {
    return Math.round(n * 100) / 100;
}

function getMultiplier() {
    const cfg = getDifficulty();
    const tier = getStreakTier(appState.meta.timer.streakSeconds);
    const base = 1 + tier * cfg.tierMultiplierStep;
    return round2(base);
}

function getXpBoostMultiplier() {
    return appState.meta.unlockedSkills.includes('skill_xp_boost_1') ? 1.1 : 1;
}

function getReviewBonusMultiplier() {
    return appState.meta.unlockedSkills.includes('skill_review_bonus') ? 1.25 : 1;
}

function xpToNextLevel(level) {
    return Math.floor(120 + (level - 1) * 55 + (level - 1) * (level - 1) * 4);
}

function addXp(amount, { notify = false, label = '' } = {}) {
    if (!Number.isFinite(amount) || amount <= 0) return;

    const boosted = Math.floor(amount * getXpBoostMultiplier());
    appState.meta.xp += boosted;

    let leveledUp = false;
    while (appState.meta.xp >= xpToNextLevel(appState.meta.level)) {
        appState.meta.xp -= xpToNextLevel(appState.meta.level);
        appState.meta.level += 1;
        appState.meta.skillPoints += 1;
        leveledUp = true;
    }

    if (notify) {
        showNotification(label ? `+${boosted} XP · ${label}` : `+${boosted} XP`);
        particleBurst(document.body, '#48bb78');
        playPing(leveledUp ? 720 : 540);
    } else if (leveledUp) {
        showNotification(`¡Nivel ${appState.meta.level}! (+1 SP)`);
        particleBurst(document.body, '#667eea');
        playPing(720);
    }

    updateXpUi();
    saveData();
}

function unlockAchievement(achievementId) {
    if (appState.meta.achievements[achievementId]) return false;
    appState.meta.achievements[achievementId] = Date.now();
    saveData();

    const a = ACHIEVEMENTS.find(x => x.id === achievementId);
    if (a) {
        showNotification(`Logro: ${a.title}`);
        particleBurst(document.body, '#ed8936');
        playPing(640);
    }

    renderAchievements();
    return true;
}

function checkAchievements() {
    const total = appState.meta.totalFocusSeconds;
    const streak = appState.meta.timer.streakSeconds;

    for (const a of ACHIEVEMENTS) {
        if (appState.meta.achievements[a.id]) continue;
        if (a.kind === 'total' && total >= a.seconds) unlockAchievement(a.id);
        if (a.kind === 'streak' && streak >= a.seconds) unlockAchievement(a.id);
    }
}

function ensureReviews(topic) {
    if (Array.isArray(topic.reviews) && topic.reviews.length) return;
    if (!topic.completedAt) return;

    const base = topic.completedAt;
    topic.reviews = REVIEW_SCHEDULE_DAYS.map(days => ({
        dueAt: base + days * 24 * 60 * 60 * 1000,
        doneAt: null
    }));
}

function getDueReview(topic) {
    if (!topic.completed) return null;
    ensureReviews(topic);
    const now = Date.now();
    return topic.reviews.find(r => !r.doneAt && r.dueAt <= now) ?? null;
}

function completeDueReview(categoryId, topicIndex) {
    const category = appState.categories.find(c => c.id === categoryId);
    if (!category) return;
    const topic = category.topics[topicIndex];
    if (!topic) return;

    const due = getDueReview(topic);
    if (!due) return;
    due.doneAt = Date.now();

    const cfg = getDifficulty();
    const mult = getMultiplier();
    const base = Math.floor(cfg.xpReviewComplete * mult * getReviewBonusMultiplier());
    addXp(base, { notify: true, label: 'Repaso' });

    saveData();
    renderAllNonTimer();
}

function toggleTopicCompleted(categoryId, topicIndex) {
    const category = appState.categories.find(c => c.id === categoryId);
    if (!category) return;
    const topic = category.topics[topicIndex];
    if (!topic) return;

    const now = Date.now();
    const wasCompleted = !!topic.completed;
    topic.completed = !topic.completed;

    if (topic.completed) {
        topic.completedAt = now;
        topic.reviews = [];
        ensureReviews(topic);

        const cfg = getDifficulty();
        const mult = getMultiplier();
        addXp(Math.floor(cfg.xpTopicComplete * mult), { notify: true, label: 'Tema' });
    } else {
        topic.completedAt = null;
        topic.reviews = [];
        saveData();
    }

    if (wasCompleted !== topic.completed) {
        renderAllNonTimer();
    }
}

function escapeHtml(text) {
    return String(text)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function renderCategories() {
    categoriesContainer.innerHTML = '';

    for (const category of appState.categories) {
        const card = document.createElement('div');
        card.className = 'category-card';

        const totalTopics = category.topics.length;
        const completedTopics = category.topics.filter(t => t.completed).length;
        const progress = totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0;

        card.innerHTML = `
            <div class="category-header">
                <div class="category-title">
                    <div class="category-icon">${category.icon}</div>
                    ${escapeHtml(category.name)}
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
                    const due = getDueReview(topic);
                    const badges = due ? `<div class="topic-badges"><button class="topic-badge" type="button" data-action="review" data-category-id="${category.id}" data-topic-index="${topicIndex}">Repasar</button></div>` : '';
                    const id = `topic-${category.id}-${topicIndex}`;
                    return `
                        <li class="topic-item ${topic.completed ? 'completed' : ''}"
                            id="${id}"
                            data-category-id="${category.id}"
                            data-topic-index="${topicIndex}"
                            style="padding-left: ${(topic.level - 1) * 20}px">
                            <div class="topic-checkbox"></div>
                            <div class="topic-name">${escapeHtml(topic.name)}</div>
                            ${badges}
                        </li>
                    `;
                }).join('')}
            </ul>
        `;

        categoriesContainer.appendChild(card);
    }
}

function updateGlobalProgress() {
    let totalTopics = 0;
    let completedTopics = 0;

    for (const category of appState.categories) {
        totalTopics += category.topics.length;
        completedTopics += category.topics.filter(t => t.completed).length;
    }

    const globalProgressPct = totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0;
    globalPercentage.textContent = `${globalProgressPct}%`;
    globalProgress.style.width = `${globalProgressPct}%`;
}

function flashElement(el) {
    el.style.transition = 'box-shadow 220ms ease';
    el.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.25)';
    setTimeout(() => { el.style.boxShadow = ''; }, 700);
}

function renderMap() {
    mapContainer.innerHTML = '';

    for (const category of appState.categories) {
        for (let i = 0; i < category.topics.length; i++) {
            const topic = category.topics[i];
            const due = getDueReview(topic);
            const status = topic.completed ? (due ? 'due' : 'done') : 'pending';

            const marker = document.createElement('button');
            marker.type = 'button';
            marker.className = `map-marker ${status}`;
            marker.innerHTML = `
                <div class="marker-title">${escapeHtml(topic.name)}</div>
                <div class="marker-sub">${escapeHtml(category.name)}</div>
            `;

            marker.addEventListener('click', () => {
                setActiveView('listView');
                const el = document.getElementById(`topic-${category.id}-${i}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    flashElement(el);
                }
            });

            mapContainer.appendChild(marker);
        }
    }
}

function renderSkillTree() {
    skillTreeContainer.innerHTML = '';

    for (const skill of SKILLS) {
        const unlocked = appState.meta.unlockedSkills.includes(skill.id);
        const canUnlock = !unlocked && appState.meta.skillPoints >= skill.cost && appState.meta.level >= skill.reqLevel;

        const card = document.createElement('div');
        card.className = `card ${unlocked ? '' : 'locked'}`;
        card.innerHTML = `
            <div class="card-title">${escapeHtml(skill.title)}</div>
            <div class="card-desc">${escapeHtml(skill.desc)}</div>
            <div class="card-meta">
                <span>Req: Lv ${skill.reqLevel} · Cost: ${skill.cost} SP</span>
                <button class="btn btn-secondary btn-small" type="button" ${canUnlock ? '' : 'disabled'} data-skill-id="${skill.id}">
                    ${unlocked ? 'Desbloqueado' : 'Desbloquear'}
                </button>
            </div>
        `;

        const btn = card.querySelector('button[data-skill-id]');
        btn.addEventListener('click', () => unlockSkill(skill.id));

        skillTreeContainer.appendChild(card);
    }
}

function unlockSkill(skillId) {
    const skill = SKILLS.find(s => s.id === skillId);
    if (!skill) return;
    if (appState.meta.unlockedSkills.includes(skillId)) return;
    if (appState.meta.level < skill.reqLevel) return;
    if (appState.meta.skillPoints < skill.cost) return;

    appState.meta.skillPoints -= skill.cost;
    appState.meta.unlockedSkills.push(skillId);
    saveData(true);
    renderSkillTree();
    updateXpUi();
    showNotification(`Habilidad desbloqueada: ${skill.title}`);
    particleBurst(document.body, '#667eea');
    playPing(690);
}

function countDueReviews() {
    let count = 0;
    for (const category of appState.categories) {
        for (const topic of category.topics) {
            if (getDueReview(topic)) count += 1;
        }
    }
    return count;
}

function prettyTime(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

function renderStats() {
    const today = todayKey();
    const focusTodaySeconds = appState.meta.dailyFocusSeconds[today] ?? 0;
    const dueReviews = countDueReviews();

    const items = [
        { title: 'Tiempo total', value: prettyTime(appState.meta.totalFocusSeconds) },
        { title: 'Hoy', value: prettyTime(focusTodaySeconds) },
        { title: 'Sesiones', value: String(appState.meta.sessionsCount) },
        { title: 'Mejor sesión', value: prettyTime(appState.meta.longestSessionSeconds) },
        { title: 'Repasos pendientes', value: String(dueReviews) }
    ];

    statsContainer.innerHTML = items.map(x => `
        <div class="card">
            <div class="card-title">${escapeHtml(x.title)}</div>
            <div class="card-desc">${escapeHtml(x.value)}</div>
        </div>
    `).join('');

    focusTodayText.textContent = `Hoy: ${Math.floor(focusTodaySeconds / 60)}m`;
}

function renderAchievements() {
    achievementsContainer.innerHTML = '';

    for (const a of ACHIEVEMENTS) {
        const unlockedAt = appState.meta.achievements[a.id];
        const unlocked = !!unlockedAt;
        const badge = unlocked ? '<span class="badge unlocked">Desbloqueado</span>' : '<span class="badge">Bloqueado</span>';

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-title">${escapeHtml(a.title)} ${badge}</div>
            <div class="card-desc">${escapeHtml(a.desc)}</div>
        `;

        achievementsContainer.appendChild(card);
    }
}

function updateXpUi() {
    levelText.textContent = String(appState.meta.level);
    xpText.textContent = String(appState.meta.xp);
    skillPointsText.textContent = String(appState.meta.skillPoints);

    const toNext = xpToNextLevel(appState.meta.level);
    const pct = toNext > 0 ? Math.min(100, Math.round((appState.meta.xp / toNext) * 100)) : 0;
    xpFill.style.width = `${pct}%`;
}

function setAvatarTier(tier) {
    const capped = Math.min(5, tier);
    streakAvatar.className = `streak-avatar streak-tier-${capped}`;

    const labels = ['En frío', 'Tibio', 'Caliente', 'Ardiendo', 'En llamas', 'Infernal'];
    avatarCaption.textContent = labels[capped] ?? 'En foco';
}

function updateTimerUi() {
    const t = appState.meta.timer;
    timerDisplay.textContent = formatHMS(t.sessionSeconds);
    streakDisplay.textContent = formatMS(t.streakSeconds);

    const mult = getMultiplier();
    multiplierDisplay.textContent = `x${mult.toFixed(2)}`;

    const tier = getStreakTier(t.streakSeconds);
    setAvatarTier(tier);

    timerToggleBtn.textContent = t.running ? 'Pausar' : (t.sessionSeconds > 0 ? 'Reanudar' : 'Iniciar');
    timerStopBtn.disabled = !t.running && t.sessionSeconds === 0;

    difficultySelect.value = appState.meta.difficulty;
    updateXpUi();
}

function startOrPauseTimer() {
    const t = appState.meta.timer;
    if (t.running) {
        pauseTimer();
    } else {
        startTimer();
    }
}

function startTimer() {
    const t = appState.meta.timer;
    const cfg = getDifficulty();
    const now = Date.now();

    if (t.pausedAtMs) {
        const pausedSeconds = (now - t.pausedAtMs) / 1000;
        if (pausedSeconds > cfg.pauseGraceSeconds) {
            t.streakSeconds = 0;
            t.xpCarrySeconds = 0;
        }
    }

    t.running = true;
    t.lastTickMs = now;
    t.pausedAtMs = null;

    appState.meta.sessionsCount += 1;
    saveData();

    if (!timerIntervalId) {
        timerIntervalId = setInterval(onTimerTick, 1000);
    }

    updateTimerUi();
}

function pauseTimer() {
    const t = appState.meta.timer;
    if (!t.running) return;
    t.running = false;
    t.pausedAtMs = Date.now();
    t.lastTickMs = null;
    updateTimerUi();
    saveData(true);
}

function stopTimer() {
    const t = appState.meta.timer;
    t.running = false;
    t.lastTickMs = null;
    t.pausedAtMs = null;

    if (t.sessionSeconds > appState.meta.longestSessionSeconds) {
        appState.meta.longestSessionSeconds = t.sessionSeconds;
    }

    t.sessionSeconds = 0;
    t.streakSeconds = 0;
    t.xpCarrySeconds = 0;

    updateTimerUi();
    saveData(true);
}

function onTimerTick() {
    const t = appState.meta.timer;
    if (!t.running) return;

    const now = Date.now();
    if (!t.lastTickMs) t.lastTickMs = now;

    const deltaSeconds = Math.min(5, Math.max(0, (now - t.lastTickMs) / 1000));
    t.lastTickMs = now;

    t.sessionSeconds += deltaSeconds;
    t.streakSeconds += deltaSeconds;
    t.xpCarrySeconds += deltaSeconds;

    appState.meta.totalFocusSeconds += deltaSeconds;
    const today = todayKey();
    appState.meta.dailyFocusSeconds[today] = (appState.meta.dailyFocusSeconds[today] ?? 0) + deltaSeconds;

    const cfg = getDifficulty();
    const mult = getMultiplier();

    if (t.xpCarrySeconds >= 60) {
        const minutes = Math.floor(t.xpCarrySeconds / 60);
        t.xpCarrySeconds -= minutes * 60;
        const gained = Math.floor(minutes * cfg.xpPerMinute * mult);
        addXp(gained, { notify: false });
    }

    checkAchievements();
    updateTimerUi();
    renderStats();
    saveData();
}

function setDifficulty(value) {
    if (!DIFFICULTY_CONFIG[value]) return;
    appState.meta.difficulty = value;
    saveData(true);
    updateTimerUi();
    renderSkillTree();
    showNotification(`Modo: ${DIFFICULTY_CONFIG[value].label}`);
}

function setActiveView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('view-active'));
    const view = document.getElementById(viewId);
    if (view) view.classList.add('view-active');

    document.querySelectorAll('.tab-btn').forEach(btn => {
        const active = btn.dataset.view === viewId;
        btn.classList.toggle('active', active);
    });
}

function renderAllNonTimer() {
    renderCategories();
    updateGlobalProgress();
    renderMap();
    renderSkillTree();
    renderStats();
    renderAchievements();
}

function renderAll() {
    renderAllNonTimer();
    updateTimerUi();
}

function setupEventListeners() {
    saveBtn.addEventListener('click', () => {
        saveData(true);
        showNotification('Progreso guardado.');
    });

    resetBtn.addEventListener('click', resetData);

    categoriesContainer.addEventListener('click', (e) => {
        const reviewBtn = e.target.closest('button[data-action="review"]');
        if (reviewBtn) {
            e.stopPropagation();
            const categoryId = parseInt(reviewBtn.dataset.categoryId, 10);
            const topicIndex = parseInt(reviewBtn.dataset.topicIndex, 10);
            completeDueReview(categoryId, topicIndex);
            return;
        }

        const topicItem = e.target.closest('.topic-item');
        if (!topicItem) return;
        const categoryId = parseInt(topicItem.dataset.categoryId, 10);
        const topicIndex = parseInt(topicItem.dataset.topicIndex, 10);
        toggleTopicCompleted(categoryId, topicIndex);
    });

    timerToggleBtn.addEventListener('click', startOrPauseTimer);
    timerStopBtn.addEventListener('click', stopTimer);

    difficultySelect.addEventListener('change', () => setDifficulty(difficultySelect.value));

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => setActiveView(btn.dataset.view));
    });

    window.addEventListener('beforeunload', () => saveData(true));
}

function ensureNotificationStyles() {
    if (document.getElementById('notificationStyles')) return;
    const style = document.createElement('style');
    style.id = 'notificationStyles';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
        @keyframes particlePop {
            0% { transform: translate(0, 0) scale(1); opacity: 1; }
            100% { transform: translate(var(--dx), var(--dy)) scale(0.6); opacity: 0; }
        }
        .particle {
            position: fixed;
            width: 10px;
            height: 10px;
            border-radius: 999px;
            pointer-events: none;
            z-index: 999;
            animation: particlePop 650ms ease-out forwards;
        }
    `;
    document.head.appendChild(style);
}

function showNotification(message) {
    ensureNotificationStyles();

    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        padding: 14px 18px;
        border-radius: 10px;
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        animation: slideIn 0.25s ease-out;
        font-weight: 800;
        max-width: min(420px, calc(100vw - 40px));
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.25s ease-out';
        setTimeout(() => notification.remove(), 260);
    }, 2400);
}

function particleBurst(target, color) {
    ensureNotificationStyles();
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

function initApp() {
    loadData();
    difficultySelect.value = appState.meta.difficulty;
    renderAll();
    setupEventListeners();
}

document.addEventListener('DOMContentLoaded', initApp);
