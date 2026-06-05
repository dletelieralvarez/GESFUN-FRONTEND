import { Component } from '@angular/core';
import { CLIENTS } from '../../data/mock-data';

@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css']
})
export class ClientesComponent {
  clients = CLIENTS;
  trackByRut(index: number, item: any) {
    return item.rut;
  }
}
