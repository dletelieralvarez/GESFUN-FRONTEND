export const CLP = (n: number) => "$" + Math.round(n).toLocaleString("es-CL");

export const AVATAR_COLORS = [
  "oklch(0.55 0.07 158)", "oklch(0.55 0.06 245)", "oklch(0.58 0.09 60)",
  "oklch(0.56 0.10 25)", "oklch(0.52 0.07 300)", "oklch(0.50 0.06 200)",
];

export const initials = (name: string) =>
  name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

export const colorFor = (name: string) => {
  if (!name) return AVATAR_COLORS[0];
  const first = name.charCodeAt(0) || 0;
  const last = name.charCodeAt(name.length - 1) || 0;
  return AVATAR_COLORS[(first + last) % AVATAR_COLORS.length];
};

// ===== DATOS DEL MODELO DE BASE DE DATOS =====

// Planes de suscripción
export const SUSCRIPCION_PLANS = [
  { id: 1, uuid: "uuid-plan-1", nombre: "Plan Básico", descripcion: "Servicio esencial, digno y completo para una despedida sobria.", valor: 1150000, activo: true },
  { id: 2, uuid: "uuid-plan-2", nombre: "Plan Tradicional", descripcion: "El más solicitado. Acompañamiento completo con servicios ceremoniales.", valor: 2050000, activo: true },
  { id: 3, uuid: "uuid-plan-3", nombre: "Plan Premium", descripcion: "Servicio integral con la máxima atención al detalle y la familia.", valor: 3480000, activo: true },
];

// Productos y servicios
export const PRODUCTOS_SERVICIOS = [
  { id: 1, uuid: "uuid-ps-1", tipo_item: "servicio", codigo: "SRV-001", nombre: "Hora adicional de sala", descripcion: "Hora adicional de alquiler de sala", precio: 35000, activo: true, afecto: true, unidad_medida_id: 1, empresa_id: 1, categoria: "Salas" },
  { id: 2, uuid: "uuid-ps-2", tipo_item: "producto", codigo: "FLO-001", nombre: "Arreglo floral de cubierta", descripcion: "Arreglo floral para cubierta de ataúd", precio: 95000, activo: true, afecto: true, unidad_medida_id: 1, empresa_id: 1, categoria: "Flores" },
  { id: 3, uuid: "uuid-ps-3", tipo_item: "producto", codigo: "FLO-002", nombre: "Corona de condolencias", descripcion: "Corona floral de condolencias", precio: 68000, activo: true, afecto: true, unidad_medida_id: 1, empresa_id: 1, categoria: "Flores" },
  { id: 4, uuid: "uuid-ps-4", tipo_item: "servicio", codigo: "TRS-001", nombre: "Traslado interurbano", descripcion: "Traslado interurbano por kilómetro", precio: 1200, activo: true, afecto: true, unidad_medida_id: 2, empresa_id: 1, categoria: "Traslados" },
  { id: 5, uuid: "uuid-ps-5", tipo_item: "servicio", codigo: "ATE-001", nombre: "Servicio de café y atención", descripcion: "Servicio de café y atención a familiares", precio: 140000, activo: true, afecto: true, unidad_medida_id: 1, empresa_id: 1, categoria: "Atención" },
  { id: 6, uuid: "uuid-ps-6", tipo_item: "servicio", codigo: "TEC-001", nombre: "Transmisión en línea", descripcion: "Transmisión en línea de ceremonia", precio: 110000, activo: true, afecto: true, unidad_medida_id: 1, empresa_id: 1, categoria: "Tecnología" },
  { id: 7, uuid: "uuid-ps-7", tipo_item: "producto", codigo: "IMP-001", nombre: "Recordatorios impresos", descripcion: "Recordatorios impresos 100 unidades", precio: 55000, activo: true, afecto: true, unidad_medida_id: 3, empresa_id: 1, categoria: "Impresión" },
  { id: 8, uuid: "uuid-ps-8", tipo_item: "servicio", codigo: "TAP-001", nombre: "Tanatopraxia / preparación", descripcion: "Servicio de tanatopraxia y preparación", precio: 180000, activo: true, afecto: true, unidad_medida_id: 1, empresa_id: 1, categoria: "Preparación" },
];

