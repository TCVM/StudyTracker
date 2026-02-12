const STORAGE_KEY_V2 = 'studyTrackerDataV2';
const STORAGE_KEY_V1 = 'studyTrackerData';
const APP_VERSION = 2;

const REVIEW_SCHEDULE_DAYS = [1, 3, 7, 14];

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

const ACHIEVEMENTS = [
    // Logros de Progreso Académico
    { id: 'progress_first_topic', title: 'Primeros pasos', desc: 'Completar el primer tema', kind: 'progress', condition: 'first_topic' },
    { id: 'progress_25_percent', title: 'Cuarto de camino', desc: 'Completar el 25% del contenido', kind: 'progress', condition: '25_percent' },
    { id: 'progress_50_percent', title: 'Mitad del camino', desc: 'Completar el 50% del contenido', kind: 'progress', condition: '50_percent' },
    { id: 'progress_75_percent', title: 'Casi ahí', desc: 'Completar el 75% del contenido', kind: 'progress', condition: '75_percent' },
    { id: 'progress_100_percent', title: 'Maestro', desc: 'Completar el 100% del contenido', kind: 'progress', condition: '100_percent' },
    
    // Logros de Tiempo
    { id: 'time_early_bird', title: 'Madrugador', desc: 'Estudiar antes de las 8 AM', kind: 'time', condition: 'before_8am' },
    { id: 'time_night_owl', title: 'Búho nocturno', desc: 'Estudiar después de las 10 PM', kind: 'time', condition: 'after_10pm' },
    { id: 'time_consistent', title: 'Consistente', desc: 'Estudiar 3 días consecutivos', kind: 'time', condition: '3_days_streak' },
    { id: 'time_week', title: 'Semana completa', desc: 'Estudiar 7 días seguidos', kind: 'time', condition: '7_days_streak' },
    { id: 'time_month', title: 'Mes de estudio', desc: 'Estudiar en 20+ días del mes', kind: 'time', condition: '20_days_month' },
    
    // Logros de Rachas
    { id: 'streak_10min', title: 'Calentando motores', desc: '10 minutos de racha seguidos', kind: 'streak', seconds: 10 * 60 },
    { id: 'streak_30min', title: 'En zona', desc: '30 minutos de racha seguidos', kind: 'streak', seconds: 30 * 60 },
    { id: 'streak_60min', title: 'Inquebrantable', desc: '60 minutos de racha seguidos', kind: 'streak', seconds: 60 * 60 },
    { id: 'streak_2h', title: 'Maratón de estudio', desc: '2 horas sin pausas', kind: 'streak', seconds: 2 * 60 * 60 },
    
    // Logros de Temas
    { id: 'topic_architecture', title: 'Arquitecto', desc: 'Completar "Estructura del Computador"', kind: 'topic', condition: 'complete_architecture' },
    { id: 'topic_memory', title: 'Memorista', desc: 'Completar "Jerarquía de Memoria"', kind: 'topic', condition: 'complete_memory' },
    { id: 'topic_instructions', title: 'Programador', desc: 'Completar "Repertorio de Instrucciones"', kind: 'topic', condition: 'complete_instructions' },
    
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

const SKILLS = [
    { id: 'skill_xp_boost_1', title: 'XP +10%', desc: 'Ganas 10% más XP (timer + tareas).', cost: 1, reqLevel: 2 },
    { id: 'skill_multiplier_cap', title: 'Combo estable', desc: '+1 tier máximo de racha (más multiplicador).', cost: 1, reqLevel: 4 },
    { id: 'skill_review_bonus', title: 'Memoria reforzada', desc: '+25% XP por repasos espaciados.', cost: 1, reqLevel: 3 }
];

const initialArchitectureData = {
    categories: [
        {
            id: 1,
            name: 'Estructura del Computador y Componentes',
            icon: '💻',
            topics: [
                { name: 'Arquitectura de Von Neumann (IAS)', level: 1 },
                { name: 'Memoria Principal (Datos/Instrucciones)', level: 2 },
                { name: 'Unidad Aritmético-Lógica (ALU)', level: 2 },
                { name: 'Unidad de Control (UC)', level: 2 },
                { name: 'Equipo de Entrada/Salida (E/S)', level: 2 },
                { name: 'Componentes de la CPU', level: 1 },
                { name: 'Unidad de Control (UC)', level: 2 },
                { name: 'ALU (Procesamiento de Datos)', level: 2 },
                { name: 'Registros (Almacenamiento Interno)', level: 2 },
                { name: 'Interconexiones CPU (Comunicación Interna)', level: 2 },
                { name: 'Evolución', level: 1 },
                { name: 'Microprocesador (Intel 4004, 1971)', level: 2 },
                { name: 'Memoria Caché (IBM S/360 Mod. 85, 1968)', level: 2 },
                { name: 'Concepto de Familia (IBM System/360, 1964)', level: 2 },
                { name: 'Unidad de Control Microprogramada (1964)', level: 2 }
            ]
        },
        {
            id: 2,
            name: 'Jerarquía de Memoria',
            icon: '📊',
            topics: [
                { name: '¿Por qué funciona?', level: 1 },
                { name: 'Principio de Localidad de Referencias', level: 2 },
                { name: 'Localidad Temporal', level: 3 },
                { name: 'Localidad Espacial', level: 3 },
                { name: 'Propiedades a Cumplir', level: 1 },
                { name: 'Inclusión', level: 2 },
                { name: 'Coherencia', level: 2 },
                { name: 'Memoria Caché', level: 1 },
                { name: 'Organización y Diseño', level: 2 },
                { name: 'Tamaño de Caché', level: 3 },
                { name: 'Función de Correspondencia', level: 3 },
                { name: 'Directa', level: 4 },
                { name: 'Asociativa', level: 4 },
                { name: 'Asociativa por Conjuntos (k-vías)', level: 4 },
                { name: 'Política de Escritura', level: 3 },
                { name: 'Escritura Inmediata (Write-Through)', level: 4 },
                { name: 'Post-Escritura (Write-Back)', level: 4 },
                { name: 'Política de Reemplazo', level: 3 },
                { name: 'LRU (Menos Recientemente Usado)', level: 4 },
                { name: 'FIFO', level: 4 },
                { name: 'LFU', level: 4 },
                { name: 'Aleatoria', level: 4 },
                { name: 'Múltiples Niveles (L1, L2, L3)', level: 3 },
                { name: 'Prestaciones', level: 2 },
                { name: 'Tasa de Aciertos (H)', level: 3 },
                { name: 'Tasa de Fallos (TF)', level: 3 },
                { name: 'Penalización por Fallo (PF)', level: 3 },
                { name: 'Tiempo Medio de Acceso', level: 3 },
                { name: 'Otros Niveles', level: 1 },
                { name: 'Memoria Principal (DRAM)', level: 2 },
                { name: 'Memoria Virtual (Disco Duro)', level: 2 },
                { name: 'Almacenamiento Local (RISC/GPUs)', level: 2 }
            ]
        },
        {
            id: 3,
            name: 'Repertorio de Instrucciones (RI)',
            icon: '📝',
            topics: [
                { name: 'Elementos de una Instrucción', level: 1 },
                { name: 'Código de Operación (Codop)', level: 2 },
                { name: 'Referencia a Operandos Fuente', level: 2 },
                { name: 'Referencia a Resultado', level: 2 },
                { name: 'Referencia a Siguiente Instrucción', level: 2 },
                { name: 'Decisiones de Diseño', level: 1 },
                { name: 'Formato de Instrucción', level: 2 },
                { name: 'Fijo (RISC)', level: 3 },
                { name: 'Variable (CISC)', level: 3 },
                { name: 'Cantidad de Direcciones', level: 2 },
                { name: 'Tipos de Operando (Numéricos, Caracteres, Lógicos)', level: 2 },
                { name: 'Repertorio de Operaciones (Cuántos, Cuáles, Complejidad)', level: 2 },
                { name: 'Registros (Número, Uso)', level: 2 },
                { name: 'Tipos de Operaciones', level: 1 },
                { name: 'Procesamiento de Datos (Aritméticas/Lógicas)', level: 2 },
                { name: 'Transferencia de Datos (Memoria/E/S)', level: 2 },
                { name: 'Control (Salto/Flujo)', level: 2 },
                { name: 'Conversión (Formato de Datos)', level: 2 },
                { name: 'Modos de Direccionamiento (MDD)', level: 1 },
                { name: 'Inmediato', level: 2 },
                { name: 'Directo', level: 2 },
                { name: 'Indirecto', level: 2 },
                { name: 'Registro', level: 2 },
                { name: 'Registro Indirecto', level: 2 },
                { name: 'Desplazamiento', level: 2 },
                { name: 'Pila', level: 2 }
            ]
        },
        {
            id: 4,
            name: 'Control de E/S y Buses',
            icon: '🔌',
            topics: [
                { name: 'Bus del Sistema', level: 1 },
                { name: 'Bus de Datos (Anchura)', level: 2 },
                { name: 'Bus de Dirección (Máx. Capacidad de Memoria)', level: 2 },
                { name: 'Bus de Control (Ordenes, Temporización)', level: 2 },
                { name: 'Sincronización (Síncrono vs Asíncrono)', level: 2 },
                { name: 'Módulos de E/S', level: 1 },
                { name: 'Funciones (Control, Comunicación CPU/Memoria, Buffering)', level: 2 },
                { name: 'Acceso a E/S', level: 2 },
                { name: 'E/S Asignada en Memoria (Memory-Mapped)', level: 3 },
                { name: 'E/S Aislada (Separada de Memoria)', level: 3 },
                { name: 'Técnicas de Gestión de E/S', level: 1 },
                { name: 'E/S Programada (CPU Ociosa, Comprobación Periódica)', level: 2 },
                { name: 'E/S con Interrupciones (CPU Continúa Procesando)', level: 2 },
                { name: 'Acceso Directo a Memoria (DMA)', level: 2 },
                { name: 'Controlador DMA (DMAC)', level: 3 },
                { name: 'Modo Ráfaga (Burst)', level: 3 },
                { name: 'Modo Robo de Ciclo (Cycle-Stealling)', level: 3 },
                { name: 'Canales de E/S (Selector/Multiplexor)', level: 3 },
                { name: 'Interrupciones', level: 1 },
                { name: 'Tipos (Hardware, Software, Traps/Excepciones)', level: 2 },
                { name: 'Pasos del Gestor (Salvar Estado, Tratar Causa, Restaurar Estado)', level: 2 },
                { name: 'Prioridades (Múltiples Interrupciones)', level: 2 },
                { name: 'Controlador PIC (Gestión Externa, Vectorizado)', level: 2 },
                { name: 'Vector de Interrupciones (Direcciones de Rutinas)', level: 2 }
            ]
        },
        {
            id: 5,
            name: 'Segmentación y Paralelismo (Pipeline)',
            icon: '⚡',
            topics: [
                { name: 'Ciclo de Instrucción Segmentado (nanoMIPS)', level: 1 },
                { name: 'Fase F (Búsqueda de Instrucción/MI)', level: 2 },
                { name: 'Fase D (Decodificación/Acceso a Registros)', level: 2 },
                { name: 'Fase X (Ejecución/ALU)', level: 2 },
                { name: 'Fase M (Acceso a Memoria/MD)', level: 2 },
                { name: 'Fase W (Escritura en Registro/Writeback)', level: 2 },
                { name: 'Riesgos (Stalls)', level: 1 },
                { name: 'Riesgos Estructurales', level: 2 },
                { name: 'Causa: Conflicto por Recursos Compartidos', level: 3 },
                { name: 'Solución: Duplicación de Recursos (MI/MD), Turnos', level: 3 },
                { name: 'Dependencia de Datos', level: 2 },
                { name: 'RAW (Read After Write)', level: 3 },
                { name: 'WAR (Write After Read, Anti-Dependencia)', level: 3 },
                { name: 'WAW (Write After Write, Salida)', level: 3 },
                { name: 'Solución Hardware: Adelantamiento (Forwarding)', level: 3 },
                { name: 'Solución Software: NOP o Reordenación de Código', level: 3 },
                { name: 'Dependencia de Control', level: 2 },
                { name: 'Causa: Instrucciones de Salto', level: 3 },
                { name: 'Solución: Predicción de Saltos (Estática/Dinámica)', level: 3 },
                { name: 'Solución: Salto Retardado (NOP/Reordenación)', level: 3 },
                { name: 'Técnicas de Aceleración', level: 1 },
                { name: 'Supersegmentación (Más Etapas, Ciclo de Reloj Rápido)', level: 2 },
                { name: 'Superescalar', level: 2 },
                { name: 'Multiples Cauces Independientes', level: 3 },
                { name: 'Emisión Multiple de Instrucciones', level: 3 },
                { name: 'Ventana de Instrucciones', level: 3 },
                { name: 'Renombramiento de Registros (Elimina WAR/WAW)', level: 3 },
                { name: 'Planificación Dinámica Distribuida (Tomasulo)', level: 2 },
                { name: 'Estaciones de Reserva', level: 3 },
                { name: 'Common Data Bus (CDB)', level: 3 },
                { name: 'Ejecución Fuera de Orden', level: 3 }
            ]
        },
        {
            id: 6,
            name: 'Sistemas de Múltiples Procesadores',
            icon: '🔄',
            topics: [
                { name: 'Taxonomía de Flynn (MIMD)', level: 1 },
                { name: 'Memoria Compartida (Fuertemente Acoplada)', level: 2 },
                { name: 'SMP (Acceso Uniforme - UMA)', level: 3 },
                { name: 'NUMA (Acceso No Uniforme)', level: 3 },
                { name: 'Problemas: Coherencia de Caché, Sincronización', level: 3 },
                { name: 'Memoria Distribuida (Débilmente Acoplada)', level: 2 },
                { name: 'Clusters (Nodos Completos)', level: 3 },
                { name: 'Comunicación: Paso de Mensajes (Send/Receive)', level: 3 },
                { name: 'Coherencia de Caché (MP)', level: 1 },
                { name: 'Protocolos de Sondeo (Snoopy)', level: 2 },
                { name: 'Protocolos Basados en Invalidación', level: 2 },
                { name: 'Protocolo MESI (Modified, Exclusive, Shared, Invalid)', level: 3 },
                { name: 'Protocolos de Actualización', level: 2 },
                { name: 'Procesamiento Multihebra (Multithreading)', level: 1 },
                { name: 'Explotación de Paralelismo a Nivel de Hilo (TLP)', level: 2 },
                { name: 'Hilos (Threads) vs Procesos', level: 2 }
            ]
        }
    ]
};

let appState = createDefaultState();
let timerIntervalId = null;
let lastAchievementsCheckMs = 0;
let lastSaveMs = 0;
let isDarkMode = false;
let currentSubject = null;

const pomodoroModeSelect = document.getElementById('pomodoroMode');
const alarmModeSelect = document.getElementById('alarmMode');
const themeToggleBtn = document.getElementById('themeToggleBtn');

const categoriesContainer = document.getElementById('categoriesContainer');
const subjectPercentage = document.getElementById('subjectPercentage');
const subjectProgress = document.getElementById('subjectProgress');
const resetBtn = document.getElementById('resetBtn');

const timerDisplay = document.getElementById('timerDisplay');
const streakDisplay = document.getElementById('streakDisplay');
const multiplierDisplay = document.getElementById('multiplierDisplay');
const difficultySelect = document.getElementById('difficultySelect');
const timerToggleBtn = document.getElementById('timerToggleBtn');
const timerStopBtn = document.getElementById('timerStopBtn');

const streakAvatar = document.getElementById('streakAvatar');
const avatarCaption = document.getElementById('avatarCaption');

const levelText = document.getElementById('levelText');
const xpText = document.getElementById('xpText');
const xpFill = document.getElementById('xpFill');
const skillPointsText = document.getElementById('skillPointsText');
const focusTodayText = document.getElementById('focusTodayText');

const mapContainer = document.getElementById('mapContainer');
const skillTreeContainer = document.getElementById('skillTreeContainer');
const statsContainer = document.getElementById('statsContainer');
const achievementsContainer = document.getElementById('achievementsContainer');
const sessionsContainer = document.getElementById('sessionsContainer');

const subjectList = document.getElementById('subjectList');
const addSubjectBtn = document.getElementById('addSubjectBtn');
const addSubjectModal = document.getElementById('addSubjectModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const confirmAddSubjectBtn = document.getElementById('confirmAddSubjectBtn');
const subjectNameInput = document.getElementById('subjectName');
const subjectIconInput = document.getElementById('subjectIcon');
const subjectColorInput = document.getElementById('subjectColor');
const subjectTitle = document.getElementById('subjectTitle');

const addSubjectTabManual = document.getElementById('addSubjectTabManual');
const addSubjectTabImport = document.getElementById('addSubjectTabImport');
const addSubjectManualSection = document.getElementById('addSubjectManualSection');
const addSubjectImportSection = document.getElementById('addSubjectImportSection');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const subjectCategoriesBuilder = document.getElementById('subjectCategoriesBuilder');
const subjectImportFile = document.getElementById('subjectImportFile');
const subjectImportStatus = document.getElementById('subjectImportStatus');

const confirmModal = document.getElementById('confirmModal');
const confirmModalTitle = document.getElementById('confirmModalTitle');
const confirmModalText = document.getElementById('confirmModalText');
const confirmModalCloseBtn = document.getElementById('confirmModalCloseBtn');
const confirmModalCancelBtn = document.getElementById('confirmModalCancelBtn');
const confirmModalConfirmBtn = document.getElementById('confirmModalConfirmBtn');
const subjectSubtitle = document.getElementById('subjectSubtitle');
const editSubjectBtn = document.getElementById('editSubjectBtn');
const deleteSubjectBtn = document.getElementById('deleteSubjectBtn');

const editSubjectModal = document.getElementById('editSubjectModal');
const closeEditSubjectModalBtn = document.getElementById('closeEditSubjectModalBtn');
const cancelEditSubjectModalBtn = document.getElementById('cancelEditSubjectModalBtn');
const confirmEditSubjectModalBtn = document.getElementById('confirmEditSubjectModalBtn');
const editSubjectTabDetails = document.getElementById('editSubjectTabDetails');
const editSubjectTabStructure = document.getElementById('editSubjectTabStructure');
const editSubjectTabAchievements = document.getElementById('editSubjectTabAchievements');
const editSubjectTabReset = document.getElementById('editSubjectTabReset');
const editSubjectDetailsSection = document.getElementById('editSubjectDetailsSection');
const editSubjectStructureSection = document.getElementById('editSubjectStructureSection');
const editSubjectAchievementsSection = document.getElementById('editSubjectAchievementsSection');
const editSubjectResetSection = document.getElementById('editSubjectResetSection');
const editSubjectNameInput = document.getElementById('editSubjectName');
const editSubjectIconInput = document.getElementById('editSubjectIcon');
const editSubjectColorInput = document.getElementById('editSubjectColor');
const editAddCategoryBtn = document.getElementById('editAddCategoryBtn');
const editSubjectCategoriesBuilder = document.getElementById('editSubjectCategoriesBuilder');
const resetSubjectBtn = document.getElementById('resetSubjectBtn');

const customAchievementsList = document.getElementById('customAchievementsList');
const customAchTitle = document.getElementById('customAchTitle');
const customAchDesc = document.getElementById('customAchDesc');
const customAchType = document.getElementById('customAchType');
const customAchValueRow = document.getElementById('customAchValueRow');
const customAchValue = document.getElementById('customAchValue');
const customAchCategoryRow = document.getElementById('customAchCategoryRow');
const customAchCategory = document.getElementById('customAchCategory');
const addCustomAchievementBtn = document.getElementById('addCustomAchievementBtn');
const customAchStatus = document.getElementById('customAchStatus');

const totalSubjectsEl = document.getElementById('totalSubjects');
const totalTimeEl = document.getElementById('totalTime');
const totalAchievementsEl = document.getElementById('totalAchievements');
const globalProgressEl = document.getElementById('globalProgress');
const recentSubjectsGrid = document.getElementById('recentSubjectsGrid');
const quickAddSubject = document.getElementById('quickAddSubject');
const quickStartSession = document.getElementById('quickStartSession');
const quickViewStats = document.getElementById('quickViewStats');
const quickResetAll = document.getElementById('quickResetAll');

const MAX_SESSIONS_DISPLAY = 20;

let addSubjectDraft = null;
let pendingConfirmResolve = null;
let editSubjectDraft = null;
let editingSubjectId = null;

function showConfirmModalV2(options = null) {
    if (!confirmModal || !confirmModalConfirmBtn || !confirmModalCancelBtn || !confirmModalCloseBtn) {
        return Promise.resolve(confirm(options?.fallbackText ?? '¿Confirmar?'));
    }

    // If another confirm is open, resolve it as cancelled to avoid stacking handlers.
    if (pendingConfirmResolve) {
        try {
            pendingConfirmResolve(false);
        } catch {
            // ignore
        }
        pendingConfirmResolve = null;
        confirmModal.classList.remove('active');
    }

    const title = options?.title ?? 'Confirmar';
    const text = options?.text ?? '¿Estás seguro?';
    const confirmText = options?.confirmText ?? 'Confirmar';
    const cancelText = options?.cancelText ?? 'Cancelar';

    if (confirmModalTitle) confirmModalTitle.textContent = title;
    if (confirmModalText) confirmModalText.textContent = text;
    confirmModalConfirmBtn.textContent = confirmText;
    confirmModalCancelBtn.textContent = cancelText;

    confirmModal.classList.add('active');

    return new Promise((resolve) => {
        pendingConfirmResolve = resolve;

        const cleanup = (value) => {
            confirmModalCancelBtn.removeEventListener('click', onCancel);
            confirmModalConfirmBtn.removeEventListener('click', onConfirm);
            confirmModalCloseBtn.removeEventListener('click', onClose);
            confirmModal.removeEventListener('click', onBackdrop);
            document.removeEventListener('keydown', onKeydown);

            if (!pendingConfirmResolve) return;
            pendingConfirmResolve = null;
            confirmModal.classList.remove('active');
            resolve(value);
        };

        const onCancel = () => cleanup(false);
        const onConfirm = () => cleanup(true);
        const onClose = () => cleanup(false);
        const onBackdrop = (e) => {
            if (e.target === confirmModal) cleanup(false);
        };
        const onKeydown = (e) => {
            if (e.key === 'Escape') cleanup(false);
        };

        confirmModalCancelBtn.addEventListener('click', onCancel);
        confirmModalConfirmBtn.addEventListener('click', onConfirm);
        confirmModalCloseBtn.addEventListener('click', onClose);
        confirmModal.addEventListener('click', onBackdrop);
        document.addEventListener('keydown', onKeydown);

        try {
            confirmModalConfirmBtn.focus();
        } catch {
            // ignore
        }
    });
}

function createDefaultState() {
    return {
        version: APP_VERSION,
        subjects: [],
        globalMeta: {
            xp: 0,
            level: 1,
            skillPoints: 0,
            unlockedSkills: [],
            achievements: {},
            totalFocusSeconds: 0,
            sessionsCount: 0,
            longestSessionSeconds: 0,
            dailyFocusSeconds: {},
            sessions: []
        }
    };
}

function createSubject(id, name, icon, color) {
    return {
        id: id,
        name: name,
        icon: icon,
        color: color,
        categories: [],
        meta: {
            difficulty: 'normal',
            xp: 0,
            level: 1,
            skillPoints: 0,
            unlockedSkills: [],
            achievements: {},
            totalFocusSeconds: 0,
            sessionsCount: 0,
            longestSessionSeconds: 0,
            dailyFocusSeconds: {},
            sessions: [],
            timer: {
                running: false,
                sessionSeconds: 0,
                streakSeconds: 0,
                xpCarrySeconds: 0,
                lastTickMs: null,
                pausedAtMs: null,
                currentSessionStartMs: null
            }
        }
    };
}

function createSubjectFromInitialData() {
    const subject = createSubject(1, 'Arquitectura y Organización de Computadoras', '💻', '#667eea');
    subject.categories = initialArchitectureData.categories.map(category => ({
        ...category,
        topics: category.topics.map(topic => ({
            name: topic.name,
            level: topic.level ?? 1,
            completed: false,
            completedAt: null,
            reviews: []
        }))
    }));
    return subject;
}

function normalizeLoadedState(loaded) {
    const base = createDefaultState();

    if (!loaded || typeof loaded !== 'object') {
        base.subjects.push(createSubjectFromInitialData());
        return base;
    }

    if (!loaded.version && Array.isArray(loaded.categories) && loaded.categories.length) {
        const subject = createSubject(1, 'Arquitectura y Organización de Computadoras', '💻', '#667eea');
        subject.categories = loaded.categories.map(category => ({
            id: category.id,
            name: category.name,
            icon: category.icon,
            topics: (category.topics || []).map(t => ({
                name: t.name ?? String(t),
                level: t.level ?? 1,
                completed: !!t.completed,
                completedAt: t.completedAt ?? (t.completed ? Date.now() : null),
                reviews: Array.isArray(t.reviews) ? t.reviews : []
            }))
        }));
        base.subjects.push(subject);
        return base;
    }

    const merged = {
        ...base,
        ...loaded,
        globalMeta: {
            ...base.globalMeta,
            ...(loaded.globalMeta || {})
        }
    };

    if (!Array.isArray(merged.subjects) || merged.subjects.length === 0) {
        merged.subjects.push(createSubjectFromInitialData());
    } else {
        merged.subjects = merged.subjects.map(subject => ({
            ...createSubject(subject.id || Date.now(), subject.name || 'Materia', subject.icon || '📚', subject.color || '#667eea'),
            ...subject,
            categories: (subject.categories || []).map(category => ({
                ...category,
                topics: (category.topics || []).map(t => ({
                    name: t.name,
                    level: t.level ?? 1,
                    completed: !!t.completed,
                    completedAt: t.completedAt ?? (t.completed ? Date.now() : null),
                    reviews: Array.isArray(t.reviews) ? t.reviews : []
                }))
            })),
            meta: {
                ...createSubject(subject.id, subject.name, subject.icon, subject.color).meta,
                ...(subject.meta || {}),
                timer: {
                    ...createSubject(subject.id, subject.name, subject.icon, subject.color).meta.timer,
                    ...((subject.meta && subject.meta.timer) ? subject.meta.timer : {}),
                    running: false,
                    lastTickMs: null
                }
            }
        }));
    }

    return merged;
}

function safeJsonParse(text) {
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

function loadData() {
    // Intentar cargar datos existentes primero
    const savedV2 = localStorage.getItem(STORAGE_KEY_V2);
    if (savedV2) {
        try {
            const loaded = JSON.parse(savedV2);
            appState = normalizeLoadedState(loaded);
            console.log('✓ Datos cargados desde localStorage V2');
            return;
        } catch (e) {
            console.error('✗ Error al parsear datos V2:', e);
        }
    }

    // Si no hay datos V2, intentar V1
    const savedV1 = localStorage.getItem(STORAGE_KEY_V1);
    if (savedV1) {
        try {
            const loaded = JSON.parse(savedV1);
            appState = normalizeLoadedState(loaded);
            console.log('✓ Datos cargados desde localStorage V1');
            return;
        } catch (e) {
            console.error('✗ Error al parsear datos V1:', e);
        }
    }

    // Si no hay datos guardados, crear estado por defecto
    console.log('Creando novo estado por defecto con datos iniciales');
    appState = createDefaultState();
    const subject = createSubjectFromInitialData();
    appState.subjects.push(subject);
    console.log('appState después de agregar materia:', appState);
}

function saveData(force = false) {
    const now = Date.now();
    if (!force && now - lastSaveMs < 1500) return;
    lastSaveMs = now;
    try {
        localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(appState));
        console.log('✓ Progreso guardado automáticamente', new Date().toLocaleTimeString());
    } catch (e) {
        console.error('✗ Error al guardar progreso:', e);
    }
}

async function resetData() {
    const ok = await showConfirmModalV2({
        title: '🧨 Reiniciar TODO',
        text: 'Esto borra TODAS las materias, temas/subtemas, sesiones, XP y logros. No se puede deshacer.',
        confirmText: 'Sí, reiniciar todo',
        cancelText: 'Cancelar',
        fallbackText: '¿Reiniciar TODO?'
    });
    if (!ok) return;
    appState = createDefaultState();
    appState.subjects.push(createSubjectFromInitialData());
    saveData(true);
    currentSubject = null;
    renderAll();
    showNotification('Progreso reiniciado.');
}

function todayKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function formatHMS(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds));
    const hh = String(Math.floor(s / 3600)).padStart(2, '0');
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
}

