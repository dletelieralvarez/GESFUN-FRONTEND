export const CLP = (n: number) => "$" + Math.round(n).toLocaleString("es-CL");

export const AVATAR_COLORS = [
  "oklch(0.55 0.07 158)", "oklch(0.55 0.06 245)", "oklch(0.58 0.09 60)",
  "oklch(0.56 0.10 25)", "oklch(0.52 0.07 300)", "oklch(0.50 0.06 200)",
];

export const initials = (name: string) =>
  name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

export const colorFor = (name: string) => {
  if (!name) return AVATAR_COLORS[0];
  const first = name.charCodeAt(0) || 0;
  const last = name.charCodeAt(name.length - 1) || 0;
  return AVATAR_COLORS[(first + last) % AVATAR_COLORS.length];
};

export const NAV_BS = [
  { group: "General", items: [{ id: "dashboard", label: "Panel", icon: "grid-1x2-fill" }] },
  { group: "Operación", items: [
    { id: "casos", label: "Servicios", icon: "folder-fill" },
    { id: "agenda", label: "Agenda de salas", icon: "calendar3" },
  ]},
  { group: "Comercial", items: [
    { id: "catalogo", label: "Catálogo y planes", icon: "grid-fill" },
    { id: "cotizacion", label: "Nueva cotización", icon: "file-earmark-plus-fill" },
    { id: "cotizaciones", label: "Cotizaciones creadas", icon: "files" },
    { id: "clientes", label: "Clientes", icon: "people-fill" },
  ]},
  { group: "Administración", items: [
    { id: "usuarios", label: "Usuarios", icon: "person-badge-fill" },
    { id: "empleados", label: "Empleados", icon: "person-workspace" },
    { id: "proveedores", label: "Proveedores", icon: "truck" },
    { id: "productos-servicios", label: "Productos y servicios", icon: "boxes" },
    { id: "planes", label: "Planes", icon: "clipboard2-check" },
    { id: "documentacion", label: "Documentación", icon: "file-earmark-text" },
    { id: "recursos", label: "Recursos", icon: "tools" },
    { id: "sucursales", label: "Sucursales", icon: "geo-alt-fill" }
  ]},
  { group: "Recursos", items: [{ id: "inventario", label: "Inventario", icon: "box-seam-fill" }] },
  { group: "Finanzas", items: [{ id: "facturacion", label: "Facturación", icon: "receipt" }] },
];

export const ESTADO_BS: Record<string, string> = {
  Pendiente: "b-warn",
  Programado: "b-info",
  "En curso": "b-ok",
  Completado: "b-neutral",
};

export const AG_COLOR = {
  ok:   { bg: "var(--ok-bg)", bar: "var(--ok)", fg: "var(--ok)" },
  info: { bg: "var(--info-bg)", bar: "var(--info)", fg: "var(--info)" },
  warn: { bg: "var(--warn-bg)", bar: "var(--warn)", fg: "oklch(0.50 0.090 60)" },
  neutral: { bg: "var(--neutral-bg)", bar: "var(--faint)", fg: "var(--ink-soft)" },
};

export const INV_ESTADO: Record<string, string> = {
  Pagada: "b-ok",
  Parcial: "b-info",
  Pendiente: "b-warn",
  Vencida: "b-danger",
};
