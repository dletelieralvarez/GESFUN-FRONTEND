# Informe de pruebas y evidencias - GESFUN Frontend

Fecha de actualización: 2026-07-03

## Alcance

Este informe cubre pruebas automatizadas del frontend Angular para los flujos principales solicitados en el documento del proyecto:

- Cotización completa contra BFF.
- Generación de PDF de cotización.
- Generación y reimpresión de contrato.
- Agenda de servicios y reserva de recursos.
- Pagos y emisión de DTE simulado.
- Emisión de DTE con rebaja de inventario delegada al BFF.
- Manejo de errores HTTP desde BFF/microservicios.
- Autenticación hacia BFF mediante interceptor.

## Casos automatizados agregados o reforzados

| Flujo | Archivo | Evidencia validada |
| --- | --- | --- |
| Cotización completa | `src/app/pages/cotizacion/cotizacion.component.spec.ts` | Valida payload enviado a `POST /api/cotizaciones`, datos de pagador/fallecido, detalle de plan/adicionales y llamada a PDF. |
| Error BFF en cotización | `src/app/pages/cotizacion/cotizacion.component.spec.ts` | Valida mensaje cuando no existe conexión con el BFF al cargar catálogos. |
| Contrato por cambio de estado | `src/app/pages/cotizaciones/cotizaciones.component.spec.ts` | Valida `PATCH /api/cotizaciones/{uuid}/estado` y generación de contrato cuando el estado queda `GEN_CONTR`. |
| Reimpresión de contrato | `src/app/pages/cotizaciones/cotizaciones.component.spec.ts` | Valida que una cotización con contrato generado use `generarContrato` y no `generar`. |
| Agenda integrada | `src/app/pages/agenda/agenda.component.spec.ts` | Valida payload de `POST /api/agendas`, cambio de vista diaria/semanal, eventos multi-día y error 409 de recurso reservado. |
| Pago + DTE | `src/app/pages/facturacion/facturacion.component.spec.ts` | Valida registro de pago, emisión de DTE, generación de PDF tributario y manejo de error cuando falla el DTE. |
| DTE + inventario interno BFF | `src/app/pages/facturacion/facturacion.component.spec.ts` | Valida que el frontend emite `FACTURA` enviando solo `pagoUuid`, `tipoDocumentoCodigo` y `observacion`, sin productos/cantidades y sin llamar a `/api/inventario/*`. |
| Error de stock en DTE | `src/app/pages/facturacion/facturacion.component.spec.ts` | Valida que un 400 por stock insuficiente se muestre como: "No se pudo emitir la factura porque no hay stock suficiente para uno o más productos físicos de la cotización." |
| Autenticación BFF | `src/app/interceptors/auth.interceptor.spec.ts` | Valida token Bearer hacia BFF, exclusión de URLs externas y expiración de sesión ante HTTP 401. |

## Comandos de ejecución

```bash
npm run test:ci
npm run build
```

## Criterio de aceptación

Las pruebas se consideran aceptadas cuando:

- `npm run test:ci` finaliza sin fallas.
- `npm run build` finaliza sin errores de compilación.
- Los warnings de bundle o CommonJS quedan registrados como observaciones, no como bloqueo funcional.

## Observaciones

- Las pruebas usan `HttpClientTestingModule`, por lo que no requieren backend real.
- La generación de PDF se valida con spies sobre los servicios PDF para evitar descargas reales en navegador.
- La rebaja de inventario por facturación queda fuera del frontend: el BFF llama internamente a `POST /api/inventario/salidas/facturacion` después de emitir el documento tributario.
- Los escenarios externos reales como Registro Civil, Seremi, AFP y seguros siguen pendientes si no existen endpoints simulados expuestos por el BFF.
