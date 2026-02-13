# StudyTracker - Arquitectura (ESM)

## Entry

- `index.html` carga `src/main.mjs` (ESM).
- `src/main.mjs` inicializa el runtime importando `src/app/bootstrap.mjs`.
- `src/app/bootstrap.mjs` inicializa la app (carga datos, setup listeners, render inicial, etc.).

## Carpetas principales

### `src/app/`

Aplicación (runtime) y estado en memoria.

- `src/app/bootstrap.mjs`: inicialización (composition root).
- `src/app/core/*`: estado + persistencia + config.
  - `src/app/core/constants.mjs`
  - `src/app/core/state.mjs`
  - `src/app/core/ui-state.mjs`
  - `src/app/core/storage.mjs`
- `src/app/ui/*`: orquestación de UI (render, listeners, navegación).
  - `src/app/ui/render.mjs`
  - `src/app/ui/events.mjs`
  - `src/app/ui/home.mjs`
  - `src/app/ui/flow.mjs`
  - `src/app/ui/confirm-modal.mjs`
- `src/app/features/*`: features de la app (cada una con su propia lógica/UI).
  - `src/app/features/timer/*`
  - `src/app/features/achievements/*`
  - `src/app/features/subject/*`
  - `src/app/features/topics/*`
  - `src/app/features/notes/*`
  - `src/app/features/xp/*`
- `src/app/shared/*`: “Compartidas” (estado local, acciones y UI).

### `src/utils/`

- `src/utils/helpers.js`: helpers de UI/formatos/notificaciones/tema.
- `src/utils/initialData.js`: dataset inicial de Arquitectura.

## Nota sobre código antiguo

Se eliminó la arquitectura anterior (scripts clásicos / controllers / modules / views) para evitar redundancia. El único entry soportado es `src/main.mjs`.