function formatMS(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds));
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
}

function round2(n) {
    return Math.round(n * 100) / 100;
}

function xpToNextLevel(level) {
    return Math.floor(120 + (level - 1) * 55 + (level - 1) * (level - 1) * 4);
}

function escapeHtml(text) {
    return String(text)
        .replaceAll('&', '&')
        .replaceAll('<', '<')
        .replaceAll('>', '>')
        .replaceAll('"', '"')
        .replaceAll("'", '&#039;');
}

function renderCategories() {
    if (!currentSubject) {
        categoriesContainer.innerHTML = '';
        return;
    }

    categoriesContainer.innerHTML = '';

    for (const category of currentSubject.categories) {
        const card = document.createElement('div');
        card.className = 'category-card';

        const totalTopics = category.topics.length;
        const completedTopics = category.topics.filter(t => t.completed).length;
        const progress = totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0;

        card.innerHTML = `
            <div class="category-header">
                <div class="category-title">
                    <div class="category-icon">${category.icon}</div>
                    ${escapeHtml(category.name)}
                </div>
            </div>

            <div class="category-progress">
                <div class="progress-header">
                    <span>Progreso</span>
                    <span class="progress-percentage">${progress}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
            </div>

            <ul class="topics-list" id="topics-${category.id}">
                ${category.topics.map((topic, topicIndex) => {
                    const id = `topic-${category.id}-${topicIndex}`;
                    return `
                        <li class="topic-item ${topic.completed ? 'completed' : ''}"
                            id="${id}"
                            data-category-id="${category.id}"
                            data-topic-index="${topicIndex}"
                            style="padding-left: ${(topic.level - 1) * 20}px">
                            <div class="topic-checkbox"></div>
                            <div class="topic-name">${escapeHtml(topic.name)}</div>
                        </li>
                    `;
                }).join('')}
            </ul>
        `;

        categoriesContainer.appendChild(card);
    }
}

function updateSubjectProgress() {
    if (!currentSubject) {
        subjectPercentage.textContent = '0%';
        subjectProgress.style.width = '0%';
        return;
    }

    let totalTopics = 0;
    let completedTopics = 0;

    for (const category of currentSubject.categories) {
        totalTopics += category.topics.length;
        completedTopics += category.topics.filter(t => t.completed).length;
    }

    const subjectProgressPct = totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0;
    subjectPercentage.textContent = `${subjectProgressPct}%`;
    subjectProgress.style.width = `${subjectProgressPct}%`;
}

