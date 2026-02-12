export function showAddSubjectModal() {
    const subjectNameInput = document.getElementById('subjectName');
    const subjectIconInput = document.getElementById('subjectIcon');
    const subjectColorInput = document.getElementById('subjectColor');
    const addSubjectModal = document.getElementById('addSubjectModal');
    
    subjectNameInput.value = '';
    subjectIconInput.value = '📚';
    subjectColorInput.value = '#667eea';
    addSubjectModal.classList.add('active');
}

export function hideAddSubjectModal() {
    const addSubjectModal = document.getElementById('addSubjectModal');
    addSubjectModal.classList.remove('active');
}

export function setActiveView(viewId) {
    // Ocultar todas las vistas
    document.querySelectorAll('.view').forEach(v => v.classList.remove('view-active'));
    
    // Mostrar la vista activa
    const view = document.getElementById(viewId);
    if (view) view.classList.add('view-active');

    // Actualizar botones de pestaña
    document.querySelectorAll('.tab-btn').forEach(btn => {
        const isActive = btn.dataset.view === viewId;
        btn.classList.toggle('active', isActive);
    });
}

export function selectSubjectUI(appState, currentSubject) {
    if (!currentSubject) {
        setActiveView('homeView');
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === 'homeView');
        });
        return;
    }
    
    const subjectTitle = document.getElementById('subjectTitle');
    const subjectSubtitle = document.getElementById('subjectSubtitle');
    
    if (subjectTitle) subjectTitle.textContent = currentSubject.name;
    if (subjectSubtitle) subjectSubtitle.textContent = 'Progreso de estudio';
    
    setActiveView('subjectView');
    
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.subjectId == currentSubject.id);
    });
}

export function goHome() {
    const homeBtn = document.querySelector('.nav-item[data-view="homeView"]');
    if (homeBtn) homeBtn.classList.add('active');
    
    document.querySelectorAll('.nav-item[data-subjectId]').forEach(btn => {
        btn.classList.remove('active');
    });
    
    setActiveView('homeView');
}

export function renderSubjectList(appState, onSelectSubject) {
    const subjectList = document.getElementById('subjectList');
    if (!subjectList) return;
    
    subjectList.innerHTML = '';
    
    for (const subject of appState.subjects) {
        const navItem = document.createElement('a');
        navItem.className = 'nav-item';
        navItem.dataset.subjectId = subject.id;
        navItem.innerHTML = `<span>${subject.icon}</span> ${subject.name}`;
        navItem.addEventListener('click', () => onSelectSubject(subject.id));
        subjectList.appendChild(navItem);
    }
}

export function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}
