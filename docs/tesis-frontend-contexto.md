# Contexto tesis frontend FrontTRT — documento de trabajo

Este archivo sirve como contexto para continuar la redacción del capítulo de tesis del frontend. No es parte de la tesis. Es la guía para futuras sesiones.

## 1. Objetivo

Redactar la sección 4.1.6 DESARROLLO DE FRONTEND de la tesis del proyecto FrontTRT (sistema punto de venta multi-sucursal para Refaccionaria TRT), siguiendo como modelo la tesis aprobada de la Universidad Veracruzana (plataforma cáncer de mama, junio 2024).

Estructura objetivo, calcada de la guía. Replica esa misma lógica, solo cambia Flutter por Angular:

```
4.1.6 DESARROLLO DE FRONTEND
  4.1.6.1 Configuración base y providers -> app.config.ts, interceptors, auth.guard
  4.1.6.2 Creación de componentes -> shared/ui, product-card, cart-panel, sales-summary, ticket-modal
  4.1.6.3 Punto de venta - sales -> sales.facade.ts, sales-cart.service.ts, create-complete-sale.usecase.ts
  4.1.6.4 Inventario por sucursal -> inventory.page.ts, movement-form-dialog
  4.1.6.5 Autenticación y control por rol -> login.page.ts (corto, como cierre)
```

Detalle por subapartado:

- 4.1.2 Estructura del proyecto
- 4.1.3 Dependencias y versión
- 4.1.4 Mappers
- 4.1.5 Manejador de estado (en FrontTRT: SessionStateService + facades con signals)
- 4.1.6 Desarrollo de frontend
  - 4.1.6.1 Configuración base y proveedores de la aplicación — TERMINADO (ver sección 3 de este archivo, no volver a redactar)
  - 4.1.6.2 Creación de componentes reutilizables — TERMINADO (ver sección 3 de este archivo, no volver a redactar)
  - 4.1.6.3 Punto de venta - sales (BORRADOR VERIFICADO: ver sección 5, pendiente de aprobación del autor)
  - 4.1.6.4 Inventario por sucursal (BORRADOR REDACTADO: ver sección 6, pendiente de aprobación del autor)
  - 4.1.6.5 Autenticación y control por rol (BORRADOR REDACTADO: ver sección 7, pendiente de aprobación del autor)
- 4.1.7 Desarrollo de backend (no toca a este rol, solo referenciar endpoints Django)

Estado: 4.1.6.1 y 4.1.6.2 están terminados. El borrador de 4.1.6.3 quedó redactado en la sección 5, verificado contra el código el 17 de octubre de 2026 y espera lectura del autor. El borrador de 4.1.6.4 quedó redactado en la sección 6 y espera la misma lectura. El borrador de 4.1.6.5 quedó redactado en la sección 7, verificado contra el código el 17 de octubre de 2026. Los cinco subapartados quedan redactados; falta la lectura del autor.

Cada subapartado debe narrar con el patrón de la guía: párrafo de qué hace y por qué existe, fragmento de código corto (15 a 30 líneas), ilustración con pie, explicación de lo visible en pantalla. Nada de clases completas de 200 líneas.

## 2. Regla principal: usar siempre la skill humanizer

Antes de redactar cualquier texto de tesis, cargar la skill:

```
skill: humanizer
```

Ruta base: /home/enigma/.agents/skills/humanizer

Motivo: los detectores y los sinodales identifican prosa generada por los patrones de los modelos (contrastes tipo "no solo X sino Y", cierres de una línea que repiten el párrafo, tríadas decorativas, guiones largos en cada frase, negritas en cada término, palabras infladas como crucial, robusto, clave, aperturas tipo "a continuación se presenta"). La skill elimina esos patrones sin inventar datos.

Tono exigido para tesis (voz técnica de la skill): neutral y plano, impersonal con "se", frases desiguales en longitud, cada frase aporta un dato nuevo. Sin humor, sin primera persona, sin adjetivos de venta.

Prohibiciones concretas al redactar:

- No usar em dash (—) ni en dash (–) en prosa. Solo coma, punto, paréntesis. En código se dejan como estén.
- No usar **negritas** como decoración ni listas con etiqueta en negrita y dos puntos. Convertir a prosa o a tabla simple.
- Encabezados en sentence case: "4.1.6.1 Configuración base y proveedores de la aplicación".
- No usar contrastes "no es X, es Y" ni "no solo X sino Y". Decir el punto directo.
- No cerrar párrafos con frases que repiten ("Esto demuestra la importancia..."). Terminar con el último dato concreto.
- No meter tríadas de adjetivos ("robusta, escalable y eficiente"). Si hay tres elementos reales (los tres interceptores), separarlos en frases distintas.
- No usar palabras marcadas: crucial, robusto, clave (como adjetivo), adicionalmente, destacar, meticuloso, pivotal, valioso, integral.
- No usar gerundios colgados para dar profundidad ("garantizando", "permitiendo", "asegurando"). Usar verbos finitos.
- Comillas rectas "...", no curvas.
- Cero residuo de chat ("Aquí tienes", "Espero que ayude", "¿Quieres que siga?").
- Referencias a figuras como crédito de fuente, no como narración del documento. Bien: "Archivo src/app/app.config.ts, líneas 119 a 124." Mal: "En la siguiente tabla se compara...".

Modo de entrega de la skill para documentos (embedded mode): devolver solo el texto final, sin borrador ni lista de patrones.

## 3. Lo ya hecho: 4.1.6.1 y 4.1.6.2 (textos aprobados por el autor)

Copiar tal cual como base. Ya están humanizados.

---

4.1.6.1 Configuración base y proveedores de la aplicación

La configuración del frontend se concentra en src/app/app.config.ts. Ese archivo registra el enrutador y el cliente HTTP. También fija la correspondencia entre contratos abstractos e implementaciones. Los componentes piden un repositorio abstracto y reciben la clase asignada en ese registro.

```
provideHttpClient(
  withInterceptors([httpErrorInterceptor, authTokenInterceptor, trailingSlashInterceptor])
)
```

Ilustración 18. Cliente HTTP con interceptores en app.config.ts. Archivo src/app/app.config.ts, líneas 119 a 124. La captura debe incluir provideRouter y el bloque provideHttpClient con los tres nombres.

El cliente HTTP usa esas tres funciones. authTokenInterceptor agrega el token de acceso. httpErrorInterceptor aplica reintentos y entrega el error al manejador central. trailingSlashInterceptor agrega la diagonal final que pide Django.

```
export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const refreshOrchestrator = inject(AuthTokenRefreshOrchestrator);
  const authRequest = refreshOrchestrator.attachAccessToken(req);
  return next(authRequest).pipe(
    catchError((error: unknown) => {
      if (!isUnauthorizedError(error)) {
        return throwError(() => error);
      }
      return refreshOrchestrator.retryRequestAfterRefresh(authRequest, next);
    }),
  );
};
```