function renderMap() {
    if (!currentSubject) {
        mapContainer.innerHTML = '';
        return;
    }

    mapContainer.innerHTML = '';

    for (const category of currentSubject.categories) {
        for (let i = 0; i < category.topics.length; i++) {
            const topic = category.topics[i];
            const status = topic.completed ? 'done' : 'pending';

            const marker = document.createElement('button');
            marker.type = 'button';
            marker.className = `map-marker ${status}`;
            marker.innerHTML = `
                <div class="marker-title">${escapeHtml(topic.name)}</div>
                <div class="marker-sub">${escapeHtml(category.name)}</div>
            `;

            marker.addEventListener('click', () => {
                setActiveView('listView');
                const el = document.getElementById(`topic-${category.id}-${i}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });

            mapContainer.appendChild(marker);
        }
    }
}

function renderSkillTree() {
    if (!currentSubject) {
        skillTreeContainer.innerHTML = '';
        return;
    }

    skillTreeContainer.innerHTML = '';

    for (const skill of SKILLS) {
        const unlocked = currentSubject.meta.unlockedSkills.includes(skill.id);
        const canUnlock = !unlocked && currentSubject.meta.skillPoints >= skill.cost && currentSubject.meta.level >= skill.reqLevel;

        const card = document.createElement('div');
        card.className = `card ${unlocked ? '' : 'locked'}`;
        card.innerHTML = `
            <div class="card-title">${escapeHtml(skill.title)}</div>
            <div class="card-desc">${escapeHtml(skill.desc)}</div>
            <div class="card-meta">
                <span>Req: Lv ${skill.reqLevel} · Cost: ${skill.cost} SP</span>
                <button class="btn btn-secondary btn-small" type="button" ${canUnlock ? '' : 'disabled'} data-skill-id="${skill.id}">
                    ${unlocked ? 'Desbloqueado' : 'Desbloquear'}
                </button>
            </div>
        `;

        const btn = card.querySelector('button[data-skill-id]');
        btn.addEventListener('click', () => unlockSkill(skill.id));

        skillTreeContainer.appendChild(card);
    }
}

function unlockSkill(skillId) {
    if (!currentSubject) return;
    
    const skill = SKILLS.find(s => s.id === skillId);
    if (!skill) return;
    if (currentSubject.meta.unlockedSkills.includes(skillId)) return;
    if (currentSubject.meta.level < skill.reqLevel) return;
    if (currentSubject.meta.skillPoints < skill.cost) return;

    currentSubject.meta.skillPoints -= skill.cost;
    currentSubject.meta.unlockedSkills.push(skillId);
    saveData(true);
    renderSkillTree();
    updateXpUi();
    showNotification(`Habilidad desbloqueada: ${skill.title}`);
}

function prettyTime(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

function renderStats() {
    if (!currentSubject) {
        statsContainer.innerHTML = '';
        return;
    }

    const today = todayKey();
    const focusTodaySeconds = currentSubject.meta.dailyFocusSeconds[today] ?? 0;

    const items = [
        { title: 'Tiempo total', value: prettyTime(currentSubject.meta.totalFocusSeconds) },
        { title: 'Hoy', value: prettyTime(focusTodaySeconds) },
        { title: 'Sesiones', value: String(currentSubject.meta.sessionsCount) },
        { title: 'Mejor sesión', value: prettyTime(currentSubject.meta.longestSessionSeconds) },
        { title: 'Repasos pendientes', value: '0' }
    ];

    statsContainer.innerHTML = items.map(x => `
        <div class="card">
            <div class="card-title">${escapeHtml(x.title)}</div>
            <div class="card-desc">${escapeHtml(x.value)}</div>
        </div>
    `).join('');

    focusTodayText.textContent = `Hoy: ${Math.floor(focusTodaySeconds / 60)}m`;
}

function achV2DateKeyFromDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function achV2AddDays(date, deltaDays) {
    const d = new Date(date);
    d.setDate(d.getDate() + deltaDays);
    return d;
}

function achV2ConsecutiveDayStreak(dailyFocusSeconds, now) {
    if (!dailyFocusSeconds || typeof dailyFocusSeconds !== 'object') return 0;

    let streak = 0;
    for (let i = 0; i < 370; i++) {
        const key = achV2DateKeyFromDate(achV2AddDays(now, -i));
        const seconds = dailyFocusSeconds[key] ?? 0;
        if (seconds > 0) streak += 1;
        else break;
    }
    return streak;
}

function achV2DaysStudiedInMonth(dailyFocusSeconds, now) {
    if (!dailyFocusSeconds || typeof dailyFocusSeconds !== 'object') return 0;

    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `${y}-${m}-`;

    let days = 0;
    for (const [key, seconds] of Object.entries(dailyFocusSeconds)) {
        if (!key.startsWith(prefix)) continue;
        if ((seconds ?? 0) > 0) days += 1;
    }
    return days;
}

function achV2SubjectCompletionPercentage(subject) {
    if (!subject || !Array.isArray(subject.categories)) return 0;

    let total = 0;
    let done = 0;
    for (const category of subject.categories) {
        total += category.topics.length;
        done += category.topics.filter(t => t.completed).length;
    }
    return total > 0 ? (done / total) * 100 : 0;
}

function unlockAchievementV2(achievementId, options = null) {
    if (!appState?.globalMeta?.achievements) return false;
    if (appState.globalMeta.achievements[achievementId]) return false;

    appState.globalMeta.achievements[achievementId] = Date.now();

    const a = ACHIEVEMENTS.find(x => x.id === achievementId);
    if (a && !options?.silent) {
        showNotification(`🏆 Logro: ${a.title}`);
    }

    renderAchievementsV2();
    renderHomePage();
    saveData(true);
    return true;
}

function unlockSubjectAchievementV2(subject, achievementId, options = null) {
    if (!subject) return false;
    if (!subject.meta) subject.meta = {};
    if (!subject.meta.achievements) subject.meta.achievements = {};
    if (subject.meta.achievements[achievementId]) return false;

    subject.meta.achievements[achievementId] = Date.now();

    if (!options?.silent) {
        const defs = subjectAchievementDefinitionsV2(subject);
        const a = defs.find(x => x.id === achievementId);
        if (a) showNotification(`🏆 Logro (${subject.name ?? 'Materia'}): ${a.title}`);
    }

    renderAchievementsV2();
    renderHomePage();
    saveData(true);
    return true;
}

function subjectTopicStatsV2(subject) {
    let total = 0;
    let done = 0;

    for (const category of subject?.categories ?? []) {
        if (!category || !Array.isArray(category.topics)) continue;
        total += category.topics.length;
        done += category.topics.filter(t => t.completed).length;
    }

    const pct = total > 0 ? (done / total) * 100 : 0;
    return { total, done, pct };
}

function checkSubjectAchievementsV2(subject, context = null) {
    if (!subject) return;
    const silent = !!context?.silent;

    const defs = subjectAchievementDefinitionsV2(subject);
    if (defs.length === 0) return;

    const { done, pct } = subjectTopicStatsV2(subject);
    const focusMinutes = Math.floor((subject?.meta?.totalFocusSeconds ?? 0) / 60);

    for (const a of defs) {
        if (subject?.meta?.achievements?.[a.id]) continue;

        if (a.kind === 'progress') {
            if (a.condition === 'first_topic' && done >= 1) {
                unlockSubjectAchievementV2(subject, a.id, { silent });
            } else if (a.condition === '25_percent' && pct >= 25) {
                unlockSubjectAchievementV2(subject, a.id, { silent });
            } else if (a.condition === '50_percent' && pct >= 50) {
                unlockSubjectAchievementV2(subject, a.id, { silent });
            } else if (a.condition === '75_percent' && pct >= 75) {
                unlockSubjectAchievementV2(subject, a.id, { silent });
            } else if (a.condition === '100_percent' && pct >= 100) {
                unlockSubjectAchievementV2(subject, a.id, { silent });
            }
            continue;
        }

        if (a.kind === 'category') {
            const category = subject.categories?.find(c => c.id === a.categoryId);
            if (category && Array.isArray(category.topics) && category.topics.length > 0 && category.topics.every(t => t.completed)) {
                unlockSubjectAchievementV2(subject, a.id, { silent });
            }
        }

        if (a.kind === 'custom') {
            if (a.type === 'pct') {
                const threshold = Number(a.value);
                if (Number.isFinite(threshold) && pct >= threshold) unlockSubjectAchievementV2(subject, a.id, { silent });
            } else if (a.type === 'focus_minutes') {
                const threshold = Number(a.value);
                if (Number.isFinite(threshold) && focusMinutes >= threshold) unlockSubjectAchievementV2(subject, a.id, { silent });
            } else if (a.type === 'category_complete') {
                const category = subject.categories?.find(c => c.id === a.categoryId);
                if (category && Array.isArray(category.topics) && category.topics.length > 0 && category.topics.every(t => t.completed)) {
                    unlockSubjectAchievementV2(subject, a.id, { silent });
                }
            }
        }
    }
}

function checkAchievementsV2(context = null) {
    if (!appState) return;

    const now = new Date(context?.nowMs ?? Date.now());
    const activity = context?.activity ?? 'generic';
    const isTimerEvent = activity.startsWith('timer');
    const streakSeconds = context?.streakSeconds ?? currentSubject?.meta?.timer?.streakSeconds ?? 0;
    const silent = !!context?.silent;

    let totalTopics = 0;
    let completedTopics = 0;

    for (const subject of appState.subjects) {
        for (const category of subject.categories) {
            totalTopics += category.topics.length;
            completedTopics += category.topics.filter(t => t.completed).length;
        }
    }

    const completionPercentage = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;
    const currentSubjectPercentage = currentSubject ? achV2SubjectCompletionPercentage(currentSubject) : 0;
    const bestSubjectPercentage = appState.subjects.reduce((max, s) => Math.max(max, achV2SubjectCompletionPercentage(s)), 0);
    const progressPercentage = Math.max(completionPercentage, currentSubjectPercentage, bestSubjectPercentage);

    const totalFocus = appState.globalMeta.totalFocusSeconds;
    const sessionsCount = appState.globalMeta.sessionsCount;
    const unlockedCount = Object.keys(appState.globalMeta.achievements ?? {}).length;

    for (const a of ACHIEVEMENTS) {
        if (appState.globalMeta.achievements[a.id]) continue;

        if (a.kind === 'total' && totalFocus >= a.seconds) {
            unlockAchievementV2(a.id, { silent });
            continue;
        }

        if (a.kind === 'streak' && isTimerEvent && streakSeconds >= a.seconds) {
            unlockAchievementV2(a.id, { silent });
            continue;
        }

        if (a.kind === 'progress') {
            if (a.condition === 'first_topic' && completedTopics >= 1) {
                unlockAchievementV2(a.id, { silent });
            } else if (a.condition === '25_percent' && progressPercentage >= 25) {
                unlockAchievementV2(a.id, { silent });
            } else if (a.condition === '50_percent' && progressPercentage >= 50) {
                unlockAchievementV2(a.id, { silent });
            } else if (a.condition === '75_percent' && progressPercentage >= 75) {
                unlockAchievementV2(a.id, { silent });
            } else if (a.condition === '100_percent' && progressPercentage >= 100) {
                unlockAchievementV2(a.id, { silent });
            }
            continue;
        }

        if (a.kind === 'time' && isTimerEvent) {
            if (a.condition === 'before_8am' && now.getHours() < 8) {
                unlockAchievementV2(a.id, { silent });
            } else if (a.condition === 'after_10pm' && now.getHours() >= 22) {
                unlockAchievementV2(a.id, { silent });
            } else if (a.condition === '3_days_streak') {
                const dayStreak = achV2ConsecutiveDayStreak(appState.globalMeta.dailyFocusSeconds, now);
                if (dayStreak >= 3) unlockAchievementV2(a.id, { silent });
            } else if (a.condition === '7_days_streak') {
                const dayStreak = achV2ConsecutiveDayStreak(appState.globalMeta.dailyFocusSeconds, now);
                if (dayStreak >= 7) unlockAchievementV2(a.id, { silent });
            } else if (a.condition === '20_days_month') {
                const daysInMonth = achV2DaysStudiedInMonth(appState.globalMeta.dailyFocusSeconds, now);
                if (daysInMonth >= 20) unlockAchievementV2(a.id, { silent });
            }
            continue;
        }

        if (a.kind === 'topic') {
            // Logros "topic" legacy (para datos iniciales) fueron reemplazados por logros dinámicos por materia.
            continue;
        }

        if (a.kind === 'special') {
            if (a.condition === 'first_10_xp' && appState.globalMeta.xp >= 10) {
                unlockAchievementV2(a.id, { silent });
            } else if (a.condition === '5_achievements' && unlockedCount >= 5) {
                unlockAchievementV2(a.id, { silent });
            } else if (a.condition === '15_achievements' && unlockedCount >= 15) {
                unlockAchievementV2(a.id, { silent });
            } else if (a.condition === '10_sessions' && sessionsCount >= 10) {
                unlockAchievementV2(a.id, { silent });
            } else if (a.condition === '50_sessions' && sessionsCount >= 50) {
                unlockAchievementV2(a.id, { silent });
            }
            continue;
        }
    }

    // Logros dinámicos por materia (se guardan dentro de cada materia; al eliminar la materia desaparecen).
    const targets = (activity === 'generic' || silent) ? (appState.subjects ?? []) : (currentSubject ? [currentSubject] : []);
    for (const s of targets) {
        checkSubjectAchievementsV2(s, { silent });
    }
}

function achievementV2GroupLabel(kind) {
    const labels = {
        progress: 'Progreso',
        total: 'Tiempo total',
        streak: 'Racha de sesión',
        time: 'Horarios y consistencia',
        special: 'Especiales',
        topic: 'Por materia'
    };
    return labels[kind] ?? 'Logros';
}

function isTopicAchievementForSubjectV2(achievement, subject) {
    if (achievement.kind !== 'topic') return false;
    if (!subject || !Array.isArray(subject.categories)) return false;

    const categoryIdByCondition = {
        complete_architecture: 1,
        complete_memory: 2,
        complete_instructions: 3,
        complete_io_buses: 4,
        complete_pipeline: 5,
        complete_multiproc: 6
    };

    const categoryId = categoryIdByCondition[achievement.condition] ?? null;
    if (!categoryId) return false;
    return subject.categories.some(c => c.id === categoryId);
}

function renderAchievementGroupTitleV2(container, text) {
    const title = document.createElement('div');
    title.className = 'achievement-group-title section-title';
    title.textContent = text;
    container.appendChild(title);
}

function ensureAchievementUiStateV2() {
    if (!appState) return {};
    if (!appState.globalMeta) appState.globalMeta = {};
    if (!appState.globalMeta.ui) appState.globalMeta.ui = {};
    if (!appState.globalMeta.ui.achievementGroups) appState.globalMeta.ui.achievementGroups = {};
    return appState.globalMeta.ui.achievementGroups;
}

function isAchievementGroupCollapsedV2(key, defaultCollapsed = false) {
    const store = ensureAchievementUiStateV2();
    if (!key) return !!defaultCollapsed;
    if (typeof store[key] !== 'boolean') store[key] = !!defaultCollapsed;
    return !!store[key];
}

function setAchievementGroupCollapsedV2(key, collapsed) {
    if (!key) return;
    const store = ensureAchievementUiStateV2();
    store[key] = !!collapsed;
}

function renderAchievementCollapsibleGroupV2(parentGrid, label, options = null) {
    const key = options?.key ?? null;
    const defaultCollapsed = !!options?.defaultCollapsed;

    const wrapper = document.createElement('div');
    wrapper.className = 'achievement-group';

    const collapsed = isAchievementGroupCollapsedV2(key, defaultCollapsed);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'achievement-group-toggle section-title';
    btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');

    const labelSpan = document.createElement('span');
    labelSpan.className = 'achievement-group-label';
    labelSpan.textContent = label;

    const chev = document.createElement('span');
    chev.className = 'achievement-group-chevron';
    chev.textContent = collapsed ? '▸' : '▾';

    btn.appendChild(labelSpan);
    btn.appendChild(chev);

    const content = document.createElement('div');
    content.className = 'achievement-group-content achievements-grid';
    content.hidden = collapsed;

    btn.addEventListener('click', () => {
        content.hidden = !content.hidden;
        const isCollapsed = content.hidden;
        chev.textContent = isCollapsed ? '▸' : '▾';
        btn.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
        setAchievementGroupCollapsedV2(key, isCollapsed);
    });

    wrapper.appendChild(btn);
    wrapper.appendChild(content);
    parentGrid.appendChild(wrapper);
    return content;
}

function renderAchievementCardV2(container, a, unlockedAt) {
    const unlocked = !!unlockedAt;
    const badge = unlocked ? '<span class="badge unlocked">Desbloqueado</span>' : '<span class="badge">Bloqueado</span>';
    const meta = unlocked ? `<div class="card-meta"><span>Desbloqueado: ${escapeHtml(formatDateTime(unlockedAt))}</span></div>` : '';

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <div class="card-title">${escapeHtml(a.title)} ${badge}</div>
        <div class="card-desc">${escapeHtml(a.desc)}</div>
        ${meta}
    `;
    container.appendChild(card);
}

function globalAchievementDefinitionsV2() {
    return (Array.isArray(ACHIEVEMENTS) ? ACHIEVEMENTS : []).filter(a => a.kind !== 'topic');
}

function subjectAchievementDefinitionsV2(subject) {
    if (!subject) return [];
    const subjectId = subject.id;
    const subjectName = subject.name ?? 'Materia';
    const subjectIcon = subject.icon ? `${subject.icon} ` : '';

    const defs = [
        { id: `subj_${subjectId}_first_topic`, title: `${subjectIcon}Primeros pasos`, desc: `Completá tu primer subtema en ${subjectName}`, kind: 'progress', condition: 'first_topic' },
        { id: `subj_${subjectId}_pct_25`, title: `${subjectIcon}En marcha`, desc: `Alcanzá el 25% de progreso en ${subjectName}`, kind: 'progress', condition: '25_percent' },
        { id: `subj_${subjectId}_pct_50`, title: `${subjectIcon}Mitad del camino`, desc: `Llegá al 50% de progreso en ${subjectName}`, kind: 'progress', condition: '50_percent' },
        { id: `subj_${subjectId}_pct_75`, title: `${subjectIcon}Casi ahí`, desc: `Alcanzá el 75% de progreso en ${subjectName}`, kind: 'progress', condition: '75_percent' },
        { id: `subj_${subjectId}_pct_100`, title: `${subjectIcon}Maestro`, desc: `Completá el 100% del contenido de ${subjectName}`, kind: 'progress', condition: '100_percent' }
    ];

    for (const category of subject.categories ?? []) {
        if (!category || !Array.isArray(category.topics) || category.topics.length === 0) continue;
        const catName = category.name ?? 'Tema';
        const catIcon = category.icon ?? '📌';
        defs.push({
            id: `subj_${subjectId}_cat_${category.id}_complete`,
            title: `${catIcon} Dominio: ${catName}`,
            desc: `Completar todos los subtemas de "${catName}"`,
            kind: 'category',
            condition: 'category_complete',
            categoryId: category.id
        });
    }

    const custom = Array.isArray(subject?.meta?.customAchievements) ? subject.meta.customAchievements : [];
    for (const a of custom) {
        if (!a || !a.id) continue;
        defs.push({
            id: String(a.id),
            title: String(a.title ?? 'Logro personalizado'),
            desc: String(a.desc ?? ''),
            kind: 'custom',
            type: a.type,
            value: a.value,
            categoryId: a.categoryId
        });
    }

    return defs;
}

function renderGlobalAchievementsGridV2(container) {
    if (!container) return;
    const unlockedById = appState?.globalMeta?.achievements ?? {};
    const allAchievements = globalAchievementDefinitionsV2();
    const knownIds = new Set(allAchievements.map(a => a.id));

    const kinds = ['progress', 'total', 'streak', 'time', 'special'];
    for (const kind of kinds) {
        const list = allAchievements.filter(a => a.kind === kind);
        if (list.length === 0) continue;
        const group = renderAchievementCollapsibleGroupV2(container, achievementV2GroupLabel(kind), {
            key: `global_${kind}`,
            defaultCollapsed: false
        });
        for (const a of list) {
            renderAchievementCardV2(group, a, unlockedById[a.id]);
        }
    }

    const legacy = Object.entries(unlockedById)
        .filter(([id]) => !knownIds.has(id))
        .map(([id, ts]) => ({ id, ts }))
        .sort((a, b) => b.ts - a.ts);

    if (legacy.length) {
        const group = renderAchievementCollapsibleGroupV2(container, 'Legacy (versiones anteriores)', {
            key: 'global_legacy',
            defaultCollapsed: true
        });

        for (const x of legacy) {
            renderAchievementCardV2(group, {
                id: x.id,
                title: `Legacy: ${x.id}`,
                desc: 'Logro de una versión anterior (se conserva por historial).',
                kind: 'legacy'
            }, x.ts);
        }
    }
}

function renderSubjectAchievementsGridV2(container, subject) {
    if (!container) return;
    if (!subject) return;

    const unlockedById = subject?.meta?.achievements ?? {};
    const defs = subjectAchievementDefinitionsV2(subject);

    const progress = defs.filter(d => d.kind === 'progress');
    const categories = defs.filter(d => d.kind === 'category');
    const custom = defs.filter(d => d.kind === 'custom');

    if (progress.length) {
        const group = renderAchievementCollapsibleGroupV2(container, 'Progreso de esta materia', {
            key: `subj_${subject.id}_group_progress`,
            defaultCollapsed: false
        });
        for (const a of progress) renderAchievementCardV2(group, a, unlockedById[a.id]);
    }

    if (categories.length) {
        const group = renderAchievementCollapsibleGroupV2(container, 'Temas completados', {
            key: `subj_${subject.id}_group_categories`,
            defaultCollapsed: true
        });
        for (const a of categories) renderAchievementCardV2(group, a, unlockedById[a.id]);
    }

    if (custom.length) {
        const group = renderAchievementCollapsibleGroupV2(container, 'Personalizados', {
            key: `subj_${subject.id}_group_custom`,
            defaultCollapsed: true
        });
        for (const a of custom) renderAchievementCardV2(group, a, unlockedById[a.id]);
    }
}

function renderAchievementsV2() {
    if (!achievementsContainer) return;
    achievementsContainer.innerHTML = '';
    if (!appState || !currentSubject) return;

    // En el Stats de una materia, solo mostramos logros de ESA materia.
    renderSubjectAchievementsGridV2(achievementsContainer, currentSubject);
}

function ensureHomeAchievementsPanelV2() {
    const homeView = document.getElementById('homeView');
    if (!homeView) return;

    const panelId = 'homeAchievementsPanel';
    let panel = document.getElementById(panelId);

    if (!panel) {
        panel = document.createElement('div');
        panel.className = 'panel';
        panel.id = panelId;
        panel.innerHTML = `
            <div class="panel-header">
                <div>
                    <h2 class="panel-title">Logros</h2>
                    <div class="panel-subtitle">Generales y por materia</div>
                </div>
                <button class="btn btn-secondary btn-small" id="homeAchievementsToggleBtn" type="button">Mostrar</button>
            </div>
            <div class="stats-grid" id="homeAchievementsSummary"></div>
            <div class="achievements-grid" id="homeAchievementsContainer" hidden></div>
        `;

        const insertBeforeEl = document.getElementById('recentSubjectsGrid')?.closest('.recent-subjects') ?? null;
        if (insertBeforeEl && insertBeforeEl.parentNode) {
            insertBeforeEl.parentNode.insertBefore(panel, insertBeforeEl);
        } else {
            homeView.querySelector('.home-container')?.appendChild(panel);
        }
    }

    const toggleBtn = document.getElementById('homeAchievementsToggleBtn');
    const listEl = document.getElementById('homeAchievementsContainer');
    if (toggleBtn && listEl && !toggleBtn.dataset.bound) {
        toggleBtn.dataset.bound = '1';
        toggleBtn.addEventListener('click', () => {
            listEl.hidden = !listEl.hidden;
            toggleBtn.textContent = listEl.hidden ? 'Mostrar' : 'Ocultar';
        });
    }

    const actionsGrid = homeView.querySelector('.actions-grid');
    if (actionsGrid && !document.getElementById('quickViewAchievements')) {
        const btn = document.createElement('button');
        btn.className = 'action-card';
        btn.id = 'quickViewAchievements';
        btn.type = 'button';
        btn.innerHTML = `
            <div class="action-icon">🏆</div>
            <div class="action-title">Ver Logros</div>
            <div class="action-desc">Revisa logros generales y por materia</div>
        `;
        actionsGrid.appendChild(btn);
    }

    const quickBtn = document.getElementById('quickViewAchievements');
    if (quickBtn && !quickBtn.dataset.bound) {
        quickBtn.dataset.bound = '1';
        quickBtn.addEventListener('click', () => {
            const list = document.getElementById('homeAchievementsContainer');
            const btn = document.getElementById('homeAchievementsToggleBtn');
            if (list) list.hidden = false;
            if (btn) btn.textContent = 'Ocultar';
            try {
                document.getElementById(panelId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } catch {
                // ignore
            }
        });
    }

    const statClickTarget = totalAchievementsEl?.closest('.stat-card') ?? totalAchievementsEl;
    if (statClickTarget && !statClickTarget.dataset.bound) {
        statClickTarget.dataset.bound = '1';
        statClickTarget.style.cursor = 'pointer';
        statClickTarget.title = 'Ver logros';
        statClickTarget.addEventListener('click', () => {
            const list = document.getElementById('homeAchievementsContainer');
            const btn = document.getElementById('homeAchievementsToggleBtn');
            if (list) list.hidden = false;
            if (btn) btn.textContent = 'Ocultar';
            try {
                document.getElementById(panelId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } catch {
                // ignore
            }
        });
    }
}

function renderHomeAchievementsV2() {
    const summaryEl = document.getElementById('homeAchievementsSummary');
    const listEl = document.getElementById('homeAchievementsContainer');
    if (!summaryEl || !listEl) return;
    if (!appState) {
        summaryEl.innerHTML = '';
        listEl.innerHTML = '';
        return;
    }

    const unlockedGlobal = appState.globalMeta?.achievements ?? {};
    const globalDefs = globalAchievementDefinitionsV2();
    const unlockedGlobalCount = globalDefs.reduce((sum, a) => sum + (unlockedGlobal[a.id] ? 1 : 0), 0);
    const totalGlobalCount = globalDefs.length;

    const perSubject = (appState.subjects ?? []).map(subject => {
        const defs = subjectAchievementDefinitionsV2(subject);
        const unlockedById = subject?.meta?.achievements ?? {};
        const unlocked = defs.filter(a => !!unlockedById[a.id]).length;
        return { subject, total: defs.length, unlocked };
    }).filter(x => x.total > 0);

    const titleById = new Map();
    for (const a of globalDefs) titleById.set(a.id, a.title);
    for (const subject of appState.subjects ?? []) {
        for (const a of subjectAchievementDefinitionsV2(subject)) {
            titleById.set(a.id, `${subject.icon ? `${subject.icon} ` : ''}${subject.name ?? 'Materia'}: ${a.title}`);
        }
    }

    const recentAll = [];
    for (const [id, ts] of Object.entries(unlockedGlobal)) {
        const title = titleById.get(id);
        if (title) recentAll.push({ title, ts });
    }
    for (const subject of appState.subjects ?? []) {
        for (const [id, ts] of Object.entries(subject?.meta?.achievements ?? {})) {
            const title = titleById.get(id);
            if (title) recentAll.push({ title, ts });
        }
    }

    const recent = recentAll
        .sort((a, b) => b.ts - a.ts)
        .slice(0, 3);

    summaryEl.innerHTML = `
        <div class="card">
            <div class="card-title">Generales</div>
            <div class="card-desc">${unlockedGlobalCount} / ${totalGlobalCount} desbloqueados</div>
        </div>
        ${perSubject.map(x => `
            <div class="card">
                <div class="card-title">${escapeHtml(x.subject.icon ? `${x.subject.icon} ` : '')}${escapeHtml(x.subject.name ?? 'Materia')}</div>
                <div class="card-desc">${x.unlocked} / ${x.total} logros de esta materia</div>
            </div>
        `).join('')}
        ${recent.length ? `
            <div class="card">
                <div class="card-title">Últimos desbloqueados</div>
                <div class="card-desc">
                    ${recent.map(r => `${escapeHtml(r.title)} · ${escapeHtml(formatDateTime(r.ts))}`).join('<br>')}
                </div>
            </div>
        ` : ''}
    `;

    listEl.innerHTML = '';
    renderGlobalAchievementsGridV2(listEl);

    for (const subject of appState.subjects ?? []) {
        const defs = subjectAchievementDefinitionsV2(subject);
        if (!defs.length) continue;

        const subjectGroup = renderAchievementCollapsibleGroupV2(
            listEl,
            `Materia: ${subject.icon ? `${subject.icon} ` : ''}${subject.name ?? 'Materia'}`,
            { key: `home_subj_${subject.id}`, defaultCollapsed: true }
        );
        renderSubjectAchievementsGridV2(subjectGroup, subject);
    }
}

function ensureHomeStatsPanelV2() {
    const homeView = document.getElementById('homeView');
    if (!homeView) return;

    const panelId = 'homeStatsPanel';
    let panel = document.getElementById(panelId);

    if (!panel) {
        panel = document.createElement('div');
        panel.className = 'panel';
        panel.id = panelId;
        panel.innerHTML = `
            <div class="panel-header">
                <div>
                    <h2 class="panel-title">Estadísticas Globales</h2>
                    <div class="panel-subtitle">Resumen total y por materia</div>
                </div>
                <button class="btn btn-secondary btn-small" id="homeStatsToggleBtn" type="button">Mostrar</button>
            </div>
            <div class="stats-grid" id="homeStatsSummary"></div>
            <div class="stats-grid" id="homeStatsDetails" hidden></div>
        `;

        const insertBeforeEl = document.getElementById('homeAchievementsPanel') ?? (document.getElementById('recentSubjectsGrid')?.closest('.recent-subjects') ?? null);
        if (insertBeforeEl && insertBeforeEl.parentNode) {
            insertBeforeEl.parentNode.insertBefore(panel, insertBeforeEl);
        } else {
            homeView.querySelector('.home-container')?.appendChild(panel);
        }
    }

    const toggleBtn = document.getElementById('homeStatsToggleBtn');
    const detailsEl = document.getElementById('homeStatsDetails');
    if (toggleBtn && detailsEl && !toggleBtn.dataset.bound) {
        toggleBtn.dataset.bound = '1';
        toggleBtn.addEventListener('click', () => {
            detailsEl.hidden = !detailsEl.hidden;
            toggleBtn.textContent = detailsEl.hidden ? 'Mostrar' : 'Ocultar';
        });
    }
}

function renderHomeStatsV2() {
    const summaryEl = document.getElementById('homeStatsSummary');
    const detailsEl = document.getElementById('homeStatsDetails');
    if (!summaryEl || !detailsEl) return;

    if (!appState) {
        summaryEl.innerHTML = '';
        detailsEl.innerHTML = '';
        return;
    }

    const totalFocus = appState.globalMeta.totalFocusSeconds ?? 0;
    const totalSessions = appState.globalMeta.sessionsCount ?? 0;
    const longest = appState.globalMeta.longestSessionSeconds ?? 0;
    const globalProgress = calculateGlobalProgress();

    summaryEl.innerHTML = `
        <div class="card">
            <div class="card-title">Tiempo total</div>
            <div class="card-desc">${escapeHtml(prettyTime(totalFocus))}</div>
        </div>
        <div class="card">
            <div class="card-title">Sesiones</div>
            <div class="card-desc">${escapeHtml(String(totalSessions))}</div>
        </div>
        <div class="card">
            <div class="card-title">Mejor sesión</div>
            <div class="card-desc">${escapeHtml(prettyTime(longest))}</div>
        </div>
        <div class="card">
            <div class="card-title">Progreso global</div>
            <div class="card-desc">${escapeHtml(String(globalProgress))}%</div>
        </div>
    `;

    const subjects = [...(appState.subjects ?? [])].sort((a, b) => calculateSubjectProgress(b) - calculateSubjectProgress(a));
    detailsEl.innerHTML = subjects.map(subject => {
        const progress = calculateSubjectProgress(subject);
        const time = prettyTime(subject.meta?.totalFocusSeconds ?? 0);
        const sessions = String(subject.meta?.sessionsCount ?? 0);
        return `
            <div class="card">
                <div class="card-title">${escapeHtml(subject.icon ? `${subject.icon} ` : '')}${escapeHtml(subject.name ?? 'Materia')}</div>
                <div class="card-desc">Progreso: ${escapeHtml(String(progress))}% · Tiempo: ${escapeHtml(time)} · Sesiones: ${escapeHtml(sessions)}</div>
            </div>
        `;
    }).join('');
}

function checkAchievements() {
    if (!currentSubject) return;

    // Contar temas completados para logros basados en progreso
    let totalTopics = 0;
    let completedTopics = 0;
    
    for (const category of currentSubject.categories) {
        totalTopics += category.topics.length;
        completedTopics += category.topics.filter(t => t.completed).length;
    }
    
    const completionPercentage = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;
    const totalFocus = currentSubject.meta.totalFocusSeconds;
    const achievements = [
        { id: 'first_topic', condition: () => completedTopics >= 1 },
        { id: '25_percent', condition: () => completionPercentage >= 25 },
        { id: '50_percent', condition: () => completionPercentage >= 50 },
        { id: '75_percent', condition: () => completionPercentage >= 75 },
        { id: '100_percent', condition: () => completionPercentage >= 100 },
        { id: 'focus_30min', condition: () => totalFocus >= 30 * 60 },
        { id: 'focus_1h', condition: () => totalFocus >= 60 * 60 },
        { id: 'focus_5h', condition: () => totalFocus >= 5 * 60 * 60 },
        { id: 'focus_10h', condition: () => totalFocus >= 10 * 60 * 60 }
    ];
    
    for (const ach of achievements) {
        if (!currentSubject.meta.achievements[ach.id] && ach.condition()) {
            currentSubject.meta.achievements[ach.id] = Date.now();
            const achievementInfo = ACHIEVEMENTS.find(a => a.id.includes(ach.id));
            if (achievementInfo) {
                showNotification(`🏆 Logro: ${achievementInfo.title}`);
            }
        }
    }
    
    // También actualizar logros globales
    const unlockedCount = Object.keys(appState.globalMeta.achievements).length;
    const sessionsCount = appState.globalMeta.sessionsCount;
    const globalTotalFocus = appState.globalMeta.totalFocusSeconds;
    
    const globalAchievements = [
        { id: 'global_first_topic', condition: () => completedTopics >= 1 },
        { id: 'global_focus_30min', condition: () => globalTotalFocus >= 30 * 60 },
        { id: 'global_focus_1h', condition: () => globalTotalFocus >= 60 * 60 },
        { id: 'global_focus_5h', condition: () => globalTotalFocus >= 5 * 60 * 60 },
        { id: 'global_10_sessions', condition: () => sessionsCount >= 10 }
    ];
    
    for (const ach of globalAchievements) {
        if (!appState.globalMeta.achievements[ach.id] && ach.condition()) {
            appState.globalMeta.achievements[ach.id] = Date.now();
        }
    }
}

function renderAchievements() {
    if (!currentSubject) {
        achievementsContainer.innerHTML = '';
        return;
    }

    achievementsContainer.innerHTML = '';

    for (const a of ACHIEVEMENTS) {
        const unlockedAt = currentSubject.meta.achievements[a.id];
        const unlocked = !!unlockedAt;
        const badge = unlocked ? '<span class="badge unlocked">Desbloqueado</span>' : '<span class="badge">Bloqueado</span>';

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-title">${escapeHtml(a.title)} ${badge}</div>
            <div class="card-desc">${escapeHtml(a.desc)}</div>
        `;

        achievementsContainer.appendChild(card);
    }
}

function updateXpUi() {
    if (!currentSubject) {
        levelText.textContent = '1';
        xpText.textContent = '0';
        skillPointsText.textContent = '0';
        xpFill.style.width = '0%';
        return;
    }

    levelText.textContent = String(currentSubject.meta.level);
    xpText.textContent = String(currentSubject.meta.xp);
    skillPointsText.textContent = String(currentSubject.meta.skillPoints);

    const toNext = xpToNextLevel(currentSubject.meta.level);
    const pct = toNext > 0 ? Math.min(100, Math.round((currentSubject.meta.xp / toNext) * 100)) : 0;
    xpFill.style.width = `${pct}%`;
}

function setAvatarTier(tier) {
    const capped = Math.min(5, tier);
    streakAvatar.className = `streak-avatar streak-tier-${capped}`;

    const labels = ['En frío', 'Tibio', 'Caliente', 'Ardiendo', 'En llamas', 'Infernal'];
    avatarCaption.textContent = labels[capped] ?? 'En foco';
}

function updateTimerUi() {
    if (!currentSubject) {
        timerDisplay.textContent = '00:00:00';
        streakDisplay.textContent = '00:00';
        multiplierDisplay.textContent = 'x1.00';
        timerToggleBtn.textContent = 'Iniciar';
        timerStopBtn.disabled = true;
        difficultySelect.value = 'normal';
        updateXpUi();
        return;
    }

    const t = currentSubject.meta.timer;
    timerDisplay.textContent = formatHMS(t.sessionSeconds);
    streakDisplay.textContent = formatMS(t.streakSeconds);
    multiplierDisplay.textContent = 'x1.00';

    setAvatarTier(0);

    timerToggleBtn.textContent = t.running ? 'Pausar' : (t.sessionSeconds > 0 ? 'Reanudar' : 'Iniciar');
    timerStopBtn.disabled = !t.running && t.sessionSeconds === 0;

    difficultySelect.value = currentSubject.meta.difficulty;
    updateXpUi();
}

function startOrPauseTimer() {
    if (!currentSubject) {
        showNotification('Selecciona una materia primero');
        return;
    }

    const t = currentSubject.meta.timer;
    if (t.running) {
        pauseTimer();
    } else {
        startTimer();
    }
}

function startTimer() {
    if (!currentSubject) return;
    
    const t = currentSubject.meta.timer;
    const now = Date.now();

    t.running = true;
    t.lastTickMs = now;
    t.pausedAtMs = null;

    if (!t.currentSessionStartMs) {
        t.currentSessionStartMs = now;
    }

    currentSubject.meta.sessionsCount += 1;
    appState.globalMeta.sessionsCount += 1;
    saveData();

    if (!timerIntervalId) {
        timerIntervalId = setInterval(onTimerTick, 1000);
    }

    checkAchievementsV2({ activity: 'timer_start', nowMs: now, streakSeconds: t.streakSeconds });
    updateTimerUi();
}

function pauseTimer() {
    if (!currentSubject) return;
    
    const t = currentSubject.meta.timer;
    if (!t.running) return;
    t.running = false;
    t.pausedAtMs = Date.now();
    t.lastTickMs = null;
    updateTimerUi();
    saveData(true);
}

function stopTimer() {
    if (!currentSubject) return;
    
    const t = currentSubject.meta.timer;
    t.running = false;
    t.lastTickMs = null;
    t.pausedAtMs = null;

    if (t.sessionSeconds > currentSubject.meta.longestSessionSeconds) {
        currentSubject.meta.longestSessionSeconds = t.sessionSeconds;
        if (t.sessionSeconds > appState.globalMeta.longestSessionSeconds) {
            appState.globalMeta.longestSessionSeconds = t.sessionSeconds;
        }
    }

    if (t.sessionSeconds > 0 && t.currentSessionStartMs) {
        const xpEarned = Math.floor(t.sessionSeconds / 60) * 6;
        recordSession(t.currentSessionStartMs, t.sessionSeconds, xpEarned);
    }

    checkAchievementsV2({ activity: 'timer_stop', nowMs: Date.now(), streakSeconds: t.streakSeconds });

    t.sessionSeconds = 0;
    t.streakSeconds = 0;
    t.xpCarrySeconds = 0;
    t.currentSessionStartMs = null;

    updateTimerUi();
    renderSessions();
    saveData(true);
}

function onTimerTick() {
    if (!currentSubject) return;
    
    const t = currentSubject.meta.timer;
    if (!t.running) return;

    const now = Date.now();
    if (!t.lastTickMs) t.lastTickMs = now;

    const deltaSeconds = Math.min(5, Math.max(0, (now - t.lastTickMs) / 1000));
    t.lastTickMs = now;

    t.sessionSeconds += deltaSeconds;
    t.streakSeconds += deltaSeconds;
    t.xpCarrySeconds += deltaSeconds;

    currentSubject.meta.totalFocusSeconds += deltaSeconds;
    appState.globalMeta.totalFocusSeconds += deltaSeconds;
    
    const today = todayKey();
    currentSubject.meta.dailyFocusSeconds[today] = (currentSubject.meta.dailyFocusSeconds[today] ?? 0) + deltaSeconds;
    appState.globalMeta.dailyFocusSeconds[today] = (appState.globalMeta.dailyFocusSeconds[today] ?? 0) + deltaSeconds;

    if (now - lastAchievementsCheckMs >= 10000) {
        lastAchievementsCheckMs = now;
        checkAchievementsV2({ activity: 'timer_tick', nowMs: now, streakSeconds: t.streakSeconds });
    }

    if (t.xpCarrySeconds >= 60) {
        const minutes = Math.floor(t.xpCarrySeconds / 60);
        t.xpCarrySeconds -= minutes * 60;
        const gained = Math.floor(minutes * 6);
        currentSubject.meta.xp += gained;
        appState.globalMeta.xp += gained;
        
        while (currentSubject.meta.xp >= xpToNextLevel(currentSubject.meta.level)) {
            currentSubject.meta.xp -= xpToNextLevel(currentSubject.meta.level);
            currentSubject.meta.level += 1;
            currentSubject.meta.skillPoints += 1;
        }
        
        while (appState.globalMeta.xp >= xpToNextLevel(appState.globalMeta.level)) {
            appState.globalMeta.xp -= xpToNextLevel(appState.globalMeta.level);
            appState.globalMeta.level += 1;
            appState.globalMeta.skillPoints += 1;
        }
        
        updateXpUi();
    }

    updateTimerUi();
    renderStats();
    saveData();
}

function setDifficulty(value) {
    if (!currentSubject || !DIFFICULTY_CONFIG[value]) return;
    currentSubject.meta.difficulty = value;
    saveData(true);
    updateTimerUi();
    renderSkillTree();
    showNotification(`Modo: ${DIFFICULTY_CONFIG[value].label}`);
}

function setActiveView(viewId) {
    // Remove active class from all views and tabs
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    // If it's a subject view tab (listView, mapView, skillView, statsView)
    if (['listView', 'mapView', 'skillView', 'statsView'].includes(viewId)) {
        // Only affect the nested views inside subjectView
        const nestedViews = document.querySelector('#subjectView .main-content').querySelectorAll('.view');
        nestedViews.forEach(v => v.classList.remove('view-active'));
        
        const view = document.getElementById(viewId);
        if (view) {
            view.classList.add('view-active');
        }
    } else {
        // For top-level views (homeView, subjectView)
        const topLevelViews = document.querySelector('.main-content > .view');
        document.querySelectorAll('.main-content > .view').forEach(v => v.classList.remove('view-active'));
        
        const view = document.getElementById(viewId);
        if (view) {
            view.classList.add('view-active');
        }
    }
    
    // Update tab button state
    const activeTab = document.querySelector(`.tab-btn[data-view="${viewId}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
}

function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function recordSession(startTime, durationSeconds, xpEarned) {
    if (!currentSubject) return;
    
    const session = {
        startTime: startTime,
        endTime: Date.now(),
        durationSeconds: durationSeconds,
        xpEarned: xpEarned,
        difficulty: currentSubject.meta.difficulty
    };
    
    currentSubject.meta.sessions.unshift(session);
    
    if (currentSubject.meta.sessions.length > MAX_SESSIONS_DISPLAY) {
        currentSubject.meta.sessions = currentSubject.meta.sessions.slice(0, MAX_SESSIONS_DISPLAY);
    }
    
    appState.globalMeta.sessions.unshift(session);
    if (appState.globalMeta.sessions.length > MAX_SESSIONS_DISPLAY) {
        appState.globalMeta.sessions = appState.globalMeta.sessions.slice(0, MAX_SESSIONS_DISPLAY);
    }
    
    saveData(true);
}

function renderSessions() {
    if (!sessionsContainer) return;
    
    const sessions = currentSubject ? currentSubject.meta.sessions : [];
    
    if (sessions.length === 0) {
        sessionsContainer.innerHTML = '<div class="sessions-empty">No hay sesiones registradas</div>';
        return;
    }
    
    sessionsContainer.innerHTML = sessions.map((session, index) => `
        <div class="session-item">
            <div class="session-icon">⏱️</div>
            <div class="session-info">
                <div class="session-date">Sesión ${currentSubject.meta.sessionsCount - index}</div>
                <div class="session-time">${formatDateTime(session.startTime)}</div>
            </div>
            <div class="session-stats">
                <div class="session-duration">${formatHMS(session.durationSeconds)}</div>
                <div class="session-xp">+${Math.floor(session.xpEarned)} XP</div>
            </div>
        </div>
    `).join('');
}

function renderAllNonTimer() {
    renderCategories();
    updateSubjectProgress();
    renderMap();
    renderSkillTree();
    renderStats();
    renderAchievementsV2();
    renderSessions();
    renderSubjectList();
    renderHomePage();
}

function renderAll() {
    renderAllNonTimer();
    updateTimerUi();
}

function renderSubjectList() {
    subjectList.innerHTML = '';
    
    appState.subjects.forEach(subject => {
        const progress = calculateSubjectProgress(subject);
        
        const btn = document.createElement('button');
        btn.className = `nav-item ${currentSubject?.id === subject.id ? 'active' : ''}`;
        btn.dataset.subjectId = subject.id;
        btn.innerHTML = `
            <span class="nav-icon">${subject.icon}</span>
            <span class="nav-text">${escapeHtml(subject.name)}</span>
            <span class="nav-progress">${progress}%</span>
        `;
        
        btn.addEventListener('click', () => {
            console.log('Subject clicked:', subject);
            selectSubject(subject.id);
        });
        subjectList.appendChild(btn);
    });
}

function calculateSubjectProgress(subject) {
    let totalTopics = 0;
    let completedTopics = 0;
    
    for (const category of subject.categories) {
        totalTopics += category.topics.length;
        completedTopics += category.topics.filter(t => t.completed).length;
    }
    
    return totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
}

function selectSubject(subjectId) {
    currentSubject = appState.subjects.find(sub => sub.id === subjectId);
    
    if (currentSubject) {
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.subjectId == subjectId);
        });
        
        subjectTitle.textContent = currentSubject.name;
        subjectSubtitle.textContent = 'Progreso de estudio';
        setActiveView('subjectView');
        setActiveView('listView');
        renderAll();
    }
}

function setAddSubjectModalTab(tab) {
    const isManual = tab === 'manual';

    if (addSubjectTabManual) {
        addSubjectTabManual.classList.toggle('active', isManual);
        addSubjectTabManual.setAttribute('aria-selected', isManual ? 'true' : 'false');
    }
    if (addSubjectTabImport) {
        addSubjectTabImport.classList.toggle('active', !isManual);
        addSubjectTabImport.setAttribute('aria-selected', !isManual ? 'true' : 'false');
    }

    if (addSubjectManualSection) addSubjectManualSection.hidden = !isManual;
    if (addSubjectImportSection) addSubjectImportSection.hidden = isManual;
}

function addSubjectDraftId() {
    return Date.now() + Math.floor(Math.random() * 1000000);
}

function createDraftTopic(depth = 1) {
    return {
        id: addSubjectDraftId(),
        name: '',
        depth: Math.max(1, Math.min(20, depth)),
        collapsed: false,
        sourceIndex: null
    };
}

function createDraftCategory() {
    return {
        id: addSubjectDraftId(),
        name: '',
        icon: '📌',
        collapsed: false,
        topics: [createDraftTopic(1)]
    };
}

function ensureAddSubjectDraft() {
    if (!addSubjectDraft) {
        addSubjectDraft = { categories: [createDraftCategory()] };
    }
    if (!Array.isArray(addSubjectDraft.categories)) addSubjectDraft.categories = [];
}

function findDraftCategory(catId) {
    ensureAddSubjectDraft();
    return addSubjectDraft.categories.find(c => c.id === catId) || null;
}

function findTopicIndexById(cat, topicId) {
    if (!cat || !Array.isArray(cat.topics)) return -1;
    return cat.topics.findIndex(t => t.id === topicId);
}

function draftLastDescendantIndex(topics, index) {
    if (!Array.isArray(topics) || index < 0 || index >= topics.length) return index;
    const depth = topics[index].depth;
    let i = index + 1;
    while (i < topics.length && topics[i].depth > depth) i++;
    return i - 1;
}

function renderAddSubjectBuilder() {
    ensureAddSubjectDraft();
    if (!subjectCategoriesBuilder) return;

    const escAttr = (value) => String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');

    if (addSubjectDraft.categories.length === 0) {
        addSubjectDraft.categories.push(createDraftCategory());
    }

    subjectCategoriesBuilder.innerHTML = addSubjectDraft.categories.map((cat, catIndex) => {
        const catChevron = cat.collapsed ? '▸' : '▾';

        const topics = Array.isArray(cat.topics) ? cat.topics : [];
        const htmlRows = [];
        const collapsedStack = [];

        for (let i = 0; i < topics.length; i++) {
            const t = topics[i];
            while (collapsedStack.length && t.depth <= collapsedStack[collapsedStack.length - 1]) {
                collapsedStack.pop();
            }

            const hidden = collapsedStack.length > 0;
            const hasChildren = i + 1 < topics.length && topics[i + 1].depth > t.depth;
            const chevron = t.collapsed ? '▸' : '▾';
            const inputIndent = (Math.max(1, t.depth) - 1) * 16;

            const collapseBtn = hasChildren
                ? `<button class="topic-collapse" type="button" data-action="topic_toggle" title="Desplegar / Cerrar">${chevron}</button>`
                : `<button class="topic-collapse placeholder" type="button" disabled title="Sin subtemas">•</button>`;

            htmlRows.push(`
                <div class="topic-row ${hidden ? 'is-hidden' : ''}" data-topic-id="${t.id}">
                    ${collapseBtn}
                    <input class="topic-input" data-field="topic_name" type="text" placeholder="Subtema" value="${escAttr(t.name ?? '')}" style="margin-left:${inputIndent}px" />
                    <button class="topic-action" type="button" data-action="topic_add_child" title="Agregar subtema">↳</button>
                    <button class="topic-action" type="button" data-action="topic_add_sibling" title="Agregar al mismo nivel">+</button>
                    <button class="topic-action" type="button" data-action="topic_delete" title="Eliminar">×</button>
                </div>
            `);

            if (!hidden && hasChildren && t.collapsed) {
                collapsedStack.push(t.depth);
            }
        }

        const topicsHtml = htmlRows.join('') || '<div class="builder-subtitle">Agregá subtemas para este tema.</div>';

        return `
            <div class="category-editor" data-cat-id="${cat.id}">
                <div class="category-editor-header">
                    <button class="mini-btn" type="button" data-action="cat_toggle" title="Desplegar / Cerrar">${catChevron}</button>
                    <input class="mini-input" data-field="cat_icon" type="text" placeholder="📌" value="${escAttr(cat.icon ?? '')}" />
                    <input class="mini-input" data-field="cat_name" type="text" placeholder="Tema (ej: Álgebra)" value="${escAttr(cat.name ?? '')}" />
                    <button class="mini-btn" type="button" data-action="cat_delete" title="Eliminar tema">×</button>
                </div>
                <div class="category-editor-body" ${cat.collapsed ? 'hidden' : ''}>
                    <div class="topics-editor-toolbar">
                        <div class="topics-editor-title">Subtemas</div>
                        <button class="btn btn-secondary btn-small" type="button" data-action="topic_add_root">+ Subtema</button>
                    </div>
                    <div class="topics-list-editor">${topicsHtml}</div>
                </div>
            </div>
        `;
    }).join('');

    if (subjectCategoriesBuilder && !subjectCategoriesBuilder.dataset.bound) {
        subjectCategoriesBuilder.dataset.bound = '1';

        subjectCategoriesBuilder.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-action]');
            if (!btn) return;

            const action = btn.dataset.action;
            const catEl = btn.closest('.category-editor');
            const catId = catEl ? Number(catEl.dataset.catId) : null;
            const cat = catId ? findDraftCategory(catId) : null;

            if (action.startsWith('cat_')) {
                if (!cat) return;
                if (action === 'cat_toggle') {
                    cat.collapsed = !cat.collapsed;
                    renderAddSubjectBuilder();
                } else if (action === 'cat_delete') {
                    addSubjectDraft.categories = addSubjectDraft.categories.filter(c => c.id !== cat.id);
                    if (addSubjectDraft.categories.length === 0) addSubjectDraft.categories.push(createDraftCategory());
                    renderAddSubjectBuilder();
                }
                return;
            }

            if (!cat) return;
            if (!Array.isArray(cat.topics)) cat.topics = [];

            const row = btn.closest('.topic-row');
            const topicId = row ? Number(row.dataset.topicId) : null;
            const topicIndex = topicId ? findTopicIndexById(cat, topicId) : -1;

            if (action === 'topic_add_root') {
                cat.topics.push(createDraftTopic(1));
                renderAddSubjectBuilder();
                return;
            }

            if (topicIndex < 0) return;

            const topics = cat.topics;
            const t = topics[topicIndex];
            const lastDesc = draftLastDescendantIndex(topics, topicIndex);
            const insertAt = lastDesc + 1;

            if (action === 'topic_toggle') {
                const hasChildren = topicIndex + 1 < topics.length && topics[topicIndex + 1].depth > t.depth;
                if (!hasChildren) return;
                t.collapsed = !t.collapsed;
                renderAddSubjectBuilder();
                return;
            }

            if (action === 'topic_add_child') {
                t.collapsed = false;
                topics.splice(insertAt, 0, createDraftTopic(t.depth + 1));
                renderAddSubjectBuilder();
                return;
            }

            if (action === 'topic_add_sibling') {
                topics.splice(insertAt, 0, createDraftTopic(t.depth));
                renderAddSubjectBuilder();
                return;
            }

            if (action === 'topic_delete') {
                const start = topicIndex;
                const end = draftLastDescendantIndex(topics, topicIndex);
                topics.splice(start, (end - start) + 1);
                if (topics.length === 0) topics.push(createDraftTopic(1));
                renderAddSubjectBuilder();
                return;
            }
        });

        subjectCategoriesBuilder.addEventListener('input', (e) => {
            const el = e.target;
            if (!(el instanceof HTMLInputElement)) return;

            const field = el.dataset.field;
            if (!field) return;

            const catEl = el.closest('.category-editor');
            const catId = catEl ? Number(catEl.dataset.catId) : null;
            const cat = catId ? findDraftCategory(catId) : null;
            if (!cat) return;

            if (field === 'cat_name') {
                cat.name = el.value;
                return;
            }

            if (field === 'cat_icon') {
                cat.icon = el.value;
                return;
            }

            if (field === 'topic_name') {
                const row = el.closest('.topic-row');
                const topicId = row ? Number(row.dataset.topicId) : null;
                const idx = topicId ? findTopicIndexById(cat, topicId) : -1;
                if (idx >= 0) cat.topics[idx].name = el.value;
            }
        });
    }
}

function normalizeImportedTopicListToLevels(topics) {
    const out = [];

    const pushTopic = (name, level) => {
        const n = String(name ?? '').trim();
        if (!n) return;
        out.push({ name: n, level: Math.max(1, Math.min(20, Number(level) || 1)) });
    };

    const walk = (node, level) => {
        if (node == null) return;
        if (typeof node === 'string' || typeof node === 'number') {
            pushTopic(String(node), level);
            return;
        }

        if (Array.isArray(node)) {
            for (const child of node) walk(child, level);
            return;
        }

        if (typeof node === 'object') {
            const name = node.name ?? node.title ?? '';
            const ownLevel = node.level != null ? node.level : level;
            pushTopic(name, ownLevel);
            if (Array.isArray(node.children)) {
                for (const child of node.children) walk(child, (Number(ownLevel) || level) + 1);
            }
        }
    };

    walk(topics, 1);
    return out;
}

function applyImportedSubjectToDraft(payload) {
    if (!payload || typeof payload !== 'object') {
        throw new Error('JSON inválido');
    }

    const subjectPayload = Array.isArray(payload.subjects) ? (payload.subjects[0] ?? null) : payload;
    if (!subjectPayload || typeof subjectPayload !== 'object') {
        throw new Error('No se encontró una materia en el archivo');
    }

    const name = String(subjectPayload.name ?? subjectPayload.title ?? '').trim();
    const icon = String(subjectPayload.icon ?? '📚').trim();
    const color = String(subjectPayload.color ?? '#667eea').trim();

    const categories = Array.isArray(subjectPayload.categories) ? subjectPayload.categories : null;
    const rootTopics = subjectPayload.topics ?? null;

    const normalizedCategories = (categories ?? [{
        name: subjectPayload.categoryName ?? 'Contenido',
        icon: subjectPayload.categoryIcon ?? '📌',
        topics: rootTopics ?? []
    }]).map((c) => {
        const catName = String(c.name ?? '').trim();
        const catIcon = String(c.icon ?? '📌').trim();
        const topicLevels = normalizeImportedTopicListToLevels(c.topics ?? []);
        return { name: catName, icon: catIcon, topics: topicLevels };
    }).filter(c => (c.name && c.topics.length) || c.topics.length);

    subjectNameInput.value = name || subjectNameInput.value;
    subjectIconInput.value = icon || subjectIconInput.value;
    if (subjectColorInput && /^#([0-9a-fA-F]{6})$/.test(color)) subjectColorInput.value = color;

    addSubjectDraft = {
        categories: normalizedCategories.map(c => ({
            id: addSubjectDraftId(),
            name: c.name,
            icon: c.icon || '📌',
            collapsed: false,
            topics: (c.topics.length ? c.topics : [{ name: '', level: 1 }]).map(t => ({
                id: addSubjectDraftId(),
                name: t.name,
                depth: t.level ?? 1,
                collapsed: false
            }))
        }))
    };

    if (!addSubjectDraft.categories.length) {
        addSubjectDraft.categories.push(createDraftCategory());
    }

    renderAddSubjectBuilder();
}

function showAddSubjectModal() {
    subjectNameInput.value = '';
    subjectIconInput.value = '📚';
    subjectColorInput.value = '#667eea';

    addSubjectDraft = { categories: [createDraftCategory()] };
    setAddSubjectModalTab('manual');

    if (subjectImportFile) subjectImportFile.value = '';
    if (subjectImportStatus) subjectImportStatus.textContent = '';

    renderAddSubjectBuilder();
    addSubjectModal.classList.add('active');
}

function hideAddSubjectModal() {
    addSubjectModal.classList.remove('active');
}

function setEditSubjectModalTab(tab) {
    const setActive = (btn, on) => {
        if (!btn) return;
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-selected', on ? 'true' : 'false');
    };

    const show = (el, on) => {
        if (!el) return;
        el.hidden = !on;
    };

    const isDetails = tab === 'details';
    const isStructure = tab === 'structure';
    const isAchievements = tab === 'achievements';
    const isReset = tab === 'reset';

    setActive(editSubjectTabDetails, isDetails);
    setActive(editSubjectTabStructure, isStructure);
    setActive(editSubjectTabAchievements, isAchievements);
    setActive(editSubjectTabReset, isReset);

    show(editSubjectDetailsSection, isDetails);
    show(editSubjectStructureSection, isStructure);
    show(editSubjectAchievementsSection, isAchievements);
    show(editSubjectResetSection, isReset);
}

function ensureEditSubjectDraft() {
    if (!editSubjectDraft) {
        editSubjectDraft = { categories: [createDraftCategory()] };
    }
    if (!Array.isArray(editSubjectDraft.categories)) editSubjectDraft.categories = [];
}

function editDraftFromSubject(subject) {
    const draft = { categories: [] };
    for (const cat of subject?.categories ?? []) {
        const topics = Array.isArray(cat.topics) ? cat.topics : [];
        draft.categories.push({
            id: Number(cat.id) || addSubjectDraftId(),
            name: cat.name ?? '',
            icon: cat.icon ?? '📌',
            collapsed: false,
            topics: topics.map((t, idx) => ({
                id: addSubjectDraftId(),
                name: t.name ?? '',
                depth: Math.max(1, Math.min(20, Number(t.level) || 1)),
                collapsed: false,
                sourceIndex: idx
            }))
        });
    }

    if (draft.categories.length === 0) draft.categories.push(createDraftCategory());
    return draft;
}

function findEditDraftCategory(catId) {
    ensureEditSubjectDraft();
    return editSubjectDraft.categories.find(c => c.id === catId) || null;
}

function findEditTopicIndexById(cat, topicId) {
    if (!cat || !Array.isArray(cat.topics)) return -1;
    return cat.topics.findIndex(t => t.id === topicId);
}

function renderEditSubjectBuilder() {
    ensureEditSubjectDraft();
    if (!editSubjectCategoriesBuilder) return;

    if (editSubjectDraft.categories.length === 0) {
        editSubjectDraft.categories.push(createDraftCategory());
    }

    const escAttr = (value) => String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');

    editSubjectCategoriesBuilder.innerHTML = editSubjectDraft.categories.map((cat) => {
        const catChevron = cat.collapsed ? '▸' : '▾';

        const topics = Array.isArray(cat.topics) ? cat.topics : [];
        const htmlRows = [];
        const collapsedStack = [];

        for (let i = 0; i < topics.length; i++) {
            const t = topics[i];
            while (collapsedStack.length && t.depth <= collapsedStack[collapsedStack.length - 1]) {
                collapsedStack.pop();
            }

            const hidden = collapsedStack.length > 0;
            const hasChildren = i + 1 < topics.length && topics[i + 1].depth > t.depth;
            const chevron = t.collapsed ? '▸' : '▾';
            const inputIndent = (Math.max(1, t.depth) - 1) * 16;

            const collapseBtn = hasChildren
                ? `<button class="topic-collapse" type="button" data-action="topic_toggle" title="Desplegar / Cerrar">${chevron}</button>`
                : `<button class="topic-collapse placeholder" type="button" disabled title="Sin subtemas">•</button>`;

            htmlRows.push(`
                <div class="topic-row ${hidden ? 'is-hidden' : ''}" data-topic-id="${t.id}">
                    ${collapseBtn}
                    <input class="topic-input" data-field="topic_name" type="text" placeholder="Subtema" value="${escAttr(t.name ?? '')}" style="margin-left:${inputIndent}px" />
                    <button class="topic-action" type="button" data-action="topic_add_child" title="Agregar subtema">↳</button>
                    <button class="topic-action" type="button" data-action="topic_add_sibling" title="Agregar al mismo nivel">+</button>
                    <button class="topic-action" type="button" data-action="topic_delete" title="Eliminar">×</button>
                </div>
            `);

            if (!hidden && hasChildren && t.collapsed) {
                collapsedStack.push(t.depth);
            }
        }

        const topicsHtml = htmlRows.join('') || '<div class="builder-subtitle">Agregá subtemas para este tema.</div>';

        return `
            <div class="category-editor" data-cat-id="${cat.id}">
                <div class="category-editor-header">
                    <button class="mini-btn" type="button" data-action="cat_toggle" title="Desplegar / Cerrar">${catChevron}</button>
                    <input class="mini-input" data-field="cat_icon" type="text" placeholder="📌" value="${escAttr(cat.icon ?? '')}" />
                    <input class="mini-input" data-field="cat_name" type="text" placeholder="Tema (ej: Álgebra)" value="${escAttr(cat.name ?? '')}" />
                    <button class="mini-btn" type="button" data-action="cat_delete" title="Eliminar tema">×</button>
                </div>
                <div class="category-editor-body" ${cat.collapsed ? 'hidden' : ''}>
                    <div class="topics-editor-toolbar">
                        <div class="topics-editor-title">Subtemas</div>
                        <button class="btn btn-secondary btn-small" type="button" data-action="topic_add_root">➕ Subtema</button>
                    </div>
                    <div class="topics-list-editor">${topicsHtml}</div>
                </div>
            </div>
        `;
    }).join('');

    if (editSubjectCategoriesBuilder && !editSubjectCategoriesBuilder.dataset.bound) {
        editSubjectCategoriesBuilder.dataset.bound = '1';

        editSubjectCategoriesBuilder.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-action]');
            if (!btn) return;

            const action = btn.dataset.action;
            const catEl = btn.closest('.category-editor');
            const catId = catEl ? Number(catEl.dataset.catId) : null;
            const cat = catId ? findEditDraftCategory(catId) : null;

            if (action.startsWith('cat_')) {
                if (!cat) return;
                if (action === 'cat_toggle') {
                    cat.collapsed = !cat.collapsed;
                    renderEditSubjectBuilder();
                } else if (action === 'cat_delete') {
                    editSubjectDraft.categories = editSubjectDraft.categories.filter(c => c.id !== cat.id);
                    if (editSubjectDraft.categories.length === 0) editSubjectDraft.categories.push(createDraftCategory());
                    renderEditSubjectBuilder();
                }
                return;
            }

            if (!cat) return;
            if (!Array.isArray(cat.topics)) cat.topics = [];

            const row = btn.closest('.topic-row');
            const topicId = row ? Number(row.dataset.topicId) : null;
            const topicIndex = topicId ? findEditTopicIndexById(cat, topicId) : -1;

            if (action === 'topic_add_root') {
                cat.topics.push(createDraftTopic(1));
                renderEditSubjectBuilder();
                return;
            }

            if (topicIndex < 0) return;

            const topics = cat.topics;
            const t = topics[topicIndex];
            const lastDesc = draftLastDescendantIndex(topics, topicIndex);
            const insertAt = lastDesc + 1;

            if (action === 'topic_toggle') {
                const hasChildren = topicIndex + 1 < topics.length && topics[topicIndex + 1].depth > t.depth;
                if (!hasChildren) return;
                t.collapsed = !t.collapsed;
                renderEditSubjectBuilder();
                return;
            }

            if (action === 'topic_add_child') {
                t.collapsed = false;
                topics.splice(insertAt, 0, createDraftTopic(t.depth + 1));
                renderEditSubjectBuilder();
                return;
            }

            if (action === 'topic_add_sibling') {
                topics.splice(insertAt, 0, createDraftTopic(t.depth));
                renderEditSubjectBuilder();
                return;
            }

            if (action === 'topic_delete') {
                const start = topicIndex;
                const end = draftLastDescendantIndex(topics, topicIndex);
                topics.splice(start, (end - start) + 1);
                if (topics.length === 0) topics.push(createDraftTopic(1));
                renderEditSubjectBuilder();
                return;
            }
        });

        editSubjectCategoriesBuilder.addEventListener('input', (e) => {
            const el = e.target;
            if (!(el instanceof HTMLInputElement)) return;

            const field = el.dataset.field;
            if (!field) return;

            const catEl = el.closest('.category-editor');
            const catId = catEl ? Number(catEl.dataset.catId) : null;
            const cat = catId ? findEditDraftCategory(catId) : null;
            if (!cat) return;

            if (field === 'cat_name') {
                cat.name = el.value;
                return;
            }

            if (field === 'cat_icon') {
                cat.icon = el.value;
                return;
            }

            if (field === 'topic_name') {
                const row = el.closest('.topic-row');
                const topicId = row ? Number(row.dataset.topicId) : null;
                const idx = topicId ? findEditTopicIndexById(cat, topicId) : -1;
                if (idx >= 0) cat.topics[idx].name = el.value;
            }
        });
    }
}

function renderCustomAchievementsEditor(subject) {
    if (!customAchievementsList) return;
    const list = Array.isArray(subject?.meta?.customAchievements) ? subject.meta.customAchievements : [];

    const escAttr = (value) => String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');

    if (list.length === 0) {
        customAchievementsList.innerHTML = '<div class="builder-subtitle">No hay logros personalizados todavía.</div>';
        return;
    }

    const metaFor = (a) => {
        if (a.type === 'pct') return `📊 ${a.value}% completado`;
        if (a.type === 'focus_minutes') return `⏱️ ${a.value} min en esta materia`;
        if (a.type === 'category_complete') {
            const cat = (subject.categories ?? []).find(c => c.id === a.categoryId);
            return `✅ Completar tema: ${cat?.name ?? 'Tema'}`;
        }
        return 'Personalizado';
    };

    customAchievementsList.innerHTML = list.map(a => `
        <div class="custom-ach-item" data-custom-ach-id="${escAttr(a.id)}">
            <div class="custom-ach-main">
                <div class="custom-ach-title">🏆 ${escapeHtml(a.title ?? 'Logro')}</div>
                <div class="custom-ach-meta">${escapeHtml(metaFor(a))}</div>
            </div>
            <button class="topic-action" type="button" data-action="custom_delete" title="Eliminar logro">🗑️</button>
        </div>
    `).join('');

    if (!customAchievementsList.dataset.bound) {
        customAchievementsList.dataset.bound = '1';
        customAchievementsList.addEventListener('click', async (e) => {
            const btn = e.target.closest('button[data-action="custom_delete"]');
            if (!btn) return;
            if (!currentSubject) return;

            const item = btn.closest('.custom-ach-item');
            const id = item ? item.dataset.customAchId : null;
            if (!id) return;

            const customList = Array.isArray(currentSubject?.meta?.customAchievements) ? currentSubject.meta.customAchievements : [];
            const ach = customList.find(x => x.id === id);
            if (!ach) return;

            const ok = await showConfirmModalV2({
                title: '🗑️ Eliminar logro personalizado',
                text: `Se eliminará el logro "${ach.title ?? 'Logro'}" y su estado de desbloqueo. No afecta logros automáticos.`,
                confirmText: 'Sí, eliminar',
                cancelText: 'Cancelar',
                fallbackText: '¿Eliminar logro?'
            });
            if (!ok) return;

            currentSubject.meta.customAchievements = customList.filter(x => x.id !== id);
            if (currentSubject?.meta?.achievements) delete currentSubject.meta.achievements[id];
            saveData(true);
            renderCustomAchievementsEditor(currentSubject);
            renderAchievementsV2();
            renderHomePage();
        });
    }
}

function syncCustomAchievementTypeUi(subject) {
    if (!customAchType || !customAchCategory || !customAchValueRow || !customAchCategoryRow) return;
    const type = customAchType.value;

    customAchValueRow.hidden = type === 'category_complete';
    customAchCategoryRow.hidden = type !== 'category_complete';

    if (type === 'category_complete') {
        const cats = subject?.categories ?? [];
        customAchCategory.innerHTML = cats.map(c => `<option value="${String(c.id)}">${escapeHtml(c.icon ? `${c.icon} ` : '')}${escapeHtml(c.name ?? 'Tema')}</option>`).join('');
    }
}

function showEditSubjectModal() {
    if (!currentSubject || !editSubjectModal) {
        showNotification('Selecciona una materia primero');
        return;
    }

    editingSubjectId = currentSubject.id;
    editSubjectDraft = editDraftFromSubject(currentSubject);

    if (editSubjectNameInput) editSubjectNameInput.value = currentSubject.name ?? '';
    if (editSubjectIconInput) editSubjectIconInput.value = currentSubject.icon ?? '📚';
    if (editSubjectColorInput) editSubjectColorInput.value = currentSubject.color ?? '#667eea';

    setEditSubjectModalTab('details');
    renderEditSubjectBuilder();
    renderCustomAchievementsEditor(currentSubject);
    syncCustomAchievementTypeUi(currentSubject);

    if (customAchTitle) customAchTitle.value = '';
    if (customAchDesc) customAchDesc.value = '';
    if (customAchValue) customAchValue.value = '';
    if (customAchStatus) customAchStatus.textContent = '';

    editSubjectModal.classList.add('active');
}

function hideEditSubjectModal() {
    if (!editSubjectModal) return;
    editSubjectModal.classList.remove('active');
    editingSubjectId = null;
    editSubjectDraft = null;
}

function pruneSubjectAchievementsToDefinitions(subject) {
    if (!subject?.meta?.achievements) return;
    const defs = subjectAchievementDefinitionsV2(subject);
    const allowed = new Set(defs.map(d => d.id));

    for (const id of Object.keys(subject.meta.achievements)) {
        if (!allowed.has(id)) delete subject.meta.achievements[id];
    }
}

function applyEditDraftToSubject(subject) {
    if (!subject) return;
    ensureEditSubjectDraft();

    const originalCategoriesById = new Map((subject.categories ?? []).map(c => [Number(c.id), c]));

    const newCategories = [];
    for (const dc of editSubjectDraft.categories ?? []) {
        const name = String(dc.name ?? '').trim() || 'Tema';
        const icon = String(dc.icon ?? '').trim() || '📌';
        const catId = Number(dc.id) || addSubjectDraftId();

        const originalCat = originalCategoriesById.get(catId) ?? null;
        const originalTopics = Array.isArray(originalCat?.topics) ? originalCat.topics : [];

        const draftTopics = Array.isArray(dc.topics) ? dc.topics : [];
        const topics = draftTopics
            .filter(t => String(t.name ?? '').trim())
            .map(t => {
                const depth = Math.max(1, Math.min(20, Number(t.depth) || 1));
                const src = (t.sourceIndex != null) ? originalTopics[t.sourceIndex] : null;
                const obj = src ? src : { name: '', level: 1, completed: false, completedAt: null, reviews: [] };
                obj.name = String(t.name ?? '').trim();
                obj.level = depth;
                if (!Array.isArray(obj.reviews)) obj.reviews = [];
                if (obj.completed && obj.completedAt == null) obj.completedAt = Date.now();
                return obj;
            });

        const catObj = originalCat ? { ...originalCat } : { id: catId };
        catObj.id = catId;
        catObj.name = name;
        catObj.icon = icon;
        catObj.topics = topics;
        newCategories.push(catObj);
    }

    subject.categories = newCategories;
    pruneSubjectAchievementsToDefinitions(subject);
}

function editingSubjectRef() {
    if (!appState) return null;
    if (editingSubjectId == null) return currentSubject;
    return appState.subjects.find(s => s.id === editingSubjectId) ?? currentSubject;
}

function saveEditedSubject() {
    const subject = editingSubjectRef();
    if (!subject) return false;

    const name = String(editSubjectNameInput?.value ?? '').trim();
    if (!name) {
        showNotification('El nombre es obligatorio');
        return false;
    }

    const icon = String(editSubjectIconInput?.value ?? '📚').trim() || '📚';
    const color = String(editSubjectColorInput?.value ?? subject.color ?? '#667eea');

    subject.name = name;
    subject.icon = icon;
    subject.color = color;

    applyEditDraftToSubject(subject);
    checkSubjectAchievementsV2(subject, { silent: true });

    saveData(true);
    renderSubjectList();
    renderAll();

    return true;
}

function resetSubjectProgress(subject) {
    if (!subject) return;

    // Preserve identity + settings
    const preserved = {
        id: subject.id,
        name: subject.name,
        icon: subject.icon,
        color: subject.color,
        categories: subject.categories,
        difficulty: subject?.meta?.difficulty ?? 'normal',
        customAchievements: Array.isArray(subject?.meta?.customAchievements) ? subject.meta.customAchievements : []
    };

    // Reset topic completion + reviews
    for (const category of preserved.categories ?? []) {
        for (const topic of category.topics ?? []) {
            topic.completed = false;
            topic.completedAt = null;
            topic.reviews = [];
        }
    }

    // Reset meta stats/timer/skills/achievements
    const freshMeta = createSubject(preserved.id, preserved.name, preserved.icon, preserved.color).meta;
    freshMeta.difficulty = preserved.difficulty;
    freshMeta.customAchievements = preserved.customAchievements;

    subject.meta = freshMeta;
    subject.categories = preserved.categories ?? [];
}

async function resetCurrentSubject() {
    if (!currentSubject) return;
    const name = currentSubject.name ?? 'esta materia';

    const ok = await showConfirmModalV2({
        title: '♻️ Reiniciar esta materia',
        text: `Esto borra el progreso de "${name}" (temas completados, sesiones, XP y logros de esta materia). La estructura (temas/subtemas) se mantiene.`,
        confirmText: 'Sí, reiniciar materia',
        cancelText: 'Cancelar',
        fallbackText: `¿Reiniciar "${name}"?`
    });
    if (!ok) return;

    resetSubjectProgress(currentSubject);
    saveData(true);
    renderAll();
    showNotification(`Materia "${name}" reiniciada.`);
}

function addSubject() {
    const name = subjectNameInput.value.trim();
    const icon = subjectIconInput.value.trim();
    const color = subjectColorInput.value;
    
    if (!name) {
        showNotification('El nombre de la materia es obligatorio');
        return;
    }
    
    const newSubject = createSubject(Date.now(), name, icon || '📚', color);

    ensureAddSubjectDraft();
    const baseId = Date.now() + 100;

    const categories = (addSubjectDraft.categories || []).map((cat, idx) => {
        const catNameRaw = String(cat.name ?? '').trim();
        const catIcon = String(cat.icon ?? '').trim() || '📌';
        const catId = baseId + idx;

        const topics = Array.isArray(cat.topics) ? cat.topics : [];
        const normalizedTopics = topics
            .filter(t => String(t.name ?? '').trim())
            .map(t => ({
                name: String(t.name ?? '').trim(),
                level: Math.max(1, Math.min(20, Number(t.depth) || 1)),
                completed: false,
                completedAt: null,
                reviews: []
            }));

        if (!catNameRaw && normalizedTopics.length === 0) return null;

        const catName = catNameRaw || `Tema ${idx + 1}`;

        return {
            id: catId,
            name: catName,
            icon: catIcon,
            topics: normalizedTopics
        };
    }).filter(Boolean);

    if (categories.length) {
        newSubject.categories = categories;
    } else {
        newSubject.categories = [];
    }

    appState.subjects.push(newSubject);
    saveData(true);
    hideAddSubjectModal();
    renderSubjectList();
    renderHomePage();
    showNotification(`Materia "${name}" creada`);
}

async function deleteCurrentSubject() {
    if (!currentSubject) return;

    const ok = await showConfirmModalV2({
        title: '🗑️ Eliminar materia',
        text: `Esto elimina la materia "${currentSubject.name}" y todo su progreso/logros. No se puede deshacer.`,
        confirmText: 'Sí, eliminar',
        cancelText: 'Cancelar',
        fallbackText: `¿Eliminar "${currentSubject.name}"?`
    });
    if (!ok) return;
    
    const index = appState.subjects.findIndex(sub => sub.id === currentSubject.id);
    if (index !== -1) {
        appState.subjects.splice(index, 1);
        currentSubject = null;
        saveData(true);
        setActiveView('homeView');
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === 'homeView');
        });
        renderAll();
        showNotification('Materia eliminada');
    }
}