// Terceros (Clientes)
import { Tercero } from './models';

export const TERCEROS: Tercero[] = [
  { id: 1, uuid: "uuid-t-1", apellido_paterno: "Soto", apellido_materno: "Vidal", rol: 'CLIENTE', dv: "5", email: "rsoto@correo.cl", fecha_nacimiento: "1950-03-15", nombre_completo: "Roberto Soto Vidal", nombres: "Roberto", razon_social: null, ruc: "10224881", telefono: "+56 9 8421 5530", tipo_persona: "persona_natural", comuna_id: 1, empresa_id: 1 },
  { id: 2, uuid: "uuid-t-2", apellido_paterno: "Cárcamo", apellido_materno: "Reyes", rol: 'CLIENTE', dv: "2", email: "pcarcamo@correo.cl", fecha_nacimiento: "1965-07-22", nombre_completo: "Patricia Cárcamo Reyes", nombres: "Patricia", razon_social: null, ruc: "12554019", telefono: "+56 9 7712 4408", tipo_persona: "persona_natural", comuna_id: 2, empresa_id: 1 },
  { id: 3, uuid: "uuid-t-3", apellido_paterno: "Villalobos", apellido_materno: "", rol: 'EMPLEADO', dv: "4", email: "mvilla@correo.cl", fecha_nacimiento: "1958-11-08", nombre_completo: "Manuel Villalobos", nombres: "Manuel", razon_social: null, ruc: "9881220", telefono: "+56 9 9032 1187", tipo_persona: "persona_natural", comuna_id: 3, empresa_id: 1 },
  { id: 4, uuid: "uuid-t-4", apellido_paterno: "Aguilera", apellido_materno: "Sanz", rol: 'CLIENTE', dv: "9", email: "caguilera@correo.cl", fecha_nacimiento: "1972-05-30", nombre_completo: "Claudia Aguilera Sanz", nombres: "Claudia", razon_social: null, ruc: "14005772", telefono: "+56 9 6650 9921", tipo_persona: "persona_natural", comuna_id: 4, empresa_id: 1 },
  { id: 5, uuid: "uuid-t-5", apellido_paterno: "Pérez", apellido_materno: "", rol: 'PROVEEDOR', dv: "6", email: "fperez@correo.cl", fecha_nacimiento: "1960-09-14", nombre_completo: "Felipe Pérez", nombres: "Felipe", razon_social: null, ruc: "11778330", telefono: "+56 9 8890 3345", tipo_persona: "persona_natural", comuna_id: 5, empresa_id: 1 },
  { id: 6, uuid: "uuid-t-6", apellido_paterno: "Bravo", apellido_materno: "", rol: 'CLIENTE', dv: "8", email: "vbravo@correo.cl", fecha_nacimiento: "1955-12-05", nombre_completo: "Verónica Bravo", nombres: "Verónica", razon_social: null, ruc: "13220114", telefono: "+56 9 7045 6612", tipo_persona: "persona_natural", comuna_id: 6, empresa_id: 1 },
  { id: 7, uuid: "uuid-t-7", apellido_paterno: "Riquelme", apellido_materno: "", rol: 'CLIENTE', dv: "0", email: "sriquelme@correo.cl", fecha_nacimiento: "1968-01-20", nombre_completo: "Sergio Riquelme", nombres: "Sergio", razon_social: null, ruc: "8443901", telefono: "+56 9 6678 2210", tipo_persona: "persona_natural", comuna_id: 7, empresa_id: 1 },
];

