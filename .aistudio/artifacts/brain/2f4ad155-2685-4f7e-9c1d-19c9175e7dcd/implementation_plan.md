# Plan de Diseño: Menú Móvil Institucional Estilo Referencia (BIMUN XXVII)

Plan de integración del patrón visual y de interacción mostrado en las imágenes de referencia, adaptado al contenido, comisiones y herramientas del Modelo de Naciones Unidas BIMUN.

---

## Directrices Clave Confirmadas por el Usuario

> [!IMPORTANT]
> Las imágenes sirven como **referencia visual y estructural de diseño** para el menú móvil de BIMUN:

1. **Botón de Menú con Borde Dorado**:
   - En la barra superior, a la derecha del selector de idioma (`🇺🇸 EN` / `🇨🇴 ES`).
   - Botón rectangular con esquinas redondeadas y borde dorado nítido (`border-2 border-amber-400`).
   - Al estar cerrado muestra las 3 líneas blancas (☰); al abrirse conmuta inmediatamente a la `✕` de cierre dentro del mismo botón.
2. **Panel Desplegable Superior de Ancho Completo**:
   - No es un cajón lateral ni una barra inferior: se despliega suavemente desde el encabezado hacia abajo en azul marino institucional (`bg-[#0c1f38]`).
3. **Distribución Interior (Contenido BIMUN)**:
   - **Columna Izquierda (Secciones del Modelo)**:
     - `Inicio` (destacado en dorado clásico `#d4af37`, tal como en la referencia)
     - `Nosotros / Comité` (`#nosotros`)
     - `Comisiones Académicas` (`#comisiones`)
     - `Matriz de Países y Delegaciones` (`#delegaciones`)
     - `Cronograma Oficial` (`#cronograma`)
     - `Guías y Temarios` (`#documentos`)
     - `Inscripciones de Delegados` (`#inscripciones`)
     - `Contacto` (`#contacto`)
   - **Columna Derecha (Accesos Circulares Estilo Referencia)**:
     - 3 botones circulares tipo medalla/sello:
       1. **Mi Carnet**: Abre directamente el modal con el carnet digital y descarga del PDF oficial con QR.
       2. **Guías**: Desplazamiento directo a los documentos y manual de procedimientos.
       3. **Buscar**: Abre el buscador interactivo inteligente del evento.
4. **Pantalla Despejada**:
   - Se eliminan la barra inferior fija y el botón flotante anterior para que la navegación en el móvil sea completamente limpia y sin distracciones.

---

## 1. Arquitectura de Interfaz Móvil

```
┌────────────────────────────────────────────────────────┐
│  [Escudo] BIMUN XXVII              [🇺🇸 EN]  [ ☰ dorada ]│  <- Header
├────────────────────────────────────────────────────────┤
│  ▼ AL TOCAR EL BOTÓN DORADO (Panel Desplegable #0c1f38)│
│                                                        │
│   • Inicio (Dorado #d4af37)           ( 🎫 Mi Carnet ) │
│   • Nosotros                                           │
│   • Comisiones                        ( 📄 Guías )     │
│   • Delegaciones / Países                              │
│   • Cronograma                        ( 🔍 Buscar )    │
│   • Documentos                                         │
│   • Inscripciones                                      │
│   • Contacto                                           │
└────────────────────────────────────────────────────────┘
```

---

## 2. Componentes y Cambios a Implementar

### A. En `src/components/Navbar.tsx`
- Reemplazar el botón de menú genérico por el botón con borde dorado (`border-2 border-amber-400 bg-slate-900/60 rounded-xl px-3 py-2`) que conmuta entre ☰ y ✕.
- Reemplazar el cajón lateral por el panel desplegable superior directo que cae bajo la barra de navegación con animación fluida.
- Renderizar la lista de secciones de BIMUN con tipografía clásica a la izquierda y los 3 botones circulares con iconos y etiquetas a la derecha.
- Al pulsar cualquier sección o botón circular, el panel se pliega suavemente y conduce al usuario a su destino.

### B. En `src/App.tsx`
- Retirar `MobileBottomBar` y los paddings inferiores residuales para dejar la pantalla completamente limpia.

---

## 3. Verificación Técnica y Estado de Implementación
- [x] Ejecutar `compile_applet` y `lint_applet` para asegurar 0 errores de compilación y tipado (Completado: 0 errores).
- [x] Eliminar barra inferior fija y botones flotantes para una experiencia limpia sin pantallas en blanco ni obstrucciones táctiles.
- [x] Implementar botón de cabecera rectangular con borde dorado (`border-2 border-amber-400`) y conmutación fluida entre ☰ y ✕.
- [x] Implementar panel superior desplegable en azul marino institucional (`#0c1f38`) directamente anclado a la cabecera.
- [x] Implementar columna izquierda con enlaces en tipografía serif con "Inicio" en dorado clásico (`#d4af37`).
- [x] Implementar columna derecha con los 3 accesos directos circulares ("Mi Carnet", "Guías", "Buscador").
- [x] Implementar cápsula de idioma compacta (`🇺🇸 EN` / `🇨🇴 ES`) en la cabecera móvil.

