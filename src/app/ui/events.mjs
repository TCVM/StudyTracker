import { getAppState, getCurrentSubject, setCurrentSubject } from '../core/state.mjs';
import { applyTheme, showNotification } from '../../utils/helpers.js';
import { completeTopicReview, toggleTopicCompleted } from '../features/topics/actions.mjs';
import { setActiveView } from './flow.mjs';
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
import { addNewNote, deleteActiveNote, ensureSubjectNotes, getActiveNote, normalizeHttpUrl, renameActiveNote, renderGlobalSkillTree, renderNotes } from '../features/notes/notes-skilltree-stats.mjs';
import { exportBackupToFile, importBackupText, resetData, saveData } from '../core/storage.mjs';
import { checkSubjectAchievementsV2 } from '../features/achievements/core.mjs';
import { ensureHomeStatsPanelV2, renderAchievementsV2, renderHomeStatsV2 } from '../features/achievements/ui.mjs';
import { getSubjectLastActivity, renderHomePage } from './home.mjs';
import { renderAll, selectSubject } from './render.mjs';
import { shareCurrentSubjectToShared, exportCurrentSubjectTemplate } from '../shared/actions.mjs';
import { renderSharedSubjects } from '../shared/ui.mjs';
import { setIsDarkMode } from '../core/ui-state.mjs';
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

let notesSaveTimeoutId = null;

function byId(id) {
  return document.getElementById(id);
}

function toggleThemeCompat() {
  const next = !document.body.classList.contains('dark-mode');
  applyTheme(next);
  setIsDarkMode(next);
  return next;
}

