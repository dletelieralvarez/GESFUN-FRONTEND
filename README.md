# GESFUN Frontend

Frontend de GESFUN, una aplicacion web para gestion funeraria desarrollada con Angular 16 y Bootstrap 5. El proyecto implementa una interfaz administrativa con modulos de operacion, comercial, administracion, recursos y finanzas, conectada al BFF/API con datos reales y autenticacion Microsoft Entra ID mediante MSAL.

## 1. Objetivo del proyecto

El objetivo es entregar una version funcional del frontend para una funeraria, con pantallas navegables, layout administrativo, componentes reutilizables, autenticacion integrada y consumo real de backend mediante BFF/API.

La aplicacion permite revisar y operar sobre:

- Servicios funerarios y casos activos.
- Agenda de servicios con reserva de recursos por sucursal.
- Catalogo de planes y servicios adicionales.
- Dashboard operativo con datos reales de cotizaciones, agenda e inventario consumidos desde el BFF.
- Notificaciones operativas en la barra superior para alertas de pagos, DTE y cotizaciones.
- Cotizaciones persistidas mediante el BFF, con datos de pagador, fallecido, plan, adicionales, forma de pago y calculo de totales.
- Consulta de cotizaciones creadas, cambio de estado y reimpresion de documentos.
- Busqueda superior conectada al listado de cotizaciones por numero, cliente, fallecido, plan o estado.
- Generacion de PDF comercial y contrato asociado a la cotizacion.
- Clientes o terceros.
- Usuarios del sistema.
- Sucursales.
- Inventario con consulta de stock por sucursal y registro de entradas con detalle de productos mediante el BFF.
- Facturacion.
- Login con Microsoft Entra ID y prueba de acceso a un endpoint protegido del BFF.

## 2. Tecnologias utilizadas

- Angular 16.
- TypeScript.
- Bootstrap 5.3.
- Bootstrap Icons mediante clases `bi`.
- RxJS.
- Angular Forms.
- Angular Router.
- Angular HttpClient.
- MSAL Angular.
- MSAL Browser.
- jsPDF y jsPDF AutoTable para documentos comerciales.
- Karma/Jasmine para pruebas base generadas por Angular.

## 3. Instalacion del proyecto

### Paso 1: clonar o abrir el proyecto

Abrir la carpeta del proyecto:

```bash
gesfun-frontend
```

### Paso 2: instalar dependencias

```bash
npm install
```

Esto instala Angular, Bootstrap, MSAL y las dependencias de desarrollo definidas en `package.json`.

### Paso 3: ejecutar en desarrollo

```bash
npm run start
```

El comando levanta Angular con `ng serve`. Por defecto, la aplicacion queda disponible en:

```bash
http://localhost:4200
```

### Paso 4: compilar para produccion

```bash
npm run build
```

El resultado se genera en:

```bash
dist/gesfun-frontend
```

### Paso 5: ejecutar pruebas

```bash
npm run test
```

Este comando usa Karma y Jasmine con la configuracion base del proyecto Angular.

## 4. Estructura general

```text
src/
  app/
    data/
      models.ts
      ui-data.ts
    interceptors/
      auth.interceptor.ts
    layout/
      sidebar/
      topbar/
    pages/
      agenda/
      auth-callback/
      casos/
      catalogo/
      clientes/
      cotizacion/
      cotizaciones/
      dashboard/
      empleados/
      facturacion/
      inventario/
      login/
      planes/
      productos-servicios/
      proveedores/
      recursos/
      sucursales/
      usuarios/
    services/
      auth.service.ts
      cotizacion-pdf.service.ts
    ui/
      ui.module.ts
    app-routing.module.ts
    app.module.ts
    auth-config.ts
  styles.css
```

## 5. Paso a paso de lo implementado

### 5.1 Creacion base Angular

Se configuro una aplicacion Angular con:

- `AppModule` como modulo principal.
- `AppRoutingModule` para navegacion.
- `AppComponent` como componente raiz.
- Soporte para `FormsModule`, `HttpClientModule` y componentes declarados localmente.

### 5.2 Configuracion de Bootstrap

En `angular.json` se agregaron:

- `node_modules/bootstrap/dist/css/bootstrap.min.css`.
- `node_modules/bootstrap/dist/js/bootstrap.bundle.min.js`.
- `src/styles.css` como archivo de estilos globales.

Esto permite usar clases Bootstrap, grillas, tablas, cards, botones, badges, formularios, offcanvas y utilidades visuales en toda la aplicacion.

### 5.3 Tema visual de la aplicacion

En `src/styles.css` se definio un tema sobrio para "Funeraria El Sauce", basado en Bootstrap:

- Variables de marca en tonos verdes.
- Overrides de colores primarios de Bootstrap.
- Estilos de botones.
- Estilos de cards.
- Estilos de tablas.
- Badges de estado.
- Layout de sidebar y topbar.
- Contenedor principal con scroll.
- Componentes visuales para KPI, agenda, timeline y avatars.

El resultado es una interfaz administrativa densa, limpia y orientada a trabajo operativo.

### 5.4 Layout principal

Se implemento un layout tipo panel administrativo:

- `SidebarComponent`: menu lateral con grupos de navegacion.
- `TopbarComponent`: barra superior con titulo y breadcrumb segun la ruta actual.
- `AppComponent`: decide si muestra el layout completo o solo la pagina actual.
- El badge del item `Servicios` en el sidebar se calcula desde `GET /api/servicios`, contando servicios activos no completados ni anulados.

El layout se oculta en rutas de autenticacion como:

- `/login`
- `/auth/callback`

Esto permite que el login se vea como una pantalla independiente.

### 5.5 Navegacion y rutas

En `src/app/app-routing.module.ts` se configuraron las rutas principales:

| Ruta | Componente | Descripcion |
| --- | --- | --- |
| `/` | Redireccion | Redirige a `/login` |
| `/login` | `LoginComponent` | Pantalla de autenticacion |
| `/dashboard` | `DashboardComponent` | Panel general |
| `/casos` | `CasosComponent` | Servicios funerarios |
| `/agenda` | `AgendaComponent` | Agenda de servicios y reserva de recursos |
| `/catalogo` | `CatalogoComponent` | Catalogo y planes |
| `/cotizacion` | `CotizacionComponent` | Nueva cotizacion |
| `/cotizaciones` | `CotizacionesComponent` | Consulta y gestion de cotizaciones creadas |
| `/clientes` | `ClientesComponent` | Clientes/terceros |
| `/usuarios` | `UsuariosComponent` | Administracion de usuarios |
| `/empleados` | `EmpleadosComponent` | Administracion de empleados |
| `/proveedores` | `ProveedoresComponent` | Administracion de proveedores |
| `/productos-servicios` | `ProductosServiciosComponent` | Administracion de productos y servicios |
| `/planes` | `PlanesComponent` | Administracion de planes armables |
| `/documentacion` | `DocumentacionComponent` | Administracion de tipos de documento |
| `/recursos` | `RecursosComponent` | Administracion de tipos de recurso |
| `/sucursales` | `SucursalesComponent` | Administracion de sucursales |
| `/inventario` | `InventarioComponent` | Inventario, stock por sucursal y registro de entradas |
| `/facturacion` | `FacturacionComponent` | Facturacion |
| `**` | Redireccion | Redirige a `/login` |

