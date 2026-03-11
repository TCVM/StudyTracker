# Registro de bugs / mejoras

Este archivo existe para anotar problemas detectados durante refactors sin “perderlos” en el tiempo.

## Bugs (confirmados o muy probables)

### Mojibake / encoding (UTF-8 roto)

En varios archivos aparecen textos como `PrÃ¡cticas`, `ExÃ¡menes` o íconos como `ðŸ…`, lo que indica que el contenido fue guardado con un encoding incorrecto y luego interpretado como UTF‑8.

Impacto:
- UI muestra caracteres rotos (no es solo estético si termina en atributos/datasets).

Pendiente:
- Convertir archivos a UTF‑8 real y reemplazar secuencias mojibake por caracteres correctos.

### Pantalla vacía en Exámenes / Prácticas (intermitente)

Se observaron “pantallas vacías” al navegar a ciertas vistas. Se mitigó con:
- `src/app/ui/flow.mjs`: guardas para no desactivar todas las vistas con IDs inválidos.
- `src/app/ui/flow.mjs`: hooks `registerViewActivationHandler()` para re-render al entrar.
- `src/app/ui/events.mjs`: handler de Exámenes más robusto frente a `e.target` no-Element.

Pendiente para cerrar:
- Capturar el error de consola exacto cuando ocurra y agregar pasos de reproducción.

## Mejoras (refactor/arquitectura)

- `src/app/ui/events.mjs` es muy grande; candidato a dividir por áreas (timer, subjects, views, exams, practices, notes).
- `src/app/features/notes/notes-skilltree-stats.mjs` concentra muchas responsabilidades; candidato a separar `notes`, `skilltree`, `stats`.
- Crear helpers DOM comunes (ej: `byId`, `asElementTarget`) para evitar duplicación y errores.
- CSS: se modularizó y se agregaron tokens en `styles/00-base.css`; pendiente migrar reglas desde `styles/legacy/*` a módulos “reales” por feature (y reducir overrides conflictivos).
- CSS: se creó `styles/05-components.css` para componentes comunes; pendiente ir moviendo estilos desde `styles/legacy/*` a módulos no-legacy.
- CSS: `styles/legacy/52-rest-01-pre.css` y `styles/legacy/pre/*` siguen teniendo estilos “de features” (subject hero/exams/timer); objetivo: migrarlos a módulos de feature cuando podamos validar visualmente.
- CSS: se movieron estilos desde `styles/legacy/pre/01-subject-hero-exams.css` a módulos no-legacy (components/home/shared/exams/timer/subject).
- CSS: legacy quedó en modo “compat” (stubs); si algo faltara visualmente, el rollback es re-importar `styles/50-legacy.css` desde `styles.css`.
