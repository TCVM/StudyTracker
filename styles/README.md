# CSS modules

`styles.css` es el entrypoint y solo importa estos módulos en orden.

## Archivos

- `styles/00-base.css`: reset + layout base + sidebar/navigation.
- `styles/05-components.css`: componentes reutilizables (panel, botones, tabs, inputs, badges).
- `styles/06-animations.css`: keyframes globales.
- `styles/07-responsive.css`: responsive global.
- `styles/10-home.css`: Home + paneles del inicio.
- `styles/15-shared.css`: vista de materias compartidas.
- `styles/20-exams-practices.css`: estilos de Exámenes/Prácticas.
- `styles/25-timer.css`: panel de sesión y UI de timer.
- `styles/27-sessions.css`: listado/estilos de sesiones (Stats).
- `styles/32-subject-topics.css`: lista de categorías/temas (subject list view).
- `styles/33-map-stats-achievements.css`: mapa + stats + achievements + cards.
- `styles/30-subject-modals.css`: subject view + modales.
- `styles/35-notes-skilltree.css`: notas, links y skill tree (árbol global / materia).
- `styles/40-theme-dark.css`: overrides de dark mode.
- `styles/41-theme-compat.css`: overrides/compat de tema (dark y light) que antes vivían en legacy.
- `styles/50-legacy.css`: compat (no se usa).
- `styles/50-legacy-responsive.css`: compat (no se usa).
- `styles/51-legacy-animations.css`: compat (no se usa).
- `styles/52-legacy-rest.css`: compat (no se usa).
- `styles/legacy/*`: compat (no se usa).

## Convenciones (prácticas comunes)

- Mantener estilos “componentizados” por feature y evitar selectores globales muy genéricos.
- Preferir clases explícitas (estilo BEM liviano) en vez de selectores por tag + cascadas profundas.
- Centralizar colores/espaciados como tokens con CSS variables (`:root { --color-... }`).
- Mantener el orden de importación (la cascada importa).
