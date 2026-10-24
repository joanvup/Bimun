# Rediseño Visual Diplomatic Summit (BIMUN)

Transformación estética integral de la plataforma web de BIMUN adaptando el sistema de diseño editorial multilateral y prestigioso de la referencia adjunta ("Diplomatic Summit"), sin agregar ni remover ninguna de las secciones funcionales existentes.

---

## Decisiones Críticas y Confirmaciones del Usuario

> [!IMPORTANT]
> Se han incorporado las respuestas confirmadas en la fase de clarificación:

- **Modo de Color Principal**: Modo claro por defecto con lienzos en blanco nítido / suave azul hielo (`#F8F9FF`), tarjetas blancas elevadas (`#FFFFFF`) y tipografía en azul diplomático profundo (`#0B1C30` / `#0D2342`). El modo oscuro se mantiene accesible mediante el alternador de tema.
- **Barra de Navegación Superior**: Cabecera institucional clara con efecto translúcido (`bg-white/95 backdrop-blur-md border-b border-slate-200/80`), acompañada por la barra superior delgada de anuncios en azul marino (`#000D23`) con texto informativo de convocatoria.
- **Tipografía Editorial**: `Playfair Display` para todos los titulares principales, nombres de comités y citas diplomáticas, combinada con `Plus Jakarta Sans` para la interfaz, textos de lectura, metadatos y botones operativos.
- **Alcance Estricto**: Cero secciones nuevas o eliminadas. Toda la estructura existente (Comités, Matriz de Delegaciones, Temarios, Cronograma, Documentos, Galería, Secretaría, Noticias, Inscripción, Contacto, CMS y Portal del Delegado) se conserva al 100%, modernizando su vestidura gráfica.

---

## 1. Visión General del Rediseño

- **Objetivo**: Elevar la identidad visual de BIMUN al nivel de conferencias modelo internacionales (como HNMUN y NAIMUN), reflejando solemnidad diplomática, rigor académico y prestancia institucional.
- **Público Objetivo**: Delegados estudiantiles, asesores docentes (Faculty Advisors), secretarios de mesa y directores de colegios participantes.
- **Propuesta de Valor**: Una interfaz de alta legibilidad con contraste editorial, tarjetas blancas nítidas con bordes sutiles de 1px (`#E2E8F0`), acentos en azul cian de las Naciones Unidas (`#009EDB`), sellos dorados conmemorativos (`#D97706`), y barras de progreso visual en cada comité.

---

## 2. Experiencia de Usuario y Diseño Visual

### Paleta de Colores Institucional (Diplomatic Summit)
- **Lienzo Base (60%)**: `#F8F9FF` (azul hielo ultra claro) y `#FFFFFF` (superficies de tarjetas y contenedores).
- **Superficies Estructurales (30%)**:
  - `Azul Diplomático / Primary`: `#0D2342` (encabezados, barra de anuncios, botones primarios).
  - `Bordes y Separadores`: `#E2E8F0` y `#CBD5E1` (líneas de 1px de precisión arquitectónica).
  - `Texto Principal`: `#0B1C30` (alta legibilidad y contraste WCAG AA).
  - `Texto Secundario / Metadatos`: `#64748B` (pizarra neutro).
- **Acentos de Interacción (10%)**:
  - `Azul Cian ONU / Secondary`: `#009EDB` / `#00658E` (indicadores de estado en curso, barras de progreso de comités, enlaces activos y botones de acción rápida).
  - `Oro Ceremonial / Tertiary`: `#D97706` / `#FEF3C7` (insignias de edición, botones de credenciales y sellos de excelencia).

### Sistema Tipográfico
- **Títulos y Encabezados de Sección**: `Playfair Display` (serif con peso 600 y 700, tracking equilibrado). Transmite tradición, sobriedad y distinción multilateral.
- **Cuerpo y Controles de Interfaz**: `Plus Jakarta Sans` (sans-serif moderno con pesos 400, 500, 600 y 700). Claridad geométrica absoluta en formularios, listas y lecturas.
- **Números Tabulares y Metadatos**: `font-mono tabular-nums` para cifras estadísticas (número de comités, países y capacidad de delegados).

### Componentes Rediseñados
1. **Header & Announcement Ribbon**:
   - Barra superior delgada en azul marino (`#000D23`) con mensaje de apertura de inscripciones y enlace rápido.
   - Navegación principal en fondo claro con sombra sutil (`0 1px 8px rgba(13,35,66,0.06)`), logotipo institucional nítido, enlaces de navegación con estado activo subrayado y botones de acción ("Portal del Delegado" e "Inscripción").
   - Menú móvil responsivo adaptado a la estética clara con menú desplegable fluido.