Ilustración 19. Renovación de token en el interceptor. Archivo src/app/features/auth/infrastructure/http/auth-token.interceptor.ts, líneas 12 a 30. La captura debe mostrar attachAccessToken en la línea 15 y retryRequestAfterRefresh en la línea 29. El interceptor renueva una vez ante un 401. Si falla la petición de renovación, devuelve el error sin reintentar de nuevo.

La correspondencia de repositorios quedó registrada con useClass y useExisting. AuthRepository recibe AuthRepositoryImpl. SaleRepository recibe SaleRepositoryImpl. ProductRepository recibe ProductRepositoryImpl. STORAGE_PORT recibe InMemoryStorageService para la jornada. PERSISTENT_STORAGE_PORT recibe LocalStorageService y solo se usa si se marcó recordarme. LOGGER_PORT recibe LoggerService y APP_ENV expone la URL del API.

Ilustración 20. Guardia de rutas privadas. Archivo src/app/features/auth/presentation/guards/auth.guard.ts, líneas 8 a 23. La captura debe mostrar isAuthenticated y createUrlTree hacia login con redirectTo. El guard lee SessionStateService. Sin sesión, redirige a login y conserva la URL pedida para volver después.

Ilustración 21. Estado de sesión con signals. Archivo src/app/features/auth/application/services/session-state.service.ts, líneas 12 a 28. La captura debe mostrar _session como signal, session como señal de solo lectura e isAuthenticated como computed. Al iniciar, el servicio revisa localStorage. Si hay sesión guardada y el token sigue vigente, la restaura en memoria. Si el token caducó, borra el almacenamiento persistente. El identificador de sucursal se guarda en currentSucursalId. Ventas e inventario lo usan para filtrar existencias y precios.

Ilustración 22. Comprobación en el navegador. Recorte de Application y Local Storage con las llaves session y session:remember. Recorte de Network con el encabezado Authorization en una petición al API y con la URL terminada en diagonal. Se tapó el valor del token. La petición POST a login aparece sin diagonal final porque el backend la define así.

---

4.1.6.2 Creación de componentes reutilizables

La interfaz se arma con dos grupos de componentes. La carpeta src/app/shared/ui contiene los controles que no dependen del dominio: botón, botón de icono, campo de texto, buscador con retardo, avisos emergentes, esqueleto de carga y menú desplegable. La carpeta src/app/features/sales/presentation/components contiene los bloques propios del punto de venta: tarjeta de producto, panel del carrito, resumen de venta y modal de ticket, entre otros. Los componentes descritos en este apartado son standalone y declaran ChangeDetectionStrategy.OnPush. La comunicación entre unos y otros usa las funciones input y output.

Las exportaciones de la biblioteca compartida se concentran en un archivo.

```
export * from './components/skeleton/skeleton.component';
export * from './components/toast/toast-container.component';
export * from './components/toast/toast.service';
export * from './components/button/button.component';
export * from './components/icon-button/icon-button.component';
export * from './components/dropdown/dropdown.component';
export * from './components/dropdown/dropdown-trigger.directive';
export * from './components/dropdown/dropdown-menu.component';
export * from './components/dropdown/dropdown-item.component';
export * from './components/dropdown/dropdown-divider.component';

export * from './form-controls/input/input.component';
export * from './form-controls/search-input/search-input.component';

export * from './form-controls/base/base-control-value-accessor';
```

Ilustración 23. Punto único de exportación de la biblioteca compartida. Archivo src/app/shared/ui/index.ts, líneas 1 a 15. La captura debe mostrar la lista completa de exportaciones, con button, input y search-input visibles. Recorte de VS Code, tema claro, con numeración de línea.

Las pantallas importan desde @shared/ui, sin rutas internas. El alias @shared se declara en tsconfig.json, líneas 28 a 35, junto con @app, @core, @features, @shell y @env. Si un control cambia de carpeta, los imports de las pantallas no cambian.

El botón recibe el tipo, la variante, el tamaño, el estado deshabilitado, el estado de carga, el texto de carga y el ancho completo. Emite onClick.

```
export class ButtonComponent {
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly variant = input<'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'>('primary');
  readonly size = input<'sm' | 'md' | 'lg' | 'compact'>('md');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly loadingText = input('Cargando...');
  readonly fullWidth = input(false);
  readonly onClick = output<void>();

  handleInternalClick(event: MouseEvent): void {
    if (this.disabled() || this.loading()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.onClick.emit();
  }
}
```

Ilustración 24. Contrato del botón compartido. Archivo src/app/shared/ui/components/button/button.component.ts, líneas 15 a 33. La captura debe mostrar el bloque de inputs, el output onClick y la revisión de disabled y loading dentro de handleInternalClick. Recorte de VS Code, tema claro, con numeración de línea.

handleInternalClick revisa disabled y loading antes de emitir. Cuando alguno de los dos está activo, detiene el evento y no emite la salida. La tarjeta de producto y el panel del carrito usan este botón.

La tarjeta de producto recibe un SalesProduct por input.required y emite addToCart. Los dos canales se declaran en product-card.component.ts, líneas 16 y 17. La plantilla dibuja nombre, descripción, precio y existencias. La insignia Sucursal aparece cuando hasSucursalPrice es verdadero. Si el producto no trae imagen, la tarjeta pinta un icono de paquete.

```
  <h3 class="product-name">{{ product().nombre }}</h3>
  <p class="product-desc">{{ product().descripcion }}</p>

  <div class="product-row">
    <span class="product-price">
      ${{ product().precio }}
      @if (product().hasSucursalPrice) {
        <span class="sucursal-badge">Sucursal</span>
      }
    </span>
    <span class="product-stock" [class.stock-zero]="product().stock === 0">
      {{ product().stock }}
    </span>
  </div>

  <app-button
    variant="primary"
    size="compact"
    [fullWidth]="true"
    [disabled]="product().stock === 0"
    (onClick)="onAdd()"
  >
    Añadir
  </app-button>
</article>
```

Ilustración 25. Tarjeta de producto en el catálogo. Captura de la pantalla de venta. La captura debe mostrar la cuadrícula de productos y una tarjeta en primer plano con nombre, precio, existencias y el botón Añadir. Dos recuadros deben señalar una tarjeta con la insignia Sucursal y otra con el botón deshabilitado por stock cero.

El panel del carrito reúne los bloques de la venta en curso. Recibe por input la lista de artículos, los cuatro montos, los métodos de pago, el pago seleccionado y los estados disabled y loading. Emite eventos para quitar, aumentar y disminuir cantidades, seleccionar el pago y procesar la transacción. La plantilla anida cart-item, sales-summary, payment-method-selector y el botón compartido. El panel declara la etiqueta aria-label "Detalle de venta". Con la lista vacía aparece el texto "No hay productos agregados."

