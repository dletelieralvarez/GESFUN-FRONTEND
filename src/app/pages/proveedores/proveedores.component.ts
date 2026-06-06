import { Component } from '@angular/core';
import { COMUNAS, REGIONES, TERCEROS } from '../../data/mock-data';
import { Tercero } from '../../data/models';

@Component({
  selector: 'app-proveedores',
  templateUrl: './proveedores.component.html',
  styleUrls: ['./proveedores.component.css']
})
export class ProveedoresComponent {
  proveedores: Tercero[] = TERCEROS.filter(t => t.rol === 'PROVEEDOR');
  regiones = REGIONES;
  comunas = COMUNAS;
  formVisible = false;
  isEditing = false;
  selectedProveedor: Tercero | null = null;
  form: Partial<Tercero> = this.createEmptyForm();

  get titleCount() {
    return this.proveedores.length;
  }

  get comunasFiltradas() {
    return this.comunas.filter(c => !this.form.region_id || c.region_id === Number(this.form.region_id));
  }

  trackById(index: number, item: Tercero) {
    return item.id;
  }

  openNew() {
    this.isEditing = false;
    this.selectedProveedor = null;
    this.form = this.createEmptyForm();
    this.formVisible = true;
  }

  edit(proveedor: Tercero) {
    this.isEditing = true;
    this.selectedProveedor = proveedor;
    this.form = { ...proveedor, rol: 'PROVEEDOR', region_id: proveedor.region_id || this.getRegionIdByComuna(proveedor.comuna_id) };
    this.formVisible = true;
  }

  delete(proveedor: Tercero) {
    if (!confirm(`Eliminar proveedor ${proveedor.nombre_completo}?`)) {
      return;
    }
    this.proveedores = this.proveedores.filter(p => p.id !== proveedor.id);
    if (this.selectedProveedor?.id === proveedor.id) {
      this.cancel();
    }
  }

  save() {
    if (!this.form.nombre_completo || !this.form.ruc || !this.form.dv || !this.form.email || !this.form.telefono) {
      alert('Completa nombre, RUT, email y telefono.');
      return;
    }

    const result = this.getFullTerceroFromForm();
    if (this.isEditing && this.selectedProveedor) {
      this.proveedores = this.proveedores.map(p => p.id === this.selectedProveedor!.id ? { ...p, ...result } : p);
    } else {
      const nextId = Math.max(0, ...this.proveedores.map(p => p.id)) + 1;
      this.proveedores = [...this.proveedores, { ...result, id: nextId, uuid: `uuid-prov-${Date.now()}` }];
    }

    this.cancel();
  }

  cancel() {
    this.formVisible = false;
    this.isEditing = false;
    this.selectedProveedor = null;
    this.form = this.createEmptyForm();
  }

  formatRut(proveedor: Tercero) {
    return proveedor.dv ? `${proveedor.ruc}-${proveedor.dv}` : proveedor.ruc;
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
      tipo_persona: 'empresa',
      rol: 'PROVEEDOR',
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
      rol: 'PROVEEDOR',
      tipo_persona: this.form.tipo_persona || 'empresa',
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