Cada ruta incluye metadata como `title` y `crumb`, usada por el `TopbarComponent`.

### 5.6 Modelos y datos de interfaz

Se creo una capa local de datos en `src/app/data/`.

`models.ts` define interfaces del dominio:

- `Tercero`
- `Empresa`
- `Sucursal`
- `SuscripcionPlan`
- `ProductoServicio`
- `Usuario`
- `MotivoFallecimiento`
- `FormaPago`
- `EstadoCotizacion`
- `TipoMovimiento`
- `UnidadMedida`
- `Region`
- `Comuna`
- `Servicio`
- `Factura`
- `Cotizacion`
- `InventarioProducto`

`ui-data.ts` contiene solo utilidades y datos de interfaz que no representan informacion de negocio:

- Formateador de moneda `CLP`.
- Colores e iniciales para avatar.
- Navegacion del sidebar.
- Clases visuales de estados y agenda.

Las pantallas operativas no inicializan informacion de negocio desde archivos mock. Los planes, productos/servicios, terceros, comunas, regiones, sucursales, agenda, inventario, cotizaciones, pagos y facturacion se consultan desde el BFF. Si un endpoint no responde, la pantalla muestra el estado vacio o el mensaje de error correspondiente en vez de mezclar datos falsos con datos reales.

## 6. Modulos y pantallas implementadas

### 6.1 Login

Ubicacion:

```text
src/app/pages/login/
```

Funcionalidad:

- Boton de login usando `AuthService`.
- Boton de logout.
- Manejo de estado `loading`.
- Manejo de errores.
- Redireccion automatica a `/dashboard` cuando MSAL detecta una cuenta activa.

El login usa MSAL y Microsoft Entra ID para autenticar al usuario con flujo redirect.

### 6.2 Dashboard

Ubicacion:

```text
src/app/pages/dashboard/
```

Funcionalidad:

- Carga sucursales activas desde el BFF.
- Permite seleccionar la sucursal operativa del panel.
- Lista cotizaciones recientes reales desde `GET /api/cotizaciones`.
- Calcula cotizaciones activas y pendientes segun el estado entregado por backend.
- Calcula reservas del dia desde la agenda real de la sucursal.
- Calcula ingresos cotizados del mes con montos reales de cotizaciones.
- Consulta stock por sucursal desde inventario y destaca productos sin stock o con stock bajo.
- Muestra agenda de hoy, cotizaciones recientes e inventario con alerta.
- Informa errores de conexion con el BFF y conserva el panel util cuando fallan datos opcionales.

Endpoints consumidos:

```text
GET /api/sucursales
GET /api/cotizaciones
GET /api/agendas/sucursal/{sucursalUuid}
GET /api/inventario/stock?sucursalUuid={uuid}
```

### 6.3 Servicios funerarios

Ubicacion:

```text
src/app/pages/casos/
```

Funcionalidad:

- Lista servicios/casos funerarios reales desde el BFF.
- Representa el seguimiento operativo de un caso real, distinto al catalogo comercial de productos y servicios.
- Muestra folio, fallecido, familiar responsable, cotizacion asociada, plan, sala, estado y saldo pendiente.
- El folio del servicio se genera automaticamente en el frontend y se muestra como solo lectura.
- Permite filtrar por estado usando tabs:
  - Todas.
  - En curso.
  - Programado.
  - Pendiente.
  - Completado.
  - Anulado.
- Permite crear servicios funerarios mediante `POST /api/servicios`.
- Permite editar servicios funerarios mediante `PUT /api/servicios/{uuid}`.
- Permite desactivar/anular servicios mediante `PATCH /api/servicios/{uuid}/desactivar`.
- La creacion se realiza desde una cotizacion existente.
- Las cotizaciones que ya tienen agenda con horarios programados no quedan disponibles para crear un nuevo servicio.
- El formulario no vuelve a pedir pagador, fallecido, plan, motivo, encargado ni montos, porque esos datos pertenecen a la cotizacion.
- El frontend deriva desde la cotizacion seleccionada los datos obligatorios que exige actualmente el backend:
  - `terceroUuid`
  - `sucursalUuid`
  - `fallecidoNombre`
  - `fallecidoRut`
  - `montoTotal`
- Permite asociar una agenda/sala reservada de forma opcional.
- La fecha de ingreso no se pide visualmente: se completa automaticamente al guardar.
- La fecha de termino no se pide visualmente y se envia como `null`.
- Permite registrar fecha y hora de velatorio y ceremonia.
- Registra observacion y destino como datos operativos del servicio.
- El estado no es editable por el usuario:
  - Sin agenda, velatorio ni ceremonia se guarda como `PENDIENTE`.
  - Con agenda, velatorio o ceremonia se guarda como `PROGRAMADO`.
  - En edicion conserva estados avanzados como `EN_CURSO`, `COMPLETADO` o `ANULADO`.
- Usa los estados validos del backend:
  - `PENDIENTE`
  - `PROGRAMADO`
  - `EN_CURSO`
  - `COMPLETADO`
  - `ANULADO`
- Calcula el saldo pendiente con los pagos reales de `/api/pagos` cuando existe cotizacion asociada; si no hay pagos cargados usa `saldoPendiente` o `montoTotal - montoPagado` como respaldo.
- Valida antes de guardar que la cotizacion seleccionada traiga cliente, sucursal, fallecido y monto total.
- Ya no usa datos mock ni almacenamiento local como respaldo cuando falla el endpoint.
- Formatea montos en pesos chilenos usando `CLP`.

Endpoints consumidos:

```text
GET   /api/servicios
POST  /api/servicios
PUT   /api/servicios/{uuid}
PATCH /api/servicios/{uuid}/desactivar
GET   /api/clientes
GET   /api/planes
GET   /api/sucursales
GET   /api/motivos-fallecimiento
GET   /api/usuarios
GET   /api/cotizaciones
GET   /api/agendas
GET   /api/pagos
```

### 6.4 Agenda de servicios

Ubicacion:

```text
src/app/pages/agenda/
```

Funcionalidad:

- Carga sucursales, tipos de recurso y cotizaciones desde el BFF.
- Consulta la agenda real por sucursal desde `GET /api/agendas/sucursal/{sucursalUuid}`.
- Permite reservar un recurso o servicio, por ejemplo una sala velatoria, capilla o salon ceremonial.
- Permite asociar opcionalmente una cotizacion al registro de agenda.
- Registra fecha y hora de inicio, fecha y hora de termino, estado y observacion.
- Envia al BFF el contrato esperado por `POST /api/agendas`:
  - `fechaHoraInicio`
  - `fechaHoraFin`
  - `estado`
  - `observacion`
  - `tipoRecursoUuid`
  - `sucursalUuid`
  - `cotizacionUuid`