```
@Component({
  selector: 'app-cart-panel',
  standalone: true,
  imports: [CartItemComponent, SalesSummaryComponent, PaymentMethodSelectorComponent, ButtonComponent],
  templateUrl: './cart-panel.component.html',
  styleUrl: './cart-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartPanelComponent {
  readonly cartItems = input<SalesCartItem[]>([]);
  readonly subtotal = input(0);
  readonly descuento = input(0);
  readonly iva = input(0);
  readonly total = input(0);
  paymentMethods = input<readonly PaymentMethod[]>([]);
  selectedPayment = input<PaymentMethod | null>(null);
  readonly disabled = input(false);
  readonly loading = input(false);

  readonly removeItem = output<SalesCartItem>();
  readonly increaseQty = output<SalesCartItem>();
  readonly decreaseQty = output<SalesCartItem>();
  readonly selectPayment = output<PaymentMethod>();
  readonly processTransaction = output<void>();
}
```

Ilustración 26. Panel del carrito con una venta armada. Captura de la pantalla de venta, columna derecha. La captura debe mostrar la lista de artículos con los controles de cantidad, el resumen de importes, el selector de pago y el botón Procesar transacción.

El resumen de venta tiene cuatro filas: subtotal, descuento, IVA y total. Los valores llegan por input y se formatean con el pipe number en formato 1.2-2, que fija dos decimales. La fila del total cierra el bloque con un tamaño mayor que el resto. El componente no calcula cifras ni consulta datos.

```
<div class="panel-summary">
  <div class="summary-row">
    <span>Subtotal</span>
    <span>${{ subtotal() | number:'1.2-2' }}</span>
  </div>
  <div class="summary-row">
    <span>Descuento</span>
    <span>${{ descuento() | number:'1.2-2' }}</span>
  </div>
  <div class="summary-row">
    <span>IVA</span>
    <span>${{ iva() | number:'1.2-2' }}</span>
  </div>

  <div class="summary-total">
    <span>Total</span>
    <span class="total-amount">${{ total() | number:'1.2-2' }}</span>
  </div>
</div>
```

Ilustración 27. Resumen de importes con dos decimales. Archivo src/app/features/sales/presentation/components/sales-summary/sales-summary.component.html, líneas 1 a 19. La captura debe mostrar las cuatro filas y el uso del pipe number en cada importe. Recorte de VS Code, tema claro, con numeración de línea.

El modal de ticket aparece al terminar una venta. Muestra folio, fecha, vendedor, método de pago, productos y total. Se cierra desde el botón de la esquina, desde el botón Cerrar o con un clic fuera del cuadro. La reimpresión arma un objeto payload con los datos del comprobante y lo envía por el puente window.desktop.generateTicket. Ese puente existe en la versión de escritorio. En el navegador solo se muestra un aviso, porque no hay acceso a la impresora.

```
    try {
      const w = window as unknown as { desktop?: { generateTicket: (d: unknown) => Promise<{ success: boolean; message?: string }> } };
      if (!w.desktop?.generateTicket) {
        // Fallback web: solo simula
        console.log('[TicketModal] Preview payload', payload);
        this.toast.success('Ticket listo para reimpresión (modo web)');
        return;
      }
      const response = await w.desktop.generateTicket(payload);
      if (!response.success) {
        this.toast.error(response.message ?? 'No fue posible reimprimir el ticket.');
      } else {
        this.toast.success('Ticket reimpreso correctamente.');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al reimprimir ticket';
      this.toast.error(msg);
    } finally {
      this.isReprinting.set(false);
    }
```

Ilustración 28. Llamada al puente de escritorio desde el modal. Archivo src/app/features/sales/presentation/components/ticket-modal/ticket-modal.component.ts, líneas 188 a 207. La captura debe mostrar la llamada a window.desktop.generateTicket, el retorno anticipado del modo web y el bloque finally que restablece isReprinting. Recorte de VS Code, tema claro, con numeración de línea.

Ilustración 29. Modal del ticket después de una venta. Captura de la pantalla de venta con el modal abierto. La captura debe mostrar la etiqueta Venta exitosa, el folio en el encabezado, los datos de la venta, la lista de productos con sus subtotales, el total y los botones Cerrar y Reimprimir ticket.

En pantalla, el panel del carrito ocupa la columna derecha de la venta y el modal se dibuja sobre el contenido. El área del ticket recibe foco del teclado mediante tabindex 0 y declara aria-label "Vista previa del ticket". El fondo del modal cierra con un clic fuera del cuadro y el botón de reimpresión se deshabilita mientras isReprinting está activo.

---

## 4. Lo que falta y cómo seguir

Para cada subapartado pendiente, seguir este flujo:

1. Leer los archivos reales del feature (no inventar líneas ni funciones).
2. Cargar la skill humanizer.
3. Redactar en el mismo formato: párrafo, código o captura, ilustración con archivo y líneas, párrafo de verificación.
4. Especificar captura con: archivo, líneas exactas, qué función o variable debe verse, cómo recortar (VS Code con números de línea, tema claro), qué tapar (tokens), y pie de ilustración.

Referencias de código verificadas hasta ahora:

- src/app/app.config.ts:119-124 (interceptores), :178-198 (puertos), :200-286 (repositorios)
- src/app/features/auth/infrastructure/http/auth-token.interceptor.ts:12-30
- src/app/core/interceptors/http-error.interceptor.ts:8-15
- src/app/core/interceptors/trailing-slash.interceptor.ts:20-40
- src/app/features/auth/presentation/guards/auth.guard.ts:8-23
- src/app/features/auth/application/services/session-state.service.ts:12-28 y 38-60
- src/app/shared/ui/index.ts:1-15
- tsconfig.json:28-35 (alias @app, @core, @shared, @features, @shell, @env)
- src/app/shared/ui/components/button/button.component.ts:15-33
- src/app/features/sales/presentation/components/product-card/product-card.component.ts:16-17 y product-card.component.html:13-37
- src/app/features/sales/presentation/components/cart-panel/cart-panel.component.ts:12-36 y cart-panel.component.html:1 (aria-label), 9-11 (estado vacío), 23-47 (anidación)
- src/app/features/sales/presentation/components/sales-summary/sales-summary.component.html:1-19
- src/app/features/sales/presentation/components/ticket-modal/ticket-modal.component.ts:26 y 32 (aria-label, tabindex), 96 (disabled), 172-186 (payload), 188-207 (puente de escritorio)
- src/app/features/sales/presentation/pages/sales/sales.page.html:65-67 (apertura del modal)

Referencias verificadas para la sección 5 (4.1.6.3):

