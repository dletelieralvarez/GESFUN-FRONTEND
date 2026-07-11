import { expect, Locator, Page, test } from '@playwright/test';
import { prepararBff } from './helpers/bff';

test.beforeEach(async ({ page }) => {
  await prepararBff(page);
  await page.setViewportSize({ width: 1366, height: 900 });
});

test.describe('Mantenedores de catalogos', () => {
  test('productos y servicios: crear, editar y desactivar', async ({ page }) => {
    await page.goto('/productos-servicios');

    await expect(page.getByRole('heading', { name: /Productos y servicios/i })).toBeVisible();
    await expect(rowByText(page, 'URN-001')).toBeVisible();

    await page.getByRole('button', { name: /Nuevo item/i }).click();
    await expect(fieldByLabel(page, 'Empresa')).toHaveValue('1');
    await fillByLabel(page, 'Código', 'SER-010');
    await fillByLabel(page, 'Categoría', 'Ceremonia');
    await fillByLabel(page, 'Nombre', 'Traslado especial');
    await fillByLabel(page, 'Descripción', 'Traslado con coordinacion');
    await fillByLabel(page, 'Precio', '75000');
    await page.getByRole('button', { name: /^Guardar$/ }).click();
    await expect(page.getByText('Producto o servicio creado correctamente.')).toBeVisible();
    await expect(rowByText(page, 'SER-010')).toBeVisible();

    await rowByText(page, 'SER-010').getByRole('button', { name: /Editar/i }).click();
    await fillByLabel(page, 'Nombre', 'Traslado premium');
    await page.getByRole('button', { name: /^Guardar$/ }).click();
    await expect(page.getByText('Producto o servicio actualizado correctamente.')).toBeVisible();
    await expect(rowByText(page, 'Traslado premium')).toBeVisible();

    await rowByText(page, 'SER-010').getByRole('button', { name: /Desactivar/i }).click();
    await page.locator('.delete-confirm').getByRole('button', { name: /Desactivar/i }).click();
    await expect(page.getByText('Producto o servicio desactivado correctamente.')).toBeVisible();
  });

  test('planes: crear con kit, editar y desactivar', async ({ page }) => {
    await page.goto('/planes');

    await expect(page.getByRole('heading', { name: /^Planes$/i })).toBeVisible();
    await expect(rowByText(page, 'Plan Tradicional')).toBeVisible();
    await expect(rowByText(page, 'Plan Tradicional').getByText('Sucursal Centro')).toBeVisible();

    await page.getByRole('button', { name: /Nuevo plan/i }).click();
    await fillByLabel(page, 'Nombre', 'Plan E2E');
    await fillByLabel(page, 'Descripcion', 'Plan armado por Playwright');
    await page.getByRole('button', { name: /Agregar al plan/i }).click();
    await expect(page.getByText('Urna nogal').last()).toBeVisible();
    await page.getByRole('button', { name: /^Guardar$/ }).click();
    await expect(page.getByText('Plan creado correctamente.')).toBeVisible();
    await expect(rowByText(page, 'Plan E2E')).toBeVisible();

    await rowByText(page, 'Plan E2E').getByRole('button', { name: /Editar/i }).click();
    await fillByLabel(page, 'Nombre', 'Plan E2E actualizado');
    await page.getByRole('button', { name: /^Guardar$/ }).click();
    await expect(page.getByText('Plan actualizado correctamente.')).toBeVisible();
    await expect(rowByText(page, 'Plan E2E actualizado')).toBeVisible();

    await rowByText(page, 'Plan E2E actualizado').getByRole('button', { name: /Desactivar/i }).click();
    await page.locator('.delete-confirm').getByRole('button', { name: /Desactivar/i }).click();
    await expect(page.getByText('Plan desactivado correctamente.')).toBeVisible();
  });

  test('clientes terceros: crear, editar y desactivar', async ({ page }) => {
    await page.goto('/clientes');

    await expect(page.getByRole('heading', { name: /Clientes/i })).toBeVisible();
    await expect(rowByText(page, 'Ana Soto Perez')).toBeVisible();

    await page.getByRole('button', { name: /Nuevo cliente/i }).click();
    await fillTercero(page, {
      nombre: 'Maria Cliente Test',
      rut: '44444444',
      dv: '4',
      email: 'maria.cliente@test.cl',
      telefono: '+56944444444',
    });
    await page.getByRole('button', { name: /^Guardar$/ }).click();
    await expect(page.getByText('Cliente creado correctamente.')).toBeVisible();
    await expect(rowByText(page, 'Maria Cliente Test')).toBeVisible();

    await rowByText(page, 'Maria Cliente Test').getByRole('button', { name: /Editar/i }).click();
    await fillByLabel(page, 'Nombre completo / Razón social', 'Maria Cliente Editada');
    await page.getByRole('button', { name: /^Guardar$/ }).click();
    await expect(page.getByText('Cliente actualizado correctamente.')).toBeVisible();
    await expect(rowByText(page, 'Maria Cliente Editada')).toBeVisible();

    await rowByText(page, 'Maria Cliente Editada').getByRole('button', { name: /Desactivar/i }).click();
    await page.locator('.delete-confirm').getByRole('button', { name: /Desactivar/i }).click();
    await expect(page.getByText('Cliente desactivado correctamente.')).toBeVisible();
  });

  test('proveedores terceros: crear, editar y desactivar', async ({ page }) => {
    await page.goto('/proveedores');

    await expect(page.getByRole('heading', { name: /Proveedores/i })).toBeVisible();
    await expect(rowByText(page, 'Servicios Sur Ltda')).toBeVisible();

    await page.getByRole('button', { name: /Nuevo proveedor/i }).click();
    await fillTercero(page, {
      nombre: 'Proveedor E2E Ltda',
      rut: '55555555',
      dv: '5',
      email: 'proveedor.e2e@test.cl',
      telefono: '+56955555555',
    });
    await page.getByRole('button', { name: /^Guardar$/ }).click();
    await expect(page.getByText('Proveedor creado correctamente.')).toBeVisible();
    await expect(rowByText(page, 'Proveedor E2E Ltda')).toBeVisible();

    await rowByText(page, 'Proveedor E2E Ltda').getByRole('button', { name: /Editar/i }).click();
    await fillByLabel(page, 'Nombre completo / Razon social', 'Proveedor E2E Editado');
    await page.getByRole('button', { name: /^Guardar$/ }).click();
    await expect(page.getByText('Proveedor actualizado correctamente.')).toBeVisible();
    await expect(rowByText(page, 'Proveedor E2E Editado')).toBeVisible();

    await rowByText(page, 'Proveedor E2E Editado').getByRole('button', { name: /Desactivar/i }).click();
    await page.locator('.delete-confirm').getByRole('button', { name: /Desactivar/i }).click();
    await expect(page.getByText('Proveedor desactivado correctamente.')).toBeVisible();
  });

  test('empleados terceros: crear, editar y desactivar', async ({ page }) => {
    await page.goto('/empleados');

    await expect(page.getByRole('heading', { name: /Empleados/i })).toBeVisible();
    await expect(rowByText(page, 'Luis Rojas Diaz')).toBeVisible();

    await page.getByRole('button', { name: /Nuevo empleado/i }).click();
    await fillTercero(page, {
      nombre: 'Empleado E2E Uno',
      rut: '66666666',
      dv: '6',
      email: 'empleado.e2e@test.cl',
      telefono: '+56966666666',
    });
    await page.getByRole('button', { name: /^Guardar$/ }).click();
    await expect(page.getByText('Empleado creado correctamente.')).toBeVisible();
    await expect(rowByText(page, 'Empleado E2E Uno')).toBeVisible();

    await rowByText(page, 'Empleado E2E Uno').getByRole('button', { name: /Editar/i }).click();
    await fillByLabel(page, 'Nombre completo / Razon social', 'Empleado E2E Editado');
    await page.getByRole('button', { name: /^Guardar$/ }).click();
    await expect(page.getByText('Empleado actualizado correctamente.')).toBeVisible();
    await expect(rowByText(page, 'Empleado E2E Editado')).toBeVisible();

    await rowByText(page, 'Empleado E2E Editado').getByRole('button', { name: /Desactivar/i }).click();
    await page.locator('.delete-confirm').getByRole('button', { name: /Desactivar/i }).click();
    await expect(page.getByText('Empleado desactivado correctamente.')).toBeVisible();
  });

  test('sucursales: crear, editar y desactivar usando catalogos de empresa y comuna', async ({ page }) => {
    await page.goto('/sucursales');

    await expect(page.getByRole('heading', { name: /Sucursales/i })).toBeVisible();
    await expect(rowByText(page, 'Sucursal Centro')).toBeVisible();
    await expect(rowByText(page, 'Sucursal Centro').getByText('Funeraria El Sauce SpA')).toBeVisible();

    await page.getByRole('button', { name: /Nueva sucursal/i }).click();
    await fillByLabel(page, 'Codigo', 'SUC-010');
    await fillByLabel(page, 'Nombre', 'Sucursal E2E');
    await fillByLabel(page, 'Direccion', 'Calle Test 123');
    await fillByLabel(page, 'Telefono', '+56220000000');
    await page.getByRole('button', { name: /^Guardar$/ }).click();
    await expect(page.getByText('Sucursal creada correctamente.')).toBeVisible();
    await expect(rowByText(page, 'Sucursal E2E')).toBeVisible();

    await rowByText(page, 'Sucursal E2E').getByRole('button', { name: /Editar/i }).click();
    await fillByLabel(page, 'Nombre', 'Sucursal E2E Editada');
    await page.getByRole('button', { name: /^Guardar$/ }).click();
    await expect(page.getByText('Sucursal actualizada correctamente.')).toBeVisible();
    await expect(rowByText(page, 'Sucursal E2E Editada')).toBeVisible();

    await rowByText(page, 'Sucursal E2E Editada').getByRole('button', { name: /Desactivar/i }).click();
    await page.locator('.delete-confirm').getByRole('button', { name: /Desactivar/i }).click();
    await expect(page.getByText('Sucursal desactivada correctamente.')).toBeVisible();
  });

  test('usuarios: crear, editar y eliminar', async ({ page }) => {
    await page.goto('/usuarios');

    await expect(page.getByRole('heading', { name: /Administracion de usuarios/i })).toBeVisible();
    await expect(page.getByText('admin@gesfun.test')).toBeVisible();

    await page.getByRole('button', { name: /Crear usuario/i }).click();
    await fillByLabel(page, 'Nombre', 'Usuario');
    await fillByLabel(page, 'Apellido paterno', 'E2E');
    await fillByLabel(page, 'Apellido materno', 'Test');
    await fillByLabel(page, 'Email', 'usuario.e2e@test.cl');
    await fillByLabel(page, 'Rol', 'OPERADOR');
    await fillByLabel(page, 'Tipo de usuario', 'INTERNO');
    await page.getByRole('button', { name: /^Guardar$/ }).click();
    await expect(page.getByText('Usuario creado correctamente.')).toBeVisible();
    await expect(page.getByText('usuario.e2e@test.cl')).toBeVisible();

    await rowByText(page, 'usuario.e2e@test.cl').getByRole('button').first().click();
    await fillByLabel(page, 'Nombre', 'Usuario Editado');
    await page.getByRole('button', { name: /^Guardar$/ }).click();
    await expect(page.getByText('Usuario actualizado correctamente.')).toBeVisible();
    await expect(page.getByText('Usuario Editado')).toBeVisible();

    await rowByText(page, 'usuario.e2e@test.cl').getByRole('button').nth(1).click();
    await page.locator('.delete-confirm').getByRole('button', { name: /Eliminar/i }).click();
    await expect(page.getByText('Usuario eliminado correctamente.')).toBeVisible();
  });

  test('documentacion: crear, editar y eliminar tipo de documento', async ({ page }) => {
    await page.goto('/documentacion');

    await expect(page.getByRole('heading', { name: /Documentación/i })).toBeVisible();
    await expect(rowByText(page, 'CERT_DEF')).toBeVisible();

    await page.getByRole('button', { name: /Nuevo tipo/i }).click();
    await fillByLabel(page, 'Código', 'AUT_E2E');
    await fillByLabel(page, 'Nombre', 'Autorizacion E2E');
    await page.getByRole('button', { name: /^Guardar$/ }).click();
    await expect(page.getByText('Tipo de documento creado correctamente.')).toBeVisible();
    await expect(rowByText(page, 'AUT_E2E')).toBeVisible();

    await rowByText(page, 'AUT_E2E').getByRole('button', { name: /Editar/i }).click();
    await fillByLabel(page, 'Nombre', 'Autorizacion E2E Editada');
    await page.getByRole('button', { name: /^Guardar$/ }).click();
    await expect(page.getByText('Tipo de documento actualizado correctamente.')).toBeVisible();
    await expect(rowByText(page, 'Autorizacion E2E Editada')).toBeVisible();

    await rowByText(page, 'AUT_E2E').getByRole('button', { name: /Eliminar/i }).click();
    await page.locator('.delete-confirm').getByRole('button', { name: /Eliminar/i }).click();
    await expect(page.getByText('Tipo de documento eliminado correctamente.')).toBeVisible();
  });
});

async function fillTercero(page: Page, data: { nombre: string; rut: string; dv: string; email: string; telefono: string }) {
  await fillByLabel(page, /Nombre completo \/ Raz[oó]n social/, data.nombre);
  await fillByLabel(page, 'RUT / RUC', data.rut);
  await fillByLabel(page, 'DV', data.dv);
  await fillByLabel(page, 'Email', data.email);
  await fillByLabel(page, /Tel[eé]fono/, data.telefono);
}

async function fillByLabel(page: Page, label: string | RegExp, value: string) {
  await fieldByLabel(page, label).fill(value);
}

function fieldByLabel(page: Page, label: string | RegExp): Locator {
  const labelLocator = page.locator('label').filter({ hasText: label }).last();
  return labelLocator.locator('xpath=following-sibling::*[self::input or self::textarea or self::select][1]');
}

function rowByText(page: Page, text: string): Locator {
  return page.locator('tr', { hasText: text }).first();
}
