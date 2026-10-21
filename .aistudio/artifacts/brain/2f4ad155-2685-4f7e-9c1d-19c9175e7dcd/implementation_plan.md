# Plan de Implementación: Área del Delegado y Descarga de Carnet Digital en PDF

Implementar el **Área del Delegado / Portal de Credenciales** que permita a los delegados inscritos consultar el estado de su registro y descargar su **Carnet Digital Oficial en PDF**, con diseño de alta fidelidad, código QR de verificación, logo de BIMUN, comisión y país o rol asignado.

## Resumen de Decisiones Aclaradas

Con base en tus respuestas:
1. **Acceso al Área de Usuario:** Modal accesible desde el menú principal (Navbar en escritorio y móvil) ingresando correo electrónico o código de registro (`reg_...`), además de acceso directo tras enviar el formulario de inscripción.
2. **Requisito de Aprobación:** La descarga del carnet oficial se habilita exclusivamente cuando la inscripción se encuentra **aprobada** o con **cupo asignado** (`status === 'approved'` o `'assigned'`). Si está pendiente, se informa claramente el estado de revisión por la Secretaría General.
3. **Diseño de Credencial:** Formato carnet/gafete tipo credencial oficial de conferencia internacional, con:
   - Encabezado con identidad visual BIMUN y edición del modelo.
   - Datos del delegado: Nombre completo, Institución/Colegio y Grado.
   - Asignación oficial: Comité y País asignado (con su bandera e insignia).
   - Código QR de verificación oficial con identificador único del delegado.
   - Firma/Sello de la Secretaría General y fecha del evento.

---

## Cambios Propuestos

### 1. Dependencias (`package.json`)
- Instalar `jspdf` y `qrcode` (y tipos `@types/qrcode`) para generar el PDF directamente con máxima resolución vectorial e incrustar el código QR de verificación sin depender de servicios externos.

### 2. Backend / API (`server/api.ts`)
- **Nuevo endpoint de consulta segura:**
  - `GET /api/public/delegate-lookup?query=...`
  - Permite buscar por correo electrónico (`email`) o código de inscripción (`reg_...`).
  - Devuelve los datos públicos de la inscripción: nombre completo, colegio, tipo de delegación, estado (`pending`, `approved`, `assigned`, `rejected`), comisiones preferidas y, cuando esté aprobada/asignada, los datos del comité asignado (`name`, `code`, `type`) y país asignado (`name`, `flag_code`).
  - No expone datos confidenciales como contraseñas o tokens.
  - Protección con límite de peticiones (rate limiting) para prevenir abusos.

### 3. Generador de Carnet Digital en PDF (`src/utils/carnetPdfGenerator.ts`)
- Utilidad modular para renderizar el carnet digital en formato PDF descargable:
  - Formato carnet vertical estándar (ej. 85mm x 125mm) de calidad profesional (300 DPI).
  - Encabezado con degradado azul oscuro / dorado institucional BIMUN.
  - Tipografía jerárquica limpia, distintivo oficial "DELEGADO OFICIAL" / "DELEGATE".
  - Nombre del delegado destacado.
  - Cuadro de asignación: Comité y País asignado con icono/bandera.
  - Código QR generado con datos verificables (ID de registro y confirmación de autenticidad).
  - Fecha del evento, colegio de procedencia y código de barras/ID de seguridad.
  - Descarga automática con nombre de archivo personalizado: `Carnet-BIMUN-[Nombre-Delegado].pdf`.

### 4. Componente Modal de Área del Delegado (`src/components/common/DelegatePortalModal.tsx`)
- Modal intuitivo y elegante:
  - Formulario de búsqueda con opción de autocompletado si el usuario acaba de inscribirse.
  - **Vista de Estado:**
    - Si está **Aprobada / Asignada**: Tarjeta interactiva con vista previa visual del carnet (tipo gafete 3D con badge metálico y QR interactivo) y botón destacado **"Descargar Carnet Digital (PDF)"**.
    - Si está **Pendiente**: Badge amarillo con mensaje informativo indicando que la mesa directiva está evaluando la asignación de cupos.
    - Si no se encuentra: Mensaje amigable con sugerencia para verificar el correo o contactar a soporte.
  - Opción de imprimir directamente o descargar el archivo PDF.

### 5. Integración en la Navegación y Flujo de Inscripción
- **Navbar (`src/components/Navbar.tsx`):**
  - Botón "Mi Carnet / Área Delegado" en la barra de navegación superior y en el menú móvil.
- **Formulario de Inscripción (`src/components/RegistrationForm.tsx`):**
  - Al completar la inscripción con éxito, se muestra el botón "Consultar mi inscripción / Ver carnet" para abrir el modal automáticamente con su ID generado.
- **Panel Administrativo (`src/components/admin/AdminDashboard.tsx`):**
  - Añadir botón de descarga directa de carnet en la lista de inscripciones aprobadas para que los administradores también puedan emitirlos o descargarlos cuando lo requieran.

---

## Plan de Verificación

### Verificación Automatizada
1. Instalar paquetes con `install_applet_package` (`jspdf`, `qrcode`, `@types/qrcode`).
2. Comprobar compilación con `compile_applet`.
3. Verificar tipos con `lint_applet` (`tsc --noEmit`).

### Verificación Manual
1. **Búsqueda en el Portal del Delegado:**
   - Abrir el modal desde el Navbar.
   - Probar la consulta con un correo electrónico existente.
2. **Visualización y Descarga:**
   - Consultar una inscripción con estado `approved` o `assigned` y comprobar que se visualice la vista previa y se descargue el PDF correctamente con QR y asignación de comité/país.
   - Consultar una inscripción en estado `pending` y verificar que muestre el estado de espera sin permitir descarga indebida.
3. **Prueba de Flujo Completo:**
   - Enviar una nueva inscripción en el formulario público y verificar el acceso directo al portal.
   - Probar compatibilidad en modo oscuro y modo claro tanto en escritorio como en vista móvil.
