import { loadData, saveData, resetData, createNewSubject, createSubjectFromInitialData } from './utils/storage.js';
import { renderAll, renderAllNonTimer, setActiveView as renderSetActiveView, setCurrentSubject, selectSubject as uiSelectSubject, unlockSkill as uiUnlockSkill } from './views/ui.js';
import { startOrPauseTimer, stopTimer, setCurrentSubject as timerSetCurrentSubject, setAppState as timerSetAppState } from './controllers/timer.js';
import { loadTheme, applyTheme as renderApplyTheme, showNotification } from './utils/helpers.js';
import { addSubject, deleteSubject } from './modules/subjects.js';
import { toggleTopicCompleted } from './modules/topics.js';
import { checkAchievements } from './modules/achievements.js';
import { showAddSubjectModal, hideAddSubjectModal, selectSubjectUI, goHome, setActiveView } from './modules/ui-manager.js';
import { getDifficultyConfig } from './modules/difficulty.js';
import { applyTheme, toggleTheme, loadThemePreference } from './modules/theme.js';

let appState = null;
let currentSubject = null;
let isDarkMode = false;

function initApp() {
    appState = loadData();
    isDarkMode = loadThemePreference();
    applyTheme(isDarkMode);
    timerSetAppState(appState);
    setupEventListeners();
    renderAll(appState);
}

function setupEventListeners() {
    // Save and reset buttons
    const saveBtn = document.getElementById('saveBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    saveBtn.addEventListener('click', () => {
        saveData(appState, true);
        showNotification('Progreso guardado.');
    });
    
    resetBtn.addEventListener('click', () => {
        const newState = resetData();
        if (newState) {
            appState = newState;
            currentSubject = null;
            renderAll(appState);
            showNotification('Progreso reiniciado.');
        }
    });

    // Subject management buttons
    const addSubjectBtn = document.getElementById('addSubjectBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const confirmAddSubjectBtn = document.getElementById('confirmAddSubjectBtn');
    const deleteSubjectBtn = document.getElementById('deleteSubjectBtn');
    const quickAddSubject = document.getElementById('quickAddSubject');
    
    addSubjectBtn.addEventListener('click', showAddSubjectModal);
    closeModalBtn.addEventListener('click', hideAddSubjectModal);
    cancelModalBtn.addEventListener('click', hideAddSubjectModal);
    confirmAddSubjectBtn.addEventListener('click', addSubjectHandler);
    deleteSubjectBtn.addEventListener('click', deleteCurrentSubjectHandler);
    quickAddSubject.addEventListener('click', showAddSubjectModal);

    // Quick actions
    const quickStartSession = document.getElementById('quickStartSession');
    const quickViewStats = document.getElementById('quickViewStats');
    
    quickStartSession.addEventListener('click', () => {
        if (currentSubject) {
            startOrPauseTimer();
        } else {
            showNotification('Selecciona una materia primero');
        }
    });
    
    quickViewStats.addEventListener('click', () => {
        if (currentSubject) {
            setActiveView('statsView');
        } else {
            showNotification('Selecciona una materia primero');
        }
    });

    // Timer controls
    const timerToggleBtn = document.getElementById('timerToggleBtn');
    const timerStopBtn = document.getElementById('timerStopBtn');
    const difficultySelect = document.getElementById('difficultySelect');
    
    timerToggleBtn.addEventListener('click', startOrPauseTimer);
    timerStopBtn.addEventListener('click', stopTimer);
    difficultySelect.addEventListener('change', () => setDifficulty(difficultySelect.value));

    // View tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => setActiveView(btn.dataset.view));
    });

    // Theme toggle
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    themeToggleBtn.addEventListener('click', toggleThemeHandler);

    // Window before unload
    window.addEventListener('beforeunload', () => saveData(appState, true));

    // Categories container (topic completion)
    const categoriesContainer = document.getElementById('categoriesContainer');
    categoriesContainer.addEventListener('click', (e) => {
        const topicItem = e.target.closest('.topic-item');
        if (!topicItem) return;
        const categoryId = parseInt(topicItem.dataset.categoryId, 10);
        const topicIndex = parseInt(topicItem.dataset.topicIndex, 10);
        toggleTopicCompletedHandler(categoryId, topicIndex);
    });

    // Nav items (subject selection)
    const subjectList = document.getElementById('subjectList');
    subjectList.addEventListener('click', (e) => {
        const navItem = e.target.closest('.nav-item');
        if (navItem && navItem.dataset.subjectId) {
            const subjectId = parseInt(navItem.dataset.subjectId, 10);
            selectSubject(subjectId);
        }
    });

    // Home button
    const homeBtn = document.querySelector('.nav-item[data-view="homeView"]');
    if (homeBtn) {
        homeBtn.addEventListener('click', () => {
            currentSubject = null;
            setCurrentSubject(null);
            timerSetCurrentSubject(null);
            goHome();
            renderAll(appState);
        });
    }
}

function selectSubject(subjectId) {
    currentSubject = appState.subjects.find(sub => sub.id === subjectId);
    
    if (currentSubject) {
        setCurrentSubject(currentSubject);
        timerSetCurrentSubject(currentSubject);
        selectSubjectUI(appState, currentSubject);
        renderAll(appState);
    }
}

function addSubjectHandler() {
    const subjectNameInput = document.getElementById('subjectName');
    const subjectIconInput = document.getElementById('subjectIcon');
    const subjectColorInput = document.getElementById('subjectColor');
    
    const name = subjectNameInput.value.trim();
    const icon = subjectIconInput.value.trim();
    const color = subjectColorInput.value;
    
    if (!name) {
        showNotification('El nombre de la materia es obligatorio');
        return;
    }
    
    addSubject(appState, name, icon || '📚', color);
    hideAddSubjectModal();
    renderAll(appState);
}

function deleteCurrentSubjectHandler() {
    if (!currentSubject) return;
    
    if (!confirm(`¿Eliminar la materia "${currentSubject.name}"? Esta acción no se puede deshacer.`)) {
        return;
    }
    
    if (deleteSubject(appState, currentSubject.id)) {
        currentSubject = null;
        setCurrentSubject(null);
        timerSetCurrentSubject(null);
        goHome();
        renderAll(appState);
    }
}

function toggleTopicCompletedHandler(categoryId, topicIndex) {
    toggleTopicCompleted(appState, currentSubject, categoryId, topicIndex);
    renderAllNonTimer(appState);
}

function setDifficulty(value) {
    if (!currentSubject) return;
    
    const config = getDifficultyConfig(value);
    if (!config) return;
    
    currentSubject.meta.difficulty = value;
    saveData(appState, true);
    renderAll(appState);
    
    showNotification(`Modo de dificultad: ${config.label}`);
}

function toggleThemeHandler() {
    isDarkMode = toggleTheme();
}

document.addEventListener('DOMContentLoaded', initApp);