import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ErrorMessageService {
  static userMessage(error: any, fallback = 'Ocurrio un problema al procesar la solicitud.'): string {
    if (error?.status === 0) {
      return 'No fue posible establecer comunicacion con el sistema. Verifique su conexion e intente nuevamente.';
    }

    if (error?.status === 401) {
      return 'Su sesion ha expirado. Inicie sesion nuevamente.';
    }

    if (error?.status === 403) {
      return 'No tiene permisos para realizar esta accion.';
    }

    if (error?.status === 404) {
      return 'La informacion solicitada no se encuentra disponible.';
    }

    if (error?.status >= 500) {
      return 'Se produjo un error interno. Intente nuevamente mas tarde.';
    }

    const validation = this.validationMessage(error);
    if (validation) {
      return validation;
    }

    const detail = this.sanitizeMessage(error?.error?.message)
      || this.sanitizeMessage(error?.error?.error)
      || this.sanitizeMessage(error?.message);

    if (detail && !this.isTechnicalMessage(detail)) {
      return detail;
    }

    return fallback;
  }

  static sanitizeMessage(message: any): string {
    const text = String(message || '').trim();
    if (!text) return '';

    const jsonStart = text.indexOf('{');
    if (jsonStart >= 0) {
      const prefix = text.slice(0, jsonStart).trim();
      const jsonText = text.slice(jsonStart);

      try {
        const parsed = JSON.parse(jsonText);
        const parsedMessage = this.sanitizeMessage(parsed?.message || parsed?.error || parsed?.detail);
        return parsedMessage || this.sanitizeMessage(prefix);
      } catch {
        const match = jsonText.match(/"message"\s*:\s*"([^"]+)"/);
        if (match?.[1]) return this.sanitizeMessage(match[1]);
        return this.sanitizeMessage(prefix);
      }
    }

    return this.normalizeTechnicalText(text);
  }

  static isStockError(message: any): boolean {
    const text = String(message || '').toLocaleLowerCase('es-CL');
    return text.includes('stock') && (
      text.includes('insuficiente')
      || text.includes('no hay')
      || text.includes('sin stock')
      || text.includes('no disponible')
    );
  }

  private static validationMessage(error: any): string {
    const validation = error?.error?.errors ?? error?.error?.validationErrors;
    if (Array.isArray(validation) && validation.length) {
      return validation.map((item: any) => item.defaultMessage ?? item.message ?? item).join(' ');
    }

    if (validation && typeof validation === 'object') {
      return Object.values(validation).join(' ');
    }

    return '';
  }

  private static normalizeTechnicalText(message: string): string {
    const lower = message.toLocaleLowerCase('es-CL');

    if (lower.includes('connection refused')) {
      return 'El servicio no se encuentra disponible temporalmente.';
    }

    if (lower.includes('unauthorized') || lower.includes('401')) {
      return 'Su sesion ha expirado. Inicie sesion nuevamente.';
    }

    if (lower.includes('forbidden') || lower.includes('403')) {
      return 'No tiene permisos para realizar esta accion.';
    }

    if (lower.includes('404')) {
      return 'La informacion solicitada no se encuentra disponible.';
    }

    if (lower.includes('500')) {
      return 'Se produjo un error interno. Intente nuevamente mas tarde.';
    }

    if (lower.includes('timeout')) {
      return 'La solicitud tardo mas de lo esperado. Intente nuevamente.';
    }

    if (lower.includes('network error') || lower.includes('failed to fetch') || lower.includes('status = 0')) {
      return 'No fue posible establecer comunicacion con el sistema. Verifique su conexion e intente nuevamente.';
    }

    if (lower.includes('token')) {
      return 'La sesion no es valida. Vuelva a iniciar sesion.';
    }

    return message;
  }

  private static isTechnicalMessage(message: string): boolean {
    return /\b(bff|backend|endpoint|api|http|httperrorresponse|token|jwt|scope|audience|status\s*=?\s*\d+|localhost|\/api\/)\b/i.test(message);
  }
}