// Servicios (Casos)
export const SERVICIOS = [
  { id: 1, uuid: "uuid-srv-1", folio: "ES-2026-0418", tercero_id: 1, tercero_nombre: "Roberto Soto Vidal", tercero_rut: "10.224.881-5", fallecido_nombre: "María Eugenia Soto Carrasco", fallecido_rut: "6.482.115-3", motivo_fallecimiento_id: 1, suscripcion_plan_id: 2, plan_nombre: "Plan Tradicional", estado: "en_curso", sucursal_id: 1, sucursal_nombre: "Sala San Francisco", responsable_usuario_id: 1, responsable_nombre: "Carla Méndez", fecha_ingreso: "2026-06-01", monto_total: 2150000, monto_pagado: 1075000, fecha_velatorio: "2026-06-02 18:00", fecha_ceremonia: "2026-06-04 11:00", destino: "Parque del Recuerdo" },
  { id: 2, uuid: "uuid-srv-2", folio: "ES-2026-0417", tercero_id: 2, tercero_nombre: "Patricia Cárcamo Reyes", tercero_rut: "12.554.019-2", fallecido_nombre: "Luis Alberto Cárcamo Pinto", fallecido_rut: "4.118.902-6", motivo_fallecimiento_id: 1, suscripcion_plan_id: 3, plan_nombre: "Plan Premium", estado: "programado", sucursal_id: 2, sucursal_nombre: "Sala Los Aromos", responsable_usuario_id: 2, responsable_nombre: "Joaquín Rivas", fecha_ingreso: "2026-06-02", monto_total: 3480000, monto_pagado: 3480000, fecha_velatorio: "2026-06-03 16:00", fecha_ceremonia: "2026-06-05 10:30", destino: "Cementerio General" },
  { id: 3, uuid: "uuid-srv-3", folio: "ES-2026-0416", tercero_id: 3, tercero_nombre: "Manuel Villalobos", tercero_rut: "9.881.220-4", fallecido_nombre: "Rosa Inés Villalobos Díaz", fallecido_rut: "3.902.554-K", motivo_fallecimiento_id: 1, suscripcion_plan_id: 2, plan_nombre: "Plan Tradicional", estado: "en_curso", sucursal_id: 3, sucursal_nombre: "Sala El Sauce", responsable_usuario_id: 3, responsable_nombre: "Daniela Fuentes", fecha_ingreso: "2026-06-01", monto_total: 1980000, monto_pagado: 600000, fecha_velatorio: "2026-06-02 12:00", fecha_ceremonia: "2026-06-03 09:00", destino: "Parque del Recuerdo" },
  { id: 4, uuid: "uuid-srv-4", folio: "ES-2026-0415", tercero_id: 4, tercero_nombre: "Claudia Aguilera Sanz", tercero_rut: "14.005.772-9", fallecido_nombre: "Jorge Hernán Aguilera Mora", fallecido_rut: "8.221.340-1", motivo_fallecimiento_id: 1, suscripcion_plan_id: 1, plan_nombre: "Plan Básico", estado: "pendiente", sucursal_id: 4, sucursal_nombre: "Sala Santa Clara", responsable_usuario_id: 4, responsable_nombre: "Andrés Tapia", fecha_ingreso: "2026-06-02", monto_total: 1150000, monto_pagado: 0, fecha_velatorio: null, fecha_ceremonia: null, destino: "Cremación · Crematorio Norte" },
  { id: 5, uuid: "uuid-srv-5", folio: "ES-2026-0414", tercero_id: 5, tercero_nombre: "Felipe Pérez", tercero_rut: "11.778.330-6", fallecido_nombre: "Carmen Gloria Pérez Lagos", fallecido_rut: "5.667.201-8", motivo_fallecimiento_id: 1, suscripcion_plan_id: 2, plan_nombre: "Plan Tradicional", estado: "completado", sucursal_id: 2, sucursal_nombre: "Sala Los Aromos", responsable_usuario_id: 1, responsable_nombre: "Carla Méndez", fecha_ingreso: "2026-05-28", monto_total: 2050000, monto_pagado: 2050000, fecha_velatorio: "2026-05-29 17:00", fecha_ceremonia: "2026-05-31 12:00", destino: "Cementerio Parque del Sendero" },
  { id: 6, uuid: "uuid-srv-6", folio: "ES-2026-0413", tercero_id: 6, tercero_nombre: "Verónica Bravo", tercero_rut: "13.220.114-8", fallecido_nombre: "Eduardo Andrés Salgado Bravo", fallecido_rut: "9.110.778-4", motivo_fallecimiento_id: 1, suscripcion_plan_id: 3, plan_nombre: "Plan Premium", estado: "completado", sucursal_id: 1, sucursal_nombre: "Sala San Francisco", responsable_usuario_id: 2, responsable_nombre: "Joaquín Rivas", fecha_ingreso: "2026-05-26", monto_total: 3650000, monto_pagado: 3650000, fecha_velatorio: "2026-05-27 18:30", fecha_ceremonia: "2026-05-29 10:00", destino: "Parque del Recuerdo" },
  { id: 7, uuid: "uuid-srv-7", folio: "ES-2026-0412", tercero_id: 7, tercero_nombre: "Sergio Riquelme", tercero_rut: "8.443.901-0", fallecido_nombre: "Norma Cecilia Riquelme Gana", fallecido_rut: "4.553.119-2", motivo_fallecimiento_id: 1, suscripcion_plan_id: 1, plan_nombre: "Plan Básico", estado: "completado", sucursal_id: 3, sucursal_nombre: "Sala El Sauce", responsable_usuario_id: 3, responsable_nombre: "Daniela Fuentes", fecha_ingreso: "2026-05-24", monto_total: 1180000, monto_pagado: 1180000, fecha_velatorio: "2026-05-25 15:00", fecha_ceremonia: "2026-05-26 11:30", destino: "Cementerio Metropolitano" },
];

// Facturas
export const FACTURAS = [
  { id: 1, uuid: "uuid-fac-1", folio: "F-2026-1042", servicio_id: 1, tercero_id: 1, tercero_nombre: "Roberto Soto Vidal", monto: 2150000, monto_abonado: 1075000, estado: "parcial", forma_pago_id: 1, fecha_emitida: "2026-06-01", fecha_vencimiento: "2026-06-16" },
  { id: 2, uuid: "uuid-fac-2", folio: "F-2026-1041", servicio_id: 2, tercero_id: 2, tercero_nombre: "Patricia Cárcamo Reyes", monto: 3480000, monto_abonado: 3480000, estado: "pagada", forma_pago_id: 1, fecha_emitida: "2026-06-02", fecha_vencimiento: "2026-06-17" },
  { id: 3, uuid: "uuid-fac-3", folio: "F-2026-1040", servicio_id: 3, tercero_id: 3, tercero_nombre: "Manuel Villalobos", monto: 1980000, monto_abonado: 600000, estado: "parcial", forma_pago_id: 1, fecha_emitida: "2026-06-01", fecha_vencimiento: "2026-06-16" },
  { id: 4, uuid: "uuid-fac-4", folio: "F-2026-1039", servicio_id: 4, tercero_id: 4, tercero_nombre: "Claudia Aguilera Sanz", monto: 1150000, monto_abonado: 0, estado: "pendiente", forma_pago_id: null, fecha_emitida: "2026-06-02", fecha_vencimiento: "2026-06-17" },
  { id: 5, uuid: "uuid-fac-5", folio: "F-2026-1035", servicio_id: null, tercero_id: null, tercero_nombre: "Inés Madariaga", monto: 2050000, monto_abonado: 0, estado: "vencida", forma_pago_id: null, fecha_emitida: "2026-05-18", fecha_vencimiento: "2026-05-28" },
  { id: 6, uuid: "uuid-fac-6", folio: "F-2026-1034", servicio_id: 5, tercero_id: 5, tercero_nombre: "Felipe Pérez", monto: 2050000, monto_abonado: 2050000, estado: "pagada", forma_pago_id: 1, fecha_emitida: "2026-05-28", fecha_vencimiento: "2026-06-12" },
  { id: 7, uuid: "uuid-fac-7", folio: "F-2026-1033", servicio_id: 6, tercero_id: 6, tercero_nombre: "Verónica Bravo", monto: 3650000, monto_abonado: 3650000, estado: "pagada", forma_pago_id: 1, fecha_emitida: "2026-05-26", fecha_vencimiento: "2026-06-10" },
];

