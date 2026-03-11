# StudyTracker - Arquitectura (ESM)

Este documento describe el “mapa” del sistema: entrypoints, flujo de datos, módulos y convenciones para mantener el proyecto consistente.

## Entry / bootstrap

- `index.html` carga `src/main.mjs` (ESM).
- `src/main.mjs` importa `src/app/bootstrap.mjs`.
- `src/app/bootstrap.mjs`:
  - carga persistencia (`loadData()`),
  - configura modo (tema, mapa),
  - hace el primer render (`renderAll()`),
  - instala listeners (`setupEventListeners()`),
  - abre Home (`setActiveView('homeView')`).

## Estado y persistencia

**Estado en memoria**

- `src/app/core/state.mjs` mantiene:
  - `appState` (todas las materias + meta global),
  - `currentSubject` (materia seleccionada o `null`).

**Persistencia**

- `src/app/core/storage.mjs` es la fuente de verdad para cargar/guardar (principalmente `localStorage`).
- `src/app/core/idb.mjs` guarda binarios (imágenes) en IndexedDB (cuando aplica).

Regla práctica: el render lee desde `getAppState()` / `getCurrentSubject()`; y las acciones mutan el estado y luego llaman `saveData()` + re-render.

## Navegación por vistas

- Cada vista es un `<section class="view" id="...">` (ver `index.html`).
- La visibilidad se controla por CSS con `.view-active` (ver `styles.css`).
- `src/app/ui/flow.mjs` provee:
  - `setActiveView(viewId)` (navegación),
  - `registerViewActivationHandler(viewId, fn)` para lógica “al entrar” (re-render / refresh de UI).

Esto evita pantallas vacías si una vista no estaba renderizada al momento de navegar.

## Capas (alto nivel)

### `src/app/ui/*` (orquestación)

- `src/app/ui/render.mjs`: render “global” y selección de materia.
- `src/app/ui/events.mjs`: listeners y wiring UI → acciones.
- `src/app/ui/home.mjs`: render del Home (incluye “próximos exámenes”).
- `src/app/ui/flow.mjs`: navegación entre vistas.
- `src/app/ui/*-modal.mjs`: modales comunes.

### `src/app/features/*` (features)

Cada feature agrupa estado/migración + render + acciones.

Ejemplos:

- `src/app/features/exams/*`: categorías/ítems + Q&A + adjuntos
- `src/app/features/practices/*`: prácticas + ejercicios + respuestas
- `src/app/features/topic-notes/*`: notas por tema (modal)
- `src/app/features/timer/*`: timer/pomodoro/alarma + UI
- `src/app/features/xp/*`: XP, dificultad, due/reviews

Convención recomendada por feature:

- `ensureSubjectX(subject)`: normaliza/migra datos legacy a la forma actual.
- `renderX()`: render idempotente (puede llamarse muchas veces).
- `actions`: funciones pequeñas que mutan estado + `saveData(true)` + re-render.

### `src/app/shared/*` (materias compartidas)

Estado/acciones/UI para importar/visualizar materias compartidas (datos viven localmente).

### `src/utils/*`

Helpers generales (formato de fechas, notificaciones, tema, etc.).

## Service Worker (PWA)

- SW: `sw.js` (caching).
- Registro: `src/register-sw.mjs` (puede estar desactivado en dev).

Si el SW está activo en un navegador, hay que tener cuidado con “mezcla de versiones” (HTML nuevo + JS viejo). En esos casos: desregistrar SW y limpiar Cache Storage.

## Estilos (CSS)

- Entry: `styles.css` (no contiene reglas; solo `@import`).
- Módulos: `styles/*.css` en orden de carga (mantener el orden para no cambiar la cascada).
- Regla: agregar estilos nuevos en el módulo correcto; evitar seguir engordando `styles/50-legacy.css`.
