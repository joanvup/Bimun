# Actualización Institucional: Copresidencia, Discursos de Bienvenida y Guías de Estudio en Comisiones

Implementación integral para renombrar "Vicepresidente" a "Copresidente" en todo el portal BIMUN, dotar a cada comisión de discursos individuales de bienvenida para el Presidente y Copresidente con diseño editorial, e incorporar la gestión y descarga de la Guía de Estudio en PDF tanto en las tarjetas del catálogo como en el modal de detalle.

---

## Decisiones Críticas y Preferencias Confirmadas

> [!IMPORTANT]
> Con base en la sesión interactiva de clarificación previa, se han adoptado las siguientes directrices aprobadas:

- **Discursos de Bienvenida Separados**: Se habilitan áreas de texto dedicadas e independientes tanto para el **Presidente** como para el **Copresidente** (`president_welcome` y `copresident_welcome`), permitiendo que cada miembro de la mesa directiva exprese su saludo y expectativas pedagógicas.
- **Carga Dual de la Guía de Estudio en PDF**: En el panel administrativo se implementa una interfaz versátil que permite **subir directamente el archivo PDF** (con validación de tamaño y almacenamiento seguro) o **ingresar una URL externa** (Google Drive, OneDrive o repositorio institucional).
- **Visibilidad Integral de Descarga**: El botón de descarga y consulta de la Guía de Estudio estará presente tanto de forma ágil en la **tarjeta exterior de cada comisión** como en una sección destacada dentro del **modal de detalle extendido**.

---

## 1. Visión General del Producto y Objetivos

1. **Estandarización Terminológica ("Copresidente")**:
   - Reemplazar en la interfaz pública y administrativa cualquier mención de "Vicepresidente" por "Copresidente" (y "Co-President" en inglés), reflejando la estructura diplomática moderna del modelo de Naciones Unidas BIMUN.
2. **Discurso de Bienvenida de la Mesa Directiva**:
   - Brindar a los delegados e instituciones un acercamiento directo a los líderes de cada comité a través de cartas o discursos de bienvenida en formato editorial, con tipografía refinada, comillas estilizadas y lectura cómoda.
3. **Acceso Inmediato a las Guías de Estudio (Study Guides)**:
   - Proveer a los delegados inscritos y prospectos el acceso directo al documento central de preparación académica (temas, reglas y dinámicas de debate) sin fricciones.

---

## 2. Experiencia de Usuario y Diseño Visual (UX & Design)

Siguiendo la constitución de diseño institucional (*Museum, Editorial & Institutional Design*):

### A. Vista Pública: Tarjeta de Comisión en Cuadrícula (`CommitteesSection.tsx`)
- **Badge y Nombre del Copresidente**: La mesa directiva muestra claramente "Presidente" y "Copresidente".
- **Botón de Descarga Rápida de Guía**: En la parte inferior de la tarjeta (junto al botón "Ver detalles"), se añade un botón directo con ícono de documento PDF (`Guía de Estudio` / `Study Guide`) si la comisión dispone de ella.

### B. Vista Pública: Modal Extendido de Comisión
- **Tarjetas de Liderazgo Rediseñadas**: Retratos en alta resolución con roles institucionales distintivos ("Presidente" y "Copresidente") y función de ampliación fotográfica (lightbox).
- **Módulo de Discursos de Bienvenida (Editorial Block)**:
  - Presentación visual estilo carta editorial con tipografía contrastada, comillas estilizadas y espaciado generoso.
  - Pestañas o bloques armónicos para alternar o visualizar el saludo del Presidente y del Copresidente.
- **Banner de Descarga de la Guía Académica**:
  - Caja destacada con estilo sobrio institucional (fondo pizarra suave, borde sutil, botón de descarga con peso visual primario, indicando el formato oficial PDF).

### C. Panel Administrativo (`AdminDashboard.tsx`)
- **Formulario de Comisión Actualizado**:
  - Etiquetas renombradas a "Nombre del Copresidente" y "Foto del Copresidente".
  - Dos nuevas áreas de texto tipo párrafo (`textarea`):
    - *Discurso de Bienvenida del Presidente* (placeholder orientativo, conteo de caracteres).
    - *Discurso de Bienvenida del Copresidente* (placeholder orientativo, conteo de caracteres).
  - Control de carga para la Guía de Estudio (`DocumentUploadField` adaptado): selector entre arrastrar/subir archivo PDF local o pegar un enlace web directo.

---

## 3. Decisiones Técnicas y de Persistencia

1. **Compatibilidad Hacia Atrás en la Base de Datos**:
   - En las tablas de comisiones (`sqlite`, `postgres`, `mysql`), las columnas existentes `vicepresident_name` y `vicepresident_photo` se conservan internamente y se mapean/aliasen transparentemente a `copresident_name` y `copresident_photo` en la API y frontend para evitar cualquier pérdida o migración riesgosa de datos previos.
2. **Nuevos Campos de Esquema**:
   - `president_welcome TEXT`
   - `copresident_welcome TEXT`
   - `study_guide_url TEXT`
3. **Migración Automática y No Destructiva**:
   - Ejecución de bloques `ALTER TABLE committees ADD COLUMN ...` protegidos con `try/catch` durante el arranque del servidor, asegurando que las bases de datos existentes se actualicen al instante sin reiniciar datos.

---

## 4. Arquitectura y Flujo de Datos

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PANEL DE ADMINISTRACIÓN                         │
│  - Campos: Nombre & Foto Copresidente                                  │
│  - Textarea: Discurso Presidente & Copresidente                        │
│  - Control: Carga PDF (Base64) o Enlace URL de Guía de Estudio         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ PUT/POST /api/admin/committees
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       EXPRESS BACKEND & DATABASE                       │
│  - Migración: Añadir president_welcome, copresident_welcome,           │
│    study_guide_url a tabla 'committees'                               │
│  - Endpoints CRUD actualizados y serialización a JSON público          │
│  - Soporte de respaldo / snapshot institucional                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ GET /api/public/data
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         PORTAL PÚBLICO BIMUN                           │
│  - Tarjeta de Comisión: Botón directo de descarga Guía PDF             │
│  - Modal Detalle:                                                      │
│      * Mesa Directiva: Presidente & Copresidente (con lightbox)        │
│      * Discursos de Bienvenida en formato editorial                    │
│      * Módulo destacado de Descarga de Guía Oficial PDF               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Plan de Verificación

1. **Inspección de Esquema y API**:
   - Comprobar que `/api/public/data` retorne `copresident_name`, `president_welcome`, `copresident_welcome` y `study_guide_url`.
2. **Prueba en Panel Administrativo**:
   - Editar una comisión existente, redactar los discursos de bienvenida y cargar/enlazar un PDF de prueba.
   - Verificar persistencia en base de datos al guardar y recargar la página.
3. **Prueba en Interfaz Pública**:
   - Validar que aparezca la palabra "Copresidente" en lugar de "Vicepresidente".
   - Abrir el modal y corroborar la visualización elegante de los discursos y el visor ampliado de fotos.
   - Probar la descarga de la Guía de Estudio desde la tarjeta exterior y desde el modal.
4. **Compilación y Linteo**:
   - Ejecutar `compile_applet` y `lint_applet` para confirmar cero errores de sintaxis y tipos en TypeScript.
