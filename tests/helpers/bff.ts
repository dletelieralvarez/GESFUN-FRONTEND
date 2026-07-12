import { Page, Route } from '@playwright/test';

const API = 'http://localhost:8080/api';

type Row = Record<string, any>;

export const mockData = {
  empresas: [
    { id: 1, uuid: 'empresa-1', razonSocial: 'Funeraria El Sauce SpA', razon_social: 'Funeraria El Sauce SpA', activo: 1 },
  ],
  regiones: [
    { id: 1, uuid: 'region-rm', codigo: 'RM', nombre: 'Metropolitana' },
  ],
  comunas: [
    { id: 1, uuid: 'comuna-santiago', nombre: 'Santiago', regionId: 1, region_id: 1 },
    { id: 2, uuid: 'comuna-providencia', nombre: 'Providencia', regionId: 1, region_id: 1 },
  ],
  unidadesMedida: [
    { id: 1, uuid: 'unidad-un', codigo: 'UN', nombre: 'Unidad' },
  ],
  sucursales: [
    {
      id: 1,
      uuid: 'sucursal-centro',
      codigo: 'SUC-001',
      nombre: 'Sucursal Centro',
      direccion: 'Av. Principal 123',
      telefono: '+56223456789',
      activo: 1,
      comunaUuid: 'comuna-santiago',
      empresaUuid: 'empresa-1',
    },
  ],
  productosServicios: [
    {
      id: 1,
      uuid: 'producto-urna',
      tipoItem: 'P',
      codigo: 'URN-001',
      nombre: 'Urna nogal',
      descripcion: 'Urna de madera',
      precio: 320000,
      categoria: 'Ataudes',
      activo: 1,
      afecto: 1,
      unidadMedidaUuid: 'unidad-un',
      empresaUuid: 'empresa-1',
    },
    {
      id: 2,
      uuid: 'servicio-flores',
      tipoItem: 'S',
      codigo: 'SER-002',
      nombre: 'Arreglo floral',
      descripcion: 'Flores de temporada',
      precio: 45000,
      categoria: 'Ornamentacion',
      activo: 1,
      afecto: 1,
      unidadMedidaUuid: 'unidad-un',
      empresaUuid: 'empresa-1',
    },
  ],
  planes: [
    {
      id: 1,
      uuid: 'plan-tradicional',
      nombre: 'Plan Tradicional',
      descripcion: 'Ceremonia familiar',
      valor: 365000,
      activo: 1,
      sucursalId: 1,
    },
  ],
  planKit: {
    'plan-tradicional': [
      {
        id: 1,
        uuid: 'kit-tradicional-urna',
        productoServicioUuid: 'producto-urna',
        cantidad: 1,
        unitario: 320000,
        activo: 1,
      },
      {
        id: 2,
        uuid: 'kit-tradicional-flores',
        productoServicioUuid: 'servicio-flores',
        cantidad: 1,
        unitario: 45000,
        activo: 1,
      },
    ],
  } as Record<string, Row[]>,
  clientes: [
    tercero('cliente-ana', 'Ana Soto Perez', 'CLIENTE', 'ana.soto@test.cl', '11111111', '1'),
  ],
  proveedores: [
    tercero('proveedor-sur', 'Servicios Sur Ltda', 'PROVEEDOR', 'contacto@sur.test', '22222222', '2', 'empresa'),
  ],
  empleados: [
    tercero('empleado-luis', 'Luis Rojas Diaz', 'EMPLEADO', 'luis.rojas@test.cl', '33333333', '3'),
  ],
  usuarios: [
    {
      id: 1,
      uuid: 'usuario-admin',
      email: 'admin@gesfun.test',
      nombre: 'Admin',
      paterno: 'Sistema',
      materno: 'Demo',
      activo: 1,
      roles: 'ADMIN',
      tipoUsuario: 'INTERNO',
    },
  ],
  tiposDocumento: [
    { id: 1, uuid: 'doc-cert-def', codigo: 'CERT_DEF', nombre: 'Certificado defuncion', activo: 1 },
  ],
};

function tercero(uuid: string, nombre: string, rol: string, email: string, ruc: string, dv: string, tipoPersona = 'persona_natural') {
  return {
    id: Number(dv),
    uuid,
    tipoPersona,
    tipo_persona: tipoPersona,
    rol,
    nombres: nombre.split(' ')[0],
    apellidoPaterno: nombre.split(' ')[1] || '',
    apellidoMaterno: nombre.split(' ')[2] || '',
    apellido_paterno: nombre.split(' ')[1] || '',
    apellido_materno: nombre.split(' ')[2] || '',
    nombreCompleto: nombre,
    nombre_completo: nombre,
    razonSocial: tipoPersona === 'empresa' ? nombre : undefined,
    razon_social: tipoPersona === 'empresa' ? nombre : undefined,
    ruc,
    dv,
    email,
    telefono: '+56912345678',
    activo: 1,
    comunaUuid: 'comuna-santiago',
    empresaUuid: 'empresa-1',
  };
}

