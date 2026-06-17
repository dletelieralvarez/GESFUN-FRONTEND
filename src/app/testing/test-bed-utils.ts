import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../services/auth.service';
import { UiModule } from '../ui/ui.module';

export const commonTestingImports = [
  FormsModule,
  HttpClientTestingModule,
  RouterTestingModule,
  UiModule
];

export const authServiceMock = {
  getAccessToken: () => Promise.resolve('test-token'),
  getActiveAccount: () => ({ name: 'Usuario Test', username: 'test@gesfun.cl' }),
  isAuthenticated: () => true,
  logout: () => Promise.resolve()
};

export const commonTestingProviders = [
  { provide: AuthService, useValue: authServiceMock }
];
