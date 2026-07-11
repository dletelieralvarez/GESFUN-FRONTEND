import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { bffApiUrl } from '../../auth-config';
import { CLP } from '../../data/ui-data';
import { AuthService } from '../../services/auth.service';

interface CatalogoItem {
  uuid: string;
  codigo: string;
  nombre: string;
  activo: boolean;
  email?: string;
  tipoMvto?: string;
}

interface ProductoInventario extends CatalogoItem {
  precio: number;
  categoria: string;
  tipoItem: string;
  afecto: boolean;
}

interface StockInventario {
  sucursalUuid: string;
  sucursalCodigo: string;
  sucursalNombre: string;
  productoUuid: string;
  productoCodigo: string;
  productoNombre: string;
  unidadMedidaUuid: string;
  unidadMedidaCodigo: string;
  unidadMedidaNombre: string;
  totalEntradas: number;
  totalSalidas: number;
  stockActual: number;
}

interface EntradaDetalleForm {
  productoUuid: string;
  cantidad: number;
  costoUnitario: number;
  descuento: number;
  observacion: string;
}

interface EntradaForm {
  sucursalUuid: string;
  tipoMovimientoUuid: string;
  formaPagoUuid: string;
  terceroUuid: string;
  recibidoPorUuid: string;
  usuarioUuid: string;
  fechaDocumento: string;
  fechaRecepcion: string;
  fechaPago: string;
  numeroOc: string;
  numeroGuia: string;
  numeroFactura: string;
  observacion: string;
  detalles: EntradaDetalleForm[];
}

@Component({
  selector: 'app-inventario',
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.css']
})
export class InventarioComponent implements OnInit {
  sucursales: CatalogoItem[] = [];
  tiposMovimiento: CatalogoItem[] = [];
  formasPago: CatalogoItem[] = [];
  proveedores: CatalogoItem[] = [];
  empleados: CatalogoItem[] = [];
  usuarios: CatalogoItem[] = [];
  productos: ProductoInventario[] = [];
  stock: StockInventario[] = [];

  selectedSucursalUuid = '';
  filtro = '';
  loading = false;
  loadingStock = false;
  saving = false;
  formVisible = false;
  error: string | null = null;
  success: string | null = null;
  catalogoWarning: string | null = null;
  clp = CLP;
  form: EntradaForm = this.createForm();

  constructor(private http: HttpClient, private auth: AuthService) {}

  async ngOnInit() {
    await this.loadCatalogos();
  }

  get rows() {
    const term = this.filtro.trim().toLocaleLowerCase('es-CL');
    if (!term) return this.stock;
    return this.stock.filter(item =>
      [item.productoCodigo, item.productoNombre, item.unidadMedidaNombre]
        .some(value => String(value || '').toLocaleLowerCase('es-CL').includes(term))
    );
  }

  get valorTotal() {
    const precioPorUuid = new Map(this.productos.map(item => [item.uuid, item.precio]));
    return this.stock.reduce((sum, item) => sum + item.stockActual * (precioPorUuid.get(item.productoUuid) || 0), 0);
  }

  get totalUnidades() {
    return this.stock.reduce((sum, item) => sum + item.stockActual, 0);
  }

  get productosConStock() {
    return this.stock.filter(item => item.stockActual > 0).length;
  }

  get totalProductosSucursal() {
    return this.stock.length;
  }

  get totalEntrada() {
    return this.form.detalles.reduce((sum, item) => {
      const neto = Math.max(0, Number(item.cantidad || 0) * Number(item.costoUnitario || 0) - Number(item.descuento || 0));
      return sum + neto;
    }, 0);
  }

  get totalProductosEntrada() {
    return this.form.detalles.filter(item => item.productoUuid).length;
  }

  get totalUnidadesEntrada() {
    return this.form.detalles.reduce((sum, item) => sum + Number(item.cantidad || 0), 0);
  }

  get tiposEntrada() {
    const entradas = this.tiposMovimiento.filter(item => {
      const value = `${item.codigo} ${item.nombre}`.toLocaleLowerCase('es-CL');
      return item.tipoMvto === 'E' || value.includes('entrada') || value.includes('ingreso') || value === 'e';
    });
    return entradas.length ? entradas : this.tiposMovimiento;
  }

