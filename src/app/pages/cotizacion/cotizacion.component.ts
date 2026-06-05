import { Component } from '@angular/core';
import { CLP, PLANS, SERVICIOS_SUELTOS } from '../../data/mock-data';

@Component({
  selector: 'app-cotizacion',
  templateUrl: './cotizacion.component.html',
  styleUrls: ['./cotizacion.component.css']
})
export class CotizacionComponent {
  plans = PLANS;
  servicios = SERVICIOS_SUELTOS;
  extras = new Set<number>([1, 4]);
  clp = CLP;

  toggleExtra(index: number) {
    if (this.extras.has(index)) {
      this.extras.delete(index);
    } else {
      this.extras.add(index);
    }
  }

  selectedPlan = this.plans[1];

  setPlan(plan: any) {
    this.selectedPlan = plan;
  }

  get extrasTotal() {
    return SERVICIOS_SUELTOS.reduce((sum, item, index) => sum + (this.extras.has(index) ? item.price : 0), 0);
  }

  get subtotal() {
    return this.selectedPlan.price + this.extrasTotal;
  }

  get iva() {
    return Math.round(this.subtotal * 0.19);
  }

  get total() {
    return this.subtotal + this.iva;
  }
}
