import { Component } from '@angular/core';

interface User {
  id: number;
  uuid: string;
  email: string;
  password: string;
  nombre: string;
  paterno: string;
  materno: string;
  activo: boolean;
  roles: string;
  tipo_usuario: string;
}

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent {
  users: User[] = [
    {
      id: 1,
      uuid: 'f257c1d6-9cab-4cdd-8dba-8f4a2b710c6d',
      email: 'admin@gesfun.cl',
      password: '••••••••',
      nombre: 'Admin',
      paterno: 'Principal',
      materno: 'Sistema',
      activo: true,
      roles: 'ADMIN',
      tipo_usuario: 'Administrador'
    },
    {
      id: 2,
      uuid: 'c3f2e45a-7d59-4d5b-9d1f-2e8b60b4d7e8',
      email: 'operaciones@gesfun.cl',
      password: '••••••••',
      nombre: 'Coordinador',
      paterno: 'Operaciones',
      materno: 'Central',
      activo: true,
      roles: 'USER',
      tipo_usuario: 'Operador'
    }
  ];

  formOpen = false;
  editingIndex: number | null = null;
  userForm: User = this.createEmptyUser();

  createEmptyUser(): User {
    return {
      id: this.users.length ? Math.max(...this.users.map((user) => user.id)) + 1 : 1,
      uuid: crypto.randomUUID?.() ?? '00000000-0000-0000-0000-000000000000',
      email: '',
      password: '',
      nombre: '',
      paterno: '',
      materno: '',
      activo: true,
      roles: '',
      tipo_usuario: ''
    };
  }

  openCreate() {
    this.editingIndex = null;
    this.userForm = this.createEmptyUser();
    this.formOpen = true;
  }

  openEdit(index: number) {
    this.editingIndex = index;
    this.userForm = { ...this.users[index] };
    this.formOpen = true;
  }

  saveUser() {
    if (this.editingIndex === null) {
      this.users = [...this.users, { ...this.userForm }];
    } else {
      this.users = this.users.map((user, idx) => idx === this.editingIndex ? { ...this.userForm } : user);
    }
    this.cancel();
  }

  deleteUser(index: number) {
    if (confirm('¿Eliminar este usuario?')) {
      this.users = this.users.filter((_, idx) => idx !== index);
    }
  }

  cancel() {
    this.formOpen = false;
    this.editingIndex = null;
  }
}