  async onSucursalChange() {
    this.form.sucursalUuid = this.selectedSucursalUuid;
    await this.loadStock();
  }

  openEntrada() {
    this.clearMessages();
    this.form = this.createForm();
    this.form.sucursalUuid = this.selectedSucursalUuid;
    this.form.tipoMovimientoUuid = this.tiposEntrada[0]?.uuid || '';
    this.form.formaPagoUuid = this.formasPago[0]?.uuid || '';
    this.form.terceroUuid = this.proveedores[0]?.uuid || '';
    this.form.usuarioUuid = this.getCurrentUserUuid();
    this.form.detalles = [this.createDetalle()];
    this.formVisible = true;
  }

  cancelEntrada() {
    this.formVisible = false;
    this.form = this.createForm();
  }

  addDetalle() {
    this.form.detalles.push(this.createDetalle());
  }

  removeDetalle(index: number) {
    if (this.form.detalles.length === 1) {
      this.form.detalles[0] = this.createDetalle();
      return;
    }
    this.form.detalles.splice(index, 1);
  }

  onProductoChange(detalle: EntradaDetalleForm) {
    const producto = this.productos.find(item => item.uuid === detalle.productoUuid);
    if (producto) {
      detalle.costoUnitario = producto.precio;
    }
  }

  productoDisponible(productoUuid: string, currentIndex: number) {
    return !this.form.detalles.some((item, index) => index !== currentIndex && item.productoUuid === productoUuid);
  }

  async registrarEntrada() {
    this.clearMessages();
    const validation = this.validateEntrada();
    if (validation) {
      this.error = validation;
      return;
    }

    this.saving = true;
    try {
      const token = await this.auth.getAccessToken();
      const response = await lastValueFrom(this.http.post(
        `${bffApiUrl}/api/inventario/entradas`,
        this.toApiPayload(),
        { headers: { Authorization: `Bearer ${token}` } }
      ));
      const created = this.unwrapPayload<any>(response);
      const numero = created?.numMovimiento ?? created?.numero ?? created?.uuid;
      this.formVisible = false;
      await this.loadStock();
      this.success = numero
        ? `Entrada de inventario ${numero} registrada correctamente.`
        : 'Entrada de inventario registrada correctamente.';
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo registrar la entrada de inventario.');
    } finally {
      this.saving = false;
    }
  }

  trackByProducto(index: number, item: StockInventario) {
    return item.productoUuid || index;
  }

  trackByDetalle(index: number) {
    return index;
  }

  private async loadCatalogos() {
    this.loading = true;
    this.clearMessages();
    this.catalogoWarning = null;
    try {
      const token = await this.auth.getAccessToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [
        sucursales,
        tipos,
        formasPago,
        proveedores,
        empleados,
        usuarios,
        productos
      ] = await Promise.all([
        this.getCatalogo(`${bffApiUrl}/api/sucursales`, headers, 'sucursales', true),
        this.getCatalogo(`${bffApiUrl}/api/tipos-movimiento`, headers, 'tipos de movimiento', true),
        this.getCatalogo(`${bffApiUrl}/api/formas-pago`, headers, 'formas de pago'),
        this.getCatalogo(`${bffApiUrl}/api/proveedores`, headers, 'proveedores'),
        this.getCatalogo(`${bffApiUrl}/api/empleados`, headers, 'empleados'),
        this.getCatalogo(`${bffApiUrl}/api/usuarios`, headers, 'usuarios', true),
        this.getCatalogo(`${bffApiUrl}/api/productos-servicios`, headers, 'productos', true)
      ]);

      this.sucursales = sucursales.map(item => this.fromCatalogo(item)).filter(item => item.activo);
      this.tiposMovimiento = tipos.map(item => this.fromCatalogo(item)).filter(item => item.activo);
      this.formasPago = formasPago.map(item => this.fromCatalogo(item)).filter(item => item.activo);
      this.proveedores = proveedores.map(item => ({
        ...this.fromCatalogo(item),
        nombre: item.nombreCompleto ?? item.nombre_completo ?? item.razonSocial ?? item.razon_social ?? 'Proveedor'
      })).filter(item => item.activo);
      this.empleados = empleados.map(item => ({
        ...this.fromCatalogo(item),
        nombre: item.nombreCompleto ?? item.nombre_completo
          ?? [item.nombres, item.apellidoPaterno ?? item.apellido_paterno, item.apellidoMaterno ?? item.apellido_materno]
            .filter(Boolean).join(' ')
          ?? 'Empleado'
      })).filter(item => item.activo);
      this.usuarios = usuarios.map(item => ({
        ...this.fromCatalogo(item),
        nombre: [item.nombre, item.paterno, item.materno].filter(Boolean).join(' ') || item.email || 'Usuario',
        email: item.email
      })).filter(item => item.activo);
      this.productos = productos
        .map(item => this.fromProducto(item))
        .filter(item => item.activo && item.tipoItem === 'P');

      const faltantesCriticosParaCompra: string[] = [];
      if (!this.formasPago.length) faltantesCriticosParaCompra.push('formas de pago');
      if (!this.proveedores.length) faltantesCriticosParaCompra.push('proveedores');
      this.catalogoWarning = faltantesCriticosParaCompra.length
        ? `No se pudieron cargar ${faltantesCriticosParaCompra.join(' y ')}. Igual puedes guardar la entrada y completar esos datos más tarde.`
        : null;

      this.selectedSucursalUuid = this.sucursales[0]?.uuid || '';
      this.form = this.createForm();
      await this.loadStock(headers);
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudieron cargar los datos necesarios para inventario.');
    } finally {
      this.loading = false;
    }
  }

