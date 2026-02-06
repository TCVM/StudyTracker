// Datos iniciales del plan de estudios: Arquitectura y Organización de Computadoras (con jerarquía)
const initialData = {
    categories: [
        {
            id: 1,
            name: "Estructura del Computador y Componentes",
            icon: "💻",
            topics: [
                { name: "Arquitectura de Von Neumann (IAS)", level: 1 },
                { name: "Memoria Principal (Datos/Instrucciones)", level: 2 },
                { name: "Unidad Aritmético-Lógica (ALU)", level: 2 },
                { name: "Unidad de Control (UC)", level: 2 },
                { name: "Equipo de Entrada/Salida (E/S)", level: 2 },
                { name: "Componentes de la CPU", level: 1 },
                { name: "Unidad de Control (UC)", level: 2 },
                { name: "ALU (Procesamiento de Datos)", level: 2 },
                { name: "Registros (Almacenamiento Interno)", level: 2 },
                { name: "Interconexiones CPU (Comunicación Interna)", level: 2 },
                { name: "Evolución", level: 1 },
                { name: "Microprocesador (Intel 4004, 1971)", level: 2 },
                { name: "Memoria Caché (IBM S/360 Mod. 85, 1968)", level: 2 },
                { name: "Concepto de Familia (IBM System/360, 1964)", level: 2 },
                { name: "Unidad de Control Microprogramada (1964)", level: 2 }
            ]
        },
        {
            id: 2,
            name: "Jerarquía de Memoria",
            icon: "📊",
            topics: [
                { name: "¿Por qué funciona?", level: 1 },
                { name: "Principio de Localidad de Referencias", level: 2 },
                { name: "Localidad Temporal", level: 3 },
                { name: "Localidad Espacial", level: 3 },
                { name: "Propiedades a Cumplir", level: 1 },
                { name: "Inclusión", level: 2 },
                { name: "Coherencia", level: 2 },
                { name: "Memoria Caché", level: 1 },
                { name: "Organización y Diseño", level: 2 },
                { name: "Tamaño de Caché", level: 3 },
                { name: "Función de Correspondencia", level: 3 },
                { name: "Directa", level: 4 },
                { name: "Asociativa", level: 4 },
                { name: "Asociativa por Conjuntos (k-vías)", level: 4 },
                { name: "Política de Escritura", level: 3 },
                { name: "Escritura Inmediata (Write-Through)", level: 4 },
                { name: "Post-Escritura (Write-Back)", level: 4 },
                { name: "Política de Reemplazo", level: 3 },
                { name: "LRU (Menos Recientemente Usado)", level: 4 },
                { name: "FIFO", level: 4 },
                { name: "LFU", level: 4 },
                { name: "Aleatoria", level: 4 },
                { name: "Múltiples Niveles (L1, L2, L3)", level: 3 },
                { name: "Prestaciones", level: 2 },
                { name: "Tasa de Aciertos (H)", level: 3 },
                { name: "Tasa de Fallos (TF)", level: 3 },
                { name: "Penalización por Fallo (PF)", level: 3 },
                { name: "Tiempo Medio de Acceso", level: 3 },
                { name: "Otros Niveles", level: 1 },
                { name: "Memoria Principal (DRAM)", level: 2 },
                { name: "Memoria Virtual (Disco Duro)", level: 2 },
                { name: "Almacenamiento Local (RISC/GPUs)", level: 2 }
            ]
        },
        {
            id: 3,
            name: "Repertorio de Instrucciones (RI)",
            icon: "📝",
            topics: [
                { name: "Elementos de una Instrucción", level: 1 },
                { name: "Código de Operación (Codop)", level: 2 },
                { name: "Referencia a Operandos Fuente", level: 2 },
                { name: "Referencia a Resultado", level: 2 },
                { name: "Referencia a Siguiente Instrucción", level: 2 },
                { name: "Decisiones de Diseño", level: 1 },
                { name: "Formato de Instrucción", level: 2 },
                { name: "Fijo (RISC)", level: 3 },
                { name: "Variable (CISC)", level: 3 },
                { name: "Cantidad de Direcciones", level: 2 },
                { name: "Tipos de Operando (Numéricos, Caracteres, Lógicos)", level: 2 },
                { name: "Repertorio de Operaciones (Cantos, Cuales, Complejidad)", level: 2 },
                { name: "Registros (Número, Uso)", level: 2 },
                { name: "Tipos de Operaciones", level: 1 },
                { name: "Procesamiento de Datos (Aritméticas/Lógicas)", level: 2 },
                { name: "Transferencia de Datos (Memoria/E/S)", level: 2 },
                { name: "Control (Salto/Flujo)", level: 2 },
                { name: "Conversión (Formato de Datos)", level: 2 },
                { name: "Modos de Direccionamiento (MDD)", level: 1 },
                { name: "Inmediato", level: 2 },
                { name: "Directo (Absoluto)", level: 2 },
                { name: "Directo de Registro", level: 2 },
                { name: "Indirecto con Registro", level: 2 },
                { name: "Con Desplazamiento (Base, Indexado, Relativo al PC)", level: 2 },
                { name: "Pila (Relativo al SP)", level: 2 }
            ]
        },
        {
            id: 4,
            name: "Control de E/S y Buses",
            icon: "🔌",
            topics: [
                { name: "Bus del Sistema", level: 1 },
                { name: "Bus de Datos (Anchura)", level: 2 },
                { name: "Bus de Dirección (Máx. Capacidad de Memoria)", level: 2 },
                { name: "Bus de Control (Ordenes, Temporización)", level: 2 },
                { name: "Sincronización (Síncrono vs Asíncrono)", level: 2 },
                { name: "Módulos de E/S", level: 1 },
                { name: "Funciones (Control, Comunicación CPU/Memoria, Buffering)", level: 2 },
                { name: "Acceso a E/S", level: 2 },
                { name: "E/S Asignada en Memoria (Memory-Mapped)", level: 3 },
                { name: "E/S Aislada (Separada de Memoria)", level: 3 },
                { name: "Técnicas de Gestión de E/S", level: 1 },
                { name: "E/S Programada (CPU Ociosa, Comprobación Periódica)", level: 2 },
                { name: "E/S con Interrupciones (CPU Continúa Procesando)", level: 2 },
                { name: "Acceso Directo a Memoria (DMA)", level: 2 },
                { name: "Controlador DMA (DMAC)", level: 3 },
                { name: "Modo Ráfaga (Burst)", level: 3 },
                { name: "Modo Robo de Ciclo (Cycle-Stealling)", level: 3 },
                { name: "Canales de E/S (Selector/Multiplexor)", level: 3 },
                { name: "Interrupciones", level: 1 },
                { name: "Tipos (Hardware, Software, Traps/Excepciones)", level: 2 },
                { name: "Pasos del Gestor (Salvar Estado, Tratar Causa, Restaurar Estado)", level: 2 },
                { name: "Prioridades (Múltiples Interrupciones)", level: 2 },
                { name: "Controlador PIC (Gestión Externa, Vectorizado)", level: 2 },
                { name: "Vector de Interrupciones (Direcciones de Rutinas)", level: 2 }
            ]
        },
        {
            id: 5,
            name: "Segmentación y Paralelismo (Pipeline)",
            icon: "⚡",
            topics: [
                { name: "Ciclo de Instrucción Segmentado (nanoMIPS)", level: 1 },
                { name: "Fase F (Búsqueda de Instrucción/MI)", level: 2 },
                { name: "Fase D (Decodificación/Acceso a Registros)", level: 2 },
                { name: "Fase X (Ejecución/ALU)", level: 2 },
                { name: "Fase M (Acceso a Memoria/MD)", level: 2 },
                { name: "Fase W (Escritura en Registro/Writeback)", level: 2 },
                { name: "Riesgos (Stalls)", level: 1 },
                { name: "Riesgos Estructurales", level: 2 },
                { name: "Causa: Conflicto por Recursos Compartidos", level: 3 },
                { name: "Solución: Duplicación de Recursos (MI/MD), Turnos", level: 3 },
                { name: "Dependencia de Datos", level: 2 },
                { name: "RAW (Read After Write)", level: 3 },
                { name: "WAR (Write After Read, Anti-Dependencia)", level: 3 },
                { name: "WAW (Write After Write, Salida)", level: 3 },
                { name: "Solución Hardware: Adelantamiento (Forwarding)", level: 3 },
                { name: "Solución Software: NOP o Reordenación de Código", level: 3 },
                { name: "Dependencia de Control", level: 2 },
                { name: "Causa: Instrucciones de Salto", level: 3 },
                { name: "Solución: Predicción de Saltos (Estática/Dinámica)", level: 3 },
                { name: "Solución: Salto Retardado (NOP/Reordenación)", level: 3 },
                { name: "Técnicas de Aceleración", level: 1 },
                { name: "Supersegmentación (Más Etapas, Ciclo de Reloj Rápido)", level: 2 },
                { name: "Superescalar", level: 2 },
                { name: "Multiples Cauces Independientes", level: 3 },
                { name: "Emisión Multiple de Instrucciones", level: 3 },
                { name: "Ventana de Instrucciones", level: 3 },
                { name: "Renombramiento de Registros (Elimina WAR/WAW)", level: 3 },
                { name: "Planificación Dinámica Distribuida (Tomasulo)", level: 2 },
                { name: "Estaciones de Reserva", level: 3 },
                { name: "Common Data Bus (CDB)", level: 3 },
                { name: "Ejecución Fuera de Orden", level: 3 }
            ]
        },
        {
            id: 6,
            name: "Sistemas de Múltiples Procesadores",
            icon: "🔄",
            topics: [
                { name: "Taxonomía de Flynn (MIMD)", level: 1 },
                { name: "Memoria Compartida (Fuertemente Acoplada)", level: 2 },
                { name: "SMP (Acceso Uniforme - UMA)", level: 3 },
                { name: "NUMA (Acceso No Uniforme)", level: 3 },
                { name: "Problemas: Coherencia de Caché, Sincronización", level: 3 },
                { name: "Memoria Distribuida (Débilmente Acoplada)", level: 2 },
                { name: "Clusters (Nodos Completos)", level: 3 },
                { name: "Comunicación: Paso de Mensajes (Send/Receive)", level: 3 },
                { name: "Coherencia de Caché (MP)", level: 1 },
                { name: "Protocolos de Sondeo (Snoopy)", level: 2 },
                { name: "Protocolos Basados en Invalidación", level: 2 },
                { name: "Protocolo MESI (Modified, Exclusive, Shared, Invalid)", level: 3 },
                { name: "Protocolos de Actualización", level: 2 },
                { name: "Procesamiento Multihebra (Multithreading)", level: 1 },
                { name: "Explotación de Paralelismo a Nivel de Hilo (TLP)", level: 2 },
                { name: "Hilos (Threads) vs Procesos", level: 2 }
            ]
        }
    ]
};

