# Plan de Implementación: Corrección de Vulnerabilidad de Seguridad en Hostinger (`esbuild`)

## 1. Diagnóstico de la Vulnerabilidad
En el escaneo de seguridad de Hostinger para el dominio `bimun.colegiobilingue.edu.co`, se detectó la siguiente alerta de severidad alta:
- **Paquete afectado:** `esbuild` (`@0.25.12` / `^0.25.0`) en `devDependencies`
- **Identificador:** `GHSA-gv7w-rqvm-qjhr` (Vulnerabilidad relacionada con el binario y servidor local/protocolos de descarga)
- **Solución indicada por Hostinger:** Actualizar a `esbuild@^0.28.1` (o versión estable más reciente `^0.28.2`).

---

## 2. Cambios Propuestos y Estrategia Técnica

### A. Actualización de la Dependencia
- Actualizar `esbuild` en `package.json` de `"^0.25.0"` a `"^0.28.2"` (cumpliendo y superando el requerimiento de `>= 0.28.1`).
- Ejecutar la instalación limpia de dependencias para actualizar el árbol en `node_modules` y `package-lock.json`.

### B. Verificación de Compatibilidad del Script de Compilación
El proyecto utiliza `esbuild` en el script de producción:
```json
"build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs"
```
- Verificar que las banderas de bundling de `esbuild` (`--bundle --platform=node --format=cjs --packages=external --sourcemap`) sigan funcionando de manera idéntica y sin advertencias en `esbuild 0.28.x`.
- Comprobar compatibilidad con `tsx@^4.21.0` y `vite@^6.2.3`.

### C. Guía de Despliegue para Hostinger
- Una vez actualizado y verificado en el repositorio, al hacer push al branch principal o sincronizar en el panel de Hostinger:
  1. Ejecutar `npm install` (o `npm audit fix`).
  2. Ejecutar `npm run build`.
  3. Ejecutar nuevamente el escaneo de vulnerabilidades en el panel de Hostinger para verificar que el indicador cambie a 0 vulnerabilidades (en verde).

---

## 3. Plan de Verificación

1. **Instalación y Verificación de Versión**:
   - Confirmar que `npx esbuild --version` reporte `0.28.x`.
2. **Prueba de Compilación Completa (`npm run build`)**:
   - Verificar que `vite build` genere los estáticos en `dist/`.
   - Verificar que `esbuild server.ts ...` empaquete `dist/server.cjs` sin errores.
3. **Prueba de Ejecución del Servidor**:
   - Arrancar el servidor empaquetado y comprobar el endpoint de salud `/api/health`.
4. **Verificación de Linters**:
   - Ejecutar comprobación de tipos `npm run lint` (`tsc --noEmit`).
