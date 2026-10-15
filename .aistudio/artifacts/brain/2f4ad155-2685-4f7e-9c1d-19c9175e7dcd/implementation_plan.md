# Plan de Corrección: Auto-Migración de Columnas y Guardado de Comisiones en MySQL (Producción)

## 1. Diagnóstico del Problema

Al editar una comisión y presionar **Guardar Comisión**, la petición falla con error 500 y no persiste los cambios.

### Causa Raíz Confirmada
1. En producción, la base de datos MySQL fue configurada previamente. El archivo `server/dbManager.ts` ejecutaba únicamente `CREATE TABLE IF NOT EXISTS` durante la inicialización de MySQL.
2. Como las tablas ya existían en el servidor MySQL remoto, `CREATE TABLE IF NOT EXISTS` no altera la estructura de tablas existentes ni agrega columnas nuevas.
3. Se agregaron recientemente nuevos campos a la entidad de Comisiones:
   - `study_guide_url` (guía académica en PDF o enlace)
   - `copresident_name` y `copresident_photo` (copresidencia académica)
   - `president_welcome` y `copresident_welcome` (discursos de bienvenida)
4. Cuando el endpoint `PUT /api/admin/committees/:id` o `POST /api/admin/committees` ejecuta:
   ```sql
   UPDATE committees SET ..., copresident_name = ?, copresident_photo = ?, president_welcome = ?, copresident_welcome = ?, study_guide_url = ?, ...
   ```
   el motor MySQL en producción rechaza la consulta arrojando:
   `Error de persistencia en MySQL: Unknown column 'study_guide_url' in 'field list'`
5. Existen columnas equivalentes que también pudieron quedarse desincronizadas en otras tablas de producción (como `payment_receipt` en `registrations`, `additional_info` en `countries`, etc.).

---

## 2. Objetivos y Respuestas del Usuario

- **Auto-migración automática al conectar**: Cada vez que el servidor se inicia o se conecta a MySQL (o PostgreSQL), verificará automáticamente todas las tablas y añadirá las columnas que falten sin perder ningún dato.
- **Botón manual en panel**: En la pestaña de configuración de Base de Datos en el panel administrativo, se habilitará un botón "Verificar y Reparar Columnas en Producción" con informe en tiempo real de columnas agregadas/verificadas.
- **Cobertura total**: Aplicar la verificación y reparación a **todas las tablas** (`committees`, `registrations`, `countries`, `documents`, `gallery`, `about_sections`, `edition_archives`, `news`, `organizing_team`, etc.).
- **Tolerancia a fallos en caliente**: En los endpoints de guardado (`PUT/POST /api/admin/committees`), si ocurre un error por columna inexistente, el sistema capturará el error, ejecutará la auto-reparación de la tabla en caliente y reintentará la operación automáticamente antes de responder, garantizando que el usuario jamás quede bloqueado.

---

## 3. Arquitectura Técnica de la Solución

### A. Función Central de Auto-Migración Universal (`server/dbManager.ts`)
Crear la función `ensureAllTableColumns(pool, type)` que:
1. Inspecciona la existencia de columnas usando `information_schema.COLUMNS` para MySQL/PostgreSQL y `PRAGMA table_info` para SQLite.
2. Define un diccionario exhaustivo con todas las columnas esperadas y sus tipos de datos correspondientes para cada tabla.
3. Identifica de forma segura las columnas faltantes y ejecuta sentencias `ALTER TABLE [tabla] ADD COLUMN [columna] [tipo]` protegidas para evitar conflictos de concurrencia.
4. Se ejecuta:
   - Al establecer la conexión inicial con MySQL / PostgreSQL.
   - Al invocar la sincronización manual desde el panel.
   - De manera preventiva / en fallback si un query detecta una columna ausente.

### B. Endpoint Administrativo de Reparación (`server/api.ts`)
- `POST /api/admin/database/repair-schema`: Endpoint autenticado que ejecuta la verificación integral de todas las tablas en la base de datos activa y devuelve un reporte detallado:
  - Tablas analizadas.
  - Columnas añadidas.
  - Estado del motor (MySQL, PostgreSQL o SQLite).

### C. Tolerancia a Fallos en Endpoints de Comisiones (`server/api.ts`)
- En `POST /api/admin/committees` y `PUT /api/admin/committees/:id`:
  - Si el query falla por `ER_BAD_FIELD_ERROR` / `Unknown column`, se invoca inmediatamente `ensureAllTableColumns()` para crear las columnas faltantes en MySQL y se reintenta la actualización.
  - Si persiste algún problema imprevisto, se aplica un guardado de compatibilidad degradada (guardando los campos base) para no perder los datos del formulario, registrando el evento.

### D. Interfaz de Usuario en el Panel Admin (`src/components/admin/AdminDashboard.tsx`)
- En la pestaña de **Base de Datos**:
  - Incorporar tarjeta interactiva: **Diagnóstico y Reparación de Esquema en Producción**.
  - Botón: "Verificar y Reparar Columnas".
  - Muestra alerta de estado con las columnas añadidas o confirmadas (e.g. `study_guide_url`, `copresident_name`, `payment_receipt`).
- En el modal de Comisiones:
  - Manejo de errores claro con feedback descriptivo en caso de fallos de red o servidor.

---

## 4. Plan de Ejecución Paso a Paso

1. **Actualizar `server/dbManager.ts`**:
   - Implementar el mapeo exhaustivo de tablas y columnas (con tipos para MySQL, PostgreSQL y SQLite).
   - Crear `ensureAllTableColumns(activePool, dbType)`.
   - Conectar `ensureAllTableColumns` dentro de `initMySqlSchema` e `initPostgresSchema` para que ocurra automáticamente al conectar.
   - Exponer la función para uso externo en endpoints y controladores.

2. **Actualizar `server/api.ts`**:
   - Agregar ruta `POST /api/admin/database/repair-schema`.
   - Envolver el guardado y actualización de comisiones con detección y auto-reparación en caliente de columnas faltantes con reintento automático.

3. **Actualizar `src/components/admin/AdminDashboard.tsx`**:
   - Añadir acción interactiva de "Reparar Esquema de Tablas" con visualización del resultado.
   - Mejorar mensajes de error al guardar comisiones si la API reporta alguna anomalía.

4. **Compilación y Verificación**:
   - Ejecutar `compile_applet` para asegurar ausencia de errores de TypeScript y empaquetado Vite.
   - Probar endpoint y verificar integridad de todas las tablas.

---

## 5. Criterios de Aceptación
- Al guardar o editar comisiones con guías PDF o discursos de bienvenida en MySQL, la operación responde `200 OK` y persiste todos los campos.
- El servidor ejecuta automáticamente la adición de columnas si no existen en la base de datos remota sin requerir migraciones manuales por consola.
- El botón de reparación en el panel permite validar el estado del esquema en cualquier momento con un solo clic.
