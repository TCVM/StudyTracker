import { getAppState, getCurrentSubject, setCurrentSubject } from '../core/state.mjs';
import { applyTheme, showNotification } from '../../utils/helpers.js';
import { completeTopicReview, toggleTopicCompleted } from '../features/topics/actions.mjs';
import { addExamCategory, addExamItem, toggleExamCompleted, attachExamFile, addExamQuestion, deleteExamQuestion, renderExams } from '../features/exams/exams.mjs';
import { registerViewActivationHandler, setActiveView } from './flow.mjs';
import { setMapViewMode } from '../features/subject/view.mjs';
import {
  setAlarmMode,
  setCustomAlarmMinutes,
  setCustomPomodoroMinutes,
  setDifficulty,
  setPomodoroMode,
  startOrPauseTimer,
  stopTimer
} from '../features/timer/timer.mjs';
import { renderGlobalSkillTree } from '../features/notes/notes-skilltree-stats.mjs';
import { exportBackupToFile, importBackupText, resetData, saveData } from '../core/storage.mjs';
import { checkSubjectAchievementsV2 } from '../features/achievements/core.mjs';
import { ensureHomeStatsPanelV2, renderAchievementsV2, renderHomeStatsV2 } from '../features/achievements/ui.mjs';
import { getSubjectLastActivity, renderHomePage, renderHomeUpcomingExams } from './home.mjs';
import { renderAll, selectSubject } from './render.mjs';
import { shareCurrentSubjectToShared, exportCurrentSubjectTemplate } from '../shared/actions.mjs';
import { renderSharedSubjects, showExamDateModal, hideExamDateModal, updateExamDatePreview, renderExamCountdown } from '../shared/ui.mjs';
import { setIsDarkMode } from '../core/ui-state.mjs';
import { addPractice, addExercise, toggleExerciseDone, renderPractices } from '../features/practices/practices.mjs';
import { openTopicNoteModal, setupTopicNoteModal } from '../features/topic-notes/topic-notes.mjs';
import { deletePracticeAnswer, openPracticeAnswerModal, setupPracticeAnswerModal } from '../features/practices/answers-modal.mjs';
import { setupImageViewer } from './image-viewer.mjs';
import { showConfirmModalV2 } from './confirm-modal.mjs';
import { showPromptModal } from './prompt-modal.mjs';
import { deleteExamAnswer, openExamAnswerModal, setupExamAnswerModal } from '../features/exams/answers-modal.mjs';
import { showSyncModal } from './sync-modal.mjs';
import {
  addSubject,
  applyImportedSubjectToDraft,
  deleteCurrentSubject,
  getAddSubjectDraft,
  hideAddSubjectModal,
  setAddSubjectModalTab,
  showAddSubjectModal
} from '../features/subject/add-modal.mjs';
import {
  editingSubjectRef,
  getEditSubjectDraft,
  hideEditSubjectModal,
  ensureEditSubjectDraft,
  renderCustomAchievementsEditor,
  renderEditSubjectBuilder,
  resetCurrentSubject,
  saveEditedSubject,
  setEditSubjectModalTab,
  showEditSubjectModal,
  syncCustomAchievementTypeUi
} from '../features/subject/edit-modal.mjs';
import { createDraftCategory } from '../features/subject/drafts.mjs';
import {
  buildCloudAuthStartUrl,
  clearCloudSyncSession,
  cloudDownloadBackupById,
  cloudDownloadEncryptedBackup,
  cloudListBackups,
  cloudUploadEncryptedBackup,
  getCloudSyncConfig,
  getCloudSessionInfo,
  setCloudSyncConfig
} from '../sync/cloud-sync.mjs';

function byId(id) {
  return document.getElementById(id);
}

function toggleThemeCompat() {
  const next = !document.body.classList.contains('dark-mode');
  applyTheme(next);
  setIsDarkMode(next);
  return next;
}

function setupMobileNav() {
  const toggleBtn = byId('mobileNavToggle');
  const overlay = byId('mobileNavOverlay');
  const sidebar = byId('sidebar');
  if (!toggleBtn || !overlay || !sidebar) return;

  const setOpen = (open) => {
    document.body.classList.toggle('mobile-nav-open', open);
    overlay.hidden = !open;
    toggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  };

  toggleBtn.addEventListener('click', () => {
    setOpen(!document.body.classList.contains('mobile-nav-open'));
  });

  overlay.addEventListener('click', () => setOpen(false));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });

  document.addEventListener('click', (e) => {
    if (!document.body.classList.contains('mobile-nav-open')) return;
    const target = (e.target instanceof Element) ? e.target : null;
    if (!target) return;
    if (!target.closest('#sidebar')) return;

    if (target.closest('.nav-item, #addSubjectBtn, #themeToggleBtn')) {
      setOpen(false);
    }
  });

  window.addEventListener('resize', () => {
    if (window.matchMedia('(min-width: 769px)').matches) setOpen(false);
  });
}

