/* ===== Mock data — Funeraria El Sauce (contexto chileno) ===== */
const CLP = (n) => "$" + Math.round(n).toLocaleString("es-CL");

const AVATAR_COLORS = [
  "oklch(0.55 0.07 158)", "oklch(0.55 0.06 245)", "oklch(0.58 0.09 60)",
  "oklch(0.56 0.10 25)", "oklch(0.52 0.07 300)", "oklch(0.50 0.06 200)",
];
const initials = (name) =>
  name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
const colorFor = (name) => AVATAR_COLORS[(name.charCodeAt(0) + (name.charCodeAt(name.length - 1) || 0)) % AVATAR_COLORS.length];

const ENCARGADOS = ["Carla Méndez", "Joaquín Rivas", "Daniela Fuentes", "Andrés Tapia"];

const CASES = [
  { folio: "ES-2026-0418", fallecido: "María Eugenia Soto Carrasco", edad: 78, rut: "6.482.115-3",
    familiar: "Roberto Soto Vidal", parentesco: "Hijo", telefono: "+56 9 8421 5530", comuna: "Ñuñoa",
    plan: "Plan Tradicional", estado: "En curso", sala: "Sala San Francisco",
    velorio: "02-06 · 18:00", ceremonia: "04-06 · 11:00", destino: "Parque del Recuerdo",
    encargado: "Carla Méndez", ingreso: "01-06-2026", total: 2150000, pagado: 1075000 },
  { folio: "ES-2026-0417", fallecido: "Luis Alberto Cárcamo Pinto", edad: 84, rut: "4.118.902-6",
    familiar: "Patricia Cárcamo Reyes", parentesco: "Hija", telefono: "+56 9 7712 4408", comuna: "Maipú",
    plan: "Plan Premium", estado: "Programado", sala: "Sala Los Aromos",
    velorio: "03-06 · 16:00", ceremonia: "05-06 · 10:30", destino: "Cementerio General",
    encargado: "Joaquín Rivas", ingreso: "02-06-2026", total: 3480000, pagado: 3480000 },
  { folio: "ES-2026-0416", fallecido: "Rosa Inés Villalobos Díaz", edad: 91, rut: "3.902.554-K",
    familiar: "Manuel Villalobos", parentesco: "Hijo", telefono: "+56 9 9032 1187", comuna: "La Florida",
    plan: "Plan Tradicional", estado: "En curso", sala: "Sala El Sauce",
    velorio: "02-06 · 12:00", ceremonia: "03-06 · 09:00", destino: "Parque del Recuerdo",
    encargado: "Daniela Fuentes", ingreso: "01-06-2026", total: 1980000, pagado: 600000 },
  { folio: "ES-2026-0415", fallecido: "Jorge Hernán Aguilera Mora", edad: 67, rut: "8.221.340-1",
    familiar: "Claudia Aguilera Sanz", parentesco: "Hija", telefono: "+56 9 6650 9921", comuna: "Providencia",
    plan: "Plan Básico", estado: "Pendiente", sala: "—",
    velorio: "Por definir", ceremonia: "Por definir", destino: "Cremación · Crematorio Norte",
    encargado: "Andrés Tapia", ingreso: "02-06-2026", total: 1150000, pagado: 0 },
  { folio: "ES-2026-0414", fallecido: "Carmen Gloria Pérez Lagos", edad: 73, rut: "5.667.201-8",
    familiar: "Felipe Pérez", parentesco: "Hijo", telefono: "+56 9 8890 3345", comuna: "Puente Alto",
    plan: "Plan Tradicional", estado: "Completado", sala: "Sala Los Aromos",
    velorio: "29-05 · 17:00", ceremonia: "31-05 · 12:00", destino: "Cementerio Parque del Sendero",
    encargado: "Carla Méndez", ingreso: "28-05-2026", total: 2050000, pagado: 2050000 },
  { folio: "ES-2026-0413", fallecido: "Eduardo Andrés Salgado Bravo", edad: 59, rut: "9.110.778-4",
    familiar: "Verónica Bravo", parentesco: "Cónyuge", telefono: "+56 9 7045 6612", comuna: "San Miguel",
    plan: "Plan Premium", estado: "Completado", sala: "Sala San Francisco",
    velorio: "27-05 · 18:30", ceremonia: "29-05 · 10:00", destino: "Parque del Recuerdo",
    encargado: "Joaquín Rivas", ingreso: "26-05-2026", total: 3650000, pagado: 3650000 },
  { folio: "ES-2026-0412", fallecido: "Norma Cecilia Riquelme Gana", edad: 88, rut: "4.553.119-2",
    familiar: "Sergio Riquelme", parentesco: "Hijo", telefono: "+56 9 6678 2210", comuna: "Macul",
    plan: "Plan Básico", estado: "Completado", sala: "Sala El Sauce",
    velorio: "25-05 · 15:00", ceremonia: "26-05 · 11:30", destino: "Cementerio Metropolitano",
    encargado: "Daniela Fuentes", ingreso: "24-05-2026", total: 1180000, pagado: 1180000 },
];

