# Plan de Implementación: Presidencia, Copresidencia y Guía PDF en Temas de Debate

Incorporar en cada tarjeta de la sección "Temas de Debate por Comisión" (`TopicsSection.tsx`) la visualización de la presidencia y copresidencia con fichas de perfil (mini avatar, rol y nombre), así como el acceso directo a la guía académica en formato PDF.

## User Review Required

> [!NOTE]
> Con base en tus respuestas aclaratorias:
> - **Liderazgo de Mesa:** Se mostrarán únicamente el **Presidente** y el **Copresidente** (sin incluir vicepresidente adicional).
> - **Estilo visual:** Fichas elegantes con foto/avatar mini, insignia de rol (badge) y nombre completo. Si tienen foto configurada, se muestra su fotografía; de lo contrario, un icono de usuario con estilo del tema.
> - **Guía de Estudio:** Si la comisión tiene una guía en PDF cargada (`study_guide_url`), el botón abrirá/descargará directamente el documento en una nueva pestaña. Si no tiene guía aún, se mostrará en estado inactivo o enlazará a la sección general de documentos.

---

## Proposed Changes

### Interfaz Pública (`src/components/TopicsSection.tsx`)

- **Reemplazar la fila inferior simple** (`Presidencia: Nombre` y enlace genérico `#documentos`):
  1. **Bloque de Mesa Directiva (Presidencia y Copresidencia):**
     - **Presidente:** Ficha con avatar circular o redondeado (foto de `com.president_photo` o icono por defecto), badge distintivo (ej. "Presidente" / "Chair") y nombre del presidente (`com.president_name`).
     - **Copresidente:** Ficha con avatar circular o redondeado (foto de `com.copresident_photo` o icono por defecto), badge distintivo ("Copresidente" / "Co-Chair") y nombre del copresidente (`com.copresident_name`). Se mostrará si está configurado en la comisión.
  2. **Botón de Guía de Estudio en PDF:**
     - Si la comisión cuenta con `com.study_guide_url`:
       - Enlace con icono `FileText` / `Download`, estilo de botón atractivo (gradiente suave o borde destacado con hover).
       - Atributos `target="_blank"` y `rel="noopener noreferrer"` para abrir el PDF directamente o descargarlo.
       - Texto claro en español e inglés: *"Guía Académica (PDF)"* / *"Study Guide (PDF)"*.
     - Si aún no cuenta con `study_guide_url`:
       - Enlace accesible o indicador sutil de guía próxima a publicarse o enlace al repositorio general de documentos.
  3. **Diseño Responsivo:**
     - Disposición fluida en móviles (apilado limpio) y pantallas medianas/grandes (flex/grid equilibrado).
     - Soporte completo para modo claro y modo oscuro.

---

## Verification Plan

### Automated Verification
- Ejecutar `compile_applet` para garantizar que no existan errores de tipos ni de sintaxis en TypeScript.
- Ejecutar `lint_applet` para verificar buenas prácticas y limpieza de código.

### Manual Verification
- Visualizar la sección "Temas de Debate por Comisión" en el navegador:
  - Verificar que las comisiones con presidente y copresidente muestren ambos perfiles con sus nombres y fotos/avatares.
  - Comprobar que comisiones sin foto muestren el icono estilizado de fallback.
  - Verificar que al hacer clic en el botón de la Guía PDF, se abra o descargue directamente el archivo enlazado si existe.
  - Probar visualización tanto en escritorio como en vista móvil.
  - Probar en modo oscuro y modo claro.