- src/app/features/sales/presentation/state/sales-cart.service.ts:17-35 (señales y computed order), :37-65 (addToCart), :110-137 (confirmSale)
- src/app/features/sales/application/facades/sales.facade.ts:37-53 (señales expuestas), :55-97 (loadSales y loadPaymentMethods), :108-115 (createCompleteSale), :154-164 (resolveErrorMessage)
- src/app/features/sales/application/usecase/create-complete-sale.usecase.ts:24-48 (validación y alta), :48-70 (rollback), :71-78 (ticket)
- src/app/features/sales/presentation/pages/sales/sales.page.ts:42 (providers), :56-58 (submitDisabled), :86-94 y 97-107 (carga de sucursal), :124-163 (computed productos), :165-171 (señales expuestas), :173-197 (escaneo), :229-250 (validación previa), :252-285 (éxito), :286-297 y 307-316 (error e isNotFoundError)
- src/app/features/sales/domain/entities/order.entity.ts:28, 54-57, 59-68 (IVA, descuento, tope de partida)
- src/app/features/sales/config/sale-endpoints.ts:1-7 (/ventas/ y /detalleventa/)
- src/app/features/sales/infrastructure/repositories/sale-repository.impl.ts:71-92, 94-110, 130-144 (ticket, alta y borrado)

Referencias verificadas para la sección 6 (4.1.6.4):

- src/app/features/inventory-by-branch/presentation/pages/inventory-page/inventory.page.ts:34-41 (effect de error), 43-49 (ngOnInit), 51-65 (onRegisterMovement), 67-85 (cierre del diálogo y alta), 88-99 (onAddMovement)
- src/app/features/inventory-by-branch/presentation/pages/inventory-page/inventory.page.html:9-11 (botón Registrar Movimiento), 15-21 (estado sin sucursal), 35-39 (tabla), 42-47 (lista de movimientos)
- src/app/features/inventory-by-branch/application/facades/inventory-by-branch.facade.ts:20-32 (señales), 34-57 (loadMyBranchInventory), 78-91 (registerMovement), 93-96 (refreshAll), 102-113 (resolveErrorMessage)
- src/app/features/inventory-by-branch/presentation/components/inventory-table/inventory-table.component.ts:14-18 (inputs y output)
- src/app/features/inventory-by-branch/presentation/components/inventory-table/inventory-table.component.html:4-12 (encabezados), 29-39 (stock y precio), 51-72 (esqueleto y vacío)
- src/app/features/inventory-by-branch/presentation/components/movement-form-dialog/movement-form-dialog.component.ts:52-61 (validadores), 67-83 (onSubmit), 85-87 (onCancel)
- src/app/features/inventory-by-branch/presentation/components/movement-form-dialog/movement-form-dialog.component.html:30-40 (solo lectura y pistas), 82 (botón deshabilitado)
- src/app/features/inventory-by-branch/infrastructure/repositories/inventory-repository.impl.ts:20-38 (mi-sucursal)
- src/app/features/inventory-by-branch/infrastructure/repositories/movement-repository.impl.ts:16-28 (endpoints de movimientos)
- src/app/features/inventory-by-branch/infrastructure/mappers/movement.mapper.ts:16-28 (payload a snake case)

Referencias verificadas para la sección 7 (4.1.6.5):

- src/app/features/auth/presentation/pages/login/login.page.ts:26 y 59 (takeUntilDestroyed), :32-39 (effect del error), :41-44 (validadores), :46-48 (submitDisabled), :50-66 (onSubmit y redirección)
- src/app/features/auth/presentation/pages/login/login.page.html:12-31 (campos y errores), :34-42 (botón con loading)
- src/app/features/auth/application/facades/auth.facade.ts:29-32 (señales publicadas), :34-50 (login), :79-94 (resolveErrorMessage)
- src/app/features/auth/application/usecase/login.usecase.ts:15-28 (sesión con persist y remember)
- src/app/features/auth/infrastructure/repositories/auth-repository.impl.ts:32-51 (POST /login sin diagonal), :70-77 (mapeo de 401 y estado 0)
- src/app/features/auth/domain/value-objects/auth-user-role.enum.ts:1-5
- src/app/features/auth/domain/entities/auth-session.entity.ts:23-30 (role y hasRole)
- src/app/features/auth/application/services/session-state.service.ts:33-36 (role), :67-93 (persistencia)
- src/app/app.config.ts:207-215 (SHELL_USER_ROLE)
- src/app/shell/application/facades/shell.facade.ts:38-41 (filteredSidebarItems)
- src/app/shell/utils/sidebar-filter.utils.ts:4-14 (filtro por rol)
- src/app/shell/config/sidebar-menu.defaults.ts:40-53 y 61-67 (roles por entrada)
- src/app/shell/layouts/main-layout/main-layout.component.ts:26 (paso de la lista al sidebar)
- src/app/shell/components/sidebar/sidebar.component.html:8-27 (render de entradas)
- src/app/features/auth/config/auth-endpoints.ts:1-4 (/login y /token/refresh)

Próximo paso sugerido: revisar los borradores de las secciones 5 (4.1.6.3), 6 (4.1.6.4) y 7 (4.1.6.5). Con los tres aprobados, el apartado 4.1.6 queda cerrado. El 4.1.7 (desarrollo de backend) no corresponde a este rol.

## 5. Borrador para revisión: 4.1.6.3 Punto de venta

Texto redactado con la skill humanizer y verificado contra los archivos el 16 de octubre de 2026. Las ilustraciones continúan la numeración desde la 30.

---

4.1.6.3 Punto de venta

La pantalla de venta se arma en src/app/features/sales/presentation/pages/sales. El componente sales.page.ts no guarda los artículos del carrito ni calcula importes. Ese estado se concentra en SalesCartService, declarado en la lista providers del componente (sales.page.ts, línea 42), y se destruye al salir de la pantalla. El catálogo del lado izquierdo se toma de inventory-by-branch, la única consulta que devuelve el stock y el precio de la sucursal de la sesión.

El computed productos (sales.page.ts, líneas 124 a 163) filtra el inventario por la búsqueda global y por el texto del escaneo, y convierte cada InventoryItem en un SalesProduct. El precio sale de precioSucursal cuando existe, y de precioBase en caso contrario; hasSucursalPrice marca la insignia Sucursal de la tarjeta. Un effect observa authFacade.sucursalId y pide el inventario cuando el dato llega (sales.page.ts, líneas 86 a 94), también en el arranque (sales.page.ts, líneas 97 a 107). El campo de escaneo se resuelve en onBarcodeKeyDown contra la lista local (sales.page.ts, líneas 173 a 197). Un código sin coincidencia o un producto con cero existencias produce un aviso; una coincidencia agrega el artículo y limpia el campo, sin otra consulta al API.

Ilustración 30. Pantalla de venta con una venta en curso. Captura de la pantalla de venta. La captura debe mostrar el slider de categorías, el campo "Escanear código de barras...", la cuadrícula de productos, el panel del carrito con dos o tres artículos y sus controles de cantidad, el resumen de importes, un método de pago seleccionado y el botón Procesar transacción habilitado. Dos recuadros deben señalar el campo de escaneo y el botón Procesar transacción.

