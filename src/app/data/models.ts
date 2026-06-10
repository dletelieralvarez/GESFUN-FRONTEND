// Modelos de datos basados en la estructura de base de datos

export interface Tercero {
  id: number;
  uuid: string;
  apellido_paterno: string;
  apellido_materno: string;
  rol?: 'CLIENTE' | 'PROVEEDOR' | 'EMPLEADO' | 'FALLECIDO';
  dv?: string;
  email: string;
  fecha_nacimiento?: string;
  nombre_completo: string;
  nombre_fantasia?: string;
  nombres: string;
  razon_social?: string | null;
  ruc?: string;
  telefono: string;
  tipo_persona: 'persona_natural' | 'empresa';
  activo?: boolean;
  region_id?: number;
  comuna_id: number;
  empresa_id: number;
}

export interface Empresa {
  id: number;
  uuid: string;
  rut: string;
  dv: string;
  razon_social: string;
  activo: boolean;
  usuario_id: number;
  comuna_id: number;
  direccion: string;
}

export interface Sucursal {
  id: number;
  uuid: string;
  codigo: string;
  nombre: string;
  direccion: string;
  telefono: string;
  activo: boolean;
  empresa_id: number;
  comuna_id: number;
}

export interface SuscripcionPlan {
  id: number;
  uuid: string;
  nombre: string;
  descripcion: string;
  valor: number;
  activo: boolean;
  sucursal_id?: number;
}

export interface ProductoServicio {
  id: number;
  uuid: string;
  tipo_item: 'producto' | 'servicio';
  codigo: string;
  nombre: string;
  descripcion: string;
  precio: number;
  activo: boolean;
  afecto: boolean;
  unidad_medida_id: number;
  empresa_id: number;
  categoria?: string;
}

export interface Usuario {
  id: number;
  uuid: string;
  email: string;
  password?: string;
  nombre: string;
  paterno: string;
  materno: string;
  activo: boolean;
  roles: string[];
  tipo_usuario: string;
}

export interface MotivoFallecimiento {
  id: number;
  uuid: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface FormaPago {
  id: number;
  uuid: string;
  codigo: string;
  nombre: string;
  activo: boolean;
}

export interface EstadoCotizacion {
  id: number;
  uuid: string;
  codigo: string;
  nombre: string;
  activo: boolean;
}

export interface TipoMovimiento {
  id: number;
  uuid: string;
  codigo: string;
  nombre: string;
  activo: boolean;
}

export interface UnidadMedida {
  id: number;
  uuid: string;
  codigo: string;
  nombre: string;
  activo: boolean;
}

export interface Region {
  id: number;
  uuid: string;
  codigo: string;
  nombre: string;
}

export interface Comuna {
  id: number;
  uuid: string;
  codigo: string;
  nombre: string;
  region_id: number;
}

// Modelos de negocio (pueden combinar entidades)

export interface Servicio {
  id: number;
  uuid: string;
  folio: string;
  tercero_id: number;
  tercero_nombre: string;
  tercero_rut: string;
  fallecido_nombre: string;
  fallecido_rut: string;
  motivo_fallecimiento_id: number;
  suscripcion_plan_id: number;
  plan_nombre: string;
  estado: 'pendiente' | 'programado' | 'en_curso' | 'completado';
  sucursal_id: number;
  sucursal_nombre: string;
  responsable_usuario_id: number;
  responsable_nombre: string;
  fecha_ingreso: string;
  monto_total: number;
  monto_pagado: number;
  fecha_velatorio?: string;
  fecha_ceremonia?: string;
  destino?: string;
}

export interface Factura {
  id: number;
  uuid: string;
  folio: string;
  servicio_id: number;
  tercero_id: number;
  tercero_nombre: string;
  monto: number;
  monto_abonado: number;
  estado: 'pagada' | 'parcial' | 'pendiente' | 'vencida';
  forma_pago_id?: number;
  fecha_emitida: string;
  fecha_vencimiento: string;
}

export interface Cotizacion {
  id: number;
  uuid: string;
  folio: string;
  tercero_id: number;
  tercero_nombre: string;
  suscripcion_plan_id: number;
  plan_nombre: string;
  monto: number;
  estado: 'borrador' | 'enviada' | 'aceptada' | 'rechazada';
  fecha_creacion: string;
}

export interface InventarioProducto {
  id: number;
  uuid: string;
  producto_id: number;
  producto_codigo: string;
  producto_nombre: string;
  cantidad: number;
  cantidad_minima: number;
  precio_unitario: number;
  categoria: string;
  activo: boolean;
}