- Limita los estados enviados a los valores aceptados por backend: `OCUPADO` y `DISPONIBLE`.
- Refresca la agenda despues de guardar correctamente.
- Muestra recursos disponibles u ocupados y eventos por recurso.
- Permite seleccionar fecha de inicio de vista.
- Permite alternar la visualizacion entre dia y semana.
- Muestra el rango de fechas reservado cuando un servicio ocupa mas de un dia.
- La grilla horaria se expande automaticamente segun los eventos visibles, por lo que tambien muestra reservas despues de las 21:00.
- Los eventos que cruzan medianoche se muestran hasta las 24:00 del dia visible para evitar bloques con altura incorrecta.
- Ya no usa datos mock como fallback cuando no hay sucursal o cuando el BFF no devuelve agenda.

Endpoints consumidos:

```text
GET  /api/sucursales
GET  /api/tipos-recurso
GET  /api/cotizaciones
GET  /api/agendas/sucursal/{sucursalUuid}
POST /api/agendas
```

### 6.5 Catalogo y planes

Ubicacion:

```text
src/app/pages/catalogo/
```

Funcionalidad:

- Lista planes funerarios activos desde el BFF.
- Lista servicios adicionales activos desde `GET /api/productos-servicios`.
- Consulta la composicion de cada plan desde `GET /api/plan-kit/plan/{planUuid}`.
- Calcula el valor mostrado del plan segun su kit cuando el BFF entrega detalle.
- Muestra precios formateados en pesos chilenos.
- No usa datos mock como respaldo.

Endpoints consumidos:

```text
GET /api/planes
GET /api/productos-servicios
GET /api/plan-kit/plan/{planUuid}
```

### 6.6 Cotizaciones

Ubicacion:

```text
src/app/pages/cotizacion/
```

Funcionalidad:

- Carga sucursales, planes, productos/servicios, formas de pago, motivos de fallecimiento y comunas desde el BFF.
- Registra los datos del cliente pagador, tanto persona natural como empresa.
- Al ingresar el RUT del pagador, verifica si ya existe como cliente o tercero y autocompleta sus datos.
- Acepta el RUT del pagador separado en RUT/DV o en formato completo, por ejemplo `12.345.678-9`.
- Si el RUT del pagador se ingresa sin DV, calcula el DV y busca el cliente existente al salir del campo.
- Cuando el pagador existe, conserva su `uuid`/`terceroUuid`; cuando es nuevo, envia sus datos con `rol: CLIENTE`.
- Registra los datos personales y antecedentes del fallecido.
- Permite seleccionar una sucursal y uno de sus planes activos.
- Carga automaticamente los productos y servicios incluidos en el kit del plan.
- Permite agregar productos o servicios adicionales y definir sus cantidades.
- Permite seleccionar forma de pago, fecha de emision y fecha de validez.
- Calcula subtotal, IVA al 19% para prestaciones afectas y total estimado.
- Genera la cotizacion mediante `POST /api/cotizaciones`.
- Envia al backend los UUID de sucursal, plan, forma de pago, motivo de fallecimiento, comuna y productos/servicios.
- Excluye las prestaciones inactivas que todavia permanezcan asociadas al kit de un plan y muestra una advertencia al usuario.
- Revalida el catalogo de productos y servicios inmediatamente antes de guardar para evitar enviar elementos desactivados mientras la pantalla estaba abierta.
- Genera automaticamente un PDF formal despues de guardar correctamente.
- El PDF utiliza la identidad visual de Funeraria El Sauce, incorpora logo, folio, datos de las personas, prestaciones, impuestos, total y observaciones.
- La generacion del documento usa `jsPDF` y `jsPDF AutoTable`.

Endpoints consumidos:

```text
GET  /api/sucursales
GET  /api/planes
GET  /api/plan-kit/plan/{planUuid}
GET  /api/productos-servicios
GET  /api/formas-pago
GET  /api/motivos-fallecimiento
GET  /api/comunas
GET  /api/clientes
GET  /api/terceros
POST /api/cotizaciones
```

El backend asigna el numero, el estado inicial y los totales definitivos de la cotizacion.

Contrato funcional con el BFF:

- El usuario autenticado por Microsoft Entra ID es un usuario interno del sistema y se crea con rol `USER`.
- El cliente pagador de una cotizacion es un tercero, no un usuario del sistema.
- El pagador enviado en `POST /api/cotizaciones` debe crearse o resolverse en backend como tercero con rol `CLIENTE`.
- El fallecido debe mantenerse separado del pagador y registrarse con el rol/modelo que corresponda a fallecidos.
- Si el BFF graba el pagador como `PAGADOR` en vez de `CLIENTE`, la facturacion puede fallar durante la salida de inventario porque inventario valida el rol del tercero responsable de la cotizacion.

### 6.7 Cotizaciones creadas

Ubicacion:

```text
src/app/pages/cotizaciones/
```

Funcionalidad:

- Lista las cotizaciones persistidas desde `GET /api/cotizaciones`.
- Permite buscar por numero, cliente, fallecido, plan o estado.
- Recibe busquedas desde la barra superior mediante `/cotizaciones?q=texto`.
- Muestra fecha, vigencia, plan, estado y total.
- Consulta el detalle mediante `GET /api/cotizaciones/{uuid}` antes de reimprimir.
- Permite volver a descargar el PDF de cotizacion.
- Carga los estados activos desde `GET /api/estados-cotizacion`.
- Actualiza el estado mediante `PATCH /api/cotizaciones/{uuid}/estado`.
- Muestra el estado real entregado por el backend, incluido el estado inicial `BORRADOR`.
- Al cambiar a `GEN_CONTR` genera un PDF titulado `Contrato de prestacion de servicios`.
- Permite administrar documentos de servicio asociados a cada cotizacion desde un panel expandible.
- Lista documentos por cotizacion mediante `GET /api/documentos-servicio/cotizacion/{cotizacionUuid}`.
- Crea documentos enviando `cotizacionUuid`, `usuarioUuid`, `tipoDocumentoUuid`, `estadoDocumento` y `observacion`.
- Permite actualizar parcialmente documentos con estado `PENDIENTE` o `REALIZADO`.
- Permite eliminar documentos asociados a la cotizacion.
- Carga tipos de documento desde `GET /api/tipos-documento` y resuelve el `usuarioUuid` interno desde `GET /api/usuarios` usando el email del usuario autenticado.
- El contrato incluye prestaciones, precio, condiciones y espacios para firma del cliente y del representante.
- `GEN_CONTR` es un estado terminal: la interfaz bloquea nuevos cambios y el backend aplica la misma regla.
- Una firma electronica avanzada verificable requiere integrar posteriormente un proveedor de firma y certificados.

