import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { TopbarComponent } from './layout/topbar/topbar.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { CasosComponent } from './pages/casos/casos.component';
import { AgendaComponent } from './pages/agenda/agenda.component';
import { CatalogoComponent } from './pages/catalogo/catalogo.component';
import { CotizacionComponent } from './pages/cotizacion/cotizacion.component';
import { CotizacionesComponent } from './pages/cotizaciones/cotizaciones.component';
import { ClientesComponent } from './pages/clientes/clientes.component';
import { EmpleadosComponent } from './pages/empleados/empleados.component';
import { ProveedoresComponent } from './pages/proveedores/proveedores.component';
import { LoginComponent } from './pages/login/login.component';
import { AuthCallbackComponent } from './pages/auth-callback/auth-callback.component';
import { DocumentacionComponent } from './pages/documentacion/documentacion.component';
import { InventarioComponent } from './pages/inventario/inventario.component';
import { PlanesComponent } from './pages/planes/planes.component';
import { ProductosServiciosComponent } from './pages/productos-servicios/productos-servicios.component';
import { FacturacionComponent } from './pages/facturacion/facturacion.component';
import { SucursalesComponent } from './pages/sucursales/sucursales.component';
import { UsuariosComponent } from './pages/usuarios/usuarios.component';
import { RecursosComponent } from './pages/recursos/recursos.component';
import { UiModule } from './ui/ui.module';
import { MsalModule, MsalRedirectComponent } from '@azure/msal-angular';
import { PublicClientApplication, InteractionType } from '@azure/msal-browser';
import { loginRequest, msalConfig } from './auth-config';
import { AuthInterceptor } from './interceptors/auth.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    SidebarComponent,
    TopbarComponent,
    DashboardComponent,
    CasosComponent,
    AgendaComponent,
    CatalogoComponent,
    CotizacionComponent,
    ClientesComponent,
    EmpleadosComponent,
    ProveedoresComponent,
    InventarioComponent,
    PlanesComponent,
    ProductosServiciosComponent,
    DocumentacionComponent,
    FacturacionComponent,
    UsuariosComponent,
    RecursosComponent,
    SucursalesComponent,
    LoginComponent,
    AuthCallbackComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
    UiModule,
    CotizacionesComponent,
    MsalModule.forRoot(new PublicClientApplication(msalConfig), {
      interactionType: InteractionType.Redirect,
      authRequest: loginRequest
    }, {
      interactionType: InteractionType.Redirect,
      protectedResourceMap: new Map()
    })
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent, MsalRedirectComponent]
})
export class AppModule { }
