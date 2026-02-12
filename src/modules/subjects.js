import { createNewSubject } from '../utils/storage.js';
import { showNotification } from '../utils/helpers.js';
import { saveData } from '../utils/storage.js';

export function addSubject(appState, name, icon = '📚', color = '#667eea') {
    if (!name || !name.trim()) {
        showNotification('El nombre de la materia es obligatorio');
        return null;
    }
    
    const newSubject = createNewSubject(name.trim(), icon || '📚', color);
    appState.subjects.push(newSubject);
    saveData(appState, true);
    showNotification(`Materia "${name}" creada`);
    
    return newSubject;
}

export function deleteSubject(appState, subjectId) {
    const index = appState.subjects.findIndex(sub => sub.id === subjectId);
    if (index !== -1) {
        const subjectName = appState.subjects[index].name;
        appState.subjects.splice(index, 1);
        saveData(appState, true);
        showNotification(`Materia "${subjectName}" eliminada`);
        return true;
    }
    return false;
}

export function getSubjectById(appState, subjectId) {
    return appState.subjects.find(sub => sub.id === subjectId) || null;
}

export function getAllSubjects(appState) {
    return appState.subjects || [];
}