SalesCartService concentra las operaciones del carrito y deriva los importes en cada cambio.

```
  private readonly _cart = signal<SalesCartItem[]>([]);
  private readonly _selectedPayment = signal<SalesPaymentMethod | null>(null);
  private readonly _descuento = signal(0);
  readonly cart = this._cart.asReadonly();
  readonly selectedPayment = this._selectedPayment.asReadonly();
  readonly descuento = this._descuento.asReadonly();

  readonly order = computed(() => {
    const o = new Order();
    o.setDiscount(this.descuento());
    this.cart().forEach(item =>
      o.addItem({ productId: item.productId, price: item.precio, quantity: item.qty })
    );
    return o;
  });

  readonly subtotal = computed(() => this.order().subtotal.value);
  readonly iva = computed(() => this.order().iva.value);
  readonly total = computed(() => this.order().total.value);
```

Ilustración 31. Estado del carrito y totales derivados. Archivo src/app/features/sales/presentation/state/sales-cart.service.ts, líneas 17 a 35. Recorte de VS Code, tema claro, con numeración de línea. La captura debe mostrar las señales _cart, _selectedPayment y _descuento, sus versiones de solo lectura, el computed order con setDiscount y addItem, y los computed subtotal, iva y total.

El computed order construye una entidad Order del dominio en cada cambio del carrito. Order aplica la tasa de IVA de 0.16, topa la suma de una partida en 999 unidades y rechaza un descuento negativo (order.entity.ts, líneas 28, 54 a 57 y 59 a 68). Los computed subtotal, iva y total leen los valores de esa entidad, así que la vista no repite ninguna fórmula. La página publica esas señales (sales.page.ts, líneas 165 a 171) y la plantilla las pasa al panel del carrito (sales.page.html, líneas 48 a 63). addToCart descarta un producto sin stock, incrementa una partida existente y detiene el incremento al llegar a las existencias disponibles (sales-cart.service.ts, líneas 37 a 65). decreaseQty no baja de uno y removeItem filtra por productId con el mismo patrón de actualización sobre la señal.

confirmSale exige carrito con artículos y método de pago antes de llamar al caso de uso. Cuando falta alguno devuelve un error con throwError, que la página convierte en aviso (sales-cart.service.ts, líneas 110 a 119). Con las dos condiciones cubiertas, arma la lista de productos con id y cantidad, llama a facade.createCompleteSale y, en el tap, vacía el carrito y recarga el listado de ventas (sales-cart.service.ts, líneas 121 a 136).

SalesFacade agrupa los casos de uso del módulo y publica el estado de cada carga. sales, saleDetails y paymentMethods son señales de solo lectura; isLoadingSales, isCreatingSale y paymentMethodsLoading siguen el avance de cada operación (sales.facade.ts, líneas 37 a 53). loadSales y loadPaymentMethods comparten el patrón: activan la bandera, capturan el error con catchError para dejarlo en errorMessage, cierran la bandera en finalize y escriben el resultado en la señal (sales.facade.ts, líneas 55 a 97). La página observa errorMessage con un effect y lo muestra en un toast. resolveErrorMessage da prioridad al mensaje de SalesDomainError y responde con un texto genérico cuando el error no trae mensaje (sales.facade.ts, líneas 154 a 164).

createCompleteSale mantiene la bandera isCreatingSale activa mientras el caso de uso trabaja.

```
  createCompleteSale(payload: CreateCompleteSalePayload) {
    this._isCreatingSale.set(true);
    return this.createCompleteSaleUseCase.execute(payload).pipe(
      finalize(() => {
        this._isCreatingSale.set(false);
      })
    );
  }
```

Ilustración 32. La venta en curso en el facade. Archivo src/app/features/sales/application/facades/sales.facade.ts, líneas 108 a 115. Recorte de VS Code, tema claro, con numeración de línea. La captura debe mostrar isCreatingSale en true, la llamada a createCompleteSaleUseCase.execute y el finalize que restablece la bandera.

El caso de uso ejecuta la venta en dos etapas (create-complete-sale.usecase.ts, líneas 24 a 48). Primero valida el payload: al menos un producto y cada cantidad construida con Quantity.fromNumber. Después crea el encabezado con createSale, porque los detalles necesitan el id que devuelve el backend, y lanza las peticiones de detalle en paralelo con forkJoin. Si una falla, borra la venta creada y relanza el error original.

```
        return forkJoin(detailCalls).pipe(
          catchError((error: unknown) => {
            this.logger.error('Detalle falló, rollback venta', {
              saleId: createdSaleId,
              error,
            });

            if (createdSaleId != null) {
              return this.saleRepository.deleteSale(createdSaleId).pipe(
                catchError((rollbackError: unknown) => {
                  this.logger.error('Rollback falló', {
                    saleId: createdSaleId,
                    rollbackError,
                  });

                  return throwError(() => error);
                }),
                concatMap(() => throwError(() => error))
              );
            }

            return throwError(() => error);
          }),
```

Ilustración 33. Reversa de la venta cuando falla un detalle. Archivo src/app/features/sales/application/usecase/create-complete-sale.usecase.ts, líneas 48 a 70. Recorte de VS Code, tema claro, con numeración de línea. La captura debe mostrar forkJoin sobre detailCalls, el catchError con el registro del error, la llamada deleteSale(createdSaleId), el catchError interno para el caso de que también falle el borrado y el relanzamiento del error.

Cuando todos los detalles quedan registrados, el caso de uso pide el ticket con getSaleTicket y devuelve la venta y el comprobante juntos (create-complete-sale.usecase.ts, líneas 71 a 78).

processTransaction en la página revisa el estado del carrito antes de enviar la venta.

```
  processTransaction(): void {
    // Guardia in-flight: si ya hay una transacción en curso se ignora (evita doble POST).
    if (this.isCreatingSale()) return;

    // Validación fresca contra stock actual de mi-sucursal (evita POST si el stock cambió desde que se agregó al carrito)
    const freshStockById = new Map<number, number>(
      this.inventoryByBranchFacade.allItems().map((it) => [it.idProducto, it.cantidad]),
    );
    for (const item of this.cartService.cart()) {
      const freshStock = freshStockById.get(item.productId);
      if (freshStock === undefined) {
        this.toastService.error(`"${item.nombre}" ya no está disponible en tu sucursal. Recarga el catálogo.`);
        this.inventoryByBranchFacade.loadMyBranchInventory();
        return;
      }
      if (item.qty > freshStock) {
        this.toastService.error(
          `Stock insuficiente para "${item.nombre}": solicitas ${item.qty}, disponible ${freshStock}.`,
        );
        return;
      }
    }
```