const ESTADO_META = {
  "Pendiente":  { cls: "b-warn",   label: "Pendiente" },
  "Programado": { cls: "b-info",   label: "Programado" },
  "En curso":   { cls: "b-ok",     label: "En curso" },
  "Completado": { cls: "b-neutral",label: "Completado" },
};

const SALAS = ["Sala San Francisco", "Sala Los Aromos", "Sala El Sauce", "Sala Santa Clara"];

const AGENDA = [
  { sala: 0, start: 9,  end: 11, tipo: "Ceremonia", titulo: "Aguilera Mora", sub: "Responso", color: "info" },
  { sala: 0, start: 12, end: 19, tipo: "Velorio", titulo: "Soto Carrasco", sub: "Familia Soto", color: "ok" },
  { sala: 1, start: 10, end: 12, tipo: "Sepultación", titulo: "Pérez Lagos", sub: "P. del Sendero", color: "warn" },
  { sala: 1, start: 16, end: 21, tipo: "Velorio", titulo: "Cárcamo Pinto", sub: "Familia Cárcamo", color: "ok" },
  { sala: 2, start: 9,  end: 16, tipo: "Velorio", titulo: "Villalobos Díaz", sub: "Familia Villalobos", color: "ok" },
  { sala: 2, start: 17, end: 19, tipo: "Traslado", titulo: "Preparación sala", sub: "Mantención", color: "neutral" },
  { sala: 3, start: 11, end: 14, tipo: "Ceremonia", titulo: "Misa comunitaria", sub: "Capilla", color: "info" },
];
const AG_COLOR = {
  ok:   { bg: "var(--ok-bg)", bar: "var(--ok)", fg: "var(--ok)" },
  info: { bg: "var(--info-bg)", bar: "var(--info)", fg: "var(--info)" },
  warn: { bg: "var(--warn-bg)", bar: "var(--warn)", fg: "oklch(0.50 0.090 60)" },
  neutral: { bg: "var(--neutral-bg)", bar: "var(--faint)", fg: "var(--ink-soft)" },
};

const PLANS = [
  { name: "Plan Básico", price: 1150000, tag: "b-neutral", desc: "Servicio esencial, digno y completo para una despedida sobria.",
    items: ["Ataúd modelo Sauce natural", "Sala de velatorio (12 h)", "Carroza y traslado urbano", "Trámites y certificado de defunción", "Coordinación con cementerio"] },
  { name: "Plan Tradicional", price: 2050000, tag: "b-ok", popular: true, desc: "El más solicitado. Acompañamiento completo con servicios ceremoniales.",
    items: ["Ataúd modelo Roble tallado", "Sala de velatorio (24 h)", "Carroza y 2 traslados", "Servicio de café y atención", "Arreglo floral de cubierta", "Libro de condolencias", "Coordinación ceremonia religiosa"] },
  { name: "Plan Premium", price: 3480000, tag: "b-info", desc: "Servicio integral con la máxima atención al detalle y la familia.",
    items: ["Ataúd modelo Caoba premium", "Sala principal (48 h)", "Carroza de honor + cortejo", "Servicio de catering completo", "Arreglos florales premium", "Tarjetas y recordatorios impresos", "Transmisión en línea de ceremonia", "Asesor familiar dedicado"] },
];