function renderHomePage() {
    const totalSubjects = appState.subjects.length;
    const unlockedGlobal = globalAchievementDefinitionsV2().reduce((sum, a) => sum + ((appState.globalMeta.achievements ?? {})[a.id] ? 1 : 0), 0);
    const unlockedSubject = (appState.subjects ?? []).reduce((sum, s) => {
        const prefix = `subj_${s.id}_`;
        const ids = Object.keys(s?.meta?.achievements ?? {}).filter(id => id.startsWith(prefix));
        return sum + ids.length;
    }, 0);
    const totalAchievements = unlockedGlobal + unlockedSubject;
    const totalTime = prettyTime(appState.globalMeta.totalFocusSeconds);
    const globalProgress = calculateGlobalProgress();
    
    totalSubjectsEl.textContent = totalSubjects;
    totalAchievementsEl.textContent = totalAchievements;
    totalTimeEl.textContent = totalTime;
    globalProgressEl.textContent = `${globalProgress}%`;
    
    ensureHomeAchievementsPanelV2();
    renderHomeAchievementsV2();
    ensureHomeStatsPanelV2();
    renderHomeStatsV2();
    renderRecentSubjects();
}

function calculateGlobalProgress() {
    let totalTopics = 0;
    let completedTopics = 0;
    
    appState.subjects.forEach(subject => {
        subject.categories.forEach(category => {
            totalTopics += category.topics.length;
            completedTopics += category.topics.filter(t => t.completed).length;
        });
    });
    
    return totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
}