Ilustración 34. Validación de existencias antes de enviar la venta. Archivo src/app/features/sales/presentation/pages/sales/sales.page.ts, líneas 229 a 250. Recorte de VS Code, tema claro, con numeración de línea. La captura debe mostrar la guardia isCreatingSale, el mapa freshStockById, el recorrido del carrito y los dos avisos de error.

La guardia sobre isCreatingSale evita el doble POST (sales.page.ts, líneas 229 a 231). El recorrido del carrito compara cada partida con el stock actual de la sucursal, y un producto desaparecido o con existencias insuficientes detiene el envío con el detalle del faltante (sales.page.ts, líneas 233 a 250). El botón del panel permanece deshabilitado mientras el carrito está vacío o no hay método de pago (sales.page.ts, líneas 56 a 58). Con los controles superados, la suscripción a confirmSale recarga el inventario, guarda el ticket en lastTicket y en la versión de escritorio llama al puente window.desktop.generateTicket (sales.page.ts, líneas 252 a 285). El modal se dibuja cuando lastTicket tiene valor (sales.page.html, líneas 65 a 67). Ante un error muestra el aviso y recarga el inventario solo si el mensaje menciona stock, con isNotFoundError para excluir el 404 (sales.page.ts, líneas 286 a 297 y 307 a 316).

Ilustración 35. Comprobación en el navegador. Recorte de Network con las peticiones de una venta en orden: POST /ventas/, los POST /detalleventa/, uno por producto, y GET /ventas/{id}/ticket/. El id de la venta en las rutas de detalle y del ticket debe coincidir con el que devolvió la primera respuesta. Recorte del aviso "Venta registrada correctamente.", del carrito vacío y del stock descontado en el catálogo. Se tapa el valor del token de autorización.

En el navegador, una venta produce el alta del encabezado, el alta de cada detalle y la lectura del ticket. El carrito queda vacío y el inventario de la sucursal se pide de nuevo, así que las existencias del catálogo reflejan la venta.

## 6. Borrador para revisión: 4.1.6.4 Inventario por sucursal

Texto redactado con la skill humanizer y verificado contra los archivos el 17 de octubre de 2026. Las ilustraciones continúan la numeración desde la 36.

---

4.1.6.4 Inventario por sucursal

La pantalla de inventario se arma en src/app/features/inventory-by-branch/presentation/pages/inventory-page. Muestra el catálogo de la sucursal de la sesión y la lista de movimientos recientes. La sucursal se lee de AuthFacade; cuando el usuario no tiene ninguna asignada, la plantilla dibuja el aviso "Tu usuario no tiene sucursal asignada." y no se lanza ninguna consulta. ngOnInit pide las dos fuentes: el inventario con loadMyBranchInventory y los movimientos con loadMovements (inventory.page.ts, líneas 43 a 49).

Ilustración 36. Pantalla de inventario por sucursal. Captura de la pantalla de inventario con datos de una sucursal. La captura debe mostrar el título "Inventario por Sucursal", el botón Registrar Movimiento, la tabla con las columnas Producto, Clave, Marca, Código de Barras, Stock, Precio y Acciones, y el panel Movimientos recientes. Dos recuadros deben señalar una insignia de stock en color de umbral y el botón Movimiento de una fila.

Cada fila de la tabla ofrece el botón Movimiento. onRegisterMovement comprueba que exista un inventario seleccionado y abre MovementFormDialogComponent con el identificador del inventario y los datos de la fila: idProducto, nombre y existencias (inventory.page.ts, líneas 51 a 65). El botón Registrar Movimiento de la cabecera abre el mismo diálogo desde onAddMovement (inventory.page.ts, líneas 88 a 99), sin idProducto en data, así que el operador teclea el identificador del producto.

```
  ngOnInit(): void {
    const sucursalId = this.authFacade.sucursalId();
    if (sucursalId) {
      this.inventoryFacade.loadMyBranchInventory();
      this.inventoryFacade.loadMovements();
    }
  }

  onRegisterMovement(item: InventoryItem): void {
    const inventario = this.inventoryFacade.selectedInventory();
    if (!inventario) {
      this.toastService.error('No hay inventario seleccionado');
      return;
    }

    const dialogRef = this.dialog.open(MovementFormDialogComponent, {
      data: {
        idInventario: inventario.idInventario,
        idProducto: item.idProducto,
        productName: item.nombre,
        stock: item.cantidad,
      },
    });
```

Ilustración 37. Apertura del diálogo con los datos de la fila. Archivo src/app/features/inventory-by-branch/presentation/pages/inventory-page/inventory.page.ts, líneas 43 a 65. Recorte de VS Code, tema claro, con numeración de línea. La captura debe mostrar ngOnInit con loadMyBranchInventory y loadMovements, la guardia sobre selectedInventory y el bloque data del dialog.open con idInventario, idProducto, productName y stock.

El diálogo entrega el formulario por dialogRef.closed. La página descarta el valor nulo, que corresponde a Cancelar, y con un resultado arma el payload de registerMovement con un solo elemento en items. Si el alta termina bien, muestra el aviso "Movimiento registrado correctamente" y llama a refreshAll (inventory.page.ts, líneas 67 a 85). La rama de error queda vacía porque el facade ya escribió el mensaje en errorMessage, y un effect de la página lo convierte en toast (inventory.page.ts, líneas 34 a 41).

```
    dialogRef.closed.subscribe((result) => {
      if (!result) return;
      const formValue = result as { idInventario: number; tipoMovimiento: 'ENTRADA' | 'SALIDA'; idProducto: number; cantidad: number; razon: string; observaciones?: string; idProveedor?: number };

      this.inventoryFacade.registerMovement({
        idInventario: formValue.idInventario,
        tipoMovimiento: formValue.tipoMovimiento,
        razon: formValue.razon,
        observaciones: formValue.observaciones,
        idProveedor: formValue.idProveedor,
        items: [{ idProducto: formValue.idProducto, cantidad: formValue.cantidad }],
      }).subscribe({
        next: () => {
          this.toastService.success('Movimiento registrado correctamente');
          this.inventoryFacade.refreshAll();
        },
        error: () => {},
      });
    });
```

Ilustración 38. Registro del movimiento después de cerrar el diálogo. Archivo src/app/features/inventory-by-branch/presentation/pages/inventory-page/inventory.page.ts, líneas 67 a 85. Recorte de VS Code, tema claro, con numeración de línea. La captura debe mostrar la suscripción a dialogRef.closed, el retorno anticipado con !result, el payload con items de un elemento, el aviso de éxito y la llamada a refreshAll.

