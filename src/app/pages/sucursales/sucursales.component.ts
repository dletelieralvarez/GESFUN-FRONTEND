import { Component } from '@angular/core';

interface Branch {
  id: number;
  uuid: string;
  codigo: string;
  nombre: string;
  direccion: string;
  telefono: string;
  activo: boolean;
  empresa_id: number;
  comuna_id: number;
}

@Component({
  selector: 'app-sucursales',
  templateUrl: './sucursales.component.html',
  styleUrls: ['./sucursales.component.css']
})
export class SucursalesComponent {
  branches: Branch[] = [
    {
      id: 1,
      uuid: 'f8a2e9d1-3d4b-4b20-b9f4-1d9824f1b0a0',
      codigo: 'SUC-001',
      nombre: 'Sucursal Centro',
      direccion: 'Av. Principal 123',
      telefono: '+56 2 2345 6789',
      activo: true,
      empresa_id: 1,
      comuna_id: 101
    },
    {
      id: 2,
      uuid: 'd7c1f613-5c2a-4ffa-9b2e-7ef6c6f41d77',
      codigo: 'SUC-002',
      nombre: 'Sucursal Norte',
      direccion: 'Calle Norte 45',
      telefono: '+56 2 2345 6790',
      activo: true,
      empresa_id: 1,
      comuna_id: 102
    }
  ];

  formOpen = false;
  editingIndex: number | null = null;
  branchForm: Branch = this.createEmptyBranch();

  createEmptyBranch(): Branch {
    return {
      id: this.branches.length ? Math.max(...this.branches.map((b) => b.id)) + 1 : 1,
      uuid: crypto.randomUUID?.() ?? '00000000-0000-0000-0000-000000000000',
      codigo: '',
      nombre: '',
      direccion: '',
      telefono: '',
      activo: true,
      empresa_id: 0,
      comuna_id: 0
    };
  }

  openCreate() {
    this.editingIndex = null;
    this.branchForm = this.createEmptyBranch();
    this.formOpen = true;
  }

  openEdit(index: number) {
    this.editingIndex = index;
    this.branchForm = { ...this.branches[index] };
    this.formOpen = true;
  }

  saveBranch() {
    if (this.editingIndex === null) {
      this.branches = [...this.branches, { ...this.branchForm }];
    } else {
      this.branches = this.branches.map((branch, idx) => idx === this.editingIndex ? { ...this.branchForm } : branch);
    }
    this.cancel();
  }

  deleteBranch(index: number) {
    if (confirm('¿Eliminar esta sucursal?')) {
      this.branches = this.branches.filter((_, idx) => idx !== index);
    }
  }

  cancel() {
    this.formOpen = false;
    this.editingIndex = null;
  }
}
