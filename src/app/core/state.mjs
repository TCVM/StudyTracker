let appState = null;
let currentSubject = null;

export function getAppState() {
  return appState;
}

export function setAppState(next) {
  appState = next ?? null;
  return appState;
}

export function getCurrentSubject() {
  return currentSubject;
}

export function setCurrentSubject(next) {
  currentSubject = next ?? null;
  return currentSubject;
}
