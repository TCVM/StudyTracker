export const STORAGE_KEY_V2 = 'studyTrackerDataV2';
export const STORAGE_KEY_V1 = 'studyTrackerData';
export const APP_VERSION = 2;

export const REVIEW_SCHEDULE_DAYS = [1, 3, 7, 14];

export const DIFFICULTY_CONFIG = {
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

export const ACHIEVEMENTS = [
    { id: 'progress_first_topic', title: 'Primeros pasos', desc: 'Completar el primer tema', kind: 'progress', condition: 'first_topic' },
    { id: 'progress_25_percent', title: 'Cuarto de camino', desc: 'Completar el 25% del contenido', kind: 'progress', condition: '25_percent' },
    { id: 'progress_50_percent', title: 'Mitad del camino', desc: 'Completar el 50% del contenido', kind: 'progress', condition: '50_percent' },
    { id: 'progress_75_percent', title: 'Casi ahí', desc: 'Completar el 75% del contenido', kind: 'progress', condition: '75_percent' },
    { id: 'progress_100_percent', title: 'Maestro', desc: 'Completar el 100% del contenido', kind: 'progress', condition: '100_percent' },
    { id: 'time_early_bird', title: 'Madrugador', desc: 'Estudiar antes de las 8 AM', kind: 'time', condition: 'before_8am' },
    { id: 'time_night_owl', title: 'Búho nocturno', desc: 'Estudiar después de las 10 PM', kind: 'time', condition: 'after_10pm' },
    { id: 'time_consistent', title: 'Consistente', desc: 'Estudiar 3 días consecutivos', kind: 'time', condition: '3_days_streak' },
    { id: 'time_week', title: 'Semana completa', desc: 'Estudiar 7 días seguidos', kind: 'time', condition: '7_days_streak' },
    { id: 'time_month', title: 'Mes de estudio', desc: 'Estudiar en 20+ días del mes', kind: 'time', condition: '20_days_month' },
    { id: 'streak_10min', title: 'Calentando motores', desc: '10 minutos de racha seguidos', kind: 'streak', seconds: 10 * 60 },
    { id: 'streak_30min', title: 'En zona', desc: '30 minutos de racha seguidos', kind: 'streak', seconds: 30 * 60 },
    { id: 'streak_60min', title: 'Inquebrantable', desc: '60 minutos de racha seguidos', kind: 'streak', seconds: 60 * 60 },
    { id: 'streak_2h', title: 'Maratón de estudio', desc: '2 horas sin pausas', kind: 'streak', seconds: 2 * 60 * 60 },
    // Logros de Temas específicos
    { id: 'topic_architecture', title: 'Arquitecto', desc: 'Completar "Estructura del Computador"', kind: 'topic', condition: 'complete_architecture' },
    { id: 'topic_memory', title: 'Memorista', desc: 'Completar "Jerarquía de Memoria"', kind: 'topic', condition: 'complete_memory' },
    { id: 'topic_instructions', title: 'Programador', desc: 'Completar "Repertorio de Instrucciones"', kind: 'topic', condition: 'complete_instructions' },
    { id: 'topic_io_buses', title: 'Especialista en E/S', desc: 'Completar "Control de E/S y Buses"', kind: 'topic', condition: 'complete_io_buses' },
    { id: 'topic_pipeline', title: 'Experto en Pipeline', desc: 'Completar "Segmentación y Paralelismo"', kind: 'topic', condition: 'complete_pipeline' },
    { id: 'topic_multiproc', title: 'Multiprocesador', desc: 'Completar "Sistemas de Múltiples Procesadores"', kind: 'topic', condition: 'complete_multiproc' },
    // Logros Especiales
    { id: 'special_first_xp', title: 'Primer XP', desc: 'Ganar los primeros 10 XP', kind: 'special', condition: 'first_10_xp' },
    { id: 'special_collector', title: 'Coleccionista', desc: 'Desbloquear 5 logros', kind: 'special', condition: '5_achievements' },
    { id: 'special_hunter', title: 'Cazador de logros', desc: 'Desbloquear 15 logros', kind: 'special', condition: '15_achievements' },
    { id: 'special_dedicated', title: 'Dedicado', desc: '10 sesiones de estudio', kind: 'special', condition: '10_sessions' },
    { id: 'special_veteran', title: 'Veterano', desc: '50 sesiones de estudio', kind: 'special', condition: '50_sessions' },
    // Logros originales
    { id: 'focus_total_10m', title: 'Arranque', desc: '10 minutos de enfoque total', kind: 'total', seconds: 10 * 60 },
    { id: 'focus_total_30m', title: 'Ritmo', desc: '30 minutos de enfoque total', kind: 'total', seconds: 30 * 60 },
    { id: 'focus_total_60m', title: 'Una hora', desc: '60 minutos de enfoque total', kind: 'total', seconds: 60 * 60 },
    { id: 'focus_total_3h', title: 'En serio', desc: '3 horas de enfoque total', kind: 'total', seconds: 3 * 60 * 60 },
    { id: 'focus_total_10h', title: 'Modo máquina', desc: '10 horas de enfoque total', kind: 'total', seconds: 10 * 60 * 60 },
    { id: 'focus_streak_25m', title: 'Pomodoro pro', desc: '25 minutos de racha en una sesión', kind: 'streak', seconds: 25 * 60 },
    { id: 'focus_streak_45m', title: 'En llamas', desc: '45 minutos de racha en una sesión', kind: 'streak', seconds: 45 * 60 }
];

export const SKILLS = [
    { id: 'skill_xp_boost_1', title: 'XP +10%', desc: 'Ganas 10% más XP (timer + tareas).', cost: 1, reqLevel: 2 },
    { id: 'skill_multiplier_cap', title: 'Combo estable', desc: '+1 tier máximo de racha (más multiplicador).', cost: 1, reqLevel: 4 },
    { id: 'skill_review_bonus', title: 'Memoria reforzada', desc: '+25% XP por repasos espaciados.', cost: 1, reqLevel: 3 }
];

export const MAX_SESSIONS_DISPLAY = 20;