async function ensureCloudSyncAuthorized() {
  const current = getCloudSyncConfig();

  let baseUrl = String(current.baseUrl ?? '').trim();
  if (!baseUrl) {
    const entered = await showPromptModal({
      title: 'Sincronización (Cloud)',
      label: 'URL del servidor de Sync',
      placeholder: 'https://studytracker-sync.<tu-subdominio>.workers.dev',
      hint: 'Es el backend (Cloudflare Worker) que deployás. Se guarda solo en este dispositivo.'
    });

    if (entered == null) return null;
    baseUrl = String(entered).trim();
    if (!baseUrl) {
      showNotification('URL vacía.');
      return null;
    }

    setCloudSyncConfig({ baseUrl });
  }

  const updated = getCloudSyncConfig();
  if (String(updated.sessionToken ?? '').trim()) return updated;

  let loginUrl;
  try {
    loginUrl = buildCloudAuthStartUrl({ baseUrl: updated.baseUrl, redirectUrl: window.location.href });
  } catch (e) {
    showNotification(String(e?.message ?? e ?? 'URL inválida.'));
    return null;
  }

  const ok = await showConfirmModalV2({
    title: 'Conectar con GitHub',
    text: 'Vas a ser redirigido a GitHub para iniciar sesión y autorizar el Sync.',
    confirmText: 'Continuar',
    cancelText: 'Cancelar',
    fallbackText: '¿Conectar con GitHub para Sync?'
  });

  if (!ok) return null;

  showNotification('Redirigiendo a GitHub…');
  window.location.assign(loginUrl);
  return null;
}

async function chooseBackupIdFromHistory({ limit = 10 } = {}) {
  let list;
  try {
    list = await cloudListBackups({ limit });
  } catch (e) {
    showNotification(String(e?.message ?? e ?? 'No se pudo obtener el historial.'));
    return null;
  }

  const items = Array.isArray(list?.items) ? list.items : [];
  if (items.length === 0) {
    showNotification('No hay backups en el historial todavía.');
    return null;
  }

  const lines = items.map((it, idx) => {
    const when = String(it?.updatedAt ?? '');
    const id = String(it?.id ?? '');
    return `${idx + 1}) ${when} (${id})`;
  });

  const res = await showPromptModal({
    title: 'Historial de Backups',
    label: `Elegí un número (1-${items.length})`,
    placeholder: '1',
    defaultValue: '1',
    hint: lines.join('\n')
  });

  if (res == null) return null;
  const n = parseInt(String(res).trim(), 10);
  if (!Number.isFinite(n) || n < 1 || n > items.length) {
    showNotification('Selección inválida.');
    return null;
  }

  return String(items[n - 1]?.id ?? '').trim() || null;
}

async function promptPassphrase() {
  const passphrase = await showPromptModal({
    title: 'Cifrado del Backup',
    label: 'Contraseña (no se guarda)',
    inputType: 'password',
    hint: 'Si la perdés, no se puede recuperar el backup cifrado.'
  });

  if (passphrase == null) return null;
  const p = String(passphrase).trim();
  if (!p) {
    showNotification('Contraseña vacía.');
    return null;
  }
  return p;
}

// (Cloud sync) no necesita Gist ID: el backend guarda 1 backup por usuario.