function renderRecentSubjects() {
    recentSubjectsGrid.innerHTML = '';
    
    const recentSubjects = [...appState.subjects]
        .sort((a, b) => {
            const aTime = getSubjectLastActivity(a);
            const bTime = getSubjectLastActivity(b);
            return bTime - aTime;
        })
        .slice(0, 6);
    
    recentSubjects.forEach(subject => {
        const progress = calculateSubjectProgress(subject);
        
        const card = document.createElement('button');
        card.className = 'subject-card';
        card.dataset.subjectId = subject.id;
        card.innerHTML = `
            <div class="subject-card-icon">${subject.icon}</div>
            <div class="subject-card-name">${escapeHtml(subject.name)}</div>
            <div class="subject-card-progress">${progress}% completado</div>
        `;
        
        card.addEventListener('click', () => selectSubject(subject.id));
        recentSubjectsGrid.appendChild(card);
    });
}

function getSubjectLastActivity(subject) {
    const sessionDates = subject.meta.sessions.map(s => s.startTime);
    return sessionDates.length > 0 ? Math.max(...sessionDates) : 0;
}

function setupEventListeners() {
    if (resetBtn) resetBtn.addEventListener('click', resetCurrentSubject);

    categoriesContainer.addEventListener('click', (e) => {
        const topicItem = e.target.closest('.topic-item');
        if (!topicItem) return;
        const categoryId = parseInt(topicItem.dataset.categoryId, 10);
        const topicIndex = parseInt(topicItem.dataset.topicIndex, 10);
        toggleTopicCompleted(categoryId, topicIndex);
    });

    timerToggleBtn.addEventListener('click', startOrPauseTimer);
    timerStopBtn.addEventListener('click', stopTimer);

    difficultySelect.addEventListener('change', () => setDifficulty(difficultySelect.value));

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => setActiveView(btn.dataset.view));
    });

    window.addEventListener('beforeunload', () => saveData(true));

    addSubjectBtn.addEventListener('click', showAddSubjectModal);
    closeModalBtn.addEventListener('click', hideAddSubjectModal);
    cancelModalBtn.addEventListener('click', hideAddSubjectModal);
    confirmAddSubjectBtn.addEventListener('click', addSubject);

    if (addSubjectTabManual) {
        addSubjectTabManual.addEventListener('click', () => setAddSubjectModalTab('manual'));
    }
    if (addSubjectTabImport) {
        addSubjectTabImport.addEventListener('click', () => setAddSubjectModalTab('import'));
    }

    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', () => {
            ensureAddSubjectDraft();
            addSubjectDraft.categories.push(createDraftCategory());
            renderAddSubjectBuilder();
        });
    }

    if (subjectImportFile) {
        subjectImportFile.addEventListener('change', () => {
            const file = subjectImportFile.files && subjectImportFile.files[0];
            if (!file) return;

            if (subjectImportStatus) subjectImportStatus.textContent = 'Leyendo archivo…';

            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const text = String(reader.result ?? '');
                    const payload = JSON.parse(text);
                    applyImportedSubjectToDraft(payload);
                    setAddSubjectModalTab('manual');
                    if (subjectImportStatus) subjectImportStatus.textContent = 'Importación lista. Revisá y tocá “Crear”.';
                } catch (err) {
                    console.error(err);
                    if (subjectImportStatus) subjectImportStatus.textContent = 'No se pudo importar: JSON inválido o estructura no soportada.';
                }
            };
            reader.onerror = () => {
                if (subjectImportStatus) subjectImportStatus.textContent = 'No se pudo leer el archivo.';
            };
            reader.readAsText(file);
        });
    }

    if (editSubjectBtn) {
        editSubjectBtn.addEventListener('click', showEditSubjectModal);
    }
    if (closeEditSubjectModalBtn) closeEditSubjectModalBtn.addEventListener('click', hideEditSubjectModal);
    if (cancelEditSubjectModalBtn) cancelEditSubjectModalBtn.addEventListener('click', hideEditSubjectModal);
    if (confirmEditSubjectModalBtn) {
        confirmEditSubjectModalBtn.addEventListener('click', () => {
            const ok = saveEditedSubject();
            if (ok) {
                showNotification('Cambios guardados.');
                hideEditSubjectModal();
            }
        });
    }

    if (editSubjectTabDetails) editSubjectTabDetails.addEventListener('click', () => setEditSubjectModalTab('details'));
    if (editSubjectTabStructure) editSubjectTabStructure.addEventListener('click', () => setEditSubjectModalTab('structure'));
    if (editSubjectTabAchievements) editSubjectTabAchievements.addEventListener('click', () => setEditSubjectModalTab('achievements'));
    if (editSubjectTabReset) editSubjectTabReset.addEventListener('click', () => setEditSubjectModalTab('reset'));

    if (editAddCategoryBtn) {
        editAddCategoryBtn.addEventListener('click', () => {
            ensureEditSubjectDraft();
            editSubjectDraft.categories.push(createDraftCategory());
            renderEditSubjectBuilder();
            const subject = editingSubjectRef();
            if (subject) syncCustomAchievementTypeUi(subject);
        });
    }

    if (resetSubjectBtn) {
        resetSubjectBtn.addEventListener('click', async () => {
            await resetCurrentSubject();
            hideEditSubjectModal();
        });
    }

    if (customAchType) {
        customAchType.addEventListener('change', () => {
            const subject = editingSubjectRef();
            if (subject) syncCustomAchievementTypeUi(subject);
        });
    }

    if (addCustomAchievementBtn) {
        addCustomAchievementBtn.addEventListener('click', async () => {
            const subject = editingSubjectRef();
            if (!subject) return;

            if (!subject.meta) subject.meta = {};
            if (!Array.isArray(subject.meta.customAchievements)) subject.meta.customAchievements = [];

            const title = String(customAchTitle?.value ?? '').trim();
            const desc = String(customAchDesc?.value ?? '').trim();
            const type = String(customAchType?.value ?? 'pct');

            if (!title) {
                if (customAchStatus) customAchStatus.textContent = 'El título es obligatorio.';
                return;
            }

            const ach = {
                id: `custom_${subject.id}_${Date.now()}`,
                title,
                desc,
                type,
                value: null,
                categoryId: null
            };

            if (type === 'pct') {
                const v = Number(String(customAchValue?.value ?? '').trim());
                if (!Number.isFinite(v) || v <= 0 || v > 100) {
                    if (customAchStatus) customAchStatus.textContent = 'Usá un porcentaje entre 1 y 100.';
                    return;
                }
                ach.value = Math.round(v);
            } else if (type === 'focus_minutes') {
                const v = Number(String(customAchValue?.value ?? '').trim());
                if (!Number.isFinite(v) || v <= 0) {
                    if (customAchStatus) customAchStatus.textContent = 'Usá una cantidad de minutos mayor a 0.';
                    return;
                }
                ach.value = Math.round(v);
            } else if (type === 'category_complete') {
                const cid = Number(customAchCategory?.value);
                if (!Number.isFinite(cid)) {
                    if (customAchStatus) customAchStatus.textContent = 'Elegí un tema válido.';
                    return;
                }
                ach.categoryId = cid;
            }

            subject.meta.customAchievements.push(ach);
            if (customAchStatus) customAchStatus.textContent = 'Logro agregado.';

            if (customAchTitle) customAchTitle.value = '';
            if (customAchDesc) customAchDesc.value = '';
            if (customAchValue) customAchValue.value = '';

            saveData(true);
            checkSubjectAchievementsV2(subject, { silent: true });
            renderCustomAchievementsEditor(subject);
            renderAchievementsV2();
            renderHomePage();
        });
    }

    deleteSubjectBtn.addEventListener('click', deleteCurrentSubject);

    quickAddSubject.addEventListener('click', showAddSubjectModal);
    quickStartSession.addEventListener('click', () => {
        if (!currentSubject) {
            const subjects = appState.subjects ?? [];
            if (subjects.length === 0) {
                showNotification('Crea una materia primero');
                return;
            }

            const mostRecent = [...subjects].sort((a, b) => getSubjectLastActivity(b) - getSubjectLastActivity(a))[0] ?? subjects[0];
            selectSubject(mostRecent.id);
        }

        startOrPauseTimer();
    });
    quickViewStats.addEventListener('click', () => {
        ensureHomeStatsPanelV2();
        renderHomeStatsV2();

        const detailsEl = document.getElementById('homeStatsDetails');
        const toggleBtn = document.getElementById('homeStatsToggleBtn');
        if (detailsEl) detailsEl.hidden = false;
        if (toggleBtn) toggleBtn.textContent = 'Ocultar';

        try {
            document.getElementById('homeStatsPanel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch {
            // ignore
        }
    });

    if (quickResetAll) {
        quickResetAll.addEventListener('click', resetData);
    }

    document.querySelectorAll('.nav-item[data-view="homeView"]').forEach(btn => {
        btn.addEventListener('click', () => {
            currentSubject = null;
            setActiveView('homeView');
            document.querySelectorAll('.nav-item').forEach(b => {
                b.classList.toggle('active', b.dataset.view === 'homeView');
            });
            renderAll();
        });
    });
}