const SERVICIOS_SUELTOS = [
  { name: "Hora adicional de sala", price: 35000, cat: "Salas" },
  { name: "Arreglo floral de cubierta", price: 95000, cat: "Flores" },
  { name: "Corona de condolencias", price: 68000, cat: "Flores" },
  { name: "Traslado interurbano (por km)", price: 1200, cat: "Traslados" },
  { name: "Servicio de café y atención", price: 140000, cat: "Atención" },
  { name: "Transmisión en línea", price: 110000, cat: "Tecnología" },
  { name: "Recordatorios impresos (100u)", price: 55000, cat: "Impresión" },
  { name: "Tanatopraxia / preparación", price: 180000, cat: "Preparación" },
];

const INVENTORY = [
  { cat: "Ataúdes", item: "Ataúd Sauce natural", sku: "ATA-001", stock: 14, min: 6, price: 380000 },
  { cat: "Ataúdes", item: "Ataúd Roble tallado", sku: "ATA-014", stock: 5, min: 6, price: 620000 },
  { cat: "Ataúdes", item: "Ataúd Caoba premium", sku: "ATA-021", stock: 2, min: 3, price: 1180000 },
  { cat: "Ataúdes", item: "Ataúd infantil blanco", sku: "ATA-030", stock: 8, min: 4, price: 290000 },
  { cat: "Urnas", item: "Urna cinerario madera", sku: "URN-005", stock: 22, min: 10, price: 145000 },
  { cat: "Urnas", item: "Urna mármol blanco", sku: "URN-011", stock: 3, min: 5, price: 240000 },
  { cat: "Urnas", item: "Urna biodegradable", sku: "URN-018", stock: 17, min: 8, price: 98000 },
  { cat: "Flores", item: "Arreglo de cubierta", sku: "FLO-002", stock: 9, min: 12, price: 95000 },
  { cat: "Flores", item: "Corona de condolencias", sku: "FLO-007", stock: 11, min: 10, price: 68000 },
  { cat: "Flores", item: "Centro floral pedestal", sku: "FLO-013", stock: 6, min: 6, price: 120000 },
  { cat: "Insumos", item: "Libro de condolencias", sku: "INS-004", stock: 40, min: 20, price: 18000 },
  { cat: "Insumos", item: "Cirios litúrgicos (par)", sku: "INS-009", stock: 4, min: 15, price: 12000 },
  { cat: "Insumos", item: "Set de tarjetas recordatorio", sku: "INS-016", stock: 28, min: 15, price: 9000 },
];

const CLIENTS = [
  { name: "Roberto Soto Vidal", rut: "10.224.881-5", telefono: "+56 9 8421 5530", email: "rsoto@correo.cl", comuna: "Ñuñoa", casos: 1, ultimo: "ES-2026-0418" },
  { name: "Patricia Cárcamo Reyes", rut: "12.554.019-2", telefono: "+56 9 7712 4408", email: "pcarcamo@correo.cl", comuna: "Maipú", casos: 1, ultimo: "ES-2026-0417" },
  { name: "Manuel Villalobos", rut: "9.881.220-4", telefono: "+56 9 9032 1187", email: "mvilla@correo.cl", comuna: "La Florida", casos: 2, ultimo: "ES-2026-0416" },
  { name: "Claudia Aguilera Sanz", rut: "14.005.772-9", telefono: "+56 9 6650 9921", email: "caguilera@correo.cl", comuna: "Providencia", casos: 1, ultimo: "ES-2026-0415" },
  { name: "Felipe Pérez", rut: "11.778.330-6", telefono: "+56 9 8890 3345", email: "fperez@correo.cl", comuna: "Puente Alto", casos: 1, ultimo: "ES-2026-0414" },
  { name: "Verónica Bravo", rut: "13.220.114-8", telefono: "+56 9 7045 6612", email: "vbravo@correo.cl", comuna: "San Miguel", casos: 3, ultimo: "ES-2026-0413" },
  { name: "Sergio Riquelme", rut: "8.443.901-0", telefono: "+56 9 6678 2210", email: "sriquelme@correo.cl", comuna: "Macul", casos: 1, ultimo: "ES-2026-0412" },
];