Endpoints consumidos:

```text
GET   /api/cotizaciones
GET   /api/cotizaciones/{uuid}
GET   /api/estados-cotizacion
PATCH /api/cotizaciones/{uuid}/estado
GET   /api/tipos-documento
GET   /api/usuarios
GET   /api/documentos-servicio/cotizacion/{cotizacionUuid}
POST  /api/documentos-servicio
PUT   /api/documentos-servicio/{uuid}
DELETE /api/documentos-servicio/{uuid}
```

### 6.8 Clientes

Ubicacion:

```text
src/app/pages/clientes/
```

Funcionalidad:

- Lista clientes desde el BFF.
- Permite crear un nuevo cliente.
- Permite editar un cliente existente.
- Permite desactivar clientes mediante desactivacion logica.
- Mantiene el rol fijo como `Cliente`; no se puede cambiar desde el formulario.
- Valida campos minimos:
  - Nombre.
  - RUT.
  - DV.
  - Email.
  - Telefono.
- Formatea RUT con digito verificador.
- Permite seleccionar region.
- Muestra nombre de comuna desde el catalogo cargado desde el BFF.
- Diferencia entre persona natural y empresa.
- Muestra estado `Activo` o `Desactivado`.
- Bloquea la edicion de clientes desactivados.
- Usa confirmacion visual inline para desactivar, sin `alert` ni `confirm` nativo del navegador.
- Se conecta al BFF por endpoints especificos de clientes:
  - `GET /api/clientes`
  - `POST /api/clientes`
  - `PUT /api/clientes/{uuid}`
  - `PATCH /api/clientes/{uuid}/desactivar`
- El BFF reenvia al backend real y aplica el rol `CLIENTE`.

### 6.9 Empleados

Ubicacion:

```text
src/app/pages/empleados/
```

Funcionalidad:

- Lista empleados desde el BFF.
- Permite crear y editar empleados.
- Permite desactivar empleados mediante desactivacion logica.
- Mantiene el rol fijo como `Empleado`; no se puede seleccionar otro rol.
- Mantiene el tipo de persona fijo como `Persona natural`.
- Permite seleccionar region y comuna.
- Maneja datos generales como nombre, RUT, email, telefono y empresa.
- Muestra estado `Activo` o `Desactivado`.
- Bloquea la edicion de empleados desactivados.
- Usa confirmacion visual inline para desactivar, sin `alert` ni `confirm` nativo del navegador.
- Se conecta al BFF por endpoints especificos de empleados:
  - `GET /api/empleados`
  - `POST /api/empleados`
  - `PUT /api/empleados/{uuid}`
  - `PATCH /api/empleados/{uuid}/desactivar`
- El BFF reenvia al backend real y aplica el rol `EMPLEADO`.

### 6.10 Proveedores

Ubicacion:

```text
src/app/pages/proveedores/
```

Funcionalidad:

- Lista proveedores desde el BFF.
- Permite crear y editar proveedores.
- Permite desactivar proveedores mediante desactivacion logica.
- Mantiene el rol fijo como `Proveedor`; no se puede seleccionar otro rol.
- Permite seleccionar region y comuna.
- Maneja datos generales como razon social/nombre, RUT, email, telefono, empresa y tipo de persona.
- Permite elegir si el proveedor es empresa o persona natural.
- Muestra estado `Activo` o `Desactivado`.
- Bloquea la edicion de proveedores desactivados.
- Usa confirmacion visual inline para desactivar, sin `alert` ni `confirm` nativo del navegador.
- Se conecta al BFF por endpoints especificos de proveedores:
  - `GET /api/proveedores`
  - `POST /api/proveedores`
  - `PUT /api/proveedores/{uuid}`
  - `PATCH /api/proveedores/{uuid}/desactivar`
- El BFF reenvia al backend real y aplica el rol `PROVEEDOR`.

### 6.11 Productos Y Servicios

Ubicacion:

```text
src/app/pages/productos-servicios/
```

Funcionalidad:

- Administra el maestro `PRODUCTO_SERVICIO` desde el BFF.
- Permite crear y editar productos o servicios.
- Permite desactivar productos o servicios mediante desactivacion logica.
- Soporta ejemplos como ataudes, cirios, libro de condolencias, flores y servicios de cafeteria.
- Maneja tipo de item (`producto` o `servicio`), codigo, nombre, descripcion, precio, categoria visual, unidad de medida, empresa, estado activo y afecto.
- Sirve como catalogo base para armar planes.
- Carga catalogos auxiliares desde:
  - `GET /api/unidades-medida`
  - `GET /api/empresas`
- Se conecta al BFF por endpoints especificos de productos y servicios:
  - `GET /api/productos-servicios`
  - `POST /api/productos-servicios`
  - `PUT /api/productos-servicios/{uuid}`
  - `PATCH /api/productos-servicios/{uuid}/desactivar`
- Envia al BFF el contrato esperado:
  - `tipoItem`
  - `codigo`
  - `nombre`
  - `descripcion`
  - `precio`
  - `activo`
  - `afecto`
  - `unidadMedidaUuid`
  - `empresaUuid`
- Muestra los registros desactivados y bloquea su edicion.

### 6.12 Planes

Ubicacion:

```text
src/app/pages/planes/
```

Funcionalidad:

- Administra planes asociados a una sucursal desde el BFF.
- Permite crear y editar planes.
- Permite desactivar planes mediante desactivacion logica.
- Permite armar el plan seleccionando productos o servicios desde el catalogo del BFF.
- Permite definir cantidad por item.
- Calcula unitario y total por item.
- Calcula automaticamente el total del plan a partir del kit.
- Mantiene una estructura equivalente a `PLAN` y `PLAN_KIT` del modelo de datos.
- Carga catalogos auxiliares desde:
  - `GET /api/sucursales`
  - `GET /api/productos-servicios`
- Se conecta al BFF por endpoints especificos de planes:
  - `GET /api/planes`
  - `POST /api/planes`
  - `PUT /api/planes/{uuid}`
  - `PATCH /api/planes/{uuid}/desactivar`
- Sincroniza el kit del plan con:
  - `GET /api/plan-kit/plan/{planUuid}`
  - `POST /api/plan-kit`
  - `PUT /api/plan-kit/{uuid}`
  - `DELETE /api/plan-kit/{uuid}`
- Envia al BFF el contrato esperado para `PLAN`:
  - `nombre`
  - `descripcion`
  - `activo`
  - `sucursalUuid`
- Envia al BFF el contrato esperado para `PLAN_KIT`:
  - `cantidad`
  - `unitario`
  - `observacion`
  - `activo`
  - `productoServicioUuid`
  - `planUuid`
- Muestra los planes desactivados y bloquea su edicion.

### 6.12.1 Documentacion

Ubicacion:

```text
src/app/pages/documentacion/
```

Funcionalidad:

- Mantiene los tipos de documento que luego se asocian a una cotizacion desde `CotizacionesComponent`.
- Lista tipos de documento desde el BFF.
- Permite crear, editar y eliminar tipos de documento.
- Maneja codigo, nombre y estado activo.
- Se conecta al BFF por endpoints especificos de tipos de documento:
  - `GET /api/tipos-documento`
  - `POST /api/tipos-documento`
  - `PUT /api/tipos-documento/{uuid}`
  - `DELETE /api/tipos-documento/{uuid}`
- Envia al BFF el contrato esperado:
  - `codigo`
  - `nombre`
  - `activo`

### 6.13 Usuarios

Ubicacion:

```text
src/app/pages/usuarios/
```

Funcionalidad:

- Lista usuarios iniciales.
- Permite crear usuario.
- Permite editar usuario.
- Permite eliminar usuario con confirmacion.
- Genera UUID con `crypto.randomUUID()` cuando esta disponible.
- Maneja campos como email, nombre, apellidos, rol, tipo de usuario y estado activo.

Importante: estos cambios son locales en memoria.

### 6.14 Sucursales

Ubicacion:

```text
src/app/pages/sucursales/
```

Funcionalidad:

- Lista sucursales desde el BFF.
- Permite crear y editar sucursales.
- Permite desactivar sucursales mediante desactivacion logica.
- Maneja codigo, nombre, direccion, telefono, empresa, region, comuna y estado activo.
- Carga catalogos auxiliares desde:
  - `GET /api/comunas`
  - `GET /api/empresas`
- Se conecta al BFF por endpoints especificos de sucursales:
  - `GET /api/sucursales`
  - `POST /api/sucursales`
  - `PUT /api/sucursales/{uuid}`
  - `PATCH /api/sucursales/{uuid}/desactivar`
- Envia al BFF el contrato esperado:
  - `codigo`
  - `nombre`
  - `direccion`
  - `telefono`
  - `activo`
  - `empresaUuid`
  - `comunaUuid`
- Mantiene visibles las sucursales desactivadas y bloquea su edicion.
- Usa confirmacion visual inline para desactivar, sin `alert` ni `confirm` nativo del navegador.
- Conserva los UUID reales de comuna y empresa recibidos desde el BFF para evitar enviar identificadores mock al backend durante la edicion.

### 6.15 Inventario

Ubicacion:

```text
src/app/pages/inventario/
```

Funcionalidad:

- Consulta stock real por sucursal desde el BFF.
- Carga catalogos necesarios para registrar entradas:
  - Sucursales.
  - Tipos de movimiento.
  - Formas de pago.
  - Proveedores.
  - Empleados para el campo opcional `recibidoPorUuid`.
  - Usuarios responsables.
  - Productos/servicios filtrados como productos inventariables.
- Permite registrar una entrada de inventario con cabecera y multiples detalles en un unico JSON.
- El registro de entrada se abre en modal desde el boton `Registrar entrada`, manteniendo la tabla de stock a ancho completo.
- Envia el movimiento al endpoint `POST /api/inventario/entradas`.
- Refresca el stock de la sucursal despues de guardar correctamente.
- Evita repetir el mismo producto dentro de una misma entrada.
- Calcula el total de la entrada como `cantidad * costoUnitario - descuento`, sin agregar IVA automaticamente.
- Muestra indicadores de productos disponibles, stock total en unidades y valor referencial.
- Mantiene la pantalla util aunque fallen catalogos opcionales, como empleados.

### 6.16 Facturacion

Ubicacion:

```text
src/app/pages/facturacion/
```

Funcionalidad:

- Consulta pagos reales desde el BFF.
- Permite registrar pagos asociados a una cotizacion.
- Registra el pago y emite el DTE en una sola accion del usuario.
- El selector de cotizacion muestra solo cotizaciones con saldo pendiente; las cotizaciones completamente pagadas no quedan disponibles para nuevos pagos.
- El selector muestra el saldo pendiente de cada cotizacion disponible.
- Permite anular pagos registrados.
- Consulta documentos tributarios emitidos desde el BFF.
- Permite emitir DTE simulado para pagos registrados con selector fijo:
  - Boleta (`BOLETA`).
  - Factura (`FACTURA`).
- No consume `/api/tipos-documento` para DTE, porque esos tipos corresponden a documentos operacionales funerarios.
- Evita emitir DTE para pagos anulados o pagos que ya tienen un DTE activo.
- Permite anular documentos tributarios.
- Para emitir DTE llama solamente a `POST /api/documentos-tributarios/emitir`; no llama directamente a `/api/inventario/salidas/facturacion`.
- El BFF es responsable de emitir el documento tributario y luego disparar internamente la salida de inventario por facturacion.
- Si inventario rechaza por stock insuficiente, la pantalla muestra un mensaje de stock y el pago queda registrado sin DTE emitido.
- Genera PDF fisico de Boleta o Factura con `jsPDF`.
- El PDF incluye folio, receptor, RUT, cotizacion asociada, montos, IVA, track ID, proveedor `DTEEMITE_SIMULADO` y datos de trazabilidad.
- El PDF desglosa los productos o servicios de la cotizacion mediante `GET /api/cotizaciones/{cotizacionUuid}`.
- Si no se puede obtener el detalle de la cotizacion, el PDF usa una linea de respaldo asociada al pago de la cotizacion.
- Muestra mensajes de error orientados al usuario final, sin exponer BFF, backend, HTTP, endpoints, tokens ni detalles tecnicos.

Endpoints usados:

- `GET /api/pagos`
- `POST /api/pagos`
- `PATCH /api/pagos/{uuid}/anular`
- `GET /api/documentos-tributarios`
- `POST /api/documentos-tributarios/emitir`
- `PATCH /api/documentos-tributarios/{uuid}/anular`
- `GET /api/cotizaciones`
- `GET /api/cotizaciones/{uuid}`
- `GET /api/formas-pago`

Contrato de emision DTE esperado por el BFF:

```json
{
  "pagoUuid": "uuid-pago",
  "tipoDocumentoCodigo": "BOLETA",
  "observacion": "Emision por pago de servicio funerario"
}
```

Reglas de dominio relevantes:

- El pago debe estar asociado a una cotizacion valida.
- La cotizacion debe tener un tercero pagador/responsable asociado.
- Ese tercero debe tener rol `CLIENTE`.
- No se debe resolver esta validacion cambiando el rol del usuario logueado; el usuario logueado debe existir como usuario activo del backend con el mismo email del JWT y rol de sistema, por ejemplo `USER`.
- La rebaja de inventario por facturacion la ejecuta el BFF/backend despues de emitir el DTE.

## 7. Componentes reutilizables de UI

En `src/app/ui/ui.module.ts` se implemento un modulo con componentes compartidos:

- `app-avatar`: muestra iniciales y color automatico segun nombre.
- `app-badge`: badge generico.
- `app-estado-badge`: badge de estado usando clases del sistema.
- `app-page-head`: encabezado reutilizable de pagina.
- `app-progress`: barra de progreso.
- `app-pills`: tabs tipo pills con evento de seleccion.
- `app-filter-chip`: chip visual de filtro.
- `app-stat`: tarjeta KPI con icono, valor, etiqueta y variacion.