function toggleTopicCompleted(categoryId, topicIndex) {
    if (!currentSubject) return;
    
    const category = currentSubject.categories.find(c => c.id === categoryId);
    if (!category) return;
    const topic = category.topics[topicIndex];
    if (!topic) return;

    const now = Date.now();
    const wasCompleted = !!topic.completed;
    topic.completed = !topic.completed;

    if (topic.completed) {
        topic.completedAt = now;
        topic.reviews = [];
        currentSubject.meta.xp += 22;
        appState.globalMeta.xp += 22;
        
        while (currentSubject.meta.xp >= xpToNextLevel(currentSubject.meta.level)) {
            currentSubject.meta.xp -= xpToNextLevel(currentSubject.meta.level);
            currentSubject.meta.level += 1;
            currentSubject.meta.skillPoints += 1;
        }
        
        while (appState.globalMeta.xp >= xpToNextLevel(appState.globalMeta.level)) {
            appState.globalMeta.xp -= xpToNextLevel(appState.globalMeta.level);
            appState.globalMeta.level += 1;
            appState.globalMeta.skillPoints += 1;
        }
        
        showNotification('Tema completado! +22 XP');
    } else {
        topic.completedAt = null;
        topic.reviews = [];
    }

    if (wasCompleted !== topic.completed) {
        checkAchievementsV2({ activity: 'topic', nowMs: now });
        renderAllNonTimer();
        saveData(true);
    }
}

