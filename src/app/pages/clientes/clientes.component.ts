import { Component } from '@angular/core';
import { TERCEROS, COMUNAS } from '../../data/mock-data';
import { Tercero } from '../../data/models';

@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css']
})
export class ClientesComponent {
  clientes: Tercero[] = [...TERCEROS];
  comunas = COMUNAS;
  formVisible = false;
  isEditing = false;
  selectedCliente: Tercero | null = null;

  form: Partial<Tercero> = this.createEmptyForm();

  trackById(index: number, item: Tercero) {
    return item.id;
  }

  get titleCount() {
    return this.clientes.length;
  }

  openNew() {
    this.isEditing = false;
    this.selectedCliente = null;
    this.form = this.createEmptyForm();
    this.formVisible = true;
  }

  edit(cliente: Tercero) {
    this.isEditing = true;
    this.selectedCliente = cliente;
    this.form = { ...cliente };
    this.formVisible = true;
  }

  delete(cliente: Tercero) {
    if (!confirm(`Eliminar cliente ${cliente.nombre_completo}?`)) {
      return;
    }
    this.clientes = this.clientes.filter(c => c.id !== cliente.id);
    if (this.selectedCliente?.id === cliente.id) {
      this.cancel();
    }
  }

  save() {
    if (!this.form.nombre_completo || !this.form.ruc || !this.form.dv || !this.form.email || !this.form.telefono) {
      alert('Completa nombre, RUT, email y teléfono.');
      return;
    }

    const result = this.getFullTerceroFromForm();
    if (this.isEditing && this.selectedCliente) {
      this.clientes = this.clientes.map(c => c.id === this.selectedCliente!.id ? { ...c, ...result } : c);
    } else {
      const nextId = Math.max(0, ...this.clientes.map(c => c.id)) + 1;
      this.clientes = [
        ...this.clientes,
        {
          ...result,
          id: nextId,
          uuid: `uuid-t-${Date.now()}`
        }
      ];
    }

    this.cancel();
  }

  cancel() {
    this.formVisible = false;
    this.isEditing = false;
    this.selectedCliente = null;
    this.form = this.createEmptyForm();
  }

  formatRut(cliente: Tercero) {
    return cliente.dv ? `${cliente.ruc}-${cliente.dv}` : cliente.ruc;
  }

  getComunaName(id?: number) {
    if (!id) return '';
    const c = this.comunas.find(x => x.id === id);
    return c ? c.nombre : `(${id})`;
  }

  private createEmptyForm(): Partial<Tercero> {
    return {
      tipo_persona: 'persona_natural',
      razon_social: undefined,
      rol: 'CLIENTE',
      nombres: '',
      apellido_paterno: '',
      apellido_materno: '',
      nombre_completo: '',
      ruc: '',
      dv: '',
      email: '',
      telefono: '',
      comuna_id: 1,
      empresa_id: 1
    };
  }

  private getFullTerceroFromForm(): Tercero {
    const base = {
      ...this.form,
      tipo_persona: this.form.tipo_persona || 'persona_natural',
      razon_social: this.form.tipo_persona === 'empresa' ? this.form.nombre_completo || undefined : this.form.razon_social,
      rol: this.form.rol || 'CLIENTE',
      nombres: this.form.tipo_persona === 'persona_natural' ? this.extractNombres(this.form.nombre_completo || '') : '',
      apellido_paterno: this.form.tipo_persona === 'persona_natural' ? this.extractApellidoPaterno(this.form.nombre_completo || '') : '',
      apellido_materno: this.form.tipo_persona === 'persona_natural' ? this.extractApellidoMaterno(this.form.nombre_completo || '') : ''
    } as Tercero;
    return base;
  }

  private extractNombres(fullName: string) {
    const parts = fullName.trim().split(' ').filter(Boolean);
    return parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0] || '';
  }

  private extractApellidoPaterno(fullName: string) {
    const parts = fullName.trim().split(' ').filter(Boolean);
    return parts.length > 0 ? parts[parts.length - 1] : '';
  }

  private extractApellidoMaterno(fullName: string) {
    const parts = fullName.trim().split(' ').filter(Boolean);
    return parts.length > 2 ? parts.slice(-2, -1).join(' ') : '';
  }
}