Estos componentes permiten mantener una interfaz consistente entre las pantallas.

## 7.1 Barra superior y notificaciones

El `TopbarComponent` muestra la busqueda global, el acceso rapido a nuevo servicio y una campana de notificaciones operativas.

La campana consulta datos reales del BFF y genera alertas de trabajo para:

- Cotizaciones aceptadas, aprobadas, vigentes o con contrato generado que aun no registran pago.
- Pagos registrados que aun no tienen DTE activo.
- Documentos tributarios en estado `PENDIENTE` o `RECHAZADO`.

Endpoints consumidos:

```text
GET /api/cotizaciones
GET /api/pagos
GET /api/documentos-tributarios
```

Las notificaciones marcadas como leidas se guardan en `localStorage` para no volver a destacarlas en la misma sesion del navegador.

## 8. Autenticacion con Microsoft Entra ID

La configuracion esta en:

```text
src/app/auth-config.ts
```

Se definieron:

- `tenantId`
- `clientId`
- `bffApiScope`
- `apiUrl`
- `bffApiUrl`
- `msalConfig`
- `loginRequest`

`apiUrl` se toma desde los archivos de ambiente de Angular:

- En desarrollo local: `http://localhost:8080/api`.
- En produccion: `/api`.

`bffApiUrl` se conserva como prefijo de compatibilidad para componentes existentes que construyen rutas del tipo `${bffApiUrl}/api/...`. En produccion queda vacio, por lo que las llamadas resultantes son relativas, por ejemplo `/api/servicios`.

El `redirectUri` usado por MSAL queda como el origen actual del navegador. Para produccion, la URL publica `https://gesfun.duckdns.org` debe estar registrada como Redirect URI en Microsoft Entra ID.

El flujo actual usa:

- `@azure/msal-angular`.
- `@azure/msal-browser`.
- Login por redirect.
- Pantalla de login con una unica accion de autenticacion: `Iniciar sesion con Microsoft`.
- No solicita usuario ni contrasena local; la autenticacion se delega completamente a Microsoft Entra ID.
- Cache en `localStorage`.
- Scope del BFF/API.
- Logout por popup.
- Obtencion silenciosa de token cuando existe una cuenta activa.
- Deteccion de sesion expirada cuando la renovacion silenciosa del token requiere interaccion.
- Redireccion al login con el mensaje `Tu sesion expiro. Inicia sesion nuevamente para continuar`.
- `MsalRedirectComponent` para procesar respuestas de Microsoft Entra ID.

## 9. Servicio de autenticacion

Ubicacion:

```text
src/app/services/auth.service.ts
```

Responsabilidades:

- Inicializar MSAL una sola vez.
- Ejecutar login.
- Ejecutar logout.
- Obtener cuenta activa.
- Verificar si hay usuario autenticado.
- Solicitar access token.
- Consultar perfil en:

```text
/api/me
```

El endpoint se consume mediante:

```ts
getProfile() {
  return this.http.get(`${this.API_URL}/me`);
}
```

## 10. Envio de token al BFF

Ubicacion:

```text
src/app/services/auth.service.ts
```

Responsabilidades:

- Obtener access token para el scope del BFF.
- Intentar primero `acquireTokenSilent`.
- Evitar popups automaticos cuando MSAL requiere interaccion, ya que el navegador puede bloquearlos.
- Marcar la sesion como expirada y redirigir al login.
- Entregar el token a los componentes para llamar al BFF con:

```http
Authorization: Bearer <token>
```

El proyecto usa `AuthInterceptor` propio para adjuntar el header `Authorization` a las llamadas hacia la API configurada:

```text
/api
```

En desarrollo local la API apunta a `http://localhost:8080/api`. En produccion apunta a `/api`, para que el navegador nunca llame directamente a puertos internos como `8080` o `8081`.

## 11. Configuracion esperada del backend BFF

En desarrollo local la aplicacion espera que exista un BFF en:

```text
http://localhost:8080/api
```

En produccion la aplicacion debe consumir siempre una ruta relativa:

```text
https://gesfun.duckdns.org/api/...
```

Nginx de la EC2 publica HTTPS y enruta:

```text
/      -> frontend Docker en 127.0.0.1:8081
/api/  -> BFF Docker en 127.0.0.1:8080/api/
```

El puerto `8081` corresponde al contenedor del frontend y no debe aparecer en llamadas del navegador.

El endpoint usado para probar autenticacion es `GET /api/me`. La llamada debe aceptar un bearer token emitido por Microsoft Entra ID para el scope configurado en `bffApiScope`.

Para el flujo SPA, el BFF debe aceptar tokens v2 de Microsoft Entra ID. Los valores reales de tenant, audience y cliente deben mantenerse en configuracion local o variables de entorno, no documentarse en el README:

```text
issuer:   https://login.microsoftonline.com/<tenant-id>/v2.0
audience: <bff-client-id-o-app-id-uri>
client:   <frontend-client-id>
scope:    access_as_user
```

El frontend siempre debe llamar al BFF mediante `environment.apiUrl`. En produccion ese valor es `/api`; el BFF reenvia al backend real.

## 11.1 Modulos conectados al BFF

Los siguientes modulos ya cuentan con eventos reales contra el BFF:

- `DashboardComponent`
  - `GET /api/sucursales`
  - `GET /api/cotizaciones`
  - `GET /api/agendas/sucursal/{sucursalUuid}`
  - `GET /api/inventario/stock?sucursalUuid={uuid}`
- `UsuariosComponent`
  - `GET /api/usuarios`
  - `POST /api/usuarios`
  - `PUT /api/usuarios/{id}`
  - `DELETE /api/usuarios/{id}`
- `ClientesComponent`
  - `GET /api/clientes`
  - `POST /api/clientes`
  - `PUT /api/clientes/{uuid}`
  - `PATCH /api/clientes/{uuid}/desactivar`
- `EmpleadosComponent`
  - `GET /api/empleados`
  - `POST /api/empleados`
  - `PUT /api/empleados/{uuid}`
  - `PATCH /api/empleados/{uuid}/desactivar`
- `ProveedoresComponent`
  - `GET /api/proveedores`
  - `POST /api/proveedores`
  - `PUT /api/proveedores/{uuid}`
  - `PATCH /api/proveedores/{uuid}/desactivar`
- `ProductosServiciosComponent`
  - `GET /api/productos-servicios`
  - `POST /api/productos-servicios`
  - `PUT /api/productos-servicios/{uuid}`
  - `PATCH /api/productos-servicios/{uuid}/desactivar`