function ensureNotificationStyles() {
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
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 14px 18px;
            border-radius: 10px;
            box-shadow: 0 10px 28px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            animation: slideIn 0.25s ease-out;
            font-weight: 800;
            max-width: min(420px, calc(100vw - 40px));
        }
    `;
    document.head.appendChild(style);
}

function showNotification(message) {
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

function loadTheme() {
    const savedTheme = localStorage.getItem('studyTrackerTheme');
    isDarkMode = savedTheme === 'dark';
    applyTheme();
}

function applyTheme() {
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        themeToggleBtn.textContent = '☀️';
    } else {
        document.body.classList.remove('dark-mode');
        themeToggleBtn.textContent = '🌙';
    }
    localStorage.setItem('studyTrackerTheme', isDarkMode ? 'dark' : 'light');
}

function toggleTheme() {
    isDarkMode = !isDarkMode;
    applyTheme();
}

function setupAdditionalEventListeners() {
    themeToggleBtn.addEventListener('click', toggleTheme);
    
    // Add event listener to subject list container
    subjectList.addEventListener('click', (e) => {
        const navItem = e.target.closest('.nav-item');
        if (navItem && navItem.dataset.subjectId) {
            selectSubject(parseInt(navItem.dataset.subjectId, 10));
        }
    });
}

function initApp() {
    loadData();
    checkAchievementsV2({ activity: 'generic', nowMs: Date.now(), silent: true });
    loadTheme();
    renderAll();
    setupEventListeners();
    setupAdditionalEventListeners();
    
    // Open to home page by default
    currentSubject = null;
    setActiveView('homeView');
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === 'homeView');
    });
}

document.addEventListener('DOMContentLoaded', initApp);
