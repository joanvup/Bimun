# Optimización Visual del Comité Organizador y Ampliación de Fotos de Mesa Directiva

Plan de mejoras enfocado en depurar la ficha de los integrantes del Comité Organizador (eliminando la etiqueta fija redundante 'Secretaría' y agregando visualización ampliada en lightbox) y jerarquizar con gran protagonismo visual las fotografías de los presidentes y vicepresidentes en el modal de detalle de comisiones.

### User Review & Critical Decisions

> [!IMPORTANT]
> **Puntos clave confirmados para la implementación:**
> 1. **Comité Organizador - Eliminación de texto redundante**: En las tarjetas del comité ya figura la insignia superior con el cargo oficial (`role`). Se retira la línea inferior que mostraba la categoría por defecto (`Secretaría`), manteniendo un diseño limpio y enfocado en el nombre y el rol específico.
> 2. **Comité Organizador - Foto ampliable (Lightbox)**: Al hacer clic en el avatar/foto de cualquier miembro del comité, se desplegará una ventana modal de alta definición con la fotografía en gran tamaño, nombre completo, cargo y opción de cierre rápido (botón de cierre, clic en el fondo o tecla Esc).
> 3. **Detalle de Comisión - Fotos de Presidente y Vicepresidente mucho más grandes**: Se reemplazan los avatares circulares compactos actuales (48px) por tarjetas de retrato destacadas con imágenes de alta visibilidad (140px - 160px), encuadre fotográfico profesional, bordes estilizados, etiquetas jerárquicas y diseño responsivo tanto en móviles como en pantallas de escritorio.

---

### 1. Overview & Core Concept

- **Qué resuelve**: Elimina ruido visual en las fichas del equipo organizador (evitando que aparezca la palabra "Secretaría" de forma innecesaria bajo cada nombre cuando el cargo ya está indicado), dota a los miembros de una experiencia fotográfica interactiva para apreciar retratos oficiales en tamaño completo, y eleva la prestancia visual de la Mesa Directiva de cada comisión en el modal de detalles con retratos fotográficos amplios y destacados.
- **Audiencia**: Delegados, docentes asesores (sponsors), invitados especiales y miembros de la comunidad académica que consultan las autoridades del modelo y el liderazgo de cada comité.
- **Valor agregado**: Una presentación institucional mucho más sobria, elegante y profesional acorde a un Modelo de Naciones Unidas (BIMUN).

---

### 2. User Experience & Visual Design

#### A. Ficha del Miembro del Comité Organizador (`TeamSection`)
- **Limpieza visual**: Se suprime la etiqueta secundaria `{member.category}` que forzaba el texto "Secretaría" debajo del nombre del integrante. La jerarquía ahora resalta claramente:
  1. Insignia con el cargo oficial (`member.role`, ej. "Secretaria General", "Director Académico", etc.).
  2. Nombre del miembro (`member.name`) con tipografía destacada.
  3. Biografía breve y correo institucional de contacto.
- **Micro-interacción de foto**:
  - Al posar el cursor sobre la foto del miembro, el cursor cambia a zoom (`cursor-zoom-in`), con un leve escalado (hover scale) y un indicador sutil con ícono de ampliación (`ZoomIn`).
  - Al hacer clic, se abre un **Lightbox Modal**:
    - Fondo oscuro con efecto translúcido (*backdrop-blur*).
    - Imagen central nítida y generosa (hasta 500x500px o proporción original optimizada).
    - Cabecera con nombre, cargo y botón de cierre accesible (`X`).
    - Cierre automático al presionar la tecla `Escape` o al hacer clic fuera del contenedor.

#### B. Detalle de Comisión y Mesa Directiva (`CommitteesSection`)
- **Rediseño de la sección "Mesa Directiva / Dais Leadership"**:
  - Transformación del bloque horizontal comprimido a una cuadrícula destacada de dos columnas para **Presidente** y **Vicepresidente**.
  - **Dimensión de fotos ampliada**: Se incrementa de los actuales `w-12 h-12` (48px) a tarjetas con retratos de gran presencia (`w-36 h-36` / `w-40 h-40` sm: `160px x 160px`), con esquinas redondeadas (`rounded-2xl`), anillo decorativo con degradado institucional BIMUN y sombra elegante.
  - Para los casos en que la presidencia o vicepresidencia aún esté "Por designar" o no disponga de foto cargada, se mostrará un contenedor institucional sobrio con ícono heráldico de liderazgo y tipografía limpia.
  - Las fotos de la mesa directiva también contarán con interacción de zoom sutil para verificar el perfil institucional.