- `PlanesComponent`
  - `GET /api/planes`
  - `POST /api/planes`
  - `PUT /api/planes/{uuid}`
  - `PATCH /api/planes/{uuid}/desactivar`
  - `GET /api/plan-kit/plan/{planUuid}`
  - `POST /api/plan-kit`
  - `PUT /api/plan-kit/{uuid}`
  - `DELETE /api/plan-kit/{uuid}`
- `DocumentacionComponent`
  - `GET /api/tipos-documento`
  - `POST /api/tipos-documento`
  - `PUT /api/tipos-documento/{uuid}`
  - `DELETE /api/tipos-documento/{uuid}`
- `CotizacionComponent`
  - `GET /api/sucursales`
  - `GET /api/planes`
  - `GET /api/plan-kit/plan/{planUuid}`
  - `GET /api/productos-servicios`
  - `GET /api/formas-pago`
  - `GET /api/motivos-fallecimiento`
  - `GET /api/comunas`
  - `GET /api/clientes`
  - `GET /api/terceros`
  - `POST /api/cotizaciones`
- `CotizacionesComponent`
  - `GET /api/cotizaciones`
  - `GET /api/cotizaciones/{uuid}`
  - `GET /api/estados-cotizacion`
  - `PATCH /api/cotizaciones/{uuid}/estado`
  - `GET /api/tipos-documento`
  - `GET /api/usuarios`
  - `GET /api/documentos-servicio/cotizacion/{cotizacionUuid}`
  - `POST /api/documentos-servicio`
  - `PUT /api/documentos-servicio/{uuid}`
  - `DELETE /api/documentos-servicio/{uuid}`
- `AgendaComponent`
  - `GET /api/sucursales`
  - `GET /api/tipos-recurso`
  - `GET /api/cotizaciones`
  - `GET /api/agendas/sucursal/{sucursalUuid}`
  - `POST /api/agendas`
- `InventarioComponent`
  - `GET /api/sucursales`
  - `GET /api/tipos-movimiento`
  - `GET /api/formas-pago`
  - `GET /api/proveedores`
  - `GET /api/empleados`
  - `GET /api/usuarios`
  - `GET /api/productos-servicios`
  - `GET /api/inventario/stock?sucursalUuid={uuid}`
  - `POST /api/inventario/entradas`
- `FacturacionComponent`
  - `GET /api/pagos`
  - `POST /api/pagos`
  - `PATCH /api/pagos/{uuid}/anular`
  - `GET /api/documentos-tributarios`
  - `POST /api/documentos-tributarios/emitir`
  - `PATCH /api/documentos-tributarios/{uuid}/anular`
  - `GET /api/cotizaciones`
  - `GET /api/cotizaciones/{uuid}`
  - `GET /api/formas-pago`
- `CasosComponent`
  - `GET /api/servicios`
  - `POST /api/servicios`
  - `PUT /api/servicios/{uuid}`
  - `PATCH /api/servicios/{uuid}/desactivar`
  - `GET /api/clientes`
  - `GET /api/planes`
  - `GET /api/sucursales`
  - `GET /api/motivos-fallecimiento`
  - `GET /api/usuarios`
  - `GET /api/cotizaciones`
  - `GET /api/agendas`
- `TopbarComponent`
  - `GET /api/cotizaciones`
  - `GET /api/pagos`
  - `GET /api/documentos-tributarios`
- `SidebarComponent`
  - `GET /api/servicios`
- `SucursalesComponent`
  - `GET /api/sucursales`
  - `POST /api/sucursales`
  - `PUT /api/sucursales/{uuid}`
  - `PATCH /api/sucursales/{uuid}/desactivar`
- `RecursosComponent`
  - `GET /api/tipos-recurso`
  - `POST /api/tipos-recurso`
  - `PUT /api/tipos-recurso/{uuid}`

Los modulos de terceros y sucursales cargan ademas:

- `GET /api/comunas`
- `GET /api/empresas`

Esto permite enviar al backend los campos esperados por contrato:

- `rut`
- `comunaUuid`
- `empresaUuid`

Las ediciones de terceros y productos/servicios se realizan por `uuid`, no por `id` numerico.

En clientes, empleados, proveedores, productos/servicios, planes, sucursales y recursos, el boton de baja se presenta como `Desactivar`, porque el backend no elimina fisicamente el registro: cambia su estado `activo`. Cuando un registro queda desactivado, el frontend lo mantiene visible, muestra el estado `Desactivado` y bloquea la edicion.

En recursos, la desactivacion se realiza con `PUT /api/tipos-recurso/{uuid}` enviando `activo: 0`, de acuerdo con el contrato actual del BFF. El UUID se usa internamente para editar/desactivar, pero no se muestra en la tabla.

## 12. Estado del callback de autenticacion

Existe el archivo:

```text
src/app/pages/auth-callback/auth-callback.component.ts
```

Actualmente este componente esta declarado y registrado como ruta `/auth/callback`.

El flujo principal usa `redirectUri` dinamico segun el origen del navegador:

```text
window.location.origin
```

En local normalmente corresponde a `http://localhost:4200`. En EC2 corresponde a `http://<host-ec2>:4200`. El callback delega el procesamiento a MSAL mediante `AuthService.handleRedirectResponse()` y redirige a `/dashboard` si existe cuenta activa.

## 13. Scripts disponibles

| Comando | Descripcion |
| --- | --- |
| `npm run start` | Levanta la app Angular en desarrollo |
| `npm run build` | Compila la app para produccion |
| `npm run watch` | Compila en modo watch con configuracion development |
| `npm run test` | Ejecuta pruebas unitarias con Karma/Jasmine |
| `npm run test:ci` | Ejecuta pruebas unitarias una sola vez en Chrome Headless |
| `npm run test:coverage` | Ejecuta pruebas unitarias y genera reporte de cobertura |
| `npm run ng` | Acceso directo al Angular CLI |

El reporte de cobertura se genera en `coverage/gesfun-frontend` y no se versiona en git. La ultima validacion local dejo 147 pruebas exitosas con `npm run test:ci`. La cobertura debe regenerarse con `npm run test:coverage` cuando se requiera un valor actualizado.

## 14. Flujo recomendado para usar la aplicacion

1. Instalar dependencias con `npm install`.
2. Levantar el backend BFF en `http://localhost:8080/api`, si se quiere probar autenticacion real.
3. Levantar el frontend con `npm run start`.
4. Abrir `http://localhost:4200`.
5. Iniciar sesion desde `/login`.
6. Completar login Microsoft Entra ID.
7. Volver automaticamente al dashboard.
8. Navegar a los modulos desde el sidebar.
9. Revisar dashboard, casos, agenda, catalogo, nueva cotizacion, cotizaciones creadas, clientes, empleados, proveedores, productos y servicios, planes, usuarios, sucursales, inventario y facturacion.

## 15. Limitaciones actuales

