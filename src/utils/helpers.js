export function todayKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

export function formatHMS(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds));
    const hh = String(Math.floor(s / 3600)).padStart(2, '0');
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
}

export function formatMS(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds));
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
}

export function round2(n) {
    return Math.round(n * 100) / 100;
}

export function xpToNextLevel(level) {
    return Math.floor(120 + (level - 1) * 55 + (level - 1) * (level - 1) * 4);
}

export function escapeHtml(text) {
    return String(text)
        .replaceAll('&', '&')
        .replaceAll('<', '<')
        .replaceAll('>', '>')
        .replaceAll('"', '"')
        .replaceAll("'", '&#039;');
}

export function prettyTime(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
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

export function formatDurationMs(ms) {
    // display a friendly duration from milliseconds
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    const parts = [];
    if (days) parts.push(`${days}d`);
    if (hours) parts.push(`${hours}h`);
    if (minutes) parts.push(`${minutes}m`);
    if (seconds || parts.length === 0) parts.push(`${seconds}s`);
    return parts.join(' ');
}

export function ensureNotificationStyles() {
    if (document.getElementById('notificationStyles')) return;
    const style = document.createElement('style');
    style.id = 'notificationStyles';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
        .notification {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 14px 16px;
            border-radius: 12px;
            max-width: min(420px, calc(100vw - 40px));
            z-index: 1100;
            animation: slideIn 0.25s ease-out;
            font-weight: 750;
            line-height: 1.35;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.95), rgba(118, 75, 162, 0.95));
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.18);
            box-shadow: 0 18px 50px rgba(0, 0, 0, 0.26);
            backdrop-filter: blur(10px);
        }
        body.dark-mode .notification {
            border-color: rgba(255, 255, 255, 0.14);
            box-shadow: 0 18px 56px rgba(0, 0, 0, 0.42);
        }
    `;
    document.head.appendChild(style);
}

export function showNotification(message) {
    ensureNotificationStyles();

    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.25s ease-out';
        setTimeout(() => notification.remove(), 260);
    }, 2400);
}

export function loadTheme() {
    const savedTheme = localStorage.getItem('studyTrackerTheme');
    const isDarkMode = savedTheme === 'dark';
    applyTheme(isDarkMode);
    return isDarkMode;
}

export function applyTheme(isDarkMode) {
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        const themeToggleBtn = document.getElementById('themeToggleBtn');
        if (themeToggleBtn) themeToggleBtn.textContent = '☀️';
    } else {
        document.body.classList.remove('dark-mode');
        const themeToggleBtn = document.getElementById('themeToggleBtn');
        if (themeToggleBtn) themeToggleBtn.textContent = '🌙';
    }
    localStorage.setItem('studyTrackerTheme', isDarkMode ? 'dark' : 'light');
}