---

### 3. Key Product Decisions & Trade-Offs

- **Decisión 1: Eliminar la categoría redundante en la vista pública y pulir el formulario administrativo**
  - *Enfoque*: Remover el renderizado de `{member.category}` debajo del nombre en `TeamSection.tsx`. Asimismo, en la vista administrativa (`AdminDashboard.tsx`), clarificar que el cargo es el campo primordial para evitar confusiones al agregar o editar integrantes.
  - *Por qué*: La categoría "Secretaría" era un campo interno/técnico del seed inicial que no aportaba valor al usuario final una vez asignado el cargo específico.
- **Decisión 2: Modal Lightbox sin dependencias externas pesadas**
  - *Enfoque*: Implementar el modal de visualización ampliada usando componentes ligeros en React y Tailwind CSS nativo, controlando el foco, la accesibilidad y el bloqueo de scroll del cuerpo cuando está abierto.
  - *Por qué*: Cero sobrecarga de dependencias, rendimiento instantáneo a 60 FPS y consistencia estética idéntica con el resto de modales del sistema (PDF viewer, search modal, etc.).
- **Decisión 3: Formato de retrato para la Mesa Directiva de Comisiones**
  - *Enfoque*: Utilizar tarjetas verticales con fotos de gran formato (`140px-160px`) en lugar de avatares miniatura.
  - *Por qué*: En conferencias de Naciones Unidas, los Presidentes y Vicepresidentes son las figuras centrales de cada comité; otorgarles presencia fotográfica distinguida transmite respeto y seriedad institucional.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                     VISTAS PRINCIPALES DEL PORTAL               │
└────────────────────────────────┬────────────────────────────────┘
                                 │
         ┌───────────────────────┴───────────────────────┐
         ▼                                               ▼
┌──────────────────────────────┐        ┌──────────────────────────────┐
│       TeamSection.tsx        │        │    CommitteesSection.tsx     │
├──────────────────────────────┤        ├──────────────────────────────┤
│ • Badges de Cargo Oficial    │        │ • Grid de Comisiones         │
│ • Nombre Principal           │        │ • Modal de Detalle           │
│ • [ELIMINADO] "Secretaría"   │        │   ├─ Temas A, B, C           │
│ • Foto interactiva con Zoom  │        │   └─ Mesa Directiva          │
│   └─► Lightbox Modal         │        │       ├─ Foto Pres. (160px)  │
│       (Zoom foto, nombre)    │        │       └─ Foto Vice. (160px)  │
└──────────────────────────────┘        └──────────────────────────────┘
```

#### Componentes a Modificar:
1. `src/components/TeamSection.tsx`:
   - Eliminar el tag `<span className="text-xs text-slate-500 ...">{member.category}</span>`.
   - Incorporar estado local `selectedPhotoMember: TeamMember | null` para gestionar la apertura del Lightbox.
   - Agregar el modal de ampliación fotográfica con animaciones fluidas, overlay con blur, botón de cierre y atajo `Escape`.
2. `src/components/CommitteesSection.tsx`:
   - Modificar la sección `Leadership / Mesa Directiva` dentro del modal `selectedModalCommittee`.
   - Reemplazar el layout anterior de 48px por tarjetas de retrato con fotos de `w-32 h-32` a `w-40 h-40`, encuadre `object-cover` optimizado, insignia destacada de presidencia/vicepresidencia y nombre completo.
3. `src/components/admin/AdminDashboard.tsx`:
   - Limpiar la lista previa de miembros del equipo para no mostrar la categoría redundante "Secretaría" y asegurar que el formulario de creación/edición de miembros no confunda el cargo con la categoría fija.