  private async loadStock(existingHeaders?: { Authorization: string }) {
    this.stock = [];
    if (!this.selectedSucursalUuid) return;

    this.loadingStock = true;
    try {
      const headers = existingHeaders ?? { Authorization: `Bearer ${await this.auth.getAccessToken()}` };
      const response = await lastValueFrom(this.http.get(`${bffApiUrl}/api/inventario/stock`, {
        headers,
        params: { sucursalUuid: this.selectedSucursalUuid }
      }));
      this.stock = this.extractPayload<any>(response).map(item => ({
        sucursalUuid: item.sucursalUuid ?? '',
        sucursalCodigo: item.sucursalCodigo ?? '',
        sucursalNombre: item.sucursalNombre ?? '',
        productoUuid: item.productoUuid ?? '',
        productoCodigo: item.productoCodigo ?? '',
        productoNombre: item.productoNombre ?? '',
        unidadMedidaUuid: item.unidadMedidaUuid ?? '',
        unidadMedidaCodigo: item.unidadMedidaCodigo ?? '',
        unidadMedidaNombre: item.unidadMedidaNombre ?? '',
        totalEntradas: Number(item.totalEntradas ?? 0),
        totalSalidas: Number(item.totalSalidas ?? 0),
        stockActual: Number(item.stockActual ?? 0)
      }));
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo consultar el stock de la sucursal.');
    } finally {
      this.loadingStock = false;
    }
  }

  private async getCatalogo(url: string, headers: { Authorization: string }, nombre: string, required = false) {
    try {
      const response = await lastValueFrom(this.http.get(url, { headers }));
      return this.extractPayload<any>(response);
    } catch (err: any) {
      if (required) {
        throw new Error(`No se pudo cargar ${nombre}. ${this.getErrorMessage(err, '')}`.trim());
      }
      console.warn(`No se pudo cargar ${nombre}`, err);
      return [];
    }
  }

  private validateEntrada() {
    if (!this.form.sucursalUuid || !this.form.tipoMovimientoUuid || !this.form.usuarioUuid) {
      return 'Selecciona sucursal, tipo de movimiento y usuario responsable.';
    }
    if (!this.form.fechaDocumento || !this.form.fechaRecepcion) {
      return 'Indica la fecha del documento y la fecha de recepción.';
    }
    if (!this.form.detalles.length) {
      return 'Agrega al menos un producto a la entrada.';
    }
    if (this.form.detalles.some(item => !item.productoUuid || Number(item.cantidad) <= 0 || Number(item.costoUnitario) < 0)) {
      return 'Cada detalle debe tener producto, cantidad mayor que cero y costo unitario válido.';
    }
    const productos = this.form.detalles.map(item => item.productoUuid);
    if (new Set(productos).size !== productos.length) {
      return 'Un producto no puede repetirse dentro de la misma entrada.';
    }
    return null;
  }

