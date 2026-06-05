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
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { LoginComponent } from './pages/login/login.component';
import { InventarioComponent } from './pages/inventario/inventario.component';
import { FacturacionComponent } from './pages/facturacion/facturacion.component';
import { SucursalesComponent } from './pages/sucursales/sucursales.component';
import { UsuariosComponent } from './pages/usuarios/usuarios.component';
import { UiModule } from './ui/ui.module';
import { MsalModule } from '@azure/msal-angular';
import { PublicClientApplication, InteractionType } from '@azure/msal-browser';
import { msalConfig, loginRequest } from './auth-config';

const msalInterceptorConfig: any = {
  interactionType: InteractionType.Popup,
  protectedResourceMap: new Map<any, string[]>()
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
    InventarioComponent,
    FacturacionComponent,
    UsuariosComponent,
    SucursalesComponent,
    LoginComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
    UiModule,
    MsalModule.forRoot(new PublicClientApplication(msalConfig), {
      interactionType: InteractionType.Popup,
      authRequest: loginRequest
    }, msalInterceptorConfig)
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
