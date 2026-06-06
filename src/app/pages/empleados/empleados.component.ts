import { Component } from '@angular/core';
import { COMUNAS, REGIONES, TERCEROS } from '../../data/mock-data';
import { Tercero } from '../../data/models';

@Component({
  selector: 'app-empleados',
  templateUrl: './empleados.component.html',
  styleUrls: ['./empleados.component.css']
})
export class EmpleadosComponent {
  empleados: Tercero[] = TERCEROS.filter(t => t.rol === 'EMPLEADO');
  regiones = REGIONES;
  comunas = COMUNAS;
  formVisible = false;
  isEditing = false;
  selectedEmpleado: Tercero | null = null;
  form: Partial<Tercero> = this.createEmptyForm();

  get titleCount() {
    return this.empleados.length;
  }

  get comunasFiltradas() {
    return this.comunas.filter(c => !this.form.region_id || c.region_id === Number(this.form.region_id));
  }

  trackById(index: number, item: Tercero) {
    return item.id;
  }

  openNew() {
    this.isEditing = false;
    this.selectedEmpleado = null;
    this.form = this.createEmptyForm();
    this.formVisible = true;
  }

  edit(empleado: Tercero) {
    this.isEditing = true;
    this.selectedEmpleado = empleado;
    this.form = { ...empleado, rol: 'EMPLEADO', region_id: empleado.region_id || this.getRegionIdByComuna(empleado.comuna_id) };
    this.formVisible = true;
  }

  delete(empleado: Tercero) {
    if (!confirm(`Eliminar empleado ${empleado.nombre_completo}?`)) {
      return;
    }
    this.empleados = this.empleados.filter(e => e.id !== empleado.id);
    if (this.selectedEmpleado?.id === empleado.id) {
      this.cancel();
    }
  }

  save() {
    if (!this.form.nombre_completo || !this.form.ruc || !this.form.dv || !this.form.email || !this.form.telefono) {
      alert('Completa nombre, RUT, email y telefono.');
      return;
    }

    const result = this.getFullTerceroFromForm();
    if (this.isEditing && this.selectedEmpleado) {
      this.empleados = this.empleados.map(e => e.id === this.selectedEmpleado!.id ? { ...e, ...result } : e);
    } else {
      const nextId = Math.max(0, ...this.empleados.map(e => e.id)) + 1;
      this.empleados = [...this.empleados, { ...result, id: nextId, uuid: `uuid-emp-${Date.now()}` }];
    }

    this.cancel();
  }

  cancel() {
    this.formVisible = false;
    this.isEditing = false;
    this.selectedEmpleado = null;
    this.form = this.createEmptyForm();
  }

  formatRut(empleado: Tercero) {
    return empleado.dv ? `${empleado.ruc}-${empleado.dv}` : empleado.ruc;
  }

  getComunaName(id?: number) {
    const comuna = this.comunas.find(c => c.id === Number(id));
    return comuna ? comuna.nombre : '';
  }

  getRegionName(id?: number) {
    const region = this.regiones.find(r => r.id === Number(id));
    return region ? region.nombre : '';
  }

  onRegionChange() {
    const comunas = this.comunasFiltradas;
    if (!comunas.some(c => c.id === Number(this.form.comuna_id))) {
      this.form.comuna_id = comunas[0]?.id;
    }
  }

  private createEmptyForm(): Partial<Tercero> {
    return {
      tipo_persona: 'persona_natural',
      rol: 'EMPLEADO',
      nombres: '',
      apellido_paterno: '',
      apellido_materno: '',
      nombre_completo: '',
      ruc: '',
      dv: '',
      email: '',
      telefono: '',
      region_id: 1,
      comuna_id: 1,
      empresa_id: 1
    };
  }

  private getFullTerceroFromForm(): Tercero {
    return {
      ...this.form,
      rol: 'EMPLEADO',
      tipo_persona: this.form.tipo_persona || 'persona_natural',
      razon_social: this.form.tipo_persona === 'empresa' ? this.form.nombre_completo || undefined : this.form.razon_social,
      region_id: this.form.region_id || this.getRegionIdByComuna(this.form.comuna_id),
      nombres: this.form.tipo_persona === 'persona_natural' ? this.extractNombres(this.form.nombre_completo || '') : '',
      apellido_paterno: this.form.tipo_persona === 'persona_natural' ? this.extractApellidoPaterno(this.form.nombre_completo || '') : '',
      apellido_materno: this.form.tipo_persona === 'persona_natural' ? this.extractApellidoMaterno(this.form.nombre_completo || '') : ''
    } as Tercero;
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

  private getRegionIdByComuna(comunaId?: number) {
    return this.comunas.find(c => c.id === Number(comunaId))?.region_id || 1;
  }
}