// Estado de la aplicación
let appState = {
    categories: []
};

// Elementos del DOM
const categoriesContainer = document.getElementById('categoriesContainer');
const globalPercentage = document.getElementById('globalPercentage');
const globalProgress = document.getElementById('globalProgress');
const saveBtn = document.getElementById('saveBtn');
const resetBtn = document.getElementById('resetBtn');

// Inicializar la aplicación
function initApp() {
    loadData();
    renderCategories();
    updateGlobalProgress();
    setupEventListeners();
}

// Cargar datos desde localStorage
function loadData() {
    const savedData = localStorage.getItem('studyTrackerData');
    if (savedData) {
        appState = JSON.parse(savedData);
    } else {
        // Inicializar con datos por defecto
        appState.categories = initialData.categories.map(category => ({
            ...category,
            topics: category.topics.map(topic => ({
                name: topic.name,
                level: topic.level,
                completed: false
            }))
        }));
    }
}

// Guardar datos en localStorage
function saveData() {
    localStorage.setItem('studyTrackerData', JSON.stringify(appState));
    showNotification('Progreso guardado correctamente!');
}

// Reiniciar progreso
function resetData() {
    if (confirm('¿Estás seguro de reiniciar todo el progreso?')) {
        appState.categories = initialData.categories.map(category => ({
            ...category,
            topics: category.topics.map(topic => ({
                name: topic.name,
                level: topic.level,
                completed: false
            }))
        }));
        saveData();
        renderCategories();
        updateGlobalProgress();
        showNotification('Progreso reiniciado!');
    }
}

