import { Component } from '@angular/core';
import { CLP, INVOICES, INV_ESTADO } from '../../data/mock-data';

@Component({
  selector: 'app-facturacion',
  templateUrl: './facturacion.component.html',
  styleUrls: ['./facturacion.component.css']
})
export class FacturacionComponent {
  invoices = INVOICES;
  invEstado = INV_ESTADO;
  tabs = ['Todas', 'Pendiente', 'Parcial', 'Pagada', 'Vencida'];
  tab = 'Todas';
  clp = CLP;

  get rows() {
    return this.tab === 'Todas' ? this.invoices : this.invoices.filter((item) => item.estado === this.tab);
  }

  get porCobrar() {
    return this.invoices.reduce((sum, invoice) => sum + (invoice.monto - invoice.abonado), 0);
  }

  get cobrado() {
    return this.invoices.reduce((sum, invoice) => sum + invoice.abonado, 0);
  }

  get vencidas() {
    return this.invoices.filter((invoice) => invoice.estado === 'Vencida').length;
  }
}
