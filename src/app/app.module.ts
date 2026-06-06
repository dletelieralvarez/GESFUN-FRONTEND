import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { TopbarComponent } from './layout/topbar/topbar.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { CasosComponent } from './pages/casos/casos.component';
import { AgendaComponent } from './pages/agenda/agenda.component';
import { CatalogoComponent } from './pages/catalogo/catalogo.component';
import { CotizacionComponent } from './pages/cotizacion/cotizacion.component';
import { ClientesComponent } from './pages/clientes/clientes.component';
import { EmpleadosComponent } from './pages/empleados/empleados.component';
import { ProveedoresComponent } from './pages/proveedores/proveedores.component';
import { LoginComponent } from './pages/login/login.component';
import { AuthCallbackComponent } from './pages/auth-callback/auth-callback.component';
import { InventarioComponent } from './pages/inventario/inventario.component';
import { PlanesComponent } from './pages/planes/planes.component';
import { ProductosServiciosComponent } from './pages/productos-servicios/productos-servicios.component';
import { FacturacionComponent } from './pages/facturacion/facturacion.component';
import { SucursalesComponent } from './pages/sucursales/sucursales.component';
import { UsuariosComponent } from './pages/usuarios/usuarios.component';
import { UiModule } from './ui/ui.module';
import { MsalInterceptor, MsalInterceptorConfiguration, MsalModule, MsalRedirectComponent } from '@azure/msal-angular';
import { PublicClientApplication, InteractionType } from '@azure/msal-browser';
import { bffApiScope, bffApiUrl, loginRequest, msalConfig } from './auth-config';

const msalInterceptorConfig: MsalInterceptorConfiguration = {
  interactionType: InteractionType.Redirect,
  protectedResourceMap: new Map<string, string[]>([
    [bffApiUrl, [bffApiScope]]
  ])
};

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
    FacturacionComponent,
    UsuariosComponent,
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
    MsalModule.forRoot(new PublicClientApplication(msalConfig), {
      interactionType: InteractionType.Redirect,
      authRequest: loginRequest
    }, msalInterceptorConfig)
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: MsalInterceptor, multi: true }
  ],
  bootstrap: [AppComponent, MsalRedirectComponent]
})
export class AppModule { }