const INVOICES = [
  { folio: "F-2026-1042", caso: "ES-2026-0418", cliente: "Roberto Soto Vidal", monto: 2150000, abonado: 1075000, estado: "Parcial", emitida: "01-06-2026", vence: "16-06-2026" },
  { folio: "F-2026-1041", caso: "ES-2026-0417", cliente: "Patricia Cárcamo Reyes", monto: 3480000, abonado: 3480000, estado: "Pagada", emitida: "02-06-2026", vence: "17-06-2026" },
  { folio: "F-2026-1040", caso: "ES-2026-0416", cliente: "Manuel Villalobos", monto: 1980000, abonado: 600000, estado: "Parcial", emitida: "01-06-2026", vence: "16-06-2026" },
  { folio: "F-2026-1039", caso: "ES-2026-0415", cliente: "Claudia Aguilera Sanz", monto: 1150000, abonado: 0, estado: "Pendiente", emitida: "02-06-2026", vence: "17-06-2026" },
  { folio: "F-2026-1035", caso: "ES-2026-0411", cliente: "Inés Madariaga", monto: 2050000, abonado: 0, estado: "Vencida", emitida: "18-05-2026", vence: "28-05-2026" },
  { folio: "F-2026-1034", caso: "ES-2026-0414", cliente: "Felipe Pérez", monto: 2050000, abonado: 2050000, estado: "Pagada", emitida: "28-05-2026", vence: "12-06-2026" },
  { folio: "F-2026-1033", caso: "ES-2026-0413", cliente: "Verónica Bravo", monto: 3650000, abonado: 3650000, estado: "Pagada", emitida: "26-05-2026", vence: "10-06-2026" },
];
const INV_ESTADO = {
  "Pagada": "b-ok", "Parcial": "b-info", "Pendiente": "b-warn", "Vencida": "b-danger",
};

const TIMELINE_SAMPLE = [
  { t: "Ingreso del caso", d: "01-06 · 09:24", who: "Carla Méndez", state: "done", note: "Recepción de familia y datos del fallecido." },
  { t: "Plan contratado", d: "01-06 · 10:10", who: "Carla Méndez", state: "done", note: "Plan Tradicional · arreglo floral adicional." },
  { t: "Asignación de sala", d: "01-06 · 11:30", who: "Sistema", state: "done", note: "Sala San Francisco reservada 24 h." },
  { t: "Velorio en curso", d: "02-06 · 18:00", who: "Daniela Fuentes", state: "active", note: "Velatorio iniciado. Atención de café activa." },
  { t: "Ceremonia religiosa", d: "04-06 · 11:00", who: "—", state: "todo", note: "Coordinada con parroquia San Crescente." },
  { t: "Sepultación", d: "04-06 · 13:00", who: "—", state: "todo", note: "Parque del Recuerdo — sector Los Olivos." },
];

Object.assign(window, {
  CLP, initials, colorFor, ENCARGADOS, CASES, ESTADO_META, SALAS, AGENDA, AG_COLOR,
  PLANS, SERVICIOS_SUELTOS, INVENTORY, CLIENTS, INVOICES, INV_ESTADO, TIMELINE_SAMPLE,
});