export function setupEventListeners() {
  const resetBtn = byId('resetBtn');
  if (resetBtn) resetBtn.addEventListener('click', () => void resetCurrentSubject());

  const categoriesContainer = byId('categoriesContainer');
  if (categoriesContainer) {
    categoriesContainer.addEventListener('click', (e) => {
      const target = (e.target instanceof Element) ? e.target : e.target?.parentElement;
      if (!target) return;

      const reviewBtn = target.closest?.('button[data-action="review"]');
      if (reviewBtn) {
        const topicItem = reviewBtn.closest('.topic-item');
        if (!topicItem) return;
        const categoryId = Number(topicItem.dataset.categoryId);
        const topicIndex = Number(topicItem.dataset.topicIndex);
        if (!Number.isFinite(categoryId) || !Number.isFinite(topicIndex)) return;
        completeTopicReview(categoryId, topicIndex);
        return;
      }

      const noteBtn = target.closest?.('.topic-note-btn');
      if (noteBtn) {
        const categoryId = Number(noteBtn.dataset.categoryId);
        const topicIndex = Number(noteBtn.dataset.topicIndex);
        if (!Number.isFinite(categoryId) || !Number.isFinite(topicIndex)) return;
        openTopicNoteModal(categoryId, topicIndex);
        return;
      }

      const topicItem = target.closest?.('.topic-item');
      if (!topicItem) return;
      const categoryId = Number(topicItem.dataset.categoryId);
      const topicIndex = Number(topicItem.dataset.topicIndex);
      if (!Number.isFinite(categoryId) || !Number.isFinite(topicIndex)) return;
      toggleTopicCompleted(categoryId, topicIndex);
    });
  }

  // Notes buttons: capture-phase handler to avoid missed clicks (e.g. emoji text nodes inside buttons)
  document.addEventListener('click', (e) => {
    const target = (e.target instanceof Element) ? e.target : e.target?.parentElement;
    if (!target) return;

    const noteBtn = target.closest?.('.topic-note-btn');
    if (!noteBtn) return;

    e.preventDefault();
    e.stopPropagation();

    const categoryId = Number(noteBtn.dataset.categoryId);
    const topicIndex = Number(noteBtn.dataset.topicIndex);
    if (!Number.isFinite(categoryId) || !Number.isFinite(topicIndex)) return;
    openTopicNoteModal(categoryId, topicIndex);
  }, true);

  const timerToggleBtn = byId('timerToggleBtn');
  if (timerToggleBtn) timerToggleBtn.addEventListener('click', () => startOrPauseTimer());
  const timerStopBtn = byId('timerStopBtn');
  if (timerStopBtn) timerStopBtn.addEventListener('click', () => stopTimer());

  const miniTimerToggleBtn = byId('miniTimerToggleBtn');
  if (miniTimerToggleBtn) miniTimerToggleBtn.addEventListener('click', () => startOrPauseTimer());
  const miniTimerStopBtn = byId('miniTimerStopBtn');
  if (miniTimerStopBtn) miniTimerStopBtn.addEventListener('click', () => stopTimer());

  const difficultySelect = byId('difficultySelect');
  if (difficultySelect) {
    difficultySelect.addEventListener('change', () => setDifficulty(difficultySelect.value));
  }

  const pomodoroModeSelect = byId('pomodoroMode');
  if (pomodoroModeSelect) {
    pomodoroModeSelect.addEventListener('change', () => setPomodoroMode(pomodoroModeSelect.value));
  }

  const alarmModeSelect = byId('alarmMode');
  if (alarmModeSelect) {
    alarmModeSelect.addEventListener('change', () => setAlarmMode(alarmModeSelect.value));
  }

  const pomodoroWorkMin = byId('pomodoroWorkMin');
  const pomodoroBreakMin = byId('pomodoroBreakMin');
  const pomodoroCustomApplyBtn = byId('pomodoroCustomApplyBtn');
  if (pomodoroCustomApplyBtn) {
    pomodoroCustomApplyBtn.addEventListener('click', () => {
      const w = Number(pomodoroWorkMin?.value ?? '');
      const b = Number(pomodoroBreakMin?.value ?? '');
      setCustomPomodoroMinutes(w, b);
    });
  }
  const pomodoroKeyHandler = (e) => {
    if (e.key !== 'Enter') return;
    const w = Number(pomodoroWorkMin?.value ?? '');
    const b = Number(pomodoroBreakMin?.value ?? '');
    setCustomPomodoroMinutes(w, b);
  };
  if (pomodoroWorkMin) pomodoroWorkMin.addEventListener('keydown', pomodoroKeyHandler);
  if (pomodoroBreakMin) pomodoroBreakMin.addEventListener('keydown', pomodoroKeyHandler);

  const alarmCustomMin = byId('alarmCustomMin');
  const alarmCustomApplyBtn = byId('alarmCustomApplyBtn');
  if (alarmCustomApplyBtn) {
    alarmCustomApplyBtn.addEventListener('click', () => {
      const m = Number(alarmCustomMin?.value ?? '');
      setCustomAlarmMinutes(m);
    });
  }
  if (alarmCustomMin) {
    alarmCustomMin.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const m = Number(alarmCustomMin.value ?? '');
      setCustomAlarmMinutes(m);
    });
  }

  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => setActiveView(btn.dataset.view));
  });

  // View activation hooks: keep navigation resilient by rendering on entry.
  registerViewActivationHandler('examsView', () => {
    renderExamCountdown();
    renderExams();
  });
  registerViewActivationHandler('practicesView', () => {
    renderPractices();
  });

  const mapViewGridBtn = byId('mapViewGridBtn');
  if (mapViewGridBtn) mapViewGridBtn.addEventListener('click', () => setMapViewMode('grid'));
  const mapViewMindmapBtn = byId('mapViewMindmapBtn');
  if (mapViewMindmapBtn) mapViewMindmapBtn.addEventListener('click', () => setMapViewMode('mindmap'));

  // exams view interactions
  const examsContainer = byId('examsContainer');
  if (examsContainer) {
    examsContainer.addEventListener('click', (e) => {
      const target = (e.target instanceof Element) ? e.target : e.target?.parentElement;
      if (!target) return;

      const addCat = target.closest?.('.exam-add-item');
      if (addCat) {
        const catDiv = addCat.closest('.exam-category');
        const catIndex = parseInt(catDiv?.dataset?.categoryIndex || 0, 10);
        void addExamItem(catIndex);
        return;
      }
      const attachBtn = target.closest?.('.exam-attach-btn');
      if (attachBtn) {
        const catIndex = parseInt(attachBtn.dataset.categoryIndex || 0, 10);
        const itemIndex = parseInt(attachBtn.dataset.itemIndex || 0, 10);
        if (examFileInput) {
          examFileInput.dataset.categoryIndex = catIndex;
          examFileInput.dataset.itemIndex = itemIndex;
          examFileInput.click();
        }
        return;
      }
      const addQBtn = target.closest?.('.exam-question-add-btn');
      if (addQBtn) {
        const catIndex = parseInt(addQBtn.dataset.categoryIndex || 0, 10);
        const itemIndex = parseInt(addQBtn.dataset.itemIndex || 0, 10);
        void addExamQuestion(catIndex, itemIndex);
        return;
      }
      const delQBtn = target.closest?.('.exam-question-del-btn');
      if (delQBtn) {
        const catIndex = parseInt(delQBtn.dataset.categoryIndex || 0, 10);
        const itemIndex = parseInt(delQBtn.dataset.itemIndex || 0, 10);
        const qId = String(delQBtn.dataset.questionId || '');
        void deleteExamQuestion(catIndex, itemIndex, qId);
        return;
      }
      const addAnsBtn = target.closest?.('.exam-answer-add-btn');
      if (addAnsBtn) {
        const catIndex = parseInt(addAnsBtn.dataset.categoryIndex || 0, 10);
        const itemIndex = parseInt(addAnsBtn.dataset.itemIndex || 0, 10);
        const qId = String(addAnsBtn.dataset.questionId || '');
        void openExamAnswerModal(catIndex, itemIndex, qId, null);
        return;
      }
      const editAnsBtn = target.closest?.('.exam-answer-edit-btn');
      if (editAnsBtn) {
        const catIndex = parseInt(editAnsBtn.dataset.categoryIndex || 0, 10);
        const itemIndex = parseInt(editAnsBtn.dataset.itemIndex || 0, 10);
        const qId = String(editAnsBtn.dataset.questionId || '');
        const ansId = String(editAnsBtn.dataset.answerId || '');
        void openExamAnswerModal(catIndex, itemIndex, qId, ansId);
        return;
      }
      const delAnsBtn = target.closest?.('.exam-answer-del-btn');
      if (delAnsBtn) {
        const catIndex = parseInt(delAnsBtn.dataset.categoryIndex || 0, 10);
        const itemIndex = parseInt(delAnsBtn.dataset.itemIndex || 0, 10);
        const qId = String(delAnsBtn.dataset.questionId || '');
        const ansId = String(delAnsBtn.dataset.answerId || '');
        void deleteExamAnswer(catIndex, itemIndex, qId, ansId);
        return;
      }
      const checkbox = target.closest?.('.exam-checkbox');
      if (checkbox) {
        const li = checkbox.closest('.exam-item');
        const catDiv = checkbox.closest('.exam-category');
        if (!li || !catDiv) return;
        const catIndex = parseInt(catDiv.dataset.categoryIndex, 10);
        const itemIndex = parseInt(li.dataset.itemIndex, 10);
        toggleExamCompleted(catIndex, itemIndex);
        return;
      }
    });
  }

  const addExamCatBtn = byId('addExamCategoryBtn');
  if (addExamCatBtn) addExamCatBtn.addEventListener('click', () => void addExamCategory());

  // countdown refresh timer
  if (typeof renderExamCountdown === 'function') {
    setInterval(() => {
      try {
        renderExamCountdown();
        renderHomeUpcomingExams();
      } catch (e) {
        // ignore
      }
    }, 1000);
  }

  const examFileInput = byId('examFileInput');
  if (examFileInput) {
    examFileInput.addEventListener('change', () => {
      const file = examFileInput.files && examFileInput.files[0];
      if (!file) return;
      const catIndex = parseInt(examFileInput.dataset.categoryIndex || 0, 10);
      const itemIndex = parseInt(examFileInput.dataset.itemIndex || 0, 10);
      attachExamFile(catIndex, itemIndex, file);
      examFileInput.value = '';
    });
  }

  // practices view interactions
  const practicesContainer = byId('practicesContainer');
  if (practicesContainer) {
    practicesContainer.addEventListener('click', (e) => {
      const addAnsBtn = e.target.closest?.('.practice-answer-add-btn');
      if (addAnsBtn) {
        const practiceIndex = parseInt(addAnsBtn.dataset.practiceIndex || 0, 10);
        const exerciseIndex = parseInt(addAnsBtn.dataset.exerciseIndex || 0, 10);
        void openPracticeAnswerModal(practiceIndex, exerciseIndex, null);
        return;
      }
      const editAnsBtn = e.target.closest?.('.practice-answer-edit-btn');
      if (editAnsBtn) {
        const practiceIndex = parseInt(editAnsBtn.dataset.practiceIndex || 0, 10);
        const exerciseIndex = parseInt(editAnsBtn.dataset.exerciseIndex || 0, 10);
        const answerId = String(editAnsBtn.dataset.answerId || '');
        void openPracticeAnswerModal(practiceIndex, exerciseIndex, answerId);
        return;
      }
      const delAnsBtn = e.target.closest?.('.practice-answer-del-btn');
      if (delAnsBtn) {
        const practiceIndex = parseInt(delAnsBtn.dataset.practiceIndex || 0, 10);
        const exerciseIndex = parseInt(delAnsBtn.dataset.exerciseIndex || 0, 10);
        const answerId = String(delAnsBtn.dataset.answerId || '');
        void deletePracticeAnswer(practiceIndex, exerciseIndex, answerId);
        return;
      }

      const addBtn = e.target.closest?.('.practice-add-exercise');
      if (addBtn) {
        const practiceIndex = parseInt(addBtn.dataset.practiceIndex || 0, 10);
        void addExercise(practiceIndex);
        return;
      }

      const checkbox = e.target.closest?.('.practice-checkbox');
      if (checkbox) {
        const practiceIndex = parseInt(checkbox.dataset.practiceIndex || 0, 10);
        const exerciseIndex = parseInt(checkbox.dataset.exerciseIndex || 0, 10);
        toggleExerciseDone(practiceIndex, exerciseIndex);
      }
    });
  }

  const addPracticeBtn = byId('addPracticeBtn');
  if (addPracticeBtn) addPracticeBtn.addEventListener('click', () => void addPractice());

  setupTopicNoteModal();
  setupPracticeAnswerModal();
  setupImageViewer();
  setupExamAnswerModal();

  addEventListener('beforeunload', () => saveData(true));

  // Modal para fecha de examen
  const setExamDateBtn = byId("setExamDateBtn");
  if (setExamDateBtn) setExamDateBtn.addEventListener("click", () => showExamDateModal());

  const closeExamDateModal = byId("closeExamDateModal");
  if (closeExamDateModal) closeExamDateModal.addEventListener("click", () => hideExamDateModal());

  const cancelExamDateBtn = byId("cancelExamDateBtn");
  if (cancelExamDateBtn) cancelExamDateBtn.addEventListener("click", () => hideExamDateModal());

  const examTitleInput = byId("examTitleInput");
  const examDateTimeInput = byId("examDateTimeInput");
  if (examTitleInput) examTitleInput.addEventListener("input", updateExamDatePreview);
  if (examDateTimeInput) examDateTimeInput.addEventListener("change", updateExamDatePreview);

  const clearExamDateBtn = byId("clearExamDateBtn");
  if (clearExamDateBtn) {
    clearExamDateBtn.addEventListener("click", () => {
      if (examTitleInput) examTitleInput.value = "";
      if (examDateTimeInput) examDateTimeInput.value = "";
      updateExamDatePreview();
    });
  }

  const confirmExamDateBtn = byId("confirmExamDateBtn");
  if (confirmExamDateBtn) {
    confirmExamDateBtn.addEventListener("click", () => {
      const subject = getCurrentSubject();
      if (!subject) return;

      const raw = String(examDateTimeInput?.value ?? "").trim();
      if (!raw) {
        showNotification("Selecciona fecha y hora");
        return;
      }

      const parts = raw.split("T");
      if (parts.length !== 2) {
        showNotification("Fecha u hora inválida");
        return;
      }
      const [y, m, d] = parts[0].split("-").map((n) => Number(n));
      const [hh, mm] = parts[1].split(":").map((n) => Number(n));
      if (![y, m, d, hh, mm].every((n) => Number.isFinite(n))) {
        showNotification("Fecha u hora inválida");
        return;
      }
      const dateObj = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
      const ts = dateObj.getTime();
      if (!Number.isFinite(ts)) {
        showNotification("Fecha u hora inválida");
        return;
      }

      if (!Array.isArray(subject.upcomingExams)) subject.upcomingExams = [];

      const modal = byId("examDateModal");
      const editingId = String(modal?.dataset?.examId ?? "").trim();
      const title = String(examTitleInput?.value ?? "").trim();

      if (editingId) {
        const found = subject.upcomingExams.find((x) => String(x?.id) === editingId);
        if (found) {
          found.title = title;
          found.at = ts;
        }
      } else {
        const id = `up_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
        subject.upcomingExams.push({ id, title, at: ts });
      }

      saveData(true);
      hideExamDateModal();
      renderAll();
    });
  }

  // Próximos exámenes: editar / eliminar
  const upcomingExamsList = byId("upcomingExamsList");
  if (upcomingExamsList) {
    upcomingExamsList.addEventListener("click", (e) => {
      const btn = (e.target instanceof Element) ? e.target.closest("button[data-action]") : null;
      const action = btn?.dataset?.action;
      const examId = String(btn?.dataset?.examId ?? "").trim();
      if (!action || !examId) return;

      const subject = getCurrentSubject();
      if (!subject) return;
      if (!Array.isArray(subject.upcomingExams)) subject.upcomingExams = [];

      if (action === "upcoming_edit") {
        showExamDateModal(examId);
        return;
      }

      if (action === "upcoming_delete") {
        subject.upcomingExams = subject.upcomingExams.filter((x) => String(x?.id) !== examId);
        saveData(true);
        renderAll();
      }
    });
  }

  // Cerrar modal clickeando afuera / Escape
  const examDateModal = byId("examDateModal");
  if (examDateModal) {
    examDateModal.addEventListener("click", (e) => {
      if (e.target === examDateModal) hideExamDateModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (examDateModal.classList.contains("active")) hideExamDateModal();
    });
  }

  const addSubjectBtn = byId('addSubjectBtn');
  if (addSubjectBtn) addSubjectBtn.addEventListener('click', () => showAddSubjectModal());
  const closeModalBtn = byId('closeModalBtn');
  if (closeModalBtn) closeModalBtn.addEventListener('click', () => hideAddSubjectModal());
  const cancelModalBtn = byId('cancelModalBtn');
  if (cancelModalBtn) cancelModalBtn.addEventListener('click', () => hideAddSubjectModal());
  const confirmAddSubjectBtn = byId('confirmAddSubjectBtn');
  if (confirmAddSubjectBtn) confirmAddSubjectBtn.addEventListener('click', () => addSubject());

  const addSubjectTabManual = byId('addSubjectTabManual');
  if (addSubjectTabManual) addSubjectTabManual.addEventListener('click', () => setAddSubjectModalTab('manual'));
  const addSubjectTabImport = byId('addSubjectTabImport');
  if (addSubjectTabImport) addSubjectTabImport.addEventListener('click', () => setAddSubjectModalTab('import'));

  const addCategoryBtn = byId('addCategoryBtn');
  if (addCategoryBtn) {
    addCategoryBtn.addEventListener('click', () => {
      const draft = getAddSubjectDraft();
      if (!Array.isArray(draft.categories)) draft.categories = [];
      draft.categories.push(createDraftCategory());
      renderAddSubjectBuilder();
    });
  }

  const subjectImportFile = byId('subjectImportFile');
  const subjectImportText = byId('subjectImportText');
  const subjectImportApplyBtn = byId('subjectImportApplyBtn');
  const subjectImportClearBtn = byId('subjectImportClearBtn');
  const subjectImportStatus = byId('subjectImportStatus');
  if (subjectImportFile) {
    subjectImportFile.addEventListener('change', () => {
      const file = subjectImportFile.files && subjectImportFile.files[0];
      if (!file) return;

      if (subjectImportStatus) subjectImportStatus.textContent = 'Leyendo archivo…';

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = String(reader.result ?? '');
          const payload = JSON.parse(text);
          applyImportedSubjectToDraft(payload);
          setAddSubjectModalTab('manual');
          if (subjectImportStatus) {
            subjectImportStatus.textContent =
              'Importación lista. Revisá y tocá “Crear”.';
          }
        } catch (err) {
          console.error(err);
          if (subjectImportStatus) {
            subjectImportStatus.textContent =
              'No se pudo importar: JSON inválido o estructura no soportada.';
          }
        }
      };
      reader.onerror = () => {
        if (subjectImportStatus) subjectImportStatus.textContent = 'No se pudo leer el archivo.';
      };
      reader.readAsText(file);
    });
  }

  if (subjectImportApplyBtn) {
    subjectImportApplyBtn.addEventListener('click', () => {
      const raw = String(subjectImportText?.value ?? '').trim();
      if (!raw) {
        if (subjectImportStatus) subjectImportStatus.textContent = 'Pegá un JSON para importar.';
        return;
      }

      try {
        if (subjectImportStatus) subjectImportStatus.textContent = 'Importando…';
        const payload = JSON.parse(raw);
        applyImportedSubjectToDraft(payload);
        setAddSubjectModalTab('manual');
        if (subjectImportStatus) {
          subjectImportStatus.textContent = 'Importación lista. Revisá y tocá “Crear”.';
        }
      } catch (err) {
        console.error(err);
        if (subjectImportStatus) {
          subjectImportStatus.textContent = 'No se pudo importar: JSON inválido o estructura no soportada.';
        }
      }
    });
  }

  if (subjectImportClearBtn) {
    subjectImportClearBtn.addEventListener('click', () => {
      if (subjectImportText) subjectImportText.value = '';
      if (subjectImportFile) subjectImportFile.value = '';
      if (subjectImportStatus) subjectImportStatus.textContent = '';
    });
  }

  const editSubjectBtn = byId('editSubjectBtn');
  if (editSubjectBtn) editSubjectBtn.addEventListener('click', () => showEditSubjectModal());
  const shareSubjectBtn = byId('shareSubjectBtn');
  if (shareSubjectBtn) shareSubjectBtn.addEventListener('click', () => void shareCurrentSubjectToShared());
  const exportSubjectBtn = byId('exportSubjectBtn');
  if (exportSubjectBtn) exportSubjectBtn.addEventListener('click', () => void exportCurrentSubjectTemplate());
  const closeEditSubjectModalBtn = byId('closeEditSubjectModalBtn');
  if (closeEditSubjectModalBtn) closeEditSubjectModalBtn.addEventListener('click', () => hideEditSubjectModal());
  const cancelEditSubjectModalBtn = byId('cancelEditSubjectModalBtn');
  if (cancelEditSubjectModalBtn) cancelEditSubjectModalBtn.addEventListener('click', () => hideEditSubjectModal());

  const confirmEditSubjectModalBtn = byId('confirmEditSubjectModalBtn');
  if (confirmEditSubjectModalBtn) {
    confirmEditSubjectModalBtn.addEventListener('click', () => {
      const ok = saveEditedSubject();
      if (ok) {
        showNotification('Cambios guardados.');
        hideEditSubjectModal();
      }
    });
  }

  const editSubjectTabDetails = byId('editSubjectTabDetails');
  if (editSubjectTabDetails) editSubjectTabDetails.addEventListener('click', () => setEditSubjectModalTab('details'));
  const editSubjectTabStructure = byId('editSubjectTabStructure');
  if (editSubjectTabStructure) editSubjectTabStructure.addEventListener('click', () => setEditSubjectModalTab('structure'));
  const editSubjectTabAchievements = byId('editSubjectTabAchievements');
  if (editSubjectTabAchievements) editSubjectTabAchievements.addEventListener('click', () => setEditSubjectModalTab('achievements'));
  const editSubjectTabReset = byId('editSubjectTabReset');
  if (editSubjectTabReset) editSubjectTabReset.addEventListener('click', () => setEditSubjectModalTab('reset'));

  const editAddCategoryBtn = byId('editAddCategoryBtn');
  if (editAddCategoryBtn) {
    editAddCategoryBtn.addEventListener('click', () => {
      ensureEditSubjectDraft();
      const draft = getEditSubjectDraft();
      if (!Array.isArray(draft.categories)) draft.categories = [];
      draft.categories.push(createDraftCategory());
      renderEditSubjectBuilder();
      const subject = editingSubjectRef();
      if (subject) syncCustomAchievementTypeUi(subject);
    });
  }

  const resetSubjectBtn = byId('resetSubjectBtn');
  if (resetSubjectBtn) {
    resetSubjectBtn.addEventListener('click', async () => {
      await resetCurrentSubject();
      hideEditSubjectModal();
    });
  }

  const customAchType = byId('customAchType');
  if (customAchType) {
    customAchType.addEventListener('change', () => {
      const subject = editingSubjectRef();
      if (subject) syncCustomAchievementTypeUi(subject);
    });
  }

  const addCustomAchievementBtn = byId('addCustomAchievementBtn');
  const customAchTitle = byId('customAchTitle');
  const customAchDesc = byId('customAchDesc');
  const customAchValue = byId('customAchValue');
  const customAchCategory = byId('customAchCategory');
  const customAchStatus = byId('customAchStatus');
  if (addCustomAchievementBtn) {
    addCustomAchievementBtn.addEventListener('click', async () => {
      const subject = editingSubjectRef();
      if (!subject) return;

      if (!subject.meta) subject.meta = {};
      if (!Array.isArray(subject.meta.customAchievements)) subject.meta.customAchievements = [];

      const title = String(customAchTitle?.value ?? '').trim();
      const desc = String(customAchDesc?.value ?? '').trim();
      const type = String(customAchType?.value ?? 'pct');

      if (!title) {
        if (customAchStatus) customAchStatus.textContent = 'El título es obligatorio.';
        return;
      }

      const ach = {
        id: `custom_${subject.id}_${Date.now()}`,
        title,
        desc,
        type,
        value: null,
        categoryId: null
      };

      if (type === 'pct') {
        const v = Number(String(customAchValue?.value ?? '').trim());
        if (!Number.isFinite(v) || v <= 0 || v > 100) {
          if (customAchStatus) customAchStatus.textContent = 'Usá un porcentaje entre 1 y 100.';
          return;
        }
        ach.value = Math.round(v);
      } else if (type === 'focus_minutes') {
        const v = Number(String(customAchValue?.value ?? '').trim());
        if (!Number.isFinite(v) || v <= 0) {
          if (customAchStatus) customAchStatus.textContent = 'Usá una cantidad de minutos mayor a 0.';
          return;
        }
        ach.value = Math.round(v);
      } else if (type === 'category_complete') {
        const cid = Number(customAchCategory?.value);
        if (!Number.isFinite(cid)) {
          if (customAchStatus) customAchStatus.textContent = 'Elegí un tema válido.';
          return;
        }
        ach.categoryId = cid;
      }

      subject.meta.customAchievements.push(ach);
      if (customAchStatus) customAchStatus.textContent = 'Logro agregado.';

      if (customAchTitle) customAchTitle.value = '';
      if (customAchDesc) customAchDesc.value = '';
      if (customAchValue) customAchValue.value = '';

      saveData(true);
      checkSubjectAchievementsV2(subject, { silent: true });
      renderCustomAchievementsEditor(subject);
      renderAchievementsV2();
      renderHomePage();
    });
  }

  const deleteSubjectBtn = byId('deleteSubjectBtn');
  if (deleteSubjectBtn) deleteSubjectBtn.addEventListener('click', () => void deleteCurrentSubject());

  const quickAddSubject = byId('quickAddSubject');
  if (quickAddSubject) quickAddSubject.addEventListener('click', () => showAddSubjectModal());

  const quickStartSession = byId('quickStartSession');
  if (quickStartSession) {
    quickStartSession.addEventListener('click', () => {
      if (!getCurrentSubject()) {
        const subjects = getAppState()?.subjects ?? [];
        if (subjects.length === 0) {
          showNotification('Crea una materia primero');
          return;
        }

        const mostRecent = [...subjects].sort((a, b) => getSubjectLastActivity(b) - getSubjectLastActivity(a))[0] ?? subjects[0];
        selectSubject(mostRecent.id);
      }

      startOrPauseTimer();
    });
  }

  const quickViewStats = byId('quickViewStats');
  if (quickViewStats) {
    quickViewStats.addEventListener('click', () => {
      ensureHomeStatsPanelV2();
      renderHomeStatsV2();

      const detailsEl = byId('homeStatsDetails');
      const toggleBtn = byId('homeStatsToggleBtn');
      if (detailsEl) detailsEl.hidden = false;
      if (toggleBtn) toggleBtn.textContent = 'Ocultar';

      try {
        byId('homeStatsPanel')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
      } catch {
        // ignore
      }
    });
  }

  const quickResetAll = byId('quickResetAll');
  if (quickResetAll) quickResetAll.addEventListener('click', () => void resetData());
  const quickExportBackup = byId('quickExportBackup');
  if (quickExportBackup) quickExportBackup.addEventListener('click', () => exportBackupToFile());
  const quickImportBackup = byId('quickImportBackup');
  const backupImportFile = byId('backupImportFile');
  if (quickImportBackup) {
    quickImportBackup.addEventListener('click', () => {
      if (backupImportFile) backupImportFile.click();
      else showNotification('Import no disponible (input file faltante).');
    });
  }

  const quickGitHubSync = byId('quickGitHubSync');
  if (quickGitHubSync) {
    quickGitHubSync.addEventListener('click', async () => {
      const cfg = getCloudSyncConfig();
      const who = getCloudSessionInfo();
      const whoText = who?.login ? `@${who.login}` : '';
      const status = `Servidor: ${cfg.baseUrl ? 'OK' : 'Falta'} | Cuenta: ${cfg.sessionToken ? `Conectado ${whoText}` : 'No conectado'}`;
      const action = await showSyncModal({ status });
      if (!action) return;

      if (action === 'setup') {
        await ensureCloudSyncAuthorized();
        return;
      }

      if (action === 'logout') {
        clearCloudSyncSession();
        showNotification('Sesión cerrada. Podés conectar otra cuenta.');
        return;
      }

      if (action === 'upload') {
        const configured = await ensureCloudSyncAuthorized();
        if (!configured) return;

        const passphrase = await promptPassphrase();
        if (!passphrase) return;

        const ok = await showConfirmModalV2({
          title: 'Subir backup cifrado',
          text: 'Esto sube un backup cifrado a tu servidor de Sync. Si ya existe, lo reemplaza.',
          confirmText: 'Subir',
          cancelText: 'Cancelar',
          fallbackText: '¿Subir backup cifrado a GitHub?'
        });
        if (!ok) return;

        try {
          const res = await cloudUploadEncryptedBackup({ passphrase });
          showNotification(`Backup subido (${res?.updatedAt ?? 'ok'}).`);
        } catch (e) {
          showNotification(String(e?.message ?? e ?? 'Error al subir.'));
        }
        return;
      }

      if (action === 'download') {
        const configured = await ensureCloudSyncAuthorized();
        if (!configured) return;

        const passphrase = await promptPassphrase();
        if (!passphrase) return;

        const ok = await showConfirmModalV2({
          title: 'Bajar backup cifrado',
          text: 'Esto descarga y descifra el backup del servidor, y luego te pedirá confirmación para importar (reemplaza tu progreso actual).',
          confirmText: 'Bajar',
          cancelText: 'Cancelar',
          fallbackText: '¿Bajar backup cifrado desde GitHub?'
        });
        if (!ok) return;

        try {
          const res = await cloudDownloadEncryptedBackup({ passphrase });
          showNotification(`Backup descargado (${res?.updatedAt ?? 'ok'}).`);
        } catch (e) {
          showNotification(String(e?.message ?? e ?? 'Error al bajar.'));
        }
      }

      if (action === 'history') {
        const configured = await ensureCloudSyncAuthorized();
        if (!configured) return;

        const backupId = await chooseBackupIdFromHistory({ limit: 10 });
        if (!backupId) return;

        const passphrase = await promptPassphrase();
        if (!passphrase) return;

        const ok = await showConfirmModalV2({
          title: 'Restaurar backup (historial)',
          text: 'Esto descarga y descifra el backup elegido y luego te pedirá confirmación para importar (reemplaza tu progreso actual).',
          confirmText: 'Restaurar',
          cancelText: 'Cancelar',
          fallbackText: '¿Restaurar backup?'
        });
        if (!ok) return;

        try {
          const res = await cloudDownloadBackupById({ id: backupId, passphrase });
          showNotification(`Backup restaurado (${res?.updatedAt ?? 'ok'}).`);
        } catch (e) {
          showNotification(String(e?.message ?? e ?? 'Error al restaurar.'));
        }
      }
    });
  }

  if (backupImportFile) {
    backupImportFile.addEventListener('change', () => {
      const file = backupImportFile.files && backupImportFile.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        void importBackupText(reader.result);
      };
      reader.onerror = () => {
        showNotification('No se pudo leer el archivo.');
      };
      reader.readAsText(file);

      // Permite importar el mismo archivo dos veces seguidas.
      backupImportFile.value = '';
    });
  }

  document.querySelectorAll('.nav-item[data-view="homeView"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setCurrentSubject(null);
      setActiveView('homeView');
      document.querySelectorAll('.nav-item').forEach((b) => {
        b.classList.toggle('active', b.dataset.view === 'homeView');
      });
      renderAll();
    });
  });

  document.querySelectorAll('.nav-item[data-view="sharedView"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setCurrentSubject(null);
      setActiveView('sharedView');
      document.querySelectorAll('.nav-item').forEach((b) => {
        b.classList.toggle('active', b.dataset.view === 'sharedView');
      });
      renderSharedSubjects();
    });
  });

  document.querySelectorAll('.nav-item[data-view="globalSkillTreeView"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setCurrentSubject(null);
      setActiveView('globalSkillTreeView');
      document.querySelectorAll('.nav-item').forEach((b) => {
        b.classList.toggle('active', b.dataset.view === 'globalSkillTreeView');
      });
      renderGlobalSkillTree();
    });
  });
}

export function setupAdditionalEventListeners() {
  setupMobileNav();

  const themeToggleBtn = byId('themeToggleBtn');
  if (themeToggleBtn) themeToggleBtn.addEventListener('click', () => toggleThemeCompat());

  const subjectList = byId('subjectList');
  if (subjectList) {
    subjectList.addEventListener('click', (e) => {
      const navItem = e.target?.closest?.('.nav-item');
      if (navItem && navItem.dataset.subjectId) {
        selectSubject(parseInt(navItem.dataset.subjectId, 10));
      }
    });
  }
}


