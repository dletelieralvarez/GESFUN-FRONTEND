import { Component } from '@angular/core';
import { CLP, INVENTORY } from '../../data/mock-data';

@Component({
  selector: 'app-inventario',
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.css']
})
export class InventarioComponent {
  inventory = INVENTORY;
  categories = ['Todas', 'Ataúdes', 'Urnas', 'Flores', 'Insumos'];
  activeCategory = 'Todas';
  clp = CLP;
  math = Math;

  get rows() {
    return this.activeCategory === 'Todas' ? this.inventory : this.inventory.filter((item) => item.cat === this.activeCategory);
  }

  get valorTotal() {
    return this.inventory.reduce((sum, item) => sum + item.stock * item.price, 0);
  }

  get lowCount() {
    return this.inventory.filter((item) => item.stock < item.min).length;
  }

  trackBySku(index: number, item: any) {
    return item.sku;
  }
}
