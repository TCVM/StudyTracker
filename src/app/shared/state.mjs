const sharedState = {
  subjects: [],
  base: [],
  local: [],
  loaded: false,
  loadError: null
};

export function getSharedSubjects() {
  return sharedState.subjects;
}

export function setSharedSubjects(list) {
  sharedState.subjects = Array.isArray(list) ? list : [];
  return sharedState.subjects;
}

export function getSharedSubjectsBase() {
  return sharedState.base;
}

export function setSharedSubjectsBase(list) {
  sharedState.base = Array.isArray(list) ? list : [];
  return sharedState.base;
}

export function getSharedSubjectsLocal() {
  return sharedState.local;
}

export function setSharedSubjectsLocal(list) {
  sharedState.local = Array.isArray(list) ? list : [];
  return sharedState.local;
}

export function getSharedSubjectsLoaded() {
  return !!sharedState.loaded;
}

export function setSharedSubjectsLoaded(value) {
  sharedState.loaded = !!value;
  return sharedState.loaded;
}

export function getSharedSubjectsLoadError() {
  return sharedState.loadError;
}

export function setSharedSubjectsLoadError(err) {
  sharedState.loadError = err ?? null;
  return sharedState.loadError;
}

