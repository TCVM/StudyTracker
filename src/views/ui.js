import { escapeHtml, formatHMS, prettyTime, formatDateTime } from '../utils/helpers.js';
import { SKILLS, MAX_SESSIONS_DISPLAY } from '../utils/constants.js';

let currentSubject = null;

export function setCurrentSubject(subject) {
    currentSubject = subject;
}

export function renderSubjectList(appState) {
    const subjectList = document.getElementById('subjectList');
    subjectList.innerHTML = '';
    
    appState.subjects.forEach(subject => {
        const progress = calculateSubjectProgress(subject);
        
        const btn = document.createElement('button');
        btn.className = `nav-item ${currentSubject?.id === subject.id ? 'active' : ''}`;
        btn.dataset.subjectId = subject.id;
        btn.innerHTML = `
            <span class="nav-icon">${subject.icon}</span>
            <span class="nav-text">${escapeHtml(subject.name)}</span>
            <span class="nav-progress">${progress}%</span>
        `;
        
        btn.addEventListener('click', () => selectSubject(subject.id));
        subjectList.appendChild(btn);
    });
}

export function calculateSubjectProgress(subject) {
    let totalTopics = 0;
    let completedTopics = 0;
    
    for (const category of subject.categories) {
        totalTopics += category.topics.length;
        completedTopics += category.topics.filter(t => t.completed).length;
    }
    
    return totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
}

export function selectSubject(subjectId) {
    // This will be implemented in the main controller
}

export function renderHomePage(appState) {
    const totalSubjects = appState.subjects.length;
    const totalAchievements = Object.keys(appState.globalMeta.achievements).length;
    const totalTime = prettyTime(appState.globalMeta.totalFocusSeconds);
    const globalProgress = calculateGlobalProgress(appState);
    
    const totalSubjectsEl = document.getElementById('totalSubjects');
    const totalTimeEl = document.getElementById('totalTime');
    const totalAchievementsEl = document.getElementById('totalAchievements');
    const globalProgressEl = document.getElementById('globalProgress');
    
    totalSubjectsEl.textContent = totalSubjects;
    totalAchievementsEl.textContent = totalAchievements;
    totalTimeEl.textContent = totalTime;
    globalProgressEl.textContent = `${globalProgress}%`;
    
    renderRecentSubjects(appState);
}

export function calculateGlobalProgress(appState) {
    let totalTopics = 0;
    let completedTopics = 0;
    
    appState.subjects.forEach(subject => {
        subject.categories.forEach(category => {
            totalTopics += category.topics.length;
            completedTopics += category.topics.filter(t => t.completed).length;
        });
    });
    
    return totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
}

export function renderRecentSubjects(appState) {
    const recentSubjectsGrid = document.getElementById('recentSubjectsGrid');
    recentSubjectsGrid.innerHTML = '';
    
    const recentSubjects = [...appState.subjects]
        .sort((a, b) => {
            const aTime = getSubjectLastActivity(a);
            const bTime = getSubjectLastActivity(b);
            return bTime - aTime;
        })
        .slice(0, 6);
    
    recentSubjects.forEach(subject => {
        const progress = calculateSubjectProgress(subject);
        
        const card = document.createElement('button');
        card.className = 'subject-card';
        card.dataset.subjectId = subject.id;
        card.innerHTML = `
            <div class="subject-card-icon">${subject.icon}</div>
            <div class="subject-card-name">${escapeHtml(subject.name)}</div>
            <div class="subject-card-progress">${progress}% completado</div>
        `;
        
        card.addEventListener('click', () => selectSubject(subject.id));
        recentSubjectsGrid.appendChild(card);
    });
}

export function getSubjectLastActivity(subject) {
    const sessionDates = subject.meta.sessions.map(s => s.startTime);
    return sessionDates.length > 0 ? Math.max(...sessionDates) : 0;
}