export function setupEventListeners() {
  const resetBtn = byId('resetBtn');
  if (resetBtn) resetBtn.addEventListener('click', () => void resetCurrentSubject());

  const categoriesContainer = byId('categoriesContainer');
  if (categoriesContainer) {
    categoriesContainer.addEventListener('click', (e) => {
      const reviewBtn = e.target?.closest?.('button[data-action="review"]');
      if (reviewBtn) {
        const topicItem = reviewBtn.closest('.topic-item');
        if (!topicItem) return;
        const categoryId = parseInt(topicItem.dataset.categoryId, 10);
        const topicIndex = parseInt(topicItem.dataset.topicIndex, 10);
        completeTopicReview(categoryId, topicIndex);
        return;
      }

      const topicItem = e.target?.closest?.('.topic-item');
      if (!topicItem) return;
      const categoryId = parseInt(topicItem.dataset.categoryId, 10);
      const topicIndex = parseInt(topicItem.dataset.topicIndex, 10);
      toggleTopicCompleted(categoryId, topicIndex);
    });
  }

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

  const mapViewGridBtn = byId('mapViewGridBtn');
  if (mapViewGridBtn) mapViewGridBtn.addEventListener('click', () => setMapViewMode('grid'));
  const mapViewMindmapBtn = byId('mapViewMindmapBtn');
  if (mapViewMindmapBtn) mapViewMindmapBtn.addEventListener('click', () => setMapViewMode('mindmap'));

  const subjectNotesText = byId('subjectNotesText');
  if (subjectNotesText) {
    subjectNotesText.addEventListener('input', () => {
      const subject = getCurrentSubject();
      if (!subject) return;
      ensureSubjectNotes(subject);
      const note = getActiveNote(subject);
      if (note) {
        note.content = String(subjectNotesText.value ?? '');
        note.updatedAt = Date.now();
        subject.notes.text = note.content;
      }

      if (notesSaveTimeoutId) clearTimeout(notesSaveTimeoutId);
      notesSaveTimeoutId = setTimeout(() => {
        notesSaveTimeoutId = null;
        saveData(true);
      }, 400);
    });

    subjectNotesText.addEventListener('blur', () => {
      const subject = getCurrentSubject();
      if (!subject) return;
      ensureSubjectNotes(subject);
      const note = getActiveNote(subject);
      if (note) {
        note.content = String(subjectNotesText.value ?? '');
        note.updatedAt = Date.now();
        subject.notes.text = note.content;
      }
      if (notesSaveTimeoutId) {
        clearTimeout(notesSaveTimeoutId);
        notesSaveTimeoutId = null;
      }
      saveData(true);
    });
  }

  const subjectNotesSelect = byId('subjectNotesSelect');
  if (subjectNotesSelect) {
    subjectNotesSelect.addEventListener('change', () => {
      const subject = getCurrentSubject();
      if (!subject) return;
      ensureSubjectNotes(subject);

      const prevId = String(subjectNotesText?.dataset?.noteId ?? '');
      const prev = subject.notes.items.find((n) => n.id === prevId);
      if (prev && subjectNotesText) {
        prev.content = String(subjectNotesText.value ?? '');
        prev.updatedAt = Date.now();
      }

      subject.notes.activeId = String(subjectNotesSelect.value ?? '');
      const active = getActiveNote(subject);
      subject.notes.text = String(active?.content ?? '');

      saveData(true);
      renderNotes();
    });
  }

  const subjectAddNoteBtn = byId('subjectAddNoteBtn');
  if (subjectAddNoteBtn) subjectAddNoteBtn.addEventListener('click', () => addNewNote());
  const subjectRenameNoteBtn = byId('subjectRenameNoteBtn');
  if (subjectRenameNoteBtn) subjectRenameNoteBtn.addEventListener('click', () => renameActiveNote());
  const subjectDeleteNoteBtn = byId('subjectDeleteNoteBtn');
  if (subjectDeleteNoteBtn) subjectDeleteNoteBtn.addEventListener('click', () => deleteActiveNote());

  const subjectAddLinkBtn = byId('subjectAddLinkBtn');
  const subjectLinkTitle = byId('subjectLinkTitle');
  const subjectLinkUrl = byId('subjectLinkUrl');
  if (subjectAddLinkBtn) {
    subjectAddLinkBtn.addEventListener('click', () => {
      const subject = getCurrentSubject();
      if (!subject) {
        showNotification('Selecciona una materia primero');
        return;
      }

      const url = normalizeHttpUrl(subjectLinkUrl ? subjectLinkUrl.value : '');
      if (!url) {
        showNotification('URL inválida (usa http/https)');
        return;
      }

      const title = String(subjectLinkTitle ? subjectLinkTitle.value : '').trim();
      ensureSubjectNotes(subject);
      subject.notes.links.unshift({ title, url });

      if (subjectLinkTitle) subjectLinkTitle.value = '';
      if (subjectLinkUrl) subjectLinkUrl.value = '';

      saveData(true);
      renderNotes();
    });
  }

  const subjectLinksList = byId('subjectLinksList');
  if (subjectLinksList) {
    subjectLinksList.addEventListener('click', (e) => {
      const btn = e.target?.closest?.('button[data-link-index]') ?? null;
      if (!btn || !btn.dataset || btn.dataset.linkIndex == null) return;
      const subject = getCurrentSubject();
      if (!subject) return;

      const idx = Number(btn.dataset.linkIndex);
      if (!Number.isFinite(idx)) return;

      ensureSubjectNotes(subject);
      if (!Array.isArray(subject.notes.links)) subject.notes.links = [];
      if (idx < 0 || idx >= subject.notes.links.length) return;

      subject.notes.links.splice(idx, 1);
      saveData(true);
      renderNotes();
    });
  }

  addEventListener('beforeunload', () => saveData(true));

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
        if (subjectImportStatus) subjectImportStatus.textContent = 'Importandoâ€¦';
        const payload = JSON.parse(raw);
        applyImportedSubjectToDraft(payload);
        setAddSubjectModalTab('manual');
        if (subjectImportStatus) {
          subjectImportStatus.textContent =
            'ImportaciÃ³n lista. RevisÃ¡ y tocÃ¡ â€œCrearâ€.';
        }
      } catch (err) {
        console.error(err);
        if (subjectImportStatus) {
          subjectImportStatus.textContent =
            'No se pudo importar: JSON invÃ¡lido o estructura no soportada.';
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