El facade concentra el estado de la pantalla: inventory, allItems, selectedInventory, movements, loading y errorMessage (inventory-by-branch.facade.ts, líneas 20 a 32). loadMyBranchInventory activa loading, limpia el error, captura la falla con catchError hacia resolveErrorMessage, apaga la bandera en finalize y en el subscribe aplana los detalles de cada inventario en allItems (inventory-by-branch.facade.ts, líneas 34 a 57). registerMovement sigue el mismo patrón y relanza el error con throw después de guardar el mensaje, para que la suscripción de la página también reciba la falla (inventory-by-branch.facade.ts, líneas 78 a 91). refreshAll llama a las dos cargas (inventory-by-branch.facade.ts, líneas 93 a 96). resolveErrorMessage prefiere el mensaje del backend cuando el error es HttpErrorResponse (inventory-by-branch.facade.ts, líneas 102 a 113).

```
  registerMovement(payload: RegisterMovementPayload): Observable<unknown> {
    this._loading.set(true);
    this._errorMessage.set(null);

    return this.registerMovementUseCase.execute(payload).pipe(
      catchError((error: unknown) => {
        const message = this.resolveErrorMessage(error);
        this._errorMessage.set(message);
        this.logger.error('Failed to register movement', { message, payload });
        throw error;
      }),
      finalize(() => this._loading.set(false)),
    );
  }
```

Ilustración 39. Alta del movimiento en el facade. Archivo src/app/features/inventory-by-branch/application/facades/inventory-by-branch.facade.ts, líneas 78 a 91. Recorte de VS Code, tema claro, con numeración de línea. La captura debe mostrar loading en true, el catchError con resolveErrorMessage y el throw, y el finalize que apaga la bandera.

La tabla es un componente de presentación. inventory-table.component.ts declara items como input.required, loading como input y registerMovement como output (inventory-table.component.ts, líneas 14 a 18). La pantalla pasa allItems y loading a la tabla y recoge registerMovement (inventory.page.html, líneas 35 a 39). La plantilla dibuja siete columnas: Producto, Clave, Marca, Código de Barras, Stock, Precio y Acciones. La celda de existencias usa una insignia con dos umbrales: clase low en cantidades de cinco o menos y clase medium entre seis y quince (inventory-table.component.html, líneas 29 a 33). El precio se formatea con el pipe number en 1.2-2 y la insignia Sucursal aparece cuando precioSucursal no es nulo (inventory-table.component.html, líneas 34 a 39). Mientras loading está activo se dibuja un esqueleto de siete celdas por fila, y con la lista vacía aparece el texto "No hay productos en el inventario de esta sucursal." (inventory-table.component.html, líneas 51 a 72).

```
        <td class="numeric">
          <span class="stock-badge" [class.low]="item.cantidad <= 5" [class.medium]="item.cantidad > 5 && item.cantidad <= 15">
            {{ item.cantidad }}
          </span>
        </td>
        <td class="numeric">
          <div class="price-cell">
            <span class="price-value">{{ item.precioVenta | number:'1.2-2' }}</span>
            <span class="price-sucursal-badge" *ngIf="item.precioSucursal !== null">Sucursal</span>
          </div>
        </td>
```

Ilustración 40. Existencias y precio en la tabla. Archivo src/app/features/inventory-by-branch/presentation/components/inventory-table/inventory-table.component.html, líneas 29 a 39. Recorte de VS Code, tema claro, con numeración de línea. La captura debe mostrar el stock-badge con las clases low y medium, el pipe number:'1.2-2' y el price-sucursal-badge.

El formulario del diálogo se construye con FormBuilder. tipoMovimiento, idProducto, cantidad y razon son requeridos; idProducto y cantidad exigen mínimo 1 y razon una longitud mínima de tres caracteres; observaciones e idProveedor quedan opcionales (movement-form-dialog.component.ts, líneas 52 a 61). El tipo arranca en Entrada. Cuando el diálogo recibe idProducto en data, el campo se dibuja de solo lectura con el nombre del producto visible, y con el tipo Salida aparece la pista Stock actual (movement-form-dialog.component.html, líneas 30 a 40). El botón de envío permanece deshabilitado mientras el formulario es inválido (movement-form-dialog.component.html, línea 82). onSubmit marca los campos como tocados cuando hay errores y, con el formulario válido, cierra el diálogo con los valores capturados (movement-form-dialog.component.ts, líneas 67 a 83). onCancel cierra con null (movement-form-dialog.component.ts, línea 86).

```
  onSubmit(): void {
    if (this.movementForm.invalid) {
      this.movementForm.markAllAsTouched();
      return;
    }

    const value = this.movementForm.value;
    this.dialogRef.close({
      idInventario: this.data.idInventario,
      tipoMovimiento: value.tipoMovimiento,
      idProducto: value.idProducto,
      cantidad: value.cantidad,
      razon: value.razon,
      observaciones: value.observaciones || undefined,
      idProveedor: value.idProveedor || undefined,
    });
  }
```

Ilustración 41. Validación y cierre del formulario de movimiento. Archivo src/app/features/inventory-by-branch/presentation/components/movement-form-dialog/movement-form-dialog.component.ts, líneas 67 a 83. Recorte de VS Code, tema claro, con numeración de línea. La captura debe mostrar la revisión de invalid con markAllAsTouched, el cierre con dialogRef.close y los campos idInventario, tipoMovimiento, idProducto y cantidad.

Ilustración 42. Diálogo de movimiento abierto. Captura del diálogo sobre la pantalla de inventario. La captura debe mostrar el Tipo de Movimiento en Salida, el campo Producto con el nombre debajo y sin edición, la pista Stock actual, Cantidad, Razón, Observaciones y los botones Cancelar y Registrar Movimiento. Un recuadro debe señalar la pista Stock actual. La captura se toma abriendo el diálogo desde el botón Movimiento de una fila y con el tipo Salida seleccionado; desde el botón de la cabecera la pista de stock no aparece porque data no lleva existencias.

Las consultas salen del feature. El catálogo llega de GET /inventarios/mi-sucursal/ y el repositorio acepta tres formas de respuesta: arreglo directo, objeto con results paginados o un solo inventario con la lista detalles (inventory-repository.impl.ts, líneas 20 a 38). Los movimientos se leen de GET /movimientos-inventario/ y el alta viaja por POST /detalles-inventario/bulk/ con el payload traducido a snake case por MovementMapper (movement-repository.impl.ts, líneas 16 a 28; movement.mapper.ts, líneas 16 a 28).

Ilustración 43. Comprobación en el navegador. Recorte de Network con GET /inventarios/mi-sucursal/ y GET /movimientos-inventario/ al entrar a la pantalla, y con POST /detalles-inventario/bulk/ al registrar una entrada. Recorte del aviso "Movimiento registrado correctamente", del stock aumentado en la fila del producto y del movimiento de entrada en el panel Movimientos recientes. Se tapa el valor del token de autorización.

## 7. Borrador para revisión: 4.1.6.5 Autenticación y control por rol

Texto redactado con la skill humanizer y verificado contra los archivos el 17 de octubre de 2026. Las ilustraciones continúan la numeración desde la 44.

