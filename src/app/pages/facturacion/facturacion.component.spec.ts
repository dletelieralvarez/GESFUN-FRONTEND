import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacturacionComponent } from './facturacion.component';
import { commonTestingImports } from '../../testing/test-bed-utils';

describe('FacturacionComponent', () => {
  let component: FacturacionComponent;
  let fixture: ComponentFixture<FacturacionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: commonTestingImports,
      declarations: [FacturacionComponent]
    });
    fixture = TestBed.createComponent(FacturacionComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
