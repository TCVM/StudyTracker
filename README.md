# StudyTracker

App web (sin backend) para llevar materias, temas, timer, prácticas y exámenes. Corre 100% en el navegador usando ES Modules.

## Ejecutar

- Abrí `index.html` con un servidor estático (recomendado) para evitar problemas de CORS con módulos.
  - Ejemplo: `python -m http.server` y navegar a `http://localhost:8000`

## Móvil / Responsive

- En pantallas chicas (<= 768px) aparece un botón “☰” para abrir/cerrar el menú lateral.
- Al tocar una opción del menú o el overlay, el menú se cierra automáticamente.

## Estilos

- Entry: `styles.css` (solo importa módulos).
- Módulos: `styles/*.css` (editá ahí en vez de tocar `styles.css`).

## Datos y persistencia

- Estado principal en memoria: `src/app/core/state.mjs` (`appState` + `currentSubject`).
- Persistencia: `src/app/core/storage.mjs` (principalmente `localStorage`).
- Imágenes/adjuntos: `src/app/core/idb.mjs` (IndexedDB) y módulos de thumbs/viewer.

## Sync (GitHub Gist)

- En Home → `Sincronizar (GitHub)`.
- `Conectar`: pegá el `Client ID` de un OAuth App y autorizá en `github.com/login/device` (se guarda solo en este dispositivo).
- `Subir backup`: pide una contraseña (no se guarda) y crea/actualiza un Gist privado con el backup cifrado.
- `Bajar backup`: pide el Gist ID (si falta) + la contraseña y luego importa el backup (reemplaza el progreso actual).
- Nota: por ahora no sincroniza adjuntos/imágenes guardados en IndexedDB.

## Navegación (vistas)

- Las vistas son `<section class="view" id="...">` (ver `index.html`).
- La navegación se maneja con `setActiveView(viewId)` en `src/app/ui/flow.mjs`.
- Algunas vistas registran “hooks” de activación con `registerViewActivationHandler()` para re-render en el momento de entrar.

## Estructura del código

- Entry: `index.html` → `src/main.mjs` → `src/app/bootstrap.mjs`
- UI (orquestación): `src/app/ui/*`
- Features (dominio + UI por módulo): `src/app/features/*`
- Compartidas: `src/app/shared/*`
- Helpers generales: `src/utils/*`

Más detalle en `ARCHITECTURE.md`.

## Debug rápido

- Pantallas en blanco: abrir DevTools → Console y copiar el error.
- Si alguna vez se habilita el Service Worker, también limpiar “Cache Storage” y des-registrar el SW (ver `sw.js`).