// Renderizar categorías
function renderCategories() {
    categoriesContainer.innerHTML = '';
    
    appState.categories.forEach(category => {
        const categoryCard = createCategoryCard(category);
        categoriesContainer.appendChild(categoryCard);
    });
}

// Crear tarjeta de categoría
function createCategoryCard(category) {
    const card = document.createElement('div');
    card.className = 'category-card';
    
    // Calcular progreso de la categoría
    const totalTopics = category.topics.length;
    const completedTopics = category.topics.filter(topic => topic.completed).length;
    const progress = Math.round((completedTopics / totalTopics) * 100);
    
    card.innerHTML = `
        <div class="category-header">
            <div class="category-title">
                <div class="category-icon">${category.icon}</div>
                ${category.name}
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
            ${category.topics.map((topic, topicIndex) => `
                <li class="topic-item ${topic.completed ? 'completed' : ''}" 
                    data-category-id="${category.id}" 
                    data-topic-index="${topicIndex}"
                    style="padding-left: ${(topic.level - 1) * 20}px">
                    <div class="topic-checkbox"></div>
                    <div class="topic-name">${topic.name}</div>
                </li>
            `).join('')}
        </ul>
    `;
    
    return card;
}

// Manejar clic en tema
function handleTopicClick(e) {
    const topicItem = e.target.closest('.topic-item');
    if (!topicItem) return;
    
    const categoryId = parseInt(topicItem.dataset.categoryId);
    const topicIndex = parseInt(topicItem.dataset.topicIndex);
    
    const category = appState.categories.find(cat => cat.id === categoryId);
    if (category) {
        category.topics[topicIndex].completed = !category.topics[topicIndex].completed;
        saveData();
        
        // Actualizar solo el elemento clickeado en lugar de renderizar todo
        const isCompleted = category.topics[topicIndex].completed;
        if (isCompleted) {
            topicItem.classList.add('completed');
        } else {
            topicItem.classList.remove('completed');
        }
        
        updateCategoryProgress(categoryId);
        updateGlobalProgress();
    }
}

