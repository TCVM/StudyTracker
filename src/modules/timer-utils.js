export function initializeTimerState() {
    return {
        running: false,
        sessionSeconds: 0,
        streakSeconds: 0,
        xpCarrySeconds: 0,
        lastTickMs: null,
        pausedAtMs: null,
        currentSessionStartMs: null
    };
}

export function getStreakTier(streakSeconds, difficulty = 'normal') {
    const difficultyConfig = {
        normal: [0, 5, 10, 15, 20, 25],
        hardcore: [0, 6, 12, 18, 24, 30]
    };
    
    const tierMinutes = difficultyConfig[difficulty] || difficultyConfig.normal;
    const minutes = streakSeconds / 60;
    
    let tier = 0;
    for (let i = 0; i < tierMinutes.length; i++) {
        if (minutes >= tierMinutes[i]) tier = i;
    }
    return tier;
}

export function getMultiplier(streakSeconds, difficulty = 'normal', maxTier = 5, tierMultiplierStep = 0.15) {
    const tier = getStreakTier(streakSeconds, difficulty);
    const capTier = Math.min(tier, maxTier);
    const base = 1 + capTier * tierMultiplierStep;
    return Math.round(base * 100) / 100;
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

export function getStreakLabel(tier) {
    const labels = ['En frío', 'Tibio', 'Caliente', 'Ardiendo', 'En llamas', 'Infernal'];
    return labels[tier] ?? 'En foco';
}
