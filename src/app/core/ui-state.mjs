let isDarkMode = false;
let sessionPanelInView = true;
let addSubjectDraft = null;
let editSubjectDraft = null;
let editingSubjectId = null;

export function getIsDarkMode() {
  return isDarkMode;
}

export function setIsDarkMode(next) {
  isDarkMode = !!next;
  return isDarkMode;
}

export function getSessionPanelInView() {
  return sessionPanelInView;
}

export function setSessionPanelInView(next) {
  sessionPanelInView = !!next;
  return sessionPanelInView;
}

export function getAddSubjectDraftRaw() {
  return addSubjectDraft;
}

export function setAddSubjectDraftRaw(next) {
  addSubjectDraft = next ?? null;
  return addSubjectDraft;
}

export function getEditSubjectDraftRaw() {
  return editSubjectDraft;
}

export function setEditSubjectDraftRaw(next) {
  editSubjectDraft = next ?? null;
  return editSubjectDraft;
}

export function getEditingSubjectId() {
  return editingSubjectId;
}

export function setEditingSubjectId(next) {
  editingSubjectId = next ?? null;
  return editingSubjectId;
}