export function renderCategories() {
    if (!currentSubject) {
        const categoriesContainer = document.getElementById('categoriesContainer');
        categoriesContainer.innerHTML = '';
        return;
    }

    const categoriesContainer = document.getElementById('categoriesContainer');
    categoriesContainer.innerHTML = '';

    for (const category of currentSubject.categories) {
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
                    const id = `topic-${category.id}-${topicIndex}`;
                    return `
                        <li class="topic-item ${topic.completed ? 'completed' : ''}"
                            id="${id}"
                            data-category-id="${category.id}"
                            data-topic-index="${topicIndex}"
                            style="padding-left: ${(topic.level - 1) * 20}px">
                            <div class="topic-checkbox"></div>
                            <div class="topic-name">${escapeHtml(topic.name)}</div>
                        </li>
                    `;
                }).join('')}
            </ul>
        `;

        categoriesContainer.appendChild(card);
    }
}

export function updateSubjectProgress() {
    if (!currentSubject) {
        const subjectPercentage = document.getElementById('subjectPercentage');
        const subjectProgress = document.getElementById('subjectProgress');
        subjectPercentage.textContent = '0%';
        subjectProgress.style.width = '0%';
        return;
    }

    let totalTopics = 0;
    let completedTopics = 0;

    for (const category of currentSubject.categories) {
        totalTopics += category.topics.length;
        completedTopics += category.topics.filter(t => t.completed).length;
    }

    const subjectProgressPct = totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0;
    const subjectPercentage = document.getElementById('subjectPercentage');
    const subjectProgress = document.getElementById('subjectProgress');
    subjectPercentage.textContent = `${subjectProgressPct}%`;
    subjectProgress.style.width = `${subjectProgressPct}%`;
}

export function renderMap() {
    if (!currentSubject) {
        const mapContainer = document.getElementById('mapContainer');
        mapContainer.innerHTML = '';
        return;
    }

    const mapContainer = document.getElementById('mapContainer');
    mapContainer.innerHTML = '';

    for (const category of currentSubject.categories) {
        for (let i = 0; i < category.topics.length; i++) {
            const topic = category.topics[i];
            const status = topic.completed ? 'done' : 'pending';

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
                }
            });

            mapContainer.appendChild(marker);
        }
    }
}

export function renderSkillTree() {
    if (!currentSubject) {
        const skillTreeContainer = document.getElementById('skillTreeContainer');
        skillTreeContainer.innerHTML = '';
        return;
    }

    const skillTreeContainer = document.getElementById('skillTreeContainer');
    skillTreeContainer.innerHTML = '';

    for (const skill of SKILLS) {
        const unlocked = currentSubject.meta.unlockedSkills.includes(skill.id);
        const canUnlock = !unlocked && currentSubject.meta.skillPoints >= skill.cost && currentSubject.meta.level >= skill.reqLevel;

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

export function unlockSkill(skillId) {
    // This will be implemented in the main controller
}

export function renderStats() {
    if (!currentSubject) {
        const statsContainer = document.getElementById('statsContainer');
        statsContainer.innerHTML = '';
        return;
    }

    const todayKey = new Date().toISOString().split('T')[0];
    const focusTodaySeconds = currentSubject.meta.dailyFocusSeconds[todayKey] ?? 0;

    const items = [
        { title: 'Tiempo total', value: prettyTime(currentSubject.meta.totalFocusSeconds) },
        { title: 'Hoy', value: prettyTime(focusTodaySeconds) },
        { title: 'Sesiones', value: String(currentSubject.meta.sessionsCount) },
        { title: 'Mejor sesión', value: prettyTime(currentSubject.meta.longestSessionSeconds) },
        { title: 'Repasos pendientes', value: '0' }
    ];

    const statsContainer = document.getElementById('statsContainer');
    statsContainer.innerHTML = items.map(x => `
        <div class="card">
            <div class="card-title">${escapeHtml(x.title)}</div>
            <div class="card-desc">${escapeHtml(x.value)}</div>
        </div>
    `).join('');

    const focusTodayText = document.getElementById('focusTodayText');
    focusTodayText.textContent = `Hoy: ${Math.floor(focusTodaySeconds / 60)}m`;
}

export function renderAchievements() {
    if (!currentSubject) {
        const achievementsContainer = document.getElementById('achievementsContainer');
        achievementsContainer.innerHTML = '';
        return;
    }

    const achievementsContainer = document.getElementById('achievementsContainer');
    achievementsContainer.innerHTML = '';

    const ACHIEVEMENTS = [
        { id: 'progress_first_topic', title: 'Primeros pasos', desc: 'Completar el primer tema' },
        { id: 'progress_25_percent', title: 'Cuarto de camino', desc: 'Completar el 25% del contenido' },
        { id: 'progress_50_percent', title: 'Mitad del camino', desc: 'Completar el 50% del contenido' },
        { id: 'progress_75_percent', title: 'Casi ahí', desc: 'Completar el 75% del contenido' },
        { id: 'progress_100_percent', title: 'Maestro', desc: 'Completar el 100% del contenido' }
    ];

    for (const a of ACHIEVEMENTS) {
        const unlockedAt = currentSubject.meta.achievements[a.id];
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

export function updateXpUi() {
    if (!currentSubject) {
        const levelText = document.getElementById('levelText');
        const xpText = document.getElementById('xpText');
        const skillPointsText = document.getElementById('skillPointsText');
        const xpFill = document.getElementById('xpFill');
        
        levelText.textContent = '1';
        xpText.textContent = '0';
        skillPointsText.textContent = '0';
        xpFill.style.width = '0%';
        return;
    }

    const levelText = document.getElementById('levelText');
    const xpText = document.getElementById('xpText');
    const skillPointsText = document.getElementById('skillPointsText');
    const xpFill = document.getElementById('xpFill');

    levelText.textContent = String(currentSubject.meta.level);
    xpText.textContent = String(currentSubject.meta.xp);
    skillPointsText.textContent = String(currentSubject.meta.skillPoints);

    const toNext = 120 + (currentSubject.meta.level - 1) * 55 + (currentSubject.meta.level - 1) * (currentSubject.meta.level - 1) * 4;
    const pct = toNext > 0 ? Math.min(100, Math.round((currentSubject.meta.xp / toNext) * 100)) : 0;
    xpFill.style.width = `${pct}%`;
}

export function setAvatarTier(tier) {
    const capped = Math.min(5, tier);
    const streakAvatar = document.getElementById('streakAvatar');
    streakAvatar.className = `streak-avatar streak-tier-${capped}`;

    const labels = ['En frío', 'Tibio', 'Caliente', 'Ardiendo', 'En llamas', 'Infernal'];
    const avatarCaption = document.getElementById('avatarCaption');
    avatarCaption.textContent = labels[capped] ?? 'En foco';
}

export function updateTimerUi() {
    if (!currentSubject) {
        const timerDisplay = document.getElementById('timerDisplay');
        const streakDisplay = document.getElementById('streakDisplay');
        const multiplierDisplay = document.getElementById('multiplierDisplay');
        const timerToggleBtn = document.getElementById('timerToggleBtn');
        const timerStopBtn = document.getElementById('timerStopBtn');
        const difficultySelect = document.getElementById('difficultySelect');
        
        timerDisplay.textContent = '00:00:00';
        streakDisplay.textContent = '00:00';
        multiplierDisplay.textContent = 'x1.00';
        timerToggleBtn.textContent = 'Iniciar';
        timerStopBtn.disabled = true;
        difficultySelect.value = 'normal';
        updateXpUi();
        return;
    }

    const t = currentSubject.meta.timer;
    const timerDisplay = document.getElementById('timerDisplay');
    const streakDisplay = document.getElementById('streakDisplay');
    const multiplierDisplay = document.getElementById('multiplierDisplay');
    const timerToggleBtn = document.getElementById('timerToggleBtn');
    const timerStopBtn = document.getElementById('timerStopBtn');
    const difficultySelect = document.getElementById('difficultySelect');

    timerDisplay.textContent = formatHMS(t.sessionSeconds);
    streakDisplay.textContent = formatHMS(t.streakSeconds);
    multiplierDisplay.textContent = 'x1.00';

    setAvatarTier(0);

    timerToggleBtn.textContent = t.running ? 'Pausar' : (t.sessionSeconds > 0 ? 'Reanudar' : 'Iniciar');
    timerStopBtn.disabled = !t.running && t.sessionSeconds === 0;

    difficultySelect.value = currentSubject.meta.difficulty;
    updateXpUi();
}

export function setActiveView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('view-active'));
    const view = document.getElementById(viewId);
    if (view) view.classList.add('view-active');

    document.querySelectorAll('.tab-btn').forEach(btn => {
        const active = btn.dataset.view === viewId;
        btn.classList.toggle('active', active);
    });
}

export function renderSessions() {
    if (!currentSubject) {
        const sessionsContainer = document.getElementById('sessionsContainer');
        sessionsContainer.innerHTML = '<div class="sessions-empty">No hay sesiones registradas</div>';
        return;
    }

    const sessionsContainer = document.getElementById('sessionsContainer');
    const sessions = currentSubject.meta.sessions;
    
    if (sessions.length === 0) {
        sessionsContainer.innerHTML = '<div class="sessions-empty">No hay sesiones registradas</div>';
        return;
    }
    
    sessionsContainer.innerHTML = sessions.map((session, index) => `
        <div class="session-item">
            <div class="session-icon">⏱️</div>
            <div class="session-info">
                <div class="session-date">Sesión ${currentSubject.meta.sessionsCount - index}</div>
                <div class="session-time">${formatDateTime(session.startTime)}</div>
            </div>
            <div class="session-stats">
                <div class="session-duration">${formatHMS(session.durationSeconds)}</div>
                <div class="session-xp">+${Math.floor(session.xpEarned)} XP</div>
            </div>
        </div>
    `).join('');
}

export function renderAllNonTimer(appState) {
    renderCategories();
    updateSubjectProgress();
    renderMap();
    renderSkillTree();
    renderStats();
    renderAchievements();
    renderSessions();
    renderSubjectList(appState);
    renderHomePage(appState);
}

export function renderAll(appState) {
    renderAllNonTimer(appState);
    updateTimerUi();
}