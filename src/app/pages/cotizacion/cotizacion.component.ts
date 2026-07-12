import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { bffApiUrl } from '../../auth-config';
import { AuthService } from '../../services/auth.service';
import { ErrorMessageService } from '../../services/error-message.service';
import { CotizacionPdfData, CotizacionPdfService } from '../../services/cotizacion-pdf.service';
import {
  Comuna,
  FormaPago,
  MotivoFallecimiento,
  ProductoServicio,
  Sucursal,
  SuscripcionPlan
} from '../../data/models';
import { CLP } from '../../data/ui-data';

interface PersonaCotizacionForm {
  uuid: string;
  tipoPersona: 'N' | 'J';
  rut: string;
  dv: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  razonSocial: string;
  email: string;
  telefono: string;
  fechaNacimiento: string;
  comunaUuid: string;
}

interface PlanKitCotizacion {
  uuid?: string;
  productoServicioUuid: string;
  cantidad: number;
  unitario: number;
  observacion?: string;
  producto?: ProductoServicio;
}

interface CatalogoItem {
  id: number;
  uuid: string;
  codigo: string;
  nombre: string;
  activo: boolean;
}

@Component({
  selector: 'app-cotizacion',
  templateUrl: './cotizacion.component.html',
  styleUrls: ['./cotizacion.component.css']
})
export class CotizacionComponent implements OnInit {
  sucursales: Sucursal[] = [];
  planes: SuscripcionPlan[] = [];
  productosServicios: ProductoServicio[] = [];
  formasPago: FormaPago[] = [];
  motivosFallecimiento: MotivoFallecimiento[] = [];
  comunas: Comuna[] = [];
  planKit: PlanKitCotizacion[] = [];
  prestacionesNoDisponibles: string[] = [];
  private catalogoProductosServicios: ProductoServicio[] = [];

  pagador = this.createPersona();
  fallecido = this.createPersona();
  selectedSucursalUuid = '';
  selectedPlanUuid = '';
  selectedFormaPagoUuid = '';
  selectedMotivoUuid = '';
  fecha = this.toDateInput(new Date());
  fechaValidez = this.toDateInput(this.addDays(new Date(), 10));
  fechaFallecimiento = '';
  horaFallecimiento = '';
  lugarFallecimiento = '';
  observacion = '';

  extras = new Set<string>();
  cantidadesExtras: Record<string, number> = {};
  loading = false;
  loadingKit = false;
  loadingPagador = false;
  saving = false;
  error: string | null = null;
  success: string | null = null;
  pagadorExistenteMessage: string | null = null;
  clp = CLP;
  private lastPagadorLookupKey = '';

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private cotizacionPdf: CotizacionPdfService
  ) {}

  async ngOnInit() {
    await this.loadCatalogos();
  }

  get selectedPlan() {
    return this.planes.find(plan => plan.uuid === this.selectedPlanUuid);
  }

  get planesSucursal() {
    return this.planes.filter(plan => {
      const sucursalUuid = (plan as any).sucursal_uuid;
      return !sucursalUuid || sucursalUuid === this.selectedSucursalUuid;
    });
  }

  get adicionalesDisponibles() {
    const incluidos = new Set(this.planKit.map(item => item.productoServicioUuid));
    return this.productosServicios.filter(item => item.activo !== false && item.uuid && !incluidos.has(item.uuid));
  }

  get planTotal() {
    return this.planKit.reduce((sum, item) => sum + item.cantidad * item.unitario, 0);
  }

  get extrasTotal() {
    return this.productosServicios.reduce((sum, item) => {
      return sum + (this.extras.has(item.uuid) ? item.precio * this.getCantidadExtra(item.uuid) : 0);
    }, 0);
  }

  get subtotal() {
    return this.planTotal + this.extrasTotal;
  }

  get iva() {
    const productos = new Map(this.productosServicios.map(item => [item.uuid, item]));
    const kitAfecto = this.planKit.reduce((sum, item) => {
      const producto = productos.get(item.productoServicioUuid);
      return sum + (producto?.afecto !== false ? item.cantidad * item.unitario : 0);
    }, 0);
    const extrasAfectos = this.productosServicios.reduce((sum, item) => {
      if (!this.extras.has(item.uuid) || item.afecto === false) return sum;
      return sum + item.precio * this.getCantidadExtra(item.uuid);
    }, 0);
    return Math.round((kitAfecto + extrasAfectos) * 0.19);
  }

  get total() {
    return this.subtotal + this.iva;
  }

  async onSucursalChange() {
    this.clearMessages();
    const primerPlan = this.planesSucursal[0];
    this.selectedPlanUuid = primerPlan?.uuid || '';
    await this.loadPlanKit();
  }

  async onPlanChange() {
    this.clearMessages();
    await this.loadPlanKit();
  }

  toggleExtra(item: ProductoServicio) {
    if (this.extras.has(item.uuid)) {
      this.extras.delete(item.uuid);
      delete this.cantidadesExtras[item.uuid];
    } else {
      this.extras.add(item.uuid);
      this.cantidadesExtras[item.uuid] = 1;
    }
  }

  setCantidadExtra(uuid: string, value: number) {
    this.cantidadesExtras[uuid] = Math.max(1, Number(value || 1));
  }

  getCantidadExtra(uuid: string) {
    return Math.max(1, Number(this.cantidadesExtras[uuid] || 1));
  }

  isExtraSelected(uuid: string) {
    return this.extras.has(uuid);
  }

  async generarCotizacion() {
    this.clearMessages();

    try {
      const removidos = await this.refreshProductosDisponibles();
      if (removidos.length) {
        this.error = `Se actualizaron las prestaciones porque ya no están activas: ${removidos.join(', ')}. Revisa el nuevo total y vuelve a generar la cotización.`;
        return;
      }
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo validar la disponibilidad de los productos y servicios.');
      return;
    }

    const validationMessage = this.validate();
    if (validationMessage) {
      this.error = validationMessage;
      return;
    }

    this.saving = true;
    try {
      const token = await this.auth.getAccessToken();
      const response = await lastValueFrom(this.http.post(
        `${bffApiUrl}/api/cotizaciones`,
        this.toApiPayload(),
        { headers: { Authorization: `Bearer ${token}` } }
      ));
      const created = this.unwrapPayload<any>(response);
      const numero = created?.numero ?? created?.folio ?? created?.uuid;
      const creadaMessage = numero
        ? `Cotización ${numero} creada correctamente`
        : 'Cotización creada correctamente';
      try {
        await this.cotizacionPdf.generar(this.toPdfData(created, numero));
        this.success = `${creadaMessage} y PDF descargado.`;
      } catch {
        this.success = `${creadaMessage}.`;
        this.error = 'La cotización quedó guardada, pero no se pudo descargar el PDF. Revisa los permisos de descarga del navegador.';
      }
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo crear la cotización.');
    } finally {
      this.saving = false;
    }
  }

  imprimir() {
    window.print();
  }

  onPagadorRutChange() {
    this.pagadorExistenteMessage = null;
    this.lastPagadorLookupKey = '';
    this.pagador.uuid = '';
  }

  async buscarPagadorExistente() {
    const { rut, dv } = this.getRutDvPagador();
    if (!rut || !dv) return;

    const lookupKey = `${rut}-${dv}`;
    if (lookupKey === this.lastPagadorLookupKey) return;
    this.lastPagadorLookupKey = lookupKey;
    this.loadingPagador = true;
    this.pagadorExistenteMessage = null;

    try {
      const token = await this.auth.getAccessToken();
      const headers = { Authorization: `Bearer ${token}` };
      const cliente = await this.buscarTerceroPorRut(headers, rut, dv);

      if (cliente) {
        this.autocompletarPagador(cliente);
        this.pagadorExistenteMessage = 'El cliente ya existe. Se autocompletaron sus datos para esta cotización.';
      }
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo verificar si el cliente ya existe.');
    } finally {
      this.loadingPagador = false;
    }
  }

  private getRutDvPagador() {
    const rutIngresado = String(this.pagador.rut || '').trim();
    const dvIngresado = String(this.pagador.dv || '').trim().toUpperCase();
    const rutCompleto = rutIngresado.match(/^(.+)-([0-9kK])$/);

    if (!dvIngresado && rutCompleto) {
      const rut = this.rutNumerico(rutCompleto[1]);
      const dv = rutCompleto[2].toUpperCase();
      this.pagador.rut = rut ? String(rut) : this.pagador.rut;
      this.pagador.dv = dv;
      return { rut, dv };
    }

    const rut = this.rutNumerico(rutIngresado);
    if (!dvIngresado && rut) {
      const dv = this.calcularDvRut(rut);
      this.pagador.rut = String(rut);
      this.pagador.dv = dv;
      return { rut, dv };
    }

    return { rut, dv: dvIngresado };
  }

  private async buscarTerceroPorRut(headers: { Authorization: string }, rut: number, dv: string) {
    const endpoints = ['/api/clientes', '/api/terceros'];

    for (const endpoint of endpoints) {
      try {
        const response = await lastValueFrom(this.http.get(`${bffApiUrl}${endpoint}`, { headers }));
        const tercero = this.extractPayload<any>(response).find(item => this.esMismoRut(item, rut, dv));
        if (tercero) return tercero;
      } catch (err: any) {
        if (endpoint === '/api/clientes') {
          throw err;
        }
      }
    }

    return null;
  }

  private esMismoRut(item: any, rut: number, dv: string) {
    return this.rutNumerico(String(item.rut ?? item.ruc ?? '')) === rut
      && String(item.dv ?? '').trim().toUpperCase() === dv;
  }

  private async loadCatalogos() {
    this.loading = true;
    this.clearMessages();
    try {
      const token = await this.auth.getAccessToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [sucursales, planes, productos, formasPago, motivos, comunas] = await Promise.all([
        lastValueFrom(this.http.get(`${bffApiUrl}/api/sucursales`, { headers })),
        lastValueFrom(this.http.get(`${bffApiUrl}/api/planes`, { headers })),
        lastValueFrom(this.http.get(`${bffApiUrl}/api/productos-servicios`, { headers })),
        lastValueFrom(this.http.get(`${bffApiUrl}/api/formas-pago`, { headers })),
        lastValueFrom(this.http.get(`${bffApiUrl}/api/motivos-fallecimiento`, { headers })),
        lastValueFrom(this.http.get(`${bffApiUrl}/api/comunas`, { headers }))
      ]);

      this.sucursales = this.extractPayload<any>(sucursales).map((item, index) => this.fromApiSucursal(item, index)).filter(item => item.activo);
      this.planes = this.extractPayload<any>(planes).map((item, index) => this.fromApiPlan(item, index)).filter(item => item.activo);
      this.catalogoProductosServicios = this.extractPayload<any>(productos).map((item, index) => this.fromApiProducto(item, index));
      this.productosServicios = this.catalogoProductosServicios.filter(item => item.activo);
      this.formasPago = this.extractPayload<any>(formasPago).map((item, index) => this.fromApiCatalogo(item, index) as FormaPago).filter(item => item.activo);
      this.motivosFallecimiento = this.extractPayload<any>(motivos).map((item, index) => ({
        ...this.fromApiCatalogo(item, index),
        descripcion: item.descripcion ?? ''
      } as MotivoFallecimiento)).filter(item => item.activo);
      this.comunas = this.extractPayload<any>(comunas).map((item, index) => this.fromApiComuna(item, index));

      this.selectedSucursalUuid = this.sucursales[0]?.uuid || '';
      this.selectedPlanUuid = this.planesSucursal[0]?.uuid || '';
      this.selectedFormaPagoUuid = this.formasPago[0]?.uuid || '';
      this.selectedMotivoUuid = this.motivosFallecimiento[0]?.uuid || '';
      this.pagador.comunaUuid = this.comunas[0]?.uuid || '';
      this.fallecido.comunaUuid = this.comunas[0]?.uuid || '';
      await this.loadPlanKit(headers);
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudieron cargar los datos necesarios para cotizar.');
    } finally {
      this.loading = false;
    }
  }

  private async loadPlanKit(existingHeaders?: { Authorization: string }) {
    this.planKit = [];
    this.prestacionesNoDisponibles = [];
    this.extras.clear();
    this.cantidadesExtras = {};
    if (!this.selectedPlanUuid) return;

    this.loadingKit = true;
    try {
      const headers = existingHeaders ?? { Authorization: `Bearer ${await this.auth.getAccessToken()}` };
      const response = await lastValueFrom(this.http.get(
        `${bffApiUrl}/api/plan-kit/plan/${this.selectedPlanUuid}`,
        { headers }
      ));
      const itemsKit = this.extractPayload<any>(response)
        .filter(item => this.isActivo(item.activo))
        .map(item => {
          const productoServicioUuid = item.productoServicioUuid
            ?? item.producto_servicio_uuid
            ?? item.productoServicio?.uuid;
          const producto = this.catalogoProductosServicios.find(row => row.uuid === productoServicioUuid);
          return {
            uuid: item.uuid,
            productoServicioUuid,
            cantidad: Math.max(1, Number(item.cantidad ?? 1)),
            unitario: Number(item.unitario ?? producto?.precio ?? 0),
            observacion: item.observacion,
            producto
          };
        })
        .filter(item => !!item.productoServicioUuid);

      const noDisponibles = itemsKit.filter(item => !item.producto?.activo);
      this.prestacionesNoDisponibles = noDisponibles.map(item =>
        item.producto?.nombre || this.getNombreProductoKit(item.productoServicioUuid, response) || item.productoServicioUuid
      );
      this.planKit = itemsKit.filter(item => item.producto?.activo);
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo cargar el contenido del plan seleccionado.');
    } finally {
      this.loadingKit = false;
    }
  }

  private validate() {
    if (!this.selectedSucursalUuid || !this.selectedPlanUuid || !this.selectedFormaPagoUuid || !this.selectedMotivoUuid) {
      return 'Selecciona sucursal, plan, motivo de fallecimiento y forma de pago.';
    }
    if (!this.isPersonaCompleta(this.pagador, true)) {
      return 'Completa los datos obligatorios del cliente pagador.';
    }
    if (!this.isPersonaCompleta(this.fallecido, false)) {
      return 'Completa los datos obligatorios del fallecido.';
    }
    if (!this.planKit.length && !this.extras.size) {
      return 'El plan no contiene prestaciones. Selecciona al menos un producto o servicio.';
    }
    return null;
  }

  private isPersonaCompleta(persona: PersonaCotizacionForm, contactoObligatorio: boolean) {
    const identidad = persona.tipoPersona === 'J'
      ? !!persona.razonSocial.trim()
      : !!persona.nombres.trim() && !!persona.apellidoPaterno.trim();
    const contacto = !contactoObligatorio || (!!persona.email.trim() && !!persona.telefono.trim());
    return !!this.rutNumerico(persona.rut) && !!persona.dv.trim() && identidad && contacto && !!persona.comunaUuid;
  }

  private toApiPayload() {
    const detalles = new Map<string, { productoServicioUuid: string; cantidad: number; descuento: number; observacion?: string }>();
    this.planKit.forEach(item => detalles.set(item.productoServicioUuid, {
      productoServicioUuid: item.productoServicioUuid,
      cantidad: item.cantidad,
      descuento: 0,
      observacion: item.observacion || 'Incluido en el plan'
    }));
    this.productosServicios.filter(item => this.extras.has(item.uuid)).forEach(item => {
      const existente = detalles.get(item.uuid);
      detalles.set(item.uuid, {
        productoServicioUuid: item.uuid,
        cantidad: (existente?.cantidad || 0) + this.getCantidadExtra(item.uuid),
        descuento: 0,
        observacion: existente?.observacion || 'Adicional'
      });
    });

    return {
      sucursalUuid: this.selectedSucursalUuid,
      planUuid: this.selectedPlanUuid,
      formaPagoUuid: this.selectedFormaPagoUuid,
      motivoFallecimientoUuid: this.selectedMotivoUuid,
      fecha: this.fecha || undefined,
      fechaValidez: this.fechaValidez || undefined,
      observacion: this.observacion || undefined,
      fechaFallecimiento: this.fechaFallecimiento || undefined,
      horaFallecimiento: this.horaFallecimiento ? `${this.horaFallecimiento}:00` : undefined,
      lugarFallecimiento: this.lugarFallecimiento || undefined,
      pagador: this.toApiPersona(this.pagador, 'CLIENTE'),
      fallecido: this.toApiPersona(this.fallecido),
      detalles: Array.from(detalles.values())
    };
  }

  private toPdfData(created: any, numero: any): CotizacionPdfData {
    const sucursal = this.sucursales.find(item => item.uuid === this.selectedSucursalUuid);
    const plan = this.planes.find(item => item.uuid === this.selectedPlanUuid);
    const formaPago = this.formasPago.find(item => item.uuid === this.selectedFormaPagoUuid);
    const motivo = this.motivosFallecimiento.find(item => item.uuid === this.selectedMotivoUuid);
    const detalles = [
      ...this.planKit.map(item => ({
        codigo: item.producto?.codigo,
        nombre: item.producto?.nombre || 'Prestación del plan',
        tipo: item.producto?.tipo_item === 'servicio' ? 'Servicio' : 'Producto',
        cantidad: item.cantidad,
        unitario: item.unitario,
        total: item.cantidad * item.unitario,
        observacion: item.observacion || 'Incluido en el plan'
      })),
      ...this.productosServicios
        .filter(item => this.extras.has(item.uuid))
        .map(item => {
          const cantidad = this.getCantidadExtra(item.uuid);
          return {
            codigo: item.codigo,
            nombre: item.nombre,
            tipo: item.tipo_item === 'servicio' ? 'Servicio' : 'Producto',
            cantidad,
            unitario: item.precio,
            total: cantidad * item.precio,
            observacion: 'Adicional'
          };
        })
    ];

    return {
      numero: String(numero || 'Sin folio'),
      fecha: created?.fecha ?? this.fecha,
      fechaValidez: created?.fechaValidez ?? created?.fecha_validez ?? this.fechaValidez,
      sucursal: sucursal?.nombre || 'No informada',
      direccionSucursal: sucursal?.direccion,
      telefonoSucursal: sucursal?.telefono,
      plan: plan?.nombre || 'No informado',
      descripcionPlan: plan?.descripcion,
      formaPago: formaPago?.nombre || 'No informada',
      motivoFallecimiento: motivo?.nombre || 'No informado',
      fechaFallecimiento: this.fechaFallecimiento,
      horaFallecimiento: this.horaFallecimiento,
      lugarFallecimiento: this.lugarFallecimiento,
      pagador: this.toPdfPersona(this.pagador),
      fallecido: this.toPdfPersona(this.fallecido),
      detalles,
      subtotal: Number(created?.subtotal ?? created?.neto ?? this.subtotal),
      iva: Number(created?.iva ?? this.iva),
      total: Number(created?.total ?? this.total),
      observacion: this.observacion
    };
  }

  private toPdfPersona(persona: PersonaCotizacionForm) {
    const comuna = this.comunas.find(item => item.uuid === persona.comunaUuid);
    return {
      tipoPersona: persona.tipoPersona,
      rut: `${this.rutNumerico(persona.rut).toLocaleString('es-CL')}-${persona.dv.trim().toUpperCase()}`,
      nombre: persona.tipoPersona === 'J'
        ? persona.razonSocial.trim()
        : [persona.nombres, persona.apellidoPaterno, persona.apellidoMaterno].filter(Boolean).join(' '),
      email: persona.email.trim(),
      telefono: persona.telefono.trim(),
      fechaNacimiento: persona.fechaNacimiento,
      comuna: comuna?.nombre
    };
  }

  private toApiPersona(persona: PersonaCotizacionForm, rol?: string) {
    return {
      tipoPersona: persona.tipoPersona,
      uuid: persona.uuid || undefined,
      terceroUuid: persona.uuid || undefined,
      rut: this.rutNumerico(persona.rut),
      dv: persona.dv.trim().toUpperCase(),
      rol,
      nombreCompleto: persona.tipoPersona === 'N'
        ? [persona.nombres, persona.apellidoPaterno, persona.apellidoMaterno].filter(Boolean).join(' ')
        : persona.razonSocial,
      nombres: persona.tipoPersona === 'N' ? persona.nombres.trim() : undefined,
      apellidoPaterno: persona.tipoPersona === 'N' ? persona.apellidoPaterno.trim() : undefined,
      apellidoMaterno: persona.tipoPersona === 'N' ? persona.apellidoMaterno.trim() || undefined : undefined,
      fechaNacimiento: persona.fechaNacimiento || undefined,
      razonSocial: persona.tipoPersona === 'J' ? persona.razonSocial.trim() : undefined,
      email: persona.email.trim() || undefined,
      telefono: persona.telefono.trim() || undefined,
      comunaUuid: persona.comunaUuid
    };
  }

  private createPersona(): PersonaCotizacionForm {
    return {
      uuid: '',
      tipoPersona: 'N',
      rut: '',
      dv: '',
      nombres: '',
      apellidoPaterno: '',
      apellidoMaterno: '',
      razonSocial: '',
      email: '',
      telefono: '',
      fechaNacimiento: '',
      comunaUuid: ''
    };
  }

  private autocompletarPagador(cliente: any) {
    const tipoPersona = cliente.tipoPersona ?? cliente.tipo_persona;
    const isEmpresa = tipoPersona === 'J' || tipoPersona === 'empresa';
    const nombreCompleto = String(cliente.nombreCompleto ?? cliente.nombre_completo ?? '').trim();
    const nombres = String(cliente.nombres ?? '').trim();
    const apellidoPaterno = String(cliente.apellidoPaterno ?? cliente.apellido_paterno ?? '').trim();
    const apellidoMaterno = String(cliente.apellidoMaterno ?? cliente.apellido_materno ?? '').trim();

    this.pagador.tipoPersona = isEmpresa ? 'J' : 'N';
    this.pagador.uuid = String(cliente.uuid ?? cliente.terceroUuid ?? cliente.tercero_uuid ?? this.pagador.uuid ?? '');
    this.pagador.rut = String(cliente.rut ?? cliente.ruc ?? this.pagador.rut);
    this.pagador.dv = String(cliente.dv ?? this.pagador.dv).trim().toUpperCase();
    this.pagador.nombres = isEmpresa ? '' : nombres || this.extractNombres(nombreCompleto);
    this.pagador.apellidoPaterno = isEmpresa ? '' : apellidoPaterno || this.extractApellidoPaterno(nombreCompleto);
    this.pagador.apellidoMaterno = isEmpresa ? '' : apellidoMaterno || this.extractApellidoMaterno(nombreCompleto);
    this.pagador.razonSocial = isEmpresa
      ? String(cliente.razonSocial ?? cliente.razon_social ?? nombreCompleto).trim()
      : '';
    this.pagador.email = String(cliente.email ?? '').trim();
    this.pagador.telefono = String(cliente.telefono ?? '').trim();
    this.pagador.fechaNacimiento = String(cliente.fechaNacimiento ?? cliente.fecha_nacimiento ?? '');
    this.pagador.comunaUuid = String(
      cliente.comunaUuid
      ?? cliente.comuna_uuid
      ?? cliente.comuna?.uuid
      ?? this.pagador.comunaUuid
    );
  }

  private extractNombres(fullName: string) {
    const parts = fullName.trim().split(' ').filter(Boolean);
    if (parts.length <= 2) return parts[0] || '';
    return parts.slice(0, -2).join(' ');
  }

  private extractApellidoPaterno(fullName: string) {
    const parts = fullName.trim().split(' ').filter(Boolean);
    return parts.length > 1 ? parts[parts.length - 2] : '';
  }

  private extractApellidoMaterno(fullName: string) {
    const parts = fullName.trim().split(' ').filter(Boolean);
    return parts.length > 1 ? parts[parts.length - 1] : '';
  }

  private fromApiSucursal(item: any, index: number): Sucursal {
    return {
      id: Number(item.id ?? index + 1),
      uuid: item.uuid,
      codigo: item.codigo ?? '',
      nombre: item.nombre ?? `Sucursal ${index + 1}`,
      direccion: item.direccion ?? '',
      telefono: item.telefono ?? '',
      activo: this.isActivo(item.activo),
      empresa_id: Number(item.empresaId ?? item.empresa_id ?? 0),
      comuna_id: Number(item.comunaId ?? item.comuna_id ?? 0)
    };
  }

  private fromApiPlan(item: any, index: number): SuscripcionPlan {
    return {
      id: Number(item.id ?? index + 1),
      uuid: item.uuid,
      nombre: item.nombre ?? `Plan ${index + 1}`,
      descripcion: item.descripcion ?? '',
      valor: Number(item.valor ?? 0),
      activo: this.isActivo(item.activo),
      sucursal_id: Number(item.sucursalId ?? item.sucursal_id ?? 0),
      sucursal_uuid: item.sucursalUuid ?? item.sucursal_uuid ?? item.sucursal?.uuid
    } as SuscripcionPlan;
  }

  private fromApiProducto(item: any, index: number): ProductoServicio {
    const tipoItem = item.tipoItem ?? item.tipo_item;
    return {
      id: Number(item.id ?? index + 1),
      uuid: item.uuid,
      tipo_item: tipoItem === 'S' || tipoItem === 'servicio' ? 'servicio' : 'producto',
      codigo: item.codigo ?? '',
      nombre: item.nombre ?? '',
      descripcion: item.descripcion ?? '',
      precio: Number(item.precio ?? 0),
      activo: this.isActivo(item.activo),
      afecto: this.isActivo(item.afecto),
      unidad_medida_id: Number(item.unidadMedidaId ?? item.unidad_medida_id ?? 0),
      empresa_id: Number(item.empresaId ?? item.empresa_id ?? 0),
      categoria: item.categoria ?? (tipoItem === 'S' ? 'Servicio' : 'Producto')
    };
  }

  private fromApiCatalogo(item: any, index: number): CatalogoItem {
    return {
      id: Number(item.id ?? index + 1),
      uuid: item.uuid,
      codigo: item.codigo ?? '',
      nombre: item.nombre ?? '',
      activo: this.isActivo(item.activo)
    };
  }

  private fromApiComuna(item: any, index: number): Comuna {
    return {
      id: Number(item.id ?? index + 1),
      uuid: item.uuid,
      codigo: String(item.codigo ?? ''),
      nombre: item.nombre ?? '',
      region_id: Number(item.regionId ?? item.region_id ?? 0)
    };
  }

  private extractPayload<T>(response: any): T[] {
    const payload = this.unwrapPayload<any>(response);
    return Array.isArray(payload) ? payload : [];
  }

  private unwrapPayload<T>(response: any): T {
    return response?.payload?.payload ?? response?.payload ?? response;
  }

  private rutNumerico(rut: string) {
    return Number(String(rut || '').replace(/\D/g, ''));
  }

  private calcularDvRut(rut: number) {
    let suma = 0;
    let multiplicador = 2;

    for (const digit of String(rut).split('').reverse()) {
      suma += Number(digit) * multiplicador;
      multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }

    const resultado = 11 - (suma % 11);
    if (resultado === 11) return '0';
    if (resultado === 10) return 'K';
    return String(resultado);
  }

  private async refreshProductosDisponibles() {
    const token = await this.auth.getAccessToken();
    const response = await lastValueFrom(this.http.get(`${bffApiUrl}/api/productos-servicios`, {
      headers: { Authorization: `Bearer ${token}` }
    }));
    this.catalogoProductosServicios = this.extractPayload<any>(response).map((item, index) => this.fromApiProducto(item, index));
    this.productosServicios = this.catalogoProductosServicios.filter(item => item.activo);

    const activos = new Set(this.productosServicios.map(item => item.uuid));
    const nombresPorUuid = new Map(this.catalogoProductosServicios.map(item => [item.uuid, item.nombre]));
    const removidosKit = this.planKit.filter(item => !activos.has(item.productoServicioUuid));
    const removidosExtras = Array.from(this.extras).filter(uuid => !activos.has(uuid));
    const removidos = [...removidosKit.map(item => item.productoServicioUuid), ...removidosExtras];

    this.planKit = this.planKit
      .filter(item => activos.has(item.productoServicioUuid))
      .map(item => ({
        ...item,
        producto: this.productosServicios.find(producto => producto.uuid === item.productoServicioUuid)
      }));
    removidosExtras.forEach(uuid => {
      this.extras.delete(uuid);
      delete this.cantidadesExtras[uuid];
    });

    return removidos.map(uuid => nombresPorUuid.get(uuid) || uuid);
  }

  private getNombreProductoKit(uuid: string, response: any) {
    const rawItem = this.extractPayload<any>(response).find(item =>
      (item.productoServicioUuid ?? item.producto_servicio_uuid ?? item.productoServicio?.uuid) === uuid
    );
    return rawItem?.productoServicio?.nombre ?? rawItem?.producto_servicio?.nombre;
  }

  private isActivo(value: any) {
    return value === undefined || value === null || value === true || value === 1 || value === '1';
  }

  private clearMessages() {
    this.error = null;
    this.success = null;
  }

  private getErrorMessage(err: any, fallback: string) {
    return ErrorMessageService.userMessage(err, fallback);
  }

  private addDays(date: Date, days: number) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private toDateInput(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
