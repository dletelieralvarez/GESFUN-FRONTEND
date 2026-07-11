import { expect, Page, test } from '@playwright/test';

const planes = [
  {
    id: 1,
    uuid: 'plan-basico',
    nombre: 'Plan Basico',
    descripcion: 'Ceremonia esencial',
    valor: 250000,
    activo: true,
  },
  {
    id: 2,
    uuid: 'plan-familiar',
    nombre: 'Plan Familiar',
    descripcion: 'Acompanamiento completo',
    valor: 650000,
    activo: true,
  },
  {
    id: 3,
    uuid: 'plan-inactivo',
    nombre: 'Plan Inactivo',
    descripcion: 'No debe mostrarse',
    valor: 100000,
    activo: false,
  },
];

const productosServicios = [
  {
    id: 1,
    uuid: 'servicio-urna',
    tipoItem: 'S',
    codigo: 'SER-001',
    nombre: 'Urna nogal',
    descripcion: 'Urna de madera',
    precio: 320000,
    categoria: 'Ceremonia',
    activo: true,
  },
  {
    id: 2,
    uuid: 'servicio-flores',
    tipo_item: 'servicio',
    codigo: 'SER-002',
    nombre: 'Arreglo floral',
    descripcion: 'Flores de temporada',
    precio: 45000,
    categoria: 'Ornamentacion',
    activo: 1,
  },
  {
    id: 3,
    uuid: 'producto-cafe',
    tipoItem: 'P',
    codigo: 'PRO-001',
    nombre: 'Cafe',
    descripcion: 'Producto interno',
    precio: 10000,
    categoria: 'Cafeteria',
    activo: true,
  },
  {
    id: 4,
    uuid: 'servicio-inactivo',
    tipoItem: 'S',
    codigo: 'SER-003',
    nombre: 'Servicio inactivo',
    descripcion: 'No debe mostrarse',
    precio: 10000,
    categoria: 'Archivo',
    activo: false,
  },
];

async function prepararCatalogo(page: Page, options: { errorPlanes?: boolean } = {}) {
  await page.addInitScript(() => {
    window.localStorage.setItem('gesfun.e2eAccessToken', 'playwright-token');
  });

  await page.route('http://localhost:8081/api/servicios', async route => {
    await route.fulfill({ json: { payload: [] } });
  });

  await page.route('http://localhost:8081/api/planes', async route => {
    if (options.errorPlanes) {
      await route.fulfill({
        status: 500,
        json: { message: 'Error controlado de catalogo' },
      });
      return;
    }

    await route.fulfill({ json: { payload: planes } });
  });

  await page.route('http://localhost:8081/api/productos-servicios', async route => {
    await route.fulfill({ json: { payload: productosServicios } });
  });

  await page.route('http://localhost:8081/api/plan-kit/plan/plan-basico', async route => {
    await route.fulfill({
      json: {
        payload: [
          { productoServicioUuid: 'servicio-urna', cantidad: 1, unitario: 320000, activo: true },
        ],
      },
    });
  });

  await page.route('http://localhost:8081/api/plan-kit/plan/plan-familiar', async route => {
    await route.fulfill({
      json: {
        payload: [
          { producto_servicio_uuid: 'servicio-urna', cantidad: 1, unitario: 320000, activo: true },
          { productoServicioUuid: 'servicio-flores', cantidad: 2, unitario: 45000, activo: 1 },
        ],
      },
    });
  });
}

test.describe('Catalogo y planes', () => {
  test('muestra planes activos, prestaciones incluidas y servicios adicionales', async ({ page }) => {
    await prepararCatalogo(page);

    await page.goto('/catalogo');

    await expect(page.getByRole('heading', { name: /Catalogo y planes/i })).toBeVisible();
    await expect(page.getByText('Plan Basico')).toBeVisible();
    await expect(page.getByText('Plan Familiar')).toBeVisible();
    await expect(page.getByText('Plan Inactivo')).toBeHidden();
    await expect(page.getByText('MAS SOLICITADO')).toBeVisible();

    await expect(page.getByText('Urna nogal').first()).toBeVisible();
    await expect(page.getByText('2 x Arreglo floral')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'SER-001' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'SER-002' })).toBeVisible();
    await expect(page.getByText('PRO-001')).toBeHidden();
    await expect(page.getByText('Servicio inactivo')).toBeHidden();
  });

  test('permite navegar desde las acciones principales del catalogo', async ({ page }) => {
    await prepararCatalogo(page);

    await page.goto('/catalogo');

    await page.getByRole('link', { name: /Administrar prestaciones/i }).click();
    await expect(page).toHaveURL(/\/productos-servicios$/);

    await page.goto('/catalogo');
    await page.getByRole('link', { name: /Administrar planes/i }).click();
    await expect(page).toHaveURL(/\/planes$/);

    await page.goto('/catalogo');
    await page.getByRole('link', { name: /Cotizar/i }).first().click();
    await expect(page).toHaveURL(/\/cotizacion$/);
  });

  test('muestra mensaje de error cuando el BFF no responde', async ({ page }) => {
    await prepararCatalogo(page, { errorPlanes: true });

    await page.goto('/catalogo');

    await expect(page.getByText(/Error controlado de catalogo/i)).toBeVisible();
  });
});