  private toApiPayload() {
    return {
      sucursalUuid: this.form.sucursalUuid,
      tipoMovimientoUuid: this.form.tipoMovimientoUuid,
      formaPagoUuid: this.form.formaPagoUuid || undefined,
      terceroUuid: this.form.terceroUuid || undefined,
      recibidoPorUuid: this.form.recibidoPorUuid || undefined,
      usuarioUuid: this.form.usuarioUuid,
      fechaDocumento: this.form.fechaDocumento || undefined,
      fechaRecepcion: this.form.fechaRecepcion || undefined,
      fechaPago: this.form.fechaPago || undefined,
      numeroOc: this.form.numeroOc.trim() || undefined,
      numeroGuia: this.form.numeroGuia.trim() || undefined,
      numeroFactura: this.form.numeroFactura.trim() || undefined,
      observacion: this.form.observacion.trim() || undefined,
      detalles: this.form.detalles.map(item => ({
        productoUuid: item.productoUuid,
        cantidad: Number(item.cantidad),
        costoUnitario: Number(item.costoUnitario),
        descuento: Number(item.descuento || 0),
        observacion: item.observacion.trim() || undefined
      }))
    };
  }

  private createForm(): EntradaForm {
    const today = this.toDateInput(new Date());
    return {
      sucursalUuid: this.selectedSucursalUuid,
      tipoMovimientoUuid: '',
      formaPagoUuid: '',
      terceroUuid: '',
      recibidoPorUuid: '',
      usuarioUuid: '',
      fechaDocumento: today,
      fechaRecepcion: today,
      fechaPago: today,
      numeroOc: '',
      numeroGuia: '',
      numeroFactura: '',
      observacion: '',
      detalles: []
    };
  }

  private createDetalle(): EntradaDetalleForm {
    return {
      productoUuid: '',
      cantidad: 1,
      costoUnitario: 0,
      descuento: 0,
      observacion: ''
    };
  }

  private getCurrentUserUuid() {
    const email = this.auth.getActiveAccount()?.username?.toLocaleLowerCase('es-CL');
    return this.usuarios.find(item => item.email?.toLocaleLowerCase('es-CL') === email)?.uuid
      || this.usuarios[0]?.uuid
      || '';
  }

  private fromCatalogo(item: any): CatalogoItem {
    return {
      uuid: String(item.uuid ?? ''),
      codigo: String(item.codigo ?? ''),
      nombre: String(item.nombre ?? ''),
      activo: this.isActivo(item.activo),
      tipoMvto: String(item.tipoMvto ?? item.tipo_mvto ?? item.tipoMovimiento ?? '').toUpperCase() || undefined
    };
  }

  private fromProducto(item: any): ProductoInventario {
    const tipoItem = String(item.tipoItem ?? item.tipo_item ?? 'P').toUpperCase();
    return {
      ...this.fromCatalogo(item),
      precio: Number(item.precio ?? 0),
      categoria: item.categoria ?? 'Producto',
      tipoItem: tipoItem === 'S' || tipoItem === 'SERVICIO' ? 'S' : 'P',
      afecto: this.isActivo(item.afecto)
    };
  }

  private extractPayload<T>(response: any): T[] {
    const payload = this.unwrapPayload<any>(response);
    if (Array.isArray(payload)) return payload;
    return payload?.content ?? payload?.items ?? [];
  }

  private unwrapPayload<T>(response: any): T {
    return response?.payload?.payload ?? response?.payload ?? response;
  }

  private isActivo(value: any) {
    return value === undefined
      || value === null
      || value === true
      || value === 1
      || value === '1'
      || String(value).toLocaleLowerCase('es-CL') === 'true';
  }

  private clearMessages() {
    this.error = null;
    this.success = null;
  }

  private getErrorMessage(err: any, fallback: string) {
    if (err?.status === 0) {
      return 'No se pudo conectar con el servidor. Verifica que el BFF y el microservicio de inventario estén disponibles.';
    }
    const validation = err?.error?.errors ?? err?.error?.validationErrors;
    if (Array.isArray(validation) && validation.length) {
      return validation.map((item: any) => item.defaultMessage ?? item.message ?? item).join(' ');
    }
    if (validation && typeof validation === 'object') {
      return Object.values(validation).join(' ');
    }
    return err?.error?.message || err?.message || fallback;
  }

  private toDateInput(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