// Actualizar el progreso de una categoría específica
function updateCategoryProgress(categoryId) {
    const category = appState.categories.find(cat => cat.id === categoryId);
    if (!category) return;
    
    const totalTopics = category.topics.length;
    const completedTopics = category.topics.filter(topic => topic.completed).length;
    const progress = Math.round((completedTopics / totalTopics) * 100);
    
    const categoryCard = document.querySelector(`#topics-${categoryId}`).closest('.category-card');
    const percentageElement = categoryCard.querySelector('.category-progress .progress-percentage');
    const progressBar = categoryCard.querySelector('.category-progress .progress-fill');
    
    if (percentageElement) {
        percentageElement.textContent = `${progress}%`;
    }
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
}

// Actualizar progreso global
function updateGlobalProgress() {
    let totalTopics = 0;
    let completedTopics = 0;
    
    appState.categories.forEach(category => {
        totalTopics += category.topics.length;
        completedTopics += category.topics.filter(topic => topic.completed).length;
    });
    
    const globalProgess = Math.round((completedTopics / totalTopics) * 100);
    
    globalPercentage.textContent = `${globalProgess}%`;
    globalProgress.style.width = `${globalProgess}%`;
}

// Mostrar notificación
function showNotification(message) {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        padding: 16px 24px;
        border-radius: 10px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        font-weight: 600;
    `;
    
    // Agregar animación
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Eliminar notificación después de 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Configurar listeners de eventos
function setupEventListeners() {
    saveBtn.addEventListener('click', saveData);
    resetBtn.addEventListener('click', resetData);
    
    // Event delegation for topic items
    categoriesContainer.addEventListener('click', handleTopicClick);
}

// Inicializar la aplicación al cargar la página
document.addEventListener('DOMContentLoaded', initApp);