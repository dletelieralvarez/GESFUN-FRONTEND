import { Component } from '@angular/core';
import { SERVICIOS, CLP } from '../../data/mock-data';

@Component({
  selector: 'app-casos',
  templateUrl: './casos.component.html',
  styleUrls: ['./casos.component.css']
})
export class CasosComponent {
  cases = SERVICIOS.map(s => ({
    folio: s.folio,
    fallecido: s.fallecido_nombre,
    edad: 0,
    rut: s.fallecido_rut,
    familiar: s.tercero_nombre,
    parentesco: 'Cliente',
    plan: s.plan_nombre,
    estado: s.estado === 'en_curso' ? 'En curso' : s.estado === 'programado' ? 'Programado' : s.estado === 'pendiente' ? 'Pendiente' : 'Completado',
    sala: s.sucursal_nombre,
    velorio: s.fecha_velatorio || '—',
    ceremonia: s.fecha_ceremonia || '—',
    destino: s.destino || '—',
    encargado: s.responsable_nombre,
    ingreso: s.fecha_ingreso,
    total: s.monto_total,
    pagado: s.monto_pagado
  }));
  clp = CLP;
  tab = 'Todas';
  tabs = ['Todas', 'En curso', 'Programado', 'Pendiente', 'Completado'];

  get rows() {
    return this.tab === 'Todas' ? this.cases : this.cases.filter((c) => c.estado === this.tab);
  }

  setTab(value: string) {
    this.tab = value;
  }
}
