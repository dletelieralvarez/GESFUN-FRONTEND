import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CasosComponent } from './casos.component';
import { commonTestingImports, commonTestingProviders } from '../../testing/test-bed-utils';

describe('CasosComponent', () => {
  let component: CasosComponent;
  let fixture: ComponentFixture<CasosComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: commonTestingImports,
      declarations: [CasosComponent],
      providers: commonTestingProviders
    });
    fixture = TestBed.createComponent(CasosComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