export async function prepararBff(page: Page) {
  const state = structuredClone(mockData);

  await page.addInitScript(() => {
    const payload = btoa(JSON.stringify({
      aud: 'gesfun-e2e',
      scp: 'access_as_user',
      preferred_username: 'playwright@gesfun.local',
    })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    window.localStorage.setItem('gesfun.e2eAccessToken', `e2e.${payload}.token`);
  });

  await page.route('http://localhost:8080/bff/me', async route => {
    await ok(route, { email: 'playwright@gesfun.local' });
  });

  await page.route(`${API}/**`, async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace('/api', '');
    const method = request.method();

    if (path === '/me') {
      await ok(route, { email: 'playwright@gesfun.local' });
      return;
    }

    if (path === '/empresas') return ok(route, state.empresas);
    if (path === '/regiones') return ok(route, state.regiones);
    if (path === '/comunas') return ok(route, state.comunas);
    if (path === '/unidades-medida') return ok(route, state.unidadesMedida);
    if (path === '/servicios') return ok(route, []);

    if (path === '/sucursales' && method === 'GET') return ok(route, state.sucursales);
    if (path === '/sucursales' && method === 'POST') return create(route, state.sucursales, normalizeSucursal(await request.postDataJSON(), state));
    if (path.startsWith('/sucursales/') && method === 'PUT') return update(route, state.sucursales, path, normalizeSucursal(await request.postDataJSON(), state));
    if (path.endsWith('/desactivar') && path.startsWith('/sucursales/') && method === 'PATCH') return deactivate(route, state.sucursales, path);

    if (path === '/productos-servicios' && method === 'GET') return ok(route, state.productosServicios);
    if (path === '/productos-servicios' && method === 'POST') return create(route, state.productosServicios, await request.postDataJSON());
    if (path.startsWith('/productos-servicios/') && method === 'PUT') return update(route, state.productosServicios, path, await request.postDataJSON());
    if (path.endsWith('/desactivar') && path.startsWith('/productos-servicios/') && method === 'PATCH') return deactivate(route, state.productosServicios, path);

    if (path === '/planes' && method === 'GET') return ok(route, state.planes);
    if (path === '/planes' && method === 'POST') return createPlan(route, state, await request.postDataJSON());
    if (path.startsWith('/planes/') && method === 'PUT') return update(route, state.planes, path, await request.postDataJSON());
    if (path.endsWith('/desactivar') && path.startsWith('/planes/') && method === 'PATCH') return deactivate(route, state.planes, path);
    if (path.startsWith('/plan-kit/plan/') && method === 'GET') return ok(route, state.planKit[path.split('/').pop() || ''] || []);
    if (path === '/plan-kit' && method === 'POST') return createPlanKit(route, state, await request.postDataJSON());
    if (path.startsWith('/plan-kit/') && method === 'PUT') return ok(route, await request.postDataJSON());

    if (path === '/clientes' && method === 'GET') return ok(route, state.clientes);
    if (path === '/clientes' && method === 'POST') return create(route, state.clientes, normalizeTercero(await request.postDataJSON(), 'CLIENTE'));
    if (path.startsWith('/clientes/') && method === 'PUT') return update(route, state.clientes, path, normalizeTercero(await request.postDataJSON(), 'CLIENTE'));
    if (path.endsWith('/desactivar') && path.startsWith('/clientes/') && method === 'PATCH') return deactivate(route, state.clientes, path);

    if (path === '/proveedores' && method === 'GET') return ok(route, state.proveedores);
    if (path === '/proveedores' && method === 'POST') return create(route, state.proveedores, normalizeTercero(await request.postDataJSON(), 'PROVEEDOR'));
    if (path.startsWith('/proveedores/') && method === 'PUT') return update(route, state.proveedores, path, normalizeTercero(await request.postDataJSON(), 'PROVEEDOR'));
    if (path.endsWith('/desactivar') && path.startsWith('/proveedores/') && method === 'PATCH') return deactivate(route, state.proveedores, path);

    if (path === '/empleados' && method === 'GET') return ok(route, state.empleados);
    if (path === '/empleados' && method === 'POST') return create(route, state.empleados, normalizeTercero(await request.postDataJSON(), 'EMPLEADO'));
    if (path.startsWith('/empleados/') && method === 'PUT') return update(route, state.empleados, path, normalizeTercero(await request.postDataJSON(), 'EMPLEADO'));
    if (path.endsWith('/desactivar') && path.startsWith('/empleados/') && method === 'PATCH') return deactivate(route, state.empleados, path);

    if (path === '/usuarios' && method === 'GET') return ok(route, state.usuarios);
    if (path === '/usuarios' && method === 'POST') return create(route, state.usuarios, await request.postDataJSON());
    if (path.startsWith('/usuarios/') && method === 'PUT') return updateById(route, state.usuarios, path, await request.postDataJSON());
    if (path.startsWith('/usuarios/') && method === 'DELETE') return removeById(route, state.usuarios, path);

    if (path === '/tipos-documento' && method === 'GET') return ok(route, state.tiposDocumento);
    if (path === '/tipos-documento' && method === 'POST') return create(route, state.tiposDocumento, await request.postDataJSON());
    if (path.startsWith('/tipos-documento/') && method === 'PUT') return update(route, state.tiposDocumento, path, await request.postDataJSON());
    if (path.startsWith('/tipos-documento/') && method === 'DELETE') return remove(route, state.tiposDocumento, path);

    await ok(route, []);
  });
}

