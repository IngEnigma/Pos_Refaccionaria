# Protocolo de Usabilidad — FrontTRT

> Objetivo: validar que un vendedor/almacenista puede vender, buscar y corregir sin ayuda.
> Método: test moderado presencial/remoto (30-40 min) + SUS + SEQ. Complemento no moderado opcional en Maze/Useberry.
> Muestra mínima: **5 usuarios** (3 mostrador/ventas, 1 almacén/inventario, 1 admin). Con 5 se detecta ~85% de problemas críticos.

---

## 1. Preparación (checklist facilitador)

- [ ] Ambiente: `http://localhost:4200` o preview con datos seed (no producción).
- [ ] Usuarios seed por rol + productos conocidos (ej: "Filtro aceite", "Bujía NGK", "Balata").
- [ ] Grabar pantalla + audio (con consentimiento). Activar Clarity/Hotjar si es remoto.
- [ ] Guion impreso + hoja de observación + cronómetro.
- [ ] Regla de oro: **no ayudar, no guiar**. Solo: "¿Qué estás pensando en voz alta?".

Frase de apertura (leer tal cual):
> "Estamos probando la aplicación, no a ti. No hay respuestas malas. Piensa en voz alta todo el tiempo. Si te atoras, es culpa del diseño, no tuya. Puedes abandonar cualquier tarea."

## 2. Perfiles

| P# | Rol | Contexto | Tareas asignadas |
|---|---|---|---|
| U1-U3 | Vendedor mostrador | Uso diario POS, prisa, clientes en fila | T1, T2, T3, T5 |
| U4 | Almacén | Altas, stock, sucursales | T4, T2 |
| U5 | Admin/encargado | Precios, reportes, usuarios | T4, T5 + exploración libre 5 min |

## 3. Las 5 tareas (con éxito observable)

### T1 — Vender 2 productos distintos y cobrar en efectivo [CRÍTICA]
> Mide el flujo P0 completo.
- **Enunciado:** "Un cliente quiere 2× Filtro de aceite y 1× Bujía NGK, paga en efectivo. Completa la venta."
- **Éxito:** venta confirmada + carrito vacío + aparece en historial.
- **Observar:** ¿encuentra buscador? ¿entiende qty +/-? ¿encuentra método de pago? ¿entiende confirmación?
- **Tiempo esperado:** ≤3 min. **Abandono:** >6 min o error no recuperable.

### T2 — Corregir un error (quitar/agregar + cambiar pago)
- **Enunciado:** "Agregaste un producto de más y elegiste mal el pago. Corrige antes de cobrar."
- **Éxito:** quita/disminuye ítem + cambia a tarjeta/transferencia y confirma.
- **Observar:** ¿descubre remove/decrease? ¿selectPayment es visible?

### T3 — Buscar un producto por nombre parcial
- **Enunciado:** "Busca 'buj' y agrega el primero al carrito."
- **Éxito:** usa buscador, resultado correcto en ≤15 seg.
- **Observar:** tolerancia a typos, feedback de 0 resultados.

### T4 — Dar de alta stock / ajustar precio por sucursal [Almacén/Admin]
- **Enunciado:** "Crea el producto 'Anticongelante 1L' ($180, 12 pzas) y asígnalo a sucursal Centro. Luego ponle $195 solo en Norte."
- **Éxito:** producto visible + stock por sucursal + precio diferenciado.
- **Observar:** ¿encuentra inventory vs inventory-by-branch vs branch-pricing? (nombres confusos = hallazgo).

### T5 — Revisar qué se vendió hoy
- **Enunciado:** "Tu encargado te pide: ¿cuánto vendimos hoy en Centro?"
- **Éxito:** llega a historial/reportes, filtra por hoy+Centro y dice el total.
- **Observar:** ¿history vs reports? ¿filtros descubribles?

## 4. Métricas por tarea (llenar por usuario)

| Tarea | Éxito (sí/no/parcial) | Tiempo | Clicks/pasos | Errores | Ayuda pedida | SEQ (1-7) |
|---|---|---|---|---|---|---|
| T1 | | mm:ss | | nº + descripción | sí/no | "Fue fácil" 1=muy difícil 7=muy fácil |
| T2 | | | | | | |
| T3 | | | | | | |
| T4 | | | | | | |
| T5 | | | | | | |

**Criterios de éxito global:**
- T1 ≥80% éxito sin ayuda, T3 ≥90%, resto ≥70%.
- 0 errores no recuperables en T1.
- SEQ promedio ≥5.5, SUS ≥78.

## 5. Cuestionario SUS (aplicar al final, 1-5)

Instrucción: "Marca del 1 (totalmente en desacuerdo) al 5 (totalmente de acuerdo). Responde rápido, primera impresión."

1. Creo que me gustaría usar este sistema con frecuencia.
2. Encontré el sistema innecesariamente complejo.
3. Pensé que el sistema era fácil de usar.
4. Creo que necesitaría ayuda técnica para usarlo.
5. Encontré las funciones bien integradas.
6. Pensé que había demasiada inconsistencia.
7. Imagino que la mayoría aprendería rápido a usarlo.
8. Encontré el sistema engorroso de usar.
9. Me sentí seguro usándolo.
10. Necesité aprender mucho antes de usarlo.

**Cálculo SUS (0-100):**
- Impares: (respuesta − 1). Pares: (5 − respuesta). Suma × 2.5.
- Interpretación: <68 = pobre, 68-78 = ok, >78 = bueno, >85 = excelente.
- Registrar por usuario y promedio. Si <78, priorizar top-3 fricciones antes del release.

**Preguntas abiertas (3 min):**
- ¿Qué fue lo más fácil / lo más confuso?
- ¿Qué cambiarías de la pantalla de ventas con un solo clic?
- ¿Confiarías en cobrar con prisa aquí? ¿Por qué?

## 6. Heurísticas a observar (Nielsen, checklist rápido)

- [ ] Visibilidad del estado (¿sé que la venta se guardó? ¿loading claro?)
- [ ] Lenguaje del negocio (¿"ventaInventario", "branch-pricing" lo entiende un vendedor?)
- [ ] Prevención de errores (¿bloquea venta sin pago/stock con mensaje claro?)
- [ ] Flexibilidad (¿atajos teclado para POS? ¿enter = buscar/cobrar?)
- [ ] Consistencia (botones, toasts, formatos $/fechas iguales en todos los módulos)
- [ ] Accesibilidad básica (foco visible, contraste, todo operable con teclado, labels en inputs)

## 7. Plantilla de hallazgo (una por problema)

```markdown
**H-[n] Título corto** (ej: "Botón confirmar venta no se ve sin scroll")
- Severidad: bloqueador / crítico / mayor / menor
- Tarea: T1 | Usuario: U2 | Evidencia: min 04:12 video
- Qué pasó / qué esperaba:
- Frecuencia: x/5 usuarios
- Recomendación:
- Módulo: sales | Nivel: usabilidad
```

## 8. Siguientes pasos tras la sesión

1. Volcar métricas en tabla (promedios + peores casos).
2. Priorizar top-5 hallazgos por severidad × frecuencia.
3. Crear issues con video/Claridad + propuesta.
4. Re-test solo de fixes en 2-3 usuarios (no repetir todo).
5. Guardar actas + SUS en `docs/evidencias/usabilidad-YYYY-MM-DD/`.

---
*Tip operativo: si no tienes Maze aún, este guion en papel + Clarity ya te da el 80% del valor. Maze solo escala el reclutamiento.*
