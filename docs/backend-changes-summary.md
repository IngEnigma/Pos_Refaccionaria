# Resumen de cambios en el Backend (Develop)

## 1. Reportes de Ventas (ya mergeado en Develop)

**Backend nuevo:**
- **Modelo `Reporte`** (`ventas/models.py`): Almacena reportes generados con campos `tipo`, `fecha_inicio`, `fecha_fin`, `archivo` (PDF guardado en `/media/reportes/`).
- **Endpoint `GET /api/reporte/`** (`ventas/urls.py:14`): Recibe parámetros `tipo`, `year`, `month`, `quincena`. Genera un PDF con WeasyPrint y lo guarda en la DB.
- **Tipos de reporte soportados:** `day`, `week`, `quincena`, `month`, `year`.

**Frontend actual - lo que falta:**
- El frontend solo soporta `day`, `week`, `biweek`, `month` como tipos.
- **No soporta** el tipo `year` (reporte anual).
- El tipo `biweek` del frontend no coincide con `quincena` del backend. Hay que mapear `biweek → quincena` y enviar los parámetros `year`, `month`, `quincena` (1 o 2).
- Para el tipo `quincena`, el frontend **no tiene** selectores de mes, año ni quincena (1ra/2da). Hay que agregar esos controles condicionales.

**Archivos a modificar en Frontend:**
- `src/app/features/reports/domain/entities/report-params.model.ts` — Agregar tipo `'quincena'` y `'year'`, y el campo `quincena?: number`.
- `src/app/features/reports/infrastructure/repositories/report-repository.impl.ts` — Agregar params `quincena` y `year` para el tipo `quincena`, y soporte para tipo `year`.
- `src/app/features/reports/presentation/pages/reports-page/reports.page.ts` — Agregar señal `selectedQuincena`, opciones de quincena, lógica para tipo `quincena` y `year`.
- `src/app/features/reports/presentation/pages/reports-page/reports.page.html` — Agregar opción "Quincenal" y "Anual" al selector, y los selectores de quincena (1ra/2da) condicionales.

---

## 2. Búsqueda de Productos (cambio local no commiteado)

**Backend nuevo:**
- `producto/repositories/producto_repository.py` — La búsqueda ahora incluye `codigo_barras` además de `nombre`, `clave`, `marca`.
- `producto/services/producto_service.py` — Se agrega `codigoSAT` al serializer de respuesta.

**Frontend actual - lo que falta:**
- No hay impacto funcional directo en el frontend (la búsqueda ya se hace por query string). El backend simplemente busca más campos.
- Si se muestra `codigoSAT` en algún lado, hay que asegurarse de que el DTO de respuesta del frontend lo incluya.

---

## 3. Nueva app `inventario` (rama `Inventario_sucursales`, NO mergeada)

**Backend nuevo (en la rama):**
- **Nueva app `inventario`** con modelos:
  - `Inventario` — Inventario por sucursal
  - `DetalleInventario` — Detalle de inventario
  - `MovimientoInventario` — Movimientos de entrada/salida
- **Nueva app `sucursales`** con modelo `Sucursal`.
- **Endpoints:** `inventario/urls.py` y `sucursales/urls.py`.
- Modelo `Producto` modificado: se eliminó la relación directa de movimientos, ahora se maneja por sucursal.

**Frontend que habría que crear:**
- Módulo completo de **Sucursales** (CRUD).
- Módulo completo de **Inventario** (consulta por sucursal, movimientos de entrada/salida).
- Actualizar el módulo de **Productos** para vincularlos con sucursales/inventario.

---

## 4. Nueva app `notifications` (rama `feature-notificaciones`, NO mergeada)

**Backend nuevo (en la rama):**
- **Nueva app `notifications`** con modelo `Notification`.
- **Controller** con endpoints CRUD para notificaciones.
- Modelo `Producto` modificado (se eliminaron campos de movimiento).

**Frontend que habría que crear:**
- Servicio de notificaciones (fetch, marcar leído, etc.).
- Componente de notificaciones (campana, dropdown, badge).

---

## Prioridad de implementación en el Frontend

| Prioridad | Tarea | Dificultad |
|-----------|-------|------------|
| **Alta** | Arreglar tipos de reporte (`quincena` y `year`) — el backend ya lo soporta | Baja |
| **Media** | Aceptar la migración de `Inventario_sucursales` y crear módulos en frontend | Alta |
| **Media** | Crear módulo de notificaciones cuando se acepte `feature-notificaciones` | Media |
| **Baja** | Incluir `codigoSAT` en DTO de producto si se muestra | Baja |
