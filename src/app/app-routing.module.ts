import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AgendaComponent } from './pages/agenda/agenda.component';
import { CatalogoComponent } from './pages/catalogo/catalogo.component';
import { CasosComponent } from './pages/casos/casos.component';
import { ClientesComponent } from './pages/clientes/clientes.component';
import { EmpleadosComponent } from './pages/empleados/empleados.component';
import { ProveedoresComponent } from './pages/proveedores/proveedores.component';
import { CotizacionComponent } from './pages/cotizacion/cotizacion.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { FacturacionComponent } from './pages/facturacion/facturacion.component';
import { InventarioComponent } from './pages/inventario/inventario.component';
import { PlanesComponent } from './pages/planes/planes.component';
import { ProductosServiciosComponent } from './pages/productos-servicios/productos-servicios.component';
import { RecursosComponent } from './pages/recursos/recursos.component';
import { SucursalesComponent } from './pages/sucursales/sucursales.component';
import { UsuariosComponent } from './pages/usuarios/usuarios.component';
import { LoginComponent } from './pages/login/login.component';
import { AuthCallbackComponent } from './pages/auth-callback/auth-callback.component';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent, data: { title: 'Panel general', crumb: 'Inicio' } },
  { path: 'casos', component: CasosComponent, data: { title: 'Servicios funerarios', crumb: 'Operación / Servicios' } },
  { path: 'agenda', component: AgendaComponent, data: { title: 'Agenda de salas', crumb: 'Operación / Agenda' } },
  { path: 'catalogo', component: CatalogoComponent, data: { title: 'Catálogo y planes', crumb: 'Comercial / Catálogo' } },
  { path: 'cotizacion', component: CotizacionComponent, data: { title: 'Cotizaciones', crumb: 'Comercial / Cotizaciones' } },
  { path: 'login', component: LoginComponent, data: { title: 'Login' } },
  { path: 'auth/callback', component: AuthCallbackComponent, data: { title: 'Autenticacion' } },
  { path: 'clientes', component: ClientesComponent, data: { title: 'Clientes', crumb: 'Comercial / Clientes' } },
  { path: 'usuarios', component: UsuariosComponent, data: { title: 'Administración de usuarios', crumb: 'Administración / Usuarios' } },
  { path: 'empleados', component: EmpleadosComponent, data: { title: 'Administración de empleados', crumb: 'Administración / Empleados' } },
  { path: 'proveedores', component: ProveedoresComponent, data: { title: 'Administración de proveedores', crumb: 'Administración / Proveedores' } },
  { path: 'productos-servicios', component: ProductosServiciosComponent, data: { title: 'Productos y servicios', crumb: 'Administración / Productos y servicios' } },
  { path: 'planes', component: PlanesComponent, data: { title: 'Planes', crumb: 'Administración / Planes' } },
  { path: 'recursos', component: RecursosComponent, data: { title: 'Recursos', crumb: 'Administración / Recursos' } },
  { path: 'sucursales', component: SucursalesComponent, data: { title: 'Administración de sucursales', crumb: 'Administración / Sucursales' } },
  { path: 'inventario', component: InventarioComponent, data: { title: 'Inventario', crumb: 'Recursos / Inventario' } },
  { path: 'facturacion', component: FacturacionComponent, data: { title: 'Facturación', crumb: 'Finanzas / Facturación' } },
  { path: '**', redirectTo: 'login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
