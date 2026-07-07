import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';

import { DocumentacionComponent } from './documentacion.component';
import { bffApiUrl } from '../../auth-config';
import { commonTestingImports, commonTestingProviders } from '../../testing/test-bed-utils';

describe('DocumentacionComponent', () => {
  let component: DocumentacionComponent;
  let fixture: ComponentFixture<DocumentacionComponent>;
  let httpMock: HttpTestingController;
  const flushAsync = () => new Promise(resolve => setTimeout(resolve, 0));

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: commonTestingImports,
      declarations: [DocumentacionComponent],
      providers: commonTestingProviders
    });
    fixture = TestBed.createComponent(DocumentacionComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load document types from BFF', async () => {
    fixture.detectChanges();
    await Promise.resolve();

    const request = httpMock.expectOne(`${bffApiUrl}/api/tipos-documento`);
    expect(request.request.method).toBe('GET');
    request.flush({ payload: [
      { id: 1, uuid: 'tipo-1', codigo: 'CERT_DEF', nombre: 'Certificado de defunción', activo: 1 }
    ] });

    await Promise.resolve();
    await fixture.whenStable();

    expect(component.documentos.length).toBe(1);
    expect(component.documentos[0].codigo).toBe('CERT_DEF');
  });

  it('should create a document type', async () => {
    component.openNew();
    component.form = {
      codigo: 'cert_def',
      nombre: 'Certificado de defunción',
      activo: true
    };

    const action = component.save();
    await Promise.resolve();

    const post = httpMock.expectOne(`${bffApiUrl}/api/tipos-documento`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({
      codigo: 'CERT_DEF',
      nombre: 'Certificado de defunción',
      activo: 1
    });
    post.flush({ success: true, payload: { uuid: 'tipo-1' } });
    await flushAsync();

    httpMock.expectOne(`${bffApiUrl}/api/tipos-documento`).flush({ payload: [
      { id: 1, uuid: 'tipo-1', codigo: 'CERT_DEF', nombre: 'Certificado de defunción', activo: 1 }
    ] });

    await action;

    expect(component.success).toBe('Tipo de documento creado correctamente.');
    expect(component.formVisible).toBeFalse();
  });

  it('should update a document type', async () => {
    const documento = { id: 1, uuid: 'tipo-1', codigo: 'CERT_DEF', nombre: 'Certificado', activo: true };
    component.documentos = [documento];
    component.edit(documento);
    component.form.nombre = 'Certificado de defunción';

    const action = component.save();
    await Promise.resolve();

    const put = httpMock.expectOne(`${bffApiUrl}/api/tipos-documento/tipo-1`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual({
      codigo: 'CERT_DEF',
      nombre: 'Certificado de defunción',
      activo: 1
    });
    put.flush({ success: true });
    await flushAsync();

    httpMock.expectOne(`${bffApiUrl}/api/tipos-documento`).flush({ payload: [
      { id: 1, uuid: 'tipo-1', codigo: 'CERT_DEF', nombre: 'Certificado de defunción', activo: 1 }
    ] });

    await action;

    expect(component.success).toBe('Tipo de documento actualizado correctamente.');
  });

  it('should delete a document type', async () => {
    const documento = { id: 1, uuid: 'tipo-1', codigo: 'CERT_DEF', nombre: 'Certificado', activo: true };
    component.delete(documento);

    const action = component.confirmDeleteDocumento();
    await Promise.resolve();

    const del = httpMock.expectOne(`${bffApiUrl}/api/tipos-documento/tipo-1`);
    expect(del.request.method).toBe('DELETE');
    del.flush(null, { status: 204, statusText: 'No Content' });
    await flushAsync();

    httpMock.expectOne(`${bffApiUrl}/api/tipos-documento`).flush({ payload: [] });

    await action;

    expect(component.success).toBe('Tipo de documento eliminado correctamente.');
    expect(component.documentoPendingDelete).toBeNull();
  });
});
