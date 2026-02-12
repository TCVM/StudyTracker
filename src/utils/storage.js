import { STORAGE_KEY_V2, STORAGE_KEY_V1, APP_VERSION } from './constants.js';
import { initialArchitectureData } from './initialData.js';

function createDefaultState() {
    return {
        version: APP_VERSION,
        subjects: [],
        globalMeta: {
            xp: 0,
            level: 1,
            skillPoints: 0,
            unlockedSkills: [],
            achievements: {},
            totalFocusSeconds: 0,
            sessionsCount: 0,
            longestSessionSeconds: 0,
            dailyFocusSeconds: {},
            sessions: []
        }
    };
}

function createSubject(id, name, icon, color) {
    return {
        id: id,
        name: name,
        icon: icon,
        color: color,
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
            sessions: [],
            timer: {
                running: false,
                sessionSeconds: 0,
                streakSeconds: 0,
                xpCarrySeconds: 0,
                lastTickMs: null,
                pausedAtMs: null,
                currentSessionStartMs: null
            }
        }
    };
}

function createSubjectFromInitialData() {
    const subject = createSubject(1, 'Arquitectura y Organización de Computadoras', '💻', '#667eea');
    subject.categories = initialArchitectureData.categories.map(category => ({
        ...category,
        topics: category.topics.map(topic => ({
            name: topic.name,
            level: topic.level ?? 1,
            completed: false,
            completedAt: null,
            reviews: []
        }))
    }));
    return subject;
}

function normalizeLoadedState(loaded) {
    const base = createDefaultState();

    if (!loaded || typeof loaded !== 'object') {
        base.subjects.push(createSubjectFromInitialData());
        return base;
    }

    if (!loaded.version && Array.isArray(loaded.categories) && loaded.categories.length) {
        const subject = createSubject(1, 'Arquitectura y Organización de Computadoras', '💻', '#667eea');
        subject.categories = loaded.categories.map(category => ({
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
        base.subjects.push(subject);
        return base;
    }

    const merged = {
        ...base,
        ...loaded,
        globalMeta: {
            ...base.globalMeta,
            ...(loaded.globalMeta || {})
        }
    };

    if (!Array.isArray(merged.subjects) || merged.subjects.length === 0) {
        merged.subjects.push(createSubjectFromInitialData());
    } else {
        merged.subjects = merged.subjects.map(subject => {
            const normalized = {
                ...createSubject(subject.id || Date.now(), subject.name || 'Materia', subject.icon || '📚', subject.color || '#667eea'),
                ...subject,
                categories: (subject.categories || []).map(category => ({
                    ...category,
                    topics: (category.topics || []).map(t => ({
                        name: t.name,
                        level: t.level ?? 1,
                        completed: !!t.completed,
                        completedAt: t.completedAt ?? (t.completed ? Date.now() : null),
                        reviews: Array.isArray(t.reviews) ? t.reviews : []
                    }))
                })),
                meta: {
                    ...createSubject(subject.id, subject.name, subject.icon, subject.color).meta,
                    ...(subject.meta || {}),
                    timer: {
                        ...createSubject(subject.id, subject.name, subject.icon, subject.color).meta.timer,
                        ...((subject.meta && subject.meta.timer) ? subject.meta.timer : {}),
                        running: false,
                        lastTickMs: null
                    }
                }
            };
            
            // No need to update here, it will be done in loadData()
            return normalized;
        });
    }

    return merged;
}

function updateArchitectureCategories(subject) {
    // Si el sujeto es la materia de Arquitectura, verificar si necesita actualizar categorías
    if (subject.name !== 'Arquitectura y Organización de Computadoras') {
        return subject;
    }
    
    // Obtener los IDs de categorías existentes
    const existingCategoryIds = new Set(subject.categories.map(cat => cat.id));
    
    // Agregar categorías faltantes del initialData
    for (const newCategory of initialArchitectureData.categories) {
        if (!existingCategoryIds.has(newCategory.id)) {
            // Categoría nueva - agregarla sin progreso
            subject.categories.push({
                ...newCategory,
                topics: newCategory.topics.map(topic => ({
                    name: topic.name,
                    level: topic.level ?? 1,
                    completed: false,
                    completedAt: null,
                    reviews: []
                }))
            });
        } else {
            // Categoría existente - verificar si faltan temas y agregarlos
            const existingCat = subject.categories.find(cat => cat.id === newCategory.id);
            const existingTopicNames = new Set(existingCat.topics.map(t => t.name));
            
            for (const newTopic of newCategory.topics) {
                if (!existingTopicNames.has(newTopic.name)) {
                    // Tema nuevo - agregarlo sin progreso
                    existingCat.topics.push({
                        name: newTopic.name,
                        level: newTopic.level ?? 1,
                        completed: false,
                        completedAt: null,
                        reviews: []
                    });
                }
            }
        }
    }
    
    return subject;
}

function safeJsonParse(text) {
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

export function loadData() {
    const savedV2 = localStorage.getItem(STORAGE_KEY_V2);
    if (savedV2) {
        const loadedState = normalizeLoadedState(safeJsonParse(savedV2));
        // Ensure architecture categories are updated
        loadedState.subjects = loadedState.subjects.map(updateArchitectureCategories);
        return loadedState;
    }

    const savedV1 = localStorage.getItem(STORAGE_KEY_V1);
    if (savedV1) {
        const data = normalizeLoadedState(safeJsonParse(savedV1));
        // Ensure architecture categories are updated
        data.subjects = data.subjects.map(updateArchitectureCategories);
        saveData(data, true);
        return data;
    }

    const defaultState = createDefaultState();
    const newSubject = createSubjectFromInitialData();
    defaultState.subjects.push(updateArchitectureCategories(newSubject));
    return defaultState;
}

let lastSaveMs = 0;

export function saveData(appState, force = false) {
    const now = Date.now();
    if (!force && now - lastSaveMs < 1500) return;
    lastSaveMs = now;
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(appState));
}

export function resetData() {
    if (!confirm('¿Reiniciar todo? (temas, XP, logros, stats y rachas)')) return null;
    
    const defaultState = createDefaultState();
    defaultState.subjects.push(createSubjectFromInitialData());
    saveData(defaultState, true);
    
    return defaultState;
}

export function createSubjectFromInitialData() {
    const subject = createSubject(1, 'Arquitectura y Organización de Computadoras', '💻', '#667eea');
    subject.categories = initialArchitectureData.categories.map(category => ({
        ...category,
        topics: category.topics.map(topic => ({
            name: topic.name,
            level: topic.level ?? 1,
            completed: false,
            completedAt: null,
            reviews: []
        }))
    }));
    return subject;
}

export function createNewSubject(name, icon, color) {
    return createSubject(Date.now(), name, icon, color);
}
