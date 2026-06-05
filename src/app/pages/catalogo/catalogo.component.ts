import { Component } from '@angular/core';
import { CLP, PLANS, SERVICIOS_SUELTOS } from '../../data/mock-data';

@Component({
  selector: 'app-catalogo',
  templateUrl: './catalogo.component.html',
  styleUrls: ['./catalogo.component.css']
})
export class CatalogoComponent {
  plans = PLANS;
  servicios = SERVICIOS_SUELTOS;
  clp = CLP;
}
