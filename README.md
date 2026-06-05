# GESFUN-FRONTEND

Aplicación de gestión funeraria desarrollada en Angular 16, con módulos para servicios, agenda, clientes, cotizaciones, facturación, inventario y administración de usuarios/sucursales.

## Características

- Desarrollo en Angular 16
- Interfaz basada en Bootstrap 5
- Gestión de:
  - Servicios funerarios
  - Cotizaciones y catálogo de planes
  - Clientes / terceros
  - Agenda de salas
  - Inventario
  - Facturación
  - Administración de usuarios y sucursales
- Basado en modelo de datos real: `USUARIO`, `SUCURSAL`, `TERCERO`, `SERVICIO`, `FACTURA`, `INVENTARIO_PRODUCTO`, etc.
- Estructura modular con componentes y rutas bien definidas

## Estructura del proyecto

- `src/app/pages/` - páginas de la aplicación
- `src/app/layout/` - sidebar y topbar
- `src/app/data/` - modelos y datos de ejemplo
- `src/app/ui/` - componentes UI reutilizables

## Desarrollo

Instala dependencias:

```bash
npm install
```

Ejecuta la aplicación:

```bash
npm run start
```

Construye el proyecto:

```bash
npm run build
```

## Notas

Esta aplicación está pensada como frontend para un sistema de gestión funeraria y puede integrarse con una API backend que exponga los modelos de datos reales.