- Las pantallas activas ya no usan datos mock de negocio; dependen de que el BFF y sus microservicios esten disponibles.
- Los CRUD de usuarios, clientes, empleados, proveedores, productos/servicios, planes, sucursales y recursos ya pasan por BFF.
- El dashboard ya consume cotizaciones, agenda e inventario desde el BFF, pero sus metricas dependen de que esos endpoints entreguen datos completos por sucursal.
- Servicios funerarios ya consume el CRUD operativo desde el BFF mediante `/api/servicios`.
- La agenda de servicios ya consulta recursos por sucursal y registra reservas mediante el BFF.
- La creacion, listado, consulta y cambio de estado de cotizaciones ya pasan por el BFF.
- Facturacion ya registra pagos y emite DTE simulado en una sola accion, anula pagos/documentos, filtra cotizaciones pagadas del selector y genera PDF de Boleta o Factura desde datos del BFF.
- El frontend centraliza la presentacion de errores en `ErrorMessageService`, mostrando mensajes amigables al usuario final y dejando los detalles tecnicos solo para diagnostico en consola.
- Los PDFs se generan en el navegador; no se almacenan actualmente como archivos en el backend.
- La emision DTE usa el proveedor simulado `DTEEMITE_SIMULADO`; no integra aun SII ni proveedor tributario real.
- El contrato contiene espacios de firma, pero no aplica una firma electronica avanzada.
- El presupuesto de error del bundle inicial esta configurado en `2mb`; el warning se mantiene en `500kb` para seguir visibilizando crecimiento del bundle.
- No hay guards de ruta para bloquear pantallas privadas si el usuario no esta autenticado.
- Existe cobertura unitaria para mantenedores CRUD principales, interceptor y componentes base; todavia falta cubrir flujos de negocio mas profundos, errores HTTP especificos y estados de formularios complejos.

## 16. Siguientes pasos sugeridos

- Agregar `AuthGuard` para proteger rutas internas.
- Crear servicios HTTP por dominio:
  - Planes y plan kit.
  - Sucursales.
  - Cotizaciones.
  - Inventario.
  - Agenda.
  - Facturacion.
- Extraer servicios HTTP compartidos para usuarios, terceros y productos/servicios.
- Completar endpoints faltantes o contratos pendientes del BFF cuando algun microservicio no entregue toda la informacion requerida por pantalla.
- Persistir y validar desde backend todos los flujos transaccionales que aun dependan de contratos parciales.
- Agregar validaciones de formularios mas completas.
- Agregar loading states por pantalla.
- Agregar pruebas unitarias para calculos y filtros.
- Agregar pruebas de integracion para autenticacion y consumo del BFF.

## 17. Resumen

GESFUN Frontend ya cuenta con una base funcional de aplicacion administrativa: navegacion, layout, estilos, pantallas principales, componentes reutilizables, autenticacion MSAL con aviso de sesion expirada, dashboard operativo conectado al BFF, mantenedores conectados al BFF, servicios funerarios conectados al BFF, agenda de servicios conectada al BFF, inventario conectado al BFF, facturacion conectada al BFF para registrar pagos y emitir DTE en una sola accion, notificaciones operativas en la barra superior y un flujo comercial de cotizaciones que permite crear, listar, buscar desde la barra superior, cambiar estados, reimprimir PDFs y generar contratos.

La siguiente etapa natural es proteger las rutas internas con autenticacion obligatoria, consolidar servicios HTTP por dominio y ampliar pruebas automatizadas sobre los flujos integrados con el BFF.

## 18. Pruebas E2E con Playwright

El proyecto usa Playwright para ejecutar pruebas end-to-end sobre la aplicacion Angular. Estas pruebas abren el frontend en un navegador real, navegan por las pantallas y validan flujos completos de usuario.

### Objetivo

El objetivo de Playwright en GESFUN es validar que los mantenedores y catalogos principales funcionen correctamente desde la interfaz:

- Carga de pantallas.
- Listado de datos.
- Creacion de registros.
- Edicion de registros.
- Desactivacion o eliminacion segun corresponda.
- Navegacion entre acciones principales.
- Manejo de errores controlados del BFF.

Estas pruebas complementan las pruebas unitarias de Karma/Jasmine. Las unitarias validan logica de componentes y servicios; Playwright valida que el flujo completo funcione en el navegador.

### Pruebas disponibles

Los archivos principales son:

```text
tests/catalogo.spec.ts
tests/mantenedores.spec.ts
tests/login.spec.ts
tests/helpers/bff.ts
```

`tests/catalogo.spec.ts` valida catalogo y planes con respuestas simuladas del BFF.

`tests/mantenedores.spec.ts` valida los mantenedores principales:

- Productos y servicios.
- Planes.
- Clientes.
- Proveedores.
- Empleados.
- Sucursales.
- Usuarios.
- Tipos de documento.

`tests/helpers/bff.ts` contiene un BFF simulado para las pruebas. Intercepta las llamadas HTTP a `http://localhost:8080/api` y responde con datos de prueba. Gracias a esto, los mantenedores se pueden probar sin levantar el backend real y sin iniciar sesion en Microsoft.

`tests/login.spec.ts` es la prueba de login real con Microsoft. Esta prueba solo se ejecuta si existen credenciales configuradas en variables de entorno.

### Login en pruebas

Las pruebas de catalogo y mantenedores no requieren login real. Playwright configura un token de prueba en el navegador mediante `localStorage`:

```text
gesfun.e2eAccessToken
```

El frontend detecta ese token solo durante las pruebas E2E y permite ejecutar los flujos sin pasar por Microsoft Entra ID.

La aplicacion normal sigue usando MSAL y Microsoft como antes.

### Comandos

Ejecutar todas las pruebas E2E:

```bash
npm run e2e
```

Ejecutar Playwright en modo visual/interactivo:

```bash
npm run e2e:ui
```

Ejecutar solo catalogo:

```bash
npx playwright test tests/catalogo.spec.ts --project=chromium
```

Ejecutar solo mantenedores:

```bash
npx playwright test tests/mantenedores.spec.ts --project=chromium
```

Listar todas las pruebas disponibles:

```bash
npx playwright test --list
```

Abrir el ultimo reporte HTML:

```bash
npx playwright show-report
```

### Login real con Microsoft

Para ejecutar la prueba real de login se deben configurar credenciales:

```bash
export PW_EMAIL="correo@dominio.cl"
export PW_PASSWORD="password"
npx playwright test tests/login.spec.ts --project=chromium
```

Si `PW_EMAIL` o `PW_PASSWORD` no existen, la prueba de login se omite automaticamente y no rompe la suite.

### Consideraciones

- Playwright levanta Angular automaticamente usando la configuracion de `playwright.config.ts`.
- La URL base de pruebas es `http://127.0.0.1:4200`.
- El BFF real no es necesario para `catalogo.spec.ts` ni `mantenedores.spec.ts`.
- La prueba `login.spec.ts` si depende del flujo real de Microsoft y puede requerir MFA, permisos o ajustes de la cuenta.
- Para desarrollo local se recomienda partir ejecutando con Chromium:

```bash
npx playwright test --project=chromium
```