async function ok(route: Route, payload: any) {
  await route.fulfill({ json: { success: true, payload, message: null } });
}

async function create(route: Route, collection: Row[], payload: Row) {
  const created = {
    id: nextId(collection),
    uuid: payload.uuid || `e2e-${Date.now()}-${collection.length}`,
    activo: payload.activo ?? 1,
    ...payload,
  };
  collection.push(created);
  await ok(route, created);
}

async function createPlan(route: Route, state: typeof mockData, payload: Row) {
  const created = {
    id: nextId(state.planes),
    uuid: payload.uuid || `plan-e2e-${Date.now()}`,
    activo: payload.activo ?? 1,
    ...payload,
  };
  state.planes.push(created);
  state.planKit[created.uuid] = [];
  await ok(route, created);
}

async function createPlanKit(route: Route, state: typeof mockData, payload: Row) {
  const planUuid = payload.planUuid ?? payload.plan_uuid;
  const created = { id: nextId(state.planKit[planUuid] || []), uuid: `kit-e2e-${Date.now()}`, activo: 1, ...payload };
  state.planKit[planUuid] = [...(state.planKit[planUuid] || []), created];
  await ok(route, created);
}

async function update(route: Route, collection: Row[], path: string, payload: Row) {
  const uuid = path.split('/')[2];
  const index = collection.findIndex(row => row.uuid === uuid);
  if (index >= 0) collection[index] = { ...collection[index], ...payload, uuid };
  await ok(route, collection[index] || payload);
}

async function updateById(route: Route, collection: Row[], path: string, payload: Row) {
  const id = Number(path.split('/')[2]);
  const index = collection.findIndex(row => Number(row.id) === id);
  if (index >= 0) collection[index] = { ...collection[index], ...payload, id };
  await ok(route, collection[index] || payload);
}

async function deactivate(route: Route, collection: Row[], path: string) {
  const uuid = path.split('/')[2];
  const row = collection.find(item => item.uuid === uuid);
  if (row) row.activo = 0;
  await ok(route, row || {});
}

async function remove(route: Route, collection: Row[], path: string) {
  const uuid = path.split('/')[2];
  const index = collection.findIndex(row => row.uuid === uuid);
  if (index >= 0) collection.splice(index, 1);
  await ok(route, {});
}

async function removeById(route: Route, collection: Row[], path: string) {
  const id = Number(path.split('/')[2]);
  const index = collection.findIndex(row => Number(row.id) === id);
  if (index >= 0) collection.splice(index, 1);
  await ok(route, {});
}

function nextId(collection: Row[]) {
  return collection.length ? Math.max(...collection.map(row => Number(row.id) || 0)) + 1 : 1;
}

function normalizeTercero(payload: Row, rol: string) {
  const nombreCompleto = payload.nombreCompleto ?? payload.nombre_completo ?? payload.razonSocial ?? '';
  return {
    ...payload,
    rol,
    nombreCompleto,
    nombre_completo: nombreCompleto,
    ruc: String(payload.rut ?? payload.ruc ?? ''),
    tipoPersona: payload.tipoPersona ?? payload.tipo_persona,
    tipo_persona: payload.tipoPersona === 'J' ? 'empresa' : 'persona_natural',
  };
}

function normalizeSucursal(payload: Row, state: typeof mockData) {
  const comuna = state.comunas.find(row => row.uuid === payload.comunaUuid || row.uuid === payload.comuna_uuid);
  const empresa = state.empresas.find(row => row.uuid === payload.empresaUuid || row.uuid === payload.empresa_uuid);
  return {
    ...payload,
    comuna_id: comuna?.id,
    empresa_id: empresa?.id,
  };
}
