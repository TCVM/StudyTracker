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

## Sync (Cloud + GitHub login)

- Requiere un backend liviano (gratis): Cloudflare Worker + KV.
- En Home → `Sincronizar (GitHub)`.
- Config: seteá el backend en `index.html` con `<meta name="studytracker-sync-base-url" content="https://TU_WORKER.workers.dev">`.
- `Conectar`: te redirige a GitHub para iniciar sesión. Al volver, queda conectado en ese dispositivo.
- `Subir`: sube tu backup cifrado al backend (se guarda historial).
- `Bajar`: baja el último backup cifrado del backend y luego lo importa (reemplaza tu progreso actual).
- `Historial`: lista los últimos backups (N=10) y te permite restaurar uno.
- `Cerrar sesión`: desconecta la cuenta para conectar otra.
- Nota: por ahora no sincroniza adjuntos/imágenes guardados en IndexedDB.

### Backend (Cloudflare Worker)

- Worker: `cloudflare-worker/studytracker-sync-worker.js`.
- Crear un OAuth App en GitHub y configurar `Authorization callback URL` a `https://<TU_WORKER>/auth/github/callback`.
- En Cloudflare (Worker settings / wrangler):
  - KV binding: `SYNC_KV`
  - Secrets: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `JWT_SECRET`
  - (Opcional) `ALLOWED_ORIGINS` con tu URL de GitHub Pages

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
