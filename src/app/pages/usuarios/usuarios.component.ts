import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { bffApiUrl } from '../../auth-config';
import { AuthService } from '../../services/auth.service';
import { ErrorMessageService } from '../../services/error-message.service';

interface ApiResponse<T> {
  success: boolean;
  payload: T;
  message: string | null;
}

interface ApiUser {
  id: number;
  uuid: string;
  email: string;
  nombre: string;
  paterno: string;
  materno: string;
  activo: number | boolean;
  roles: string;
  tipoUsuario: string;
}

interface User {
  id: number;
  uuid: string;
  email: string;
  nombre: string;
  paterno: string;
  materno: string;
  activo: boolean;
  roles: string;
  tipoUsuario: string;
}

interface TokenDiagnostic {
  aud?: string;
  appid?: string;
  azp?: string;
  iss?: string;
  tid?: string;
  ver?: string;
  scp?: string;
  preferred_username?: string;
  upn?: string;
  roles?: string[];
  account?: string;
  meStatus?: 'OK' | 'RECHAZADO' | 'NO_PROBADO';
}

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {
  users: User[] = [];
  loading = false;
  saving = false;
  error: string | null = null;
  success: string | null = null;
  tokenInfo: TokenDiagnostic | null = null;
  userPendingDelete: User | null = null;

  formOpen = false;
  editingIndex: number | null = null;
  userForm: User = this.createEmptyUser();

  constructor(private http: HttpClient, private auth: AuthService) {}

  ngOnInit() {
    this.loadUsers();
  }

  async loadUsers() {
    this.loading = true;
    this.error = null;
    this.success = null;

    try {
      const token = await this.auth.getAccessToken();
      this.tokenInfo = {
        ...this.decodeToken(token),
        account: this.auth.getActiveAccount()?.username,
        meStatus: 'NO_PROBADO'
      };

      await this.validateBffToken(token);
      console.info('Access token claims usados para /api/usuarios', this.tokenInfo);

      const response = await lastValueFrom(this.http.get<ApiResponse<ApiUser[]>>(`${bffApiUrl}/api/usuarios`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }));

      this.users = (response.payload || []).map(user => this.mapApiUser(user));
      this.loading = false;
    } catch (err: any) {
      this.error = this.getLoadErrorMessage(err);
      this.loading = false;
    }
  }

  createEmptyUser(): User {
    return {
      id: this.users.length ? Math.max(...this.users.map((user) => user.id)) + 1 : 1,
      uuid: crypto.randomUUID?.() ?? '00000000-0000-0000-0000-000000000000',
      email: '',
      nombre: '',
      paterno: '',
      materno: '',
      activo: true,
      roles: '',
      tipoUsuario: ''
    };
  }

  openCreate() {
    this.userPendingDelete = null;
    this.editingIndex = null;
    this.userForm = this.createEmptyUser();
    this.formOpen = true;
  }

  openEdit(index: number) {
    this.userPendingDelete = null;
    this.editingIndex = index;
    this.userForm = { ...this.users[index] };
    this.formOpen = true;
  }

  async saveUser() {
    this.saving = true;
    this.error = null;
    this.success = null;

    try {
      if (this.editingIndex === null) {
        await this.createUser(this.userForm);
        await this.loadUsers();
        this.success = 'Usuario creado correctamente.';
      } else {
        await this.updateUser(this.userForm);
        await this.loadUsers();
        this.success = 'Usuario actualizado correctamente.';
      }

      this.cancel();
    } catch (err: any) {
      this.error = ErrorMessageService.userMessage(err, 'No se pudo guardar el usuario.');
    } finally {
      this.saving = false;
    }
  }

  deleteUser(index: number) {
    this.formOpen = false;
    this.editingIndex = null;
    this.userPendingDelete = this.users[index];
    this.error = null;
    this.success = null;
  }

  async confirmDeleteUser() {
    if (this.userPendingDelete) {
      await this.removeUser(this.userPendingDelete);
    }
  }

  cancelDelete() {
    this.userPendingDelete = null;
  }

  cancel() {
    this.formOpen = false;
    this.editingIndex = null;
  }

  private mapApiUser(user: ApiUser): User {
    return {
      id: user.id,
      uuid: user.uuid,
      email: user.email,
      nombre: user.nombre,
      paterno: user.paterno,
      materno: user.materno,
      activo: user.activo === true || user.activo === 1,
      roles: user.roles,
      tipoUsuario: user.tipoUsuario
    };
  }

  private async createUser(user: User) {
    const token = await this.auth.getAccessToken();
    const payload = this.toApiPayload(user, false);

    await lastValueFrom(this.http.post(`${bffApiUrl}/api/usuarios`, payload, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }));
  }

  private async updateUser(user: User) {
    const token = await this.auth.getAccessToken();
    const payload = this.toApiPayload(user, true);

    await lastValueFrom(this.http.put(`${bffApiUrl}/api/usuarios/${user.id}`, payload, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }));
  }

  private async removeUser(user: User) {
    this.loading = true;
    this.error = null;
    this.success = null;

    try {
      const token = await this.auth.getAccessToken();
      await lastValueFrom(this.http.delete(`${bffApiUrl}/api/usuarios/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }));

      await this.loadUsers();
      this.success = 'Usuario eliminado correctamente.';
      this.userPendingDelete = null;
    } catch (err: any) {
      this.error = ErrorMessageService.userMessage(err, 'No se pudo eliminar el usuario.');
    } finally {
      this.loading = false;
    }
  }

  private toApiPayload(user: User, includeId: boolean) {
    const payload: any = {
      uuid: user.uuid,
      email: user.email,
      nombre: user.nombre,
      paterno: user.paterno,
      materno: user.materno,
      activo: user.activo ? 1 : 0,
      roles: user.roles,
      tipoUsuario: user.tipoUsuario
    };

    if (includeId) {
      payload.id = user.id;
    }

    return payload;
  }

  private getLoadErrorMessage(err: any) {
    return ErrorMessageService.userMessage(err, 'No se pudieron cargar los usuarios.');
  }

  private async validateBffToken(token: string) {
    if (!this.tokenInfo) {
      return;
    }

    try {
      await lastValueFrom(this.http.get(`${bffApiUrl}/bff/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }));
      this.tokenInfo.meStatus = 'OK';
    } catch (error: any) {
      this.tokenInfo.meStatus = error?.status === 401 ? 'RECHAZADO' : 'NO_PROBADO';
      if (error?.status === 401) {
        throw error;
      }
    }
  }

  private decodeToken(token: string): TokenDiagnostic {
    try {
      const payload = token.split('.')[1];
      if (!payload) {
        return {};
      }

      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(normalized.length + (4 - normalized.length % 4) % 4, '=');
      const json = decodeURIComponent(
        atob(padded)
          .split('')
          .map(char => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
          .join('')
      );
      return JSON.parse(json);
    } catch (error) {
      console.warn('No se pudieron decodificar los claims del access token', error);
      return {};
    }
  }
}
