export function getDifficultyConfig(difficulty = 'normal') {
    const DIFFICULTY_CONFIG = {
        normal: {
            label: 'Normal',
            pauseGraceSeconds: 60,
            xpPerMinute: 6,
            xpTopicComplete: 22,
            xpReviewComplete: 14,
            tierMinutes: [0, 5, 10, 15, 20, 25],
            tierMultiplierStep: 0.15
        },
        hardcore: {
            label: 'Hardcore',
            pauseGraceSeconds: 0,
            xpPerMinute: 7,
            xpTopicComplete: 26,
            xpReviewComplete: 16,
            tierMinutes: [0, 6, 12, 18, 24, 30],
            tierMultiplierStep: 0.14
        }
    };
    
    return DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.normal;
}

export function validateDifficulty(difficulty) {
    return getDifficultyConfig(difficulty) !== undefined;
}

export function changeDifficulty(appState, currentSubject, difficulty) {
    const config = getDifficultyConfig(difficulty);
    if (!config) return false;
    
    if (currentSubject) {
        currentSubject.meta.difficulty = difficulty;
    }
    
    return true;
}
