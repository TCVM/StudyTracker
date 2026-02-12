# Estructura Modular de StudyTracker

## Organización del Proyecto

### `/src/modules/` - Lógica de Negocio

Módulos independientes que manejan la lógica de la aplicación:

| Módulo              | Responsabilidad                               |
| ------------------- | --------------------------------------------- |
| **achievements.js** | Sistema de logros, desbloqueos y verificación |
| **subjects.js**     | Gestión de materias (crear, eliminar, buscar) |
| **topics.js**       | Gestión de temas (completar, estadísticas)    |
| **xp.js**           | Sistema de XP, níveis y skill points          |
| **stats.js**        | Estadísticas de sesiones y progreso a diario  |
| **timer-utils.js**  | Utilidades del timer (formateo, cálculos)     |
| **difficulty.js**   | Configuración de dificultades                 |
| **theme.js**        | Gestión del tema oscuro/claro                 |
| **ui-manager.js**   | Control de modales y navegación               |

### `/src/controllers/` - Control de Flujo

- **timer.js** - Lógica principal del timer, tick events

### `/src/utils/` - Utilidades Compartidas

- **storage.js** - Persistencia en localStorage
- **constants.js** - Configuración global
- **helpers.js** - Funciones auxiliares
- **initialData.js** - Datos iniciales de Arquitectura

### `/src/views/` - Renderizado UI

- **ui.js** - Renderización de componentes

## Ventajas de esta Estructura

✅ **Modularidad**: Cada módulo tiene una única responsabilidad  
✅ **Reutilización**: Funciones compartidas fácilmente  
✅ **Testing**: Más fácil de testear componentes aislados  
✅ **Mantenimiento**: Código limpio y organizado  
✅ **Escalabilidad**: Fácil agregar nuevas funcionalidades

## Ejemplo de Uso

```javascript
// app.js - Código limpio y legible
import { toggleTopicCompleted } from "./modules/topics.js";
import { checkAchievements } from "./modules/achievements.js";

toggleTopicCompleted(appState, currentSubject, categoryId, topicIndex);
checkAchievements(appState);
```

## Próximas Mejoras

- [ ] Módulo de settings/configuración
- [ ] Módulo de notificaciones centralizado
- [ ] Sistema de caché para datos frecuentes
- [ ] Módulo de analytics
