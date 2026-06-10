# GESFUN Frontend

Frontend de GESFUN, una aplicacion web para gestion funeraria desarrollada con Angular 16 y Bootstrap 5. El proyecto implementa una interfaz administrativa con modulos de operacion, comercial, administracion, recursos y finanzas, usando datos mock basados en un modelo de negocio real y una integracion de autenticacion con Microsoft Entra ID mediante MSAL.

## 1. Objetivo del proyecto

El objetivo es entregar una primera version funcional del frontend para una funeraria, con pantallas navegables, layout administrativo, componentes reutilizables, datos de ejemplo y una base preparada para conectarse a un backend BFF/API.

La aplicacion permite revisar y operar sobre:

- Servicios funerarios y casos activos.
- Agenda de salas.
- Catalogo de planes y servicios adicionales.
- Cotizaciones con calculo de subtotal, IVA y total.
- Clientes o terceros.
- Usuarios del sistema.
- Sucursales.
- Inventario.
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
      mock-data.ts
      models.ts
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
      dashboard/
      empleados/
      facturacion/
      inventario/
      login/
      planes/
      productos-servicios/
      proveedores/
      sucursales/
      usuarios/
    services/
      auth.service.ts
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
| `/agenda` | `AgendaComponent` | Agenda de salas |
| `/catalogo` | `CatalogoComponent` | Catalogo y planes |
| `/cotizacion` | `CotizacionComponent` | Cotizaciones |
| `/clientes` | `ClientesComponent` | Clientes/terceros |
| `/usuarios` | `UsuariosComponent` | Administracion de usuarios |
| `/empleados` | `EmpleadosComponent` | Administracion de empleados |
| `/proveedores` | `ProveedoresComponent` | Administracion de proveedores |
| `/productos-servicios` | `ProductosServiciosComponent` | Administracion de productos y servicios |
| `/planes` | `PlanesComponent` | Administracion de planes armables |
| `/sucursales` | `SucursalesComponent` | Administracion de sucursales |
| `/inventario` | `InventarioComponent` | Inventario |
| `/facturacion` | `FacturacionComponent` | Facturacion |
| `**` | Redireccion | Redirige a `/login` |

Cada ruta incluye metadata como `title` y `crumb`, usada por el `TopbarComponent`.

### 5.6 Datos mock y modelos

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

`mock-data.ts` contiene datos de ejemplo para:

- Planes de suscripcion.
- Productos y servicios.
- Terceros/clientes.
- Empleados.
- Proveedores.
- Regiones.
- Servicios funerarios.
- Facturas.
- Inventario.
- Comunas.
- Salas.
- Agenda.
- Navegacion.
- Estados visuales.
- Helpers de formato, como `CLP`.

Tambien se agregaron alias de compatibilidad para componentes, por ejemplo:

- `CASES`
- `PLANS`
- `SERVICIOS_SUELTOS`
- `CLIENTS`
- `INVOICES`
- `INVENTORY`

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

- Muestra servicios activos.
- Calcula cantidad de casos en curso o programados.
- Calcula actividades de agenda del dia.
- Calcula ingresos pagados.
- Detecta productos con bajo stock.
- Muestra resumen operativo para la administracion.

Los datos provienen de `SERVICIOS`, `AGENDA` e `INVENTARIO_PRODUCTOS`.

### 6.3 Servicios funerarios

Ubicacion:

```text
src/app/pages/casos/
```

Funcionalidad:

- Lista servicios/casos funerarios.
- Muestra folio, fallecido, familiar, plan, sala, fechas, destino y encargado.
- Permite filtrar por estado usando tabs:
  - Todas.
  - En curso.
  - Programado.
  - Pendiente.
  - Completado.
- Formatea montos en pesos chilenos usando `CLP`.

### 6.4 Agenda de salas

Ubicacion:

```text
src/app/pages/agenda/
```

Funcionalidad:

- Muestra salas disponibles.
- Muestra agenda por horas.
- Calcula eventos por sala.
- Identifica salas ocupadas.
- Calcula estilos visuales de cada evento segun tipo/color.
- Trabaja con bloques horarios desde las 08:00 hasta las 21:00.

### 6.5 Catalogo y planes

Ubicacion:

```text
src/app/pages/catalogo/
```

Funcionalidad:

- Lista planes funerarios.
- Lista servicios/productos adicionales.
- Muestra precios formateados.
- Usa datos derivados desde `SUSCRIPCION_PLANS` y `PRODUCTOS_SERVICIOS`.

### 6.6 Cotizaciones

Ubicacion:

```text
src/app/pages/cotizacion/
```

Funcionalidad:

- Seleccion de plan base.
- Seleccion de servicios adicionales.
- Calculo de extras.
- Calculo de subtotal.
- Calculo de IVA al 19%.
- Calculo de total.

El componente inicia con el plan tradicional seleccionado y algunos extras marcados por defecto.

### 6.7 Clientes

Ubicacion:

```text
src/app/pages/clientes/
```

Funcionalidad:

- Lista clientes/terceros.
- Lista solo terceros con rol `CLIENTE`.
- Permite crear un nuevo cliente.
- Permite editar un cliente existente.
- Permite eliminar un cliente con confirmacion.
- Mantiene el rol fijo como `Cliente`; no se puede cambiar desde el formulario.
- Maneja formulario local.
- Valida campos minimos:
  - Nombre.
  - RUT.
  - DV.
  - Email.
  - Telefono.
- Formatea RUT con digito verificador.
- Permite seleccionar region.
- Muestra nombre de comuna desde el arreglo `COMUNAS`.
- Diferencia entre persona natural y empresa.

Importante: estos cambios son locales en memoria; no se persisten todavia en backend.

### 6.8 Empleados

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

### 6.9 Proveedores

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

### 6.10 Productos Y Servicios

Ubicacion:

```text
src/app/pages/productos-servicios/
```

Funcionalidad:

- Administra el maestro `PRODUCTO_SERVICIO`.
- Permite crear, editar y eliminar productos o servicios.
- Soporta ejemplos como ataudes, cirios, libro de condolencias, flores y servicios de cafeteria.
- Maneja tipo de item (`producto` o `servicio`), codigo, nombre, descripcion, precio, categoria, unidad de medida, empresa, estado activo y afecto.
- Sirve como catalogo base para armar planes.

Importante: estos cambios son locales en memoria.

### 6.11 Planes

Ubicacion:

```text
src/app/pages/planes/
```

Funcionalidad:

- Administra planes asociados a una sucursal.
- Permite crear, editar y eliminar planes.
- Permite armar el plan seleccionando productos o servicios desde `PRODUCTOS_SERVICIOS`.
- Permite definir cantidad por item.
- Calcula unitario y total por item.
- Calcula automaticamente el total del plan a partir del kit.
- Mantiene una estructura equivalente a `PLAN` y `PLAN_KIT` del modelo de datos.
- Permite activar/desactivar el plan.

Importante: estos cambios son locales en memoria.

### 6.12 Usuarios

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

### 6.13 Sucursales

Ubicacion:

```text
src/app/pages/sucursales/
```

Funcionalidad:

- Lista sucursales iniciales.
- Permite crear sucursal.
- Permite editar sucursal.
- Permite eliminar sucursal con confirmacion.
- Maneja codigo, nombre, direccion, telefono, empresa, comuna y estado activo.
- Genera UUID con `crypto.randomUUID()` cuando esta disponible.

Importante: estos cambios son locales en memoria.

### 6.14 Inventario

Ubicacion:

```text
src/app/pages/inventario/
```

Funcionalidad:

- Lista productos de inventario.
- Filtra por categoria:
  - Todas.
  - Ataudes.
  - Urnas.
  - Flores.
  - Insumos.
- Calcula valor total del inventario.
- Calcula cantidad de productos bajo stock minimo.
- Usa `trackBySku` para optimizar renderizado de filas.

### 6.15 Facturacion

Ubicacion:

```text
src/app/pages/facturacion/
```

Funcionalidad:

- Lista facturas.
- Filtra por estado:
  - Todas.
  - Pendiente.
  - Parcial.
  - Pagada.
  - Vencida.
- Calcula monto por cobrar.
- Calcula monto cobrado.
- Calcula cantidad de facturas vencidas.
- Aplica badges visuales segun estado.

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

## 8. Autenticacion con Microsoft Entra ID

La configuracion esta en:

```text
src/app/auth-config.ts
```

Se definieron:

- `tenantId`
- `clientId`
- `bffApiScope`
- `bffApiUrl`
- `msalConfig`
- `loginRequest`

El flujo actual usa:

- `@azure/msal-angular`.
- `@azure/msal-browser`.
- Login por redirect.
- Cache en `localStorage`.
- Scope del BFF/API.
- Logout por popup.
- Obtencion silenciosa de token cuando existe una cuenta activa.
- Fallback interactivo para token cuando MSAL lo requiere.
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
http://localhost:8081/api/me
```

El endpoint se consume mediante:

```ts
getProfile() {
  return this.http.get(`${this.BFF_URL}/api/me`);
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
- Usar `acquireTokenPopup` como fallback cuando MSAL requiere interaccion o cuando ocurre `monitor_window_timeout`.
- Entregar el token a los componentes para llamar al BFF con:

```http
Authorization: Bearer <token>
```

El proyecto no usa `MsalInterceptor` para el BFF en este momento. Las llamadas protegidas envian el header `Authorization` de forma explicita desde cada modulo que consume:

```text
http://localhost:8081
```

Este ajuste evita una doble adquisicion de token: una desde el componente y otra desde el interceptor. Esa doble adquisicion podia provocar errores de MSAL como `monitor_window_timeout`.

## 11. Configuracion esperada del backend BFF

La aplicacion espera que exista un backend local en:

```text
http://localhost:8081
```

El endpoint usado para probar autenticacion es:

```text
GET /api/me
```

La llamada debe aceptar un bearer token emitido por Microsoft Entra ID para el scope configurado en `bffApiScope`.

Para el flujo SPA con `gesfun-client`, el BFF debe aceptar tokens v2 de Microsoft Entra ID:

```text
issuer:   https://login.microsoftonline.com/0848441e-8d61-4f58-84b7-9f55266c7ee4/v2.0
audience: daead1c3-a4cc-4647-9423-e1fc626d8003
client:   7c4068b3-4cdf-42f3-84ac-f8e2d2042118
scope:    access_as_user
```

El frontend siempre debe llamar al BFF en `http://localhost:8081`; el BFF reenvia al backend real.

## 11.1 Modulos conectados al BFF

Los siguientes modulos ya cuentan con eventos reales contra el BFF:

- `UsuariosComponent`
  - `GET /api/usuarios`
  - `POST /api/usuarios`
  - `PUT /api/usuarios/{id}`
  - `DELETE /api/usuarios/{id}`
- `ClientesComponent`
  - `GET /api/terceros`
  - `POST /api/terceros`
  - `PUT /api/terceros/{uuid}`
  - `PATCH /api/terceros/{uuid}/desactivar`
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

Los modulos de terceros cargan ademas:

- `GET /api/comunas`
- `GET /api/empresas`

Esto permite enviar al backend los campos esperados por contrato:

- `rut`
- `comunaUuid`
- `empresaUuid`

Las ediciones de terceros y productos/servicios se realizan por `uuid`, no por `id` numerico.

En empleados y proveedores, el boton de baja se presenta como `Desactivar`, porque el backend no elimina fisicamente el registro: cambia su estado `activo`. Cuando un empleado o proveedor queda desactivado, el frontend mantiene el registro visible, muestra el estado `Desactivado` y bloquea la edicion.

## 12. Estado del callback de autenticacion

Existe el archivo:

```text
src/app/pages/auth-callback/auth-callback.component.ts
```

Actualmente este componente esta declarado y registrado como ruta `/auth/callback`.

El flujo principal usa `redirectUri` en:

```text
http://localhost:4200
```

El callback delega el procesamiento a MSAL mediante `AuthService.handleRedirectResponse()` y redirige a `/dashboard` si existe cuenta activa.

## 13. Scripts disponibles

| Comando | Descripcion |
| --- | --- |
| `npm run start` | Levanta la app Angular en desarrollo |
| `npm run build` | Compila la app para produccion |
| `npm run watch` | Compila en modo watch con configuracion development |
| `npm run test` | Ejecuta pruebas unitarias con Karma/Jasmine |
| `npm run ng` | Acceso directo al Angular CLI |

## 14. Flujo recomendado para usar la aplicacion

1. Instalar dependencias con `npm install`.
2. Levantar el backend BFF en `http://localhost:8081`, si se quiere probar autenticacion real.
3. Levantar el frontend con `npm run start`.
4. Abrir `http://localhost:4200`.
5. Iniciar sesion desde `/login`.
6. Completar login Microsoft Entra ID.
7. Volver automaticamente al dashboard.
8. Navegar a los modulos desde el sidebar.
9. Revisar dashboard, casos, agenda, catalogo, cotizacion, clientes, empleados, proveedores, productos y servicios, planes, usuarios, sucursales, inventario y facturacion.

## 15. Limitaciones actuales

- Algunos modulos siguen usando datos mock/locales.
- Los CRUD de usuarios, clientes, empleados, proveedores y productos/servicios ya pasan por BFF.
- Los CRUD de planes y sucursales aun funcionan en memoria y se pierden al recargar.
- No hay guards de ruta para bloquear pantallas privadas si el usuario no esta autenticado.
- No hay persistencia real contra API para servicios, facturas, inventario o cotizaciones.
- Las pruebas unitarias son las generadas/base y no cubren todavia todos los flujos de negocio.

## 16. Siguientes pasos sugeridos

- Agregar `AuthGuard` para proteger rutas internas.
- Crear servicios HTTP por dominio:
  - Planes y plan kit.
  - Sucursales.
  - Servicios.
  - Inventario.
  - Facturacion.
- Extraer servicios HTTP compartidos para usuarios, terceros y productos/servicios.
- Reemplazar los modulos restantes que usan mock por llamadas al BFF/API.
- Persistir altas, ediciones y eliminaciones en planes, sucursales y demas modulos pendientes.
- Agregar validaciones de formularios mas completas.
- Agregar manejo centralizado de errores.
- Agregar loading states por pantalla.
- Agregar pruebas unitarias para calculos y filtros.
- Agregar pruebas de integracion para autenticacion y consumo del BFF.

## 17. Resumen

GESFUN Frontend ya cuenta con una base funcional de aplicacion administrativa: navegacion, layout, estilos, pantallas principales, componentes reutilizables, modelos de dominio, datos de ejemplo, autenticacion MSAL, interceptor de bearer token, administracion de usuarios conectada al BFF, administracion de terceros por rol conectada al BFF, administracion de productos/servicios conectada al BFF y administracion de planes armables con kit de items.

La siguiente etapa natural es conectar cada modulo con endpoints reales y proteger las rutas internas con autenticacion obligatoria.