// Inventario
export const INVENTARIO_PRODUCTOS = [
  { id: 1, uuid: "uuid-inv-1", producto_id: 101, producto_codigo: "ATA-001", producto_nombre: "Ataúd Sauce natural", cantidad: 14, cantidad_minima: 6, precio_unitario: 380000, categoria: "Ataúdes", activo: true },
  { id: 2, uuid: "uuid-inv-2", producto_id: 102, producto_codigo: "ATA-014", producto_nombre: "Ataúd Roble tallado", cantidad: 5, cantidad_minima: 6, precio_unitario: 620000, categoria: "Ataúdes", activo: true },
  { id: 3, uuid: "uuid-inv-3", producto_id: 103, producto_codigo: "ATA-021", producto_nombre: "Ataúd Caoba premium", cantidad: 2, cantidad_minima: 3, precio_unitario: 1180000, categoria: "Ataúdes", activo: true },
  { id: 4, uuid: "uuid-inv-4", producto_id: 104, producto_codigo: "ATA-030", producto_nombre: "Ataúd infantil blanco", cantidad: 8, cantidad_minima: 4, precio_unitario: 290000, categoria: "Ataúdes", activo: true },
  { id: 5, uuid: "uuid-inv-5", producto_id: 105, producto_codigo: "URN-005", producto_nombre: "Urna cinerario madera", cantidad: 22, cantidad_minima: 10, precio_unitario: 145000, categoria: "Urnas", activo: true },
  { id: 6, uuid: "uuid-inv-6", producto_id: 106, producto_codigo: "URN-011", producto_nombre: "Urna mármol blanco", cantidad: 3, cantidad_minima: 5, precio_unitario: 240000, categoria: "Urnas", activo: true },
  { id: 7, uuid: "uuid-inv-7", producto_id: 107, producto_codigo: "URN-018", producto_nombre: "Urna biodegradable", cantidad: 17, cantidad_minima: 8, precio_unitario: 98000, categoria: "Urnas", activo: true },
  { id: 8, uuid: "uuid-inv-8", producto_id: 108, producto_codigo: "FLO-002", producto_nombre: "Arreglo de cubierta", cantidad: 9, cantidad_minima: 12, precio_unitario: 95000, categoria: "Flores", activo: true },
  { id: 9, uuid: "uuid-inv-9", producto_id: 109, producto_codigo: "FLO-007", producto_nombre: "Corona de condolencias", cantidad: 11, cantidad_minima: 10, precio_unitario: 68000, categoria: "Flores", activo: true },
  { id: 10, uuid: "uuid-inv-10", producto_id: 110, producto_codigo: "FLO-013", producto_nombre: "Centro floral pedestal", cantidad: 6, cantidad_minima: 6, precio_unitario: 120000, categoria: "Flores", activo: true },
  { id: 11, uuid: "uuid-inv-11", producto_id: 111, producto_codigo: "INS-004", producto_nombre: "Libro de condolencias", cantidad: 40, cantidad_minima: 20, precio_unitario: 18000, categoria: "Insumos", activo: true },
  { id: 12, uuid: "uuid-inv-12", producto_id: 112, producto_codigo: "INS-009", producto_nombre: "Cirios litúrgicos", cantidad: 4, cantidad_minima: 15, precio_unitario: 12000, categoria: "Insumos", activo: true },
  { id: 13, uuid: "uuid-inv-13", producto_id: 113, producto_codigo: "INS-016", producto_nombre: "Set de tarjetas recordatorio", cantidad: 28, cantidad_minima: 15, precio_unitario: 9000, categoria: "Insumos", activo: true },
];

// ===== ALIASES PARA COMPATIBILIDAD CON COMPONENTES =====

export const CASES = SERVICIOS;
export const PLANS = SUSCRIPCION_PLANS.map(p => ({
  id: p.id,
  name: p.nombre,
  price: p.valor,
  desc: p.descripcion,
  items: [],
  popular: p.id === 2,
  tag: p.id === 1 ? 'b-neutral' : p.id === 2 ? 'b-ok' : 'b-info'
}));
export const SERVICIOS_SUELTOS = PRODUCTOS_SERVICIOS.map(p => ({
  id: p.id,
  name: p.nombre,
  price: p.precio,
  cat: p.categoria
}));
export const CLIENTS = TERCEROS.map(t => ({ 
  id: t.id,
  name: t.nombre_completo, 
  rut: t.ruc, 
  telefono: t.telefono, 
  email: t.email, 
  comuna: "Ñuñoa",
  casos: 1, 
  ultimo: "ES-2026-0418" 
}));
export const INVOICES = FACTURAS.map(f => ({
  id: f.id,
  folio: f.folio,
  caso: "ES-2026-0418",
  cliente: f.tercero_nombre,
  monto: f.monto,
  abonado: f.monto_abonado,
  estado: f.estado === "pagada" ? "Pagada" : f.estado === "parcial" ? "Parcial" : f.estado === "pendiente" ? "Pendiente" : "Vencida",
  emitida: f.fecha_emitida,
  vence: f.fecha_vencimiento
}));
export const INVENTORY = INVENTARIO_PRODUCTOS.map(i => ({
  cat: i.categoria,
  item: i.producto_nombre,
  sku: i.producto_codigo,
  stock: i.cantidad,
  min: i.cantidad_minima,
  price: i.precio_unitario
}));

// ===== DATOS PARA NAVEGACIÓN E INTERFACE =====

export const NAV_BS = [
  { group: "General", items: [{ id: "dashboard", label: "Panel", icon: "grid-1x2-fill" }] },
  { group: "Operación", items: [
    { id: "casos", label: "Servicios", icon: "folder-fill", count: 4 },
    { id: "agenda", label: "Agenda de salas", icon: "calendar3" },
  ]},
  { group: "Comercial", items: [
    { id: "catalogo", label: "Catálogo y planes", icon: "grid-fill" },
    { id: "cotizacion", label: "Nueva cotización", icon: "file-earmark-plus-fill" },
    { id: "cotizaciones", label: "Cotizaciones creadas", icon: "files" },
    { id: "clientes", label: "Clientes", icon: "people-fill" },
  ]},
  { group: "Administración", items: [
    { id: "usuarios", label: "Usuarios", icon: "person-badge-fill" },
    { id: "empleados", label: "Empleados", icon: "person-workspace" },
    { id: "proveedores", label: "Proveedores", icon: "truck" },
    { id: "productos-servicios", label: "Productos y servicios", icon: "boxes" },
    { id: "planes", label: "Planes", icon: "clipboard2-check" },
    { id: "recursos", label: "Recursos", icon: "tools" },
    { id: "sucursales", label: "Sucursales", icon: "geo-alt-fill" }
  ]},
  { group: "Recursos", items: [{ id: "inventario", label: "Inventario", icon: "box-seam-fill" }] },
  { group: "Finanzas", items: [{ id: "facturacion", label: "Facturación", icon: "receipt" }] },
];

export const PAGE_META_BS = {
  dashboard:   { title: "Panel general", crumb: "Inicio" },
  casos:       { title: "Servicios funerarios", crumb: "Operación / Servicios" },
  agenda:      { title: "Agenda de salas", crumb: "Operación / Agenda" },
  catalogo:    { title: "Catálogo y planes", crumb: "Comercial / Catálogo" },
  cotizacion:  { title: "Cotizaciones", crumb: "Comercial / Cotizaciones" },
  cotizaciones: { title: "Cotizaciones creadas", crumb: "Comercial / Cotizaciones creadas" },
  clientes:    { title: "Clientes", crumb: "Comercial / Clientes" },
  inventario:  { title: "Inventario", crumb: "Recursos / Inventario" },
  facturacion: { title: "Facturación", crumb: "Finanzas / Facturación" },
  recursos:    { title: "Recursos", crumb: "Administración / Recursos" },
};

export const ESTADO_BS: Record<string, string> = {
  Pendiente:  "b-warn",
  Programado: "b-info",
  "En curso": "b-ok",
  Completado: "b-neutral",
};

export const SALAS = [
  "Sala San Francisco",
  "Sala Los Aromos",
  "Sala El Sauce",
  "Sala Santa Clara",
];

// Comunas (muestra básica para selects)
export const REGIONES = [
  { id: 1, uuid: 'r-1', codigo: 'RM', nombre: 'Metropolitana de Santiago' },
  { id: 2, uuid: 'r-2', codigo: 'V', nombre: 'Valparaiso' },
  { id: 3, uuid: 'r-3', codigo: 'VI', nombre: 'Libertador Bernardo O Higgins' }
];

export const COMUNAS = [
  { id: 1, uuid: 'c-1', codigo: '001', nombre: 'Ñuñoa', region_id: 1 },
  { id: 2, uuid: 'c-2', codigo: '002', nombre: 'Maipú', region_id: 1 },
  { id: 3, uuid: 'c-3', codigo: '003', nombre: 'La Florida', region_id: 1 },
  { id: 4, uuid: 'c-4', codigo: '004', nombre: 'Providencia', region_id: 1 },
  { id: 5, uuid: 'c-5', codigo: '005', nombre: 'Puente Alto', region_id: 1 },
  { id: 6, uuid: 'c-6', codigo: '006', nombre: 'San Miguel', region_id: 1 },
  { id: 7, uuid: 'c-7', codigo: '007', nombre: 'Macul', region_id: 1 }
];

export const AGENDA = [
  { sala: 0, start: 9,  end: 11, tipo: "Ceremonia", titulo: "Aguilera Mora", sub: "Responso", color: "info" },
  { sala: 0, start: 12, end: 19, tipo: "Velorio", titulo: "Soto Carrasco", sub: "Familia Soto", color: "ok" },
  { sala: 1, start: 10, end: 12, tipo: "Sepultación", titulo: "Pérez Lagos", sub: "P. del Sendero", color: "warn" },
  { sala: 1, start: 16, end: 21, tipo: "Velorio", titulo: "Cárcamo Pinto", sub: "Familia Cárcamo", color: "ok" },
  { sala: 2, start: 9,  end: 16, tipo: "Velorio", titulo: "Villalobos Díaz", sub: "Familia Villalobos", color: "ok" },
  { sala: 2, start: 17, end: 19, tipo: "Traslado", titulo: "Preparación sala", sub: "Mantención", color: "neutral" },
  { sala: 3, start: 11, end: 14, tipo: "Ceremonia", titulo: "Misa comunitaria", sub: "Capilla", color: "info" },
];

export const AG_COLOR = {
  ok:   { bg: "var(--ok-bg)", bar: "var(--ok)", fg: "var(--ok)" },
  info: { bg: "var(--info-bg)", bar: "var(--info)", fg: "var(--info)" },
  warn: { bg: "var(--warn-bg)", bar: "var(--warn)", fg: "oklch(0.50 0.090 60)" },
  neutral: { bg: "var(--neutral-bg)", bar: "var(--faint)", fg: "var(--ink-soft)" },
};

export const INV_ESTADO: Record<string, string> = {
  Pagada: "b-ok",
  Parcial: "b-info",
  Pendiente: "b-warn",
  Vencida: "b-danger",
};

export const TIMELINE_SAMPLE = [
  { t: "Ingreso del caso", d: "01-06 · 09:24", who: "Carla Méndez", state: "done", note: "Recepción de familia y datos del fallecido." },
  { t: "Plan contratado", d: "01-06 · 10:10", who: "Carla Méndez", state: "done", note: "Plan Tradicional · arreglo floral adicional." },
  { t: "Asignación de sala", d: "01-06 · 11:30", who: "Sistema", state: "done", note: "Sala San Francisco reservada 24 h." },
  { t: "Velorio en curso", d: "02-06 · 18:00", who: "Daniela Fuentes", state: "active", note: "Velatorio iniciado. Atención de café activa." },
  { t: "Ceremonia religiosa", d: "04-06 · 11:00", who: "—", state: "todo", note: "Coordinada con parroquia San Crescente." },
  { t: "Sepultación", d: "04-06 · 13:00", who: "—", state: "todo", note: "Parque del Recuerdo — sector Los Olivos." },
];