2. **Hero Section**:
   - Encabezado con titulares de gran impacto en `Playfair Display` con acento en cursiva cian ("diplomacia").
   - Fila de 4 tarjetas monolíticas de estadísticas (`650+ Delegados`, `12 Comités`, `25 Años`, `3 Días`) con números grandes y bordes suaves de 1px.
   - Montaje fotográfico con esquinas de radio suave (`rounded-xl`), insignia de auditorio principal y medalla conmemorativa.
3. **Sección Nosotros / Visión Diplomática**:
   - Tarjeta de despacho oficial con sello de mazo (`gavel`), cita solemne en cursiva y firmas de los secretarios generales.
   - Columna editorial con carta a la comunidad de delegados en tipografía espaciada y confortable.
4. **Comités y Fichas Académicas**:
   - Tarjetas blancas limpias con etiquetas de idioma (`EN` / `ES`) y nivel (`Avanzado`, `Intermedio`, `Crisis`).
   - Medidor de capacidad visual en cian ONU con porcentaje de asignación.
   - Botón directo para consultar la guía académica y el reglamento.
5. **Matriz de Delegaciones**:
   - Tabla y tarjetas de países refinadas con contrastes limpios y selector de comités estilizado.
6. **Cronograma Oficial**:
   - Cuadrícula de 4 fases horizontales numeradas con etiquetas de estado y ubicaciones de campus.
7. **Banners de Acción y Footer**:
   - Banner de cierre de asignaciones en azul marino diplomático con resplandor sutil en cian.
   - Footer estructurado en 4 columnas con enlaces organizados, derechos de autor y acreditación institucional.

---

## 3. Decisiones Técnicas y Estructurales

- **Enfoque de Rediseño**:
  - *Adoptado*: Restilización de componentes React existentes mediante clases de Tailwind CSS coherentes con las variables de diseño de la referencia.
  - *Por qué*: Garantiza que no se pierda ninguna integración con el backend (CMS, autenticación, base de datos pública, selector de idiomas, modal de búsqueda y descarga de carnets PDF).
- **Gestión de Tema Claro / Oscuro**:
  - El tema por defecto pasa a ser el modo claro editorial (fondo `#F8F9FF`), pero el alternador de tema (`ThemeContext` y `FloatingThemeToggle`) sigue funcionando para usuarios que prefieran navegar en modo oscuro.

---

## 4. Arquitectura de Interfaz y Flujo de Componentes

```
┌────────────────────────────────────────────────────────────────────────┐
│  [Top Banner]: BIMUN: "Peace in Progress" — Inscripciones Abiertas    │
├────────────────────────────────────────────────────────────────────────┤
│  [Navbar Claro]: Logo • BIMUN  [Comités · Agenda · ...]  [Portal/Carnet]│
├────────────────────────────────────────────────────────────────────────┤
│  [Hero]: Titular Playfair • Montaje Fotográfico • 4 KPIs Monolíticos  │
├────────────────────────────────────────────────────────────────────────┤
│  [Nosotros / Despacho]: Cita de Secretaría • Carta a la Comunidad     │
├────────────────────────────────────────────────────────────────────────┤
│  [Comités]: Filtros (Todos/EN/ES/Crisis) • Tarjetas con Barras Capacidad│
├────────────────────────────────────────────────────────────────────────┤
│  [Matriz Delegaciones]: Filtros por País • Asignación de Estados       │
├────────────────────────────────────────────────────────────────────────┤
│  [Temas & Cronograma]: 4 Fases Oficiales • Itinerario de Negociación   │
├────────────────────────────────────────────────────────────────────────┤
│  [Documentos & Guías]: Descarga ROP • Fichas Académicas               │
├────────────────────────────────────────────────────────────────────────┤
│  [Galería & Equipo]: Convivencia Campus • Miembros del Comité          │
├────────────────────────────────────────────────────────────────────────┤
│  [Registro & Contacto]: Formularios de Inscripción y Soporte           │
├────────────────────────────────────────────────────────────────────────┤
│  [CTA]: Banner Diplomático Marino • Registro de Delegación             │
├────────────────────────────────────────────────────────────────────────┤
│  [Footer]: 4 Columnas • Protocolo Diplomático • Créditos Institución  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Plan de Verificación

1. **Revisión de Estilos y Tipografía**: Comprobar que `Playfair Display` rija los encabezados y `Plus Jakarta Sans` el cuerpo y elementos interactivos.
2. **Revisión de Contrastes**: Verificar legibilidad en tarjetas blancas sobre fondo `#F8F9FF` y botones en `#0D2342` y `#009EDB`.
3. **Prueba de Interacciones Existentes**: Validar que el portal del delegado (carnet PDF), buscador `Cmd+K`, inicio de sesión del CMS, cambio de idioma (`ES` / `EN`) y filtros sigan funcionando con total fluidez.
4. **Verificación de Compilación y Linter**: Ejecutar `compile_applet` y `lint_applet` para certificar 0 errores de TypeScript y empaquetado.
