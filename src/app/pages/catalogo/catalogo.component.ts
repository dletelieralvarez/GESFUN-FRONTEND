import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { CLP } from '../../data/ui-data';
import { ProductoServicio, SuscripcionPlan } from '../../data/models';
import { bffApiUrl } from '../../auth-config';
import { AuthService } from '../../services/auth.service';

interface CatalogPlan extends SuscripcionPlan {
  items: string[];
  popular: boolean;
}

@Component({
  selector: 'app-catalogo',
  templateUrl: './catalogo.component.html',
  styleUrls: ['./catalogo.component.css']
})
export class CatalogoComponent implements OnInit {
  plans: CatalogPlan[] = [];
  servicios: ProductoServicio[] = [];
  loading = false;
  error: string | null = null;
  clp = CLP;

  constructor(private http: HttpClient, private auth: AuthService) {}

  async ngOnInit() {
    await this.loadCatalogo();
  }

  async loadCatalogo() {
    this.loading = true;
    this.error = null;

    try {
      const token = await this.auth.getAccessToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [planesResponse, productosResponse] = await Promise.all([
        lastValueFrom(this.http.get(`${bffApiUrl}/api/planes`, { headers })),
        lastValueFrom(this.http.get(`${bffApiUrl}/api/productos-servicios`, { headers }))
      ]);

      const productos = this.extractPayload<any>(productosResponse)
        .map((item, index) => this.fromApiProductoServicio(item, index));
      this.servicios = productos.filter(item => item.activo && item.tipo_item === 'servicio');

      const planes = this.extractPayload<any>(planesResponse)
        .map((item, index) => this.fromApiPlan(item, index))
        .filter(plan => plan.activo);

      this.plans = await Promise.all(planes.map((plan, index) => this.loadPlanKit(plan, index, headers)));
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo cargar el catalogo y los planes.');
    } finally {
      this.loading = false;
    }
  }

  trackById(index: number, item: { id: number; uuid: string }) {
    return item.uuid || item.id;
  }

  private async loadPlanKit(plan: SuscripcionPlan, index: number, headers: { Authorization: string }): Promise<CatalogPlan> {
    try {
      const response = await lastValueFrom(this.http.get(`${bffApiUrl}/api/plan-kit/plan/${plan.uuid}`, { headers }));
      const kit = this.extractPayload<any>(response).filter(item => item.activo === undefined || item.activo === true || item.activo === 1);
      const items = kit.map(item => {
        const productoUuid = item.productoServicioUuid ?? item.producto_servicio_uuid ?? item.productoServicio?.uuid;
        const producto = this.servicios.find(row => row.uuid === productoUuid);
        const nombre = producto?.nombre || item.productoServicio?.nombre || 'Prestacion incluida';
        const cantidad = Number(item.cantidad || 1);
        return cantidad > 1 ? `${cantidad} x ${nombre}` : nombre;
      });
      const valor = kit.reduce((sum, item) => sum + Number(item.cantidad || 1) * Number(item.unitario || 0), 0);
      return { ...plan, valor: valor || plan.valor, items, popular: index === 1 };
    } catch {
      return { ...plan, items: [], popular: index === 1 };
    }
  }

  private fromApiPlan(item: any, index: number): SuscripcionPlan {
    return {
      id: Number(item.id ?? index + 1),
      uuid: item.uuid,
      nombre: item.nombre ?? '',
      descripcion: item.descripcion ?? '',
      valor: Number(item.valor ?? 0),
      activo: item.activo === undefined || item.activo === true || item.activo === 1,
      sucursal_id: Number(item.sucursal_id ?? item.sucursalId ?? 0)
    };
  }

  private fromApiProductoServicio(item: any, index: number): ProductoServicio {
    const tipoItem = item.tipoItem ?? item.tipo_item;
    return {
      id: Number(item.id ?? index + 1),
      uuid: item.uuid,
      tipo_item: tipoItem === 'S' || tipoItem === 'servicio' ? 'servicio' : 'producto',
      codigo: item.codigo ?? '',
      nombre: item.nombre ?? '',
      descripcion: item.descripcion ?? '',
      precio: Number(item.precio ?? 0),
      activo: item.activo === undefined || item.activo === true || item.activo === 1,
      afecto: item.afecto === undefined || item.afecto === true || item.afecto === 1,
      unidad_medida_id: Number(item.unidad_medida_id ?? 0),
      empresa_id: Number(item.empresa_id ?? 0),
      categoria: item.categoria ?? 'Servicios'
    };
  }

  private extractPayload<T>(response: any): T[] {
    const payload = response?.payload?.payload ?? response?.payload ?? response;
    return Array.isArray(payload) ? payload : [];
  }

  private getErrorMessage(err: any, fallback: string) {
    if (err?.status === 0) return 'No se pudo conectar con el servidor. Verifica que el BFF esté disponible.';
    return err?.error?.message || err?.message || fallback;
  }
}