---

4.1.6.5 Autenticación y control por rol

El acceso al sistema se arma en src/app/features/auth/presentation/pages/login. La pantalla divide el ancho en dos columnas: la izquierda lleva el logo, el título "Acceso al Sistema" y el formulario; la derecha muestra una fotografía de la refaccionaria (login.page.html, líneas 1 a 51). El formulario tiene dos campos, Usuario y Contraseña, con Validators.required sobre un grupo no nulo (login.page.ts, líneas 41 a 44). Cada campo muestra su mensaje de error cuando está tocado e inválido (login.page.html, líneas 18 a 19 y 29 a 30). El botón Ingresar se deshabilita mientras el formulario está incompleto o hay una petición en curso, y cambia el texto a "Ingresando..." durante el envío (login.page.ts, líneas 46 a 48; login.page.html, líneas 34 a 42). Los errores devueltos por el servidor no se pintan en el formulario: un effect observa errorMessage del facade y lo envía al servicio de avisos (login.page.ts, líneas 32 a 39).

Ilustración 44. Pantalla de acceso al sistema. Captura del navegador en la ruta /login. La captura debe mostrar el logo, el título "Acceso al Sistema" y los campos Usuario y Contraseña sobre la columna izquierda, con la fotografía en la derecha. Dos recuadros deben señalar el botón Ingresar deshabilitado y el mensaje "La contraseña es requerida" bajo el campo tocado.

onSubmit revisa el formulario antes de llamar al API. Si hay errores, marca los controles como tocados y corta el envío. Con los datos válidos toma los valores crudos, llama a AuthFacade.login y espera un booleano. Un true significa que la sesión quedó guardada; entonces lee el parámetro redirectTo de la URL y vuelve a esa ruta, o entra a la pantalla de venta cuando el parámetro no existe (login.page.ts, líneas 50 a 66). La suscripción se cierra con takeUntilDestroyed para no dejar observadores vivos al abandonar la página (login.page.ts, líneas 26 y 59).

```
  readonly loginForm = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  get submitDisabled(): boolean {
    return this.loading() || this.loginForm.invalid;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const credentials = this.loginForm.getRawValue();
    this.authFacade
      .login(credentials)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isSuccess) => {
        if (isSuccess) {
          const redirectTo = this.route.snapshot.queryParams['redirectTo'];
          this.router.navigateByUrl(redirectTo ?? `/${AppRoutes.sales}`);
        }
      });
  }
```

Ilustración 45. Envío del formulario de acceso. Archivo src/app/features/auth/presentation/pages/login/login.page.ts, líneas 41 a 66. Recorte de VS Code, tema claro, con numeración de línea. La captura debe mostrar el grupo no nulo con los dos validadores, la propiedad submitDisabled, la llamada a authFacade.login y navigateByUrl con redirectTo y AppRoutes.sales.

AuthFacade.login enciende loading, limpia el mensaje anterior y convierte el resultado del caso de uso en un booleano para la página (auth.facade.ts, líneas 34 a 50). Las fallas pasan por resolveErrorMessage, que traduce InvalidCredentialsError a "Credenciales inválidas" y NetworkAuthError a "Error de red. Verifica tu conexión." (auth.facade.ts, líneas 79 a 94). LoginUseCase guarda la sesión en SessionStateService con persist activo y el indicador remember del comando; el servicio escribe en el almacenamiento en memoria de la jornada y solo usa localStorage cuando remember es verdadero (login.usecase.ts, líneas 15 a 28; session-state.service.ts, líneas 67 a 93). El repositorio arma el POST a /login con el contexto withoutTrailingSlash, porque Django define esa ruta sin diagonal final, y traduce el estado 401 a InvalidCredentialsError y el estado 0 a NetworkAuthError (auth-repository.impl.ts, líneas 32 a 51 y 70 a 77).

La sesión guarda el rol como UserRole, un enum con los valores admin, seller y manager (auth-user-role.enum.ts, líneas 1 a 5). SessionStateService deriva role de la sesión y AuthFacade lo publica junto con username, isAuthenticated y sucursalId (session-state.service.ts, líneas 33 a 36; auth.facade.ts, líneas 29 a 32). El shell recibe el rol por el token SHELL_USER_ROLE, registrado en app.config.ts con una fábrica que convierte el valor del enum a texto (app.config.ts, líneas 207 a 215). ShellFacade filtra el menú lateral con filterSidebarItems: los elementos sin lista de roles se muestran siempre y los demás exigen un rol presente en la lista (shell.facade.ts, líneas 38 a 41; sidebar-filter.utils.ts, líneas 4 a 14). En los datos del menú, Sucursales y Precios por Sucursal quedan solo para admin, e Inventario Sucursal para admin y manager (sidebar-menu.defaults.ts, líneas 40 a 53 y 61 a 67). El layout principal pasa la lista filtrada al componente sidebar, que dibuja una entrada por elemento recibido (main-layout.component.ts, línea 26; sidebar.component.html, líneas 8 a 27).

```
export function filterSidebarItems(
  items: readonly SidebarNavItem[],
  userRole: ShellRole | null
): SidebarNavItem[] {
  return items.filter((item) => {
    if (!item.roles || item.roles.length === 0) {
      return true;
    }
    return userRole !== null && item.roles.includes(userRole);
  });
}
```

Ilustración 46. Filtro del menú lateral por rol. Archivo src/app/shell/utils/sidebar-filter.utils.ts, líneas 4 a 14. Recorte de VS Code, tema claro, con numeración de línea. La captura debe mostrar la función filterSidebarItems, el caso sin lista de roles que devuelve true y la comparación userRole !== null && item.roles.includes(userRole).

Ilustración 47. Menú lateral con dos roles distintos. Dos capturas de la misma pantalla, una por sesión. La captura con rol admin debe mostrar las entradas Sucursales y Precios por Sucursal en el menú. La captura con rol seller debe mostrar el mismo menú sin Sucursales, sin Precios por Sucursal y sin Inventario Sucursal. Un recuadro en cada captura debe señalar la zona donde aparecen y desaparecen esas entradas.

Ilustración 48. Comprobación en el navegador. Recorte de Network con el POST a /login, sin diagonal final, seguido de las peticiones de la pantalla de venta. Recorte del aviso "Credenciales inválidas" de una corrida con contraseña incorrecta. Recorte del menú lateral en las sesiones de admin y seller. Se tapa el valor del token de autorización y el cuerpo de la respuesta de acceso.

En el navegador, un acceso correcto envía el POST al API y entra a la pantalla de venta. La petición viaja sin diagonal final porque el backend la define así. Una contraseña incorrecta responde 401 y deja el aviso "Credenciales inválidas" sobre el formulario. El menú lateral se arma con las entradas que corresponden al rol de la sesión; las restringidas al administrador no llegan a la lista de un vendedor.
