const THEME_STORAGE_KEY = 'studyTrackerTheme';
const THEME_CLASS = 'dark-mode';

export function loadThemePreference() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return savedTheme === 'dark';
}

export function applyTheme(isDarkMode) {
    const body = document.body;
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    
    if (isDarkMode) {
        body.classList.add(THEME_CLASS);
        if (themeToggleBtn) themeToggleBtn.textContent = '☀️';
    } else {
        body.classList.remove(THEME_CLASS);
        if (themeToggleBtn) themeToggleBtn.textContent = '🌙';
    }
    
    localStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? 'dark' : 'light');
}

export function toggleTheme() {
    const isDarkMode = !document.body.classList.contains(THEME_CLASS);
    applyTheme(!isDarkMode);
    return !isDarkMode;
}

export function getCSSVariable(variableName) {
    return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
}

export function setCSSVariable(variableName, value) {
    document.documentElement.style.setProperty(variableName, value);
}
