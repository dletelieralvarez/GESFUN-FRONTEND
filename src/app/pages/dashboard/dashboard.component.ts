import { Component } from '@angular/core';
import { AGENDA, SERVICIOS, CLP, INVENTARIO_PRODUCTOS } from '../../data/mock-data';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  cases = SERVICIOS.map(s => ({
    folio: s.folio,
    fallecido: s.fallecido_nombre,
    plan: s.plan_nombre,
    sala: s.sucursal_nombre,
    estado: s.estado === 'en_curso' ? 'En curso' : s.estado === 'programado' ? 'Programado' : s.estado === 'pendiente' ? 'Pendiente' : 'Completado',
    pagado: s.monto_pagado,
    total: s.monto_total
  }));
  agenda = AGENDA;
  inventory = INVENTARIO_PRODUCTOS.map(ip => ({
    item: ip.producto_nombre,
    sku: ip.producto_codigo,
    stock: ip.cantidad,
    min: ip.cantidad_minima
  }));
  clp = CLP;
  math = Math;

  get activos() {
    return this.cases.filter((c) => c.estado === 'En curso' || c.estado === 'Programado').length;
  }

  get hoy() {
    return this.agenda.filter((a) => a.tipo === 'Velorio' || a.tipo === 'Ceremonia').length;
  }

  get todayAgenda() {
    return this.agenda.filter((a) => a.color !== 'neutral').slice(0, 4);
  }

  formatHour(hour: number) {
    return hour.toString().padStart(2, '0') + ':00';
  }

  get ingresos() {
    return this.cases.filter((c) => c.estado !== 'Pendiente').reduce((sum, c) => sum + c.pagado, 0);
  }

  get lowStock() {
    return this.inventory.filter((item) => item.stock < item.min);
  }

  get activeCases() {
    return this.cases.filter((c) => c.estado === 'En curso' || c.estado === 'Programado');
  }
}
