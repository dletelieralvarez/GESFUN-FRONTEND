/* ===== Shell (sidebar + topbar) + Dashboard — Bootstrap ===== */

const NAV_BS = [
  { group: "General", items: [{ id: "dashboard", label: "Panel", icon: "grid-1x2-fill" }] },
  { group: "Operación", items: [
    { id: "casos", label: "Servicios", icon: "folder-fill", count: 4 },
    { id: "agenda", label: "Agenda de salas", icon: "calendar3" },
  ]},
  { group: "Comercial", items: [
    { id: "catalogo", label: "Catálogo y planes", icon: "grid-fill" },
    { id: "cotizacion", label: "Cotizaciones", icon: "file-earmark-text-fill" },
    { id: "clientes", label: "Clientes", icon: "people-fill" },
  ]},
  { group: "Recursos", items: [{ id: "inventario", label: "Inventario", icon: "box-seam-fill", count: 3 }] },
  { group: "Finanzas", items: [{ id: "facturacion", label: "Facturación", icon: "receipt", count: 2 }] },
];

const PAGE_META_BS = {
  dashboard:   { title: "Panel general", crumb: "Inicio" },
  casos:       { title: "Servicios funerarios", crumb: "Operación / Servicios" },
  agenda:      { title: "Agenda de salas", crumb: "Operación / Agenda" },
  catalogo:    { title: "Catálogo y planes", crumb: "Comercial / Catálogo" },
  cotizacion:  { title: "Cotizaciones", crumb: "Comercial / Cotizaciones" },
  clientes:    { title: "Clientes", crumb: "Comercial / Clientes" },
  inventario:  { title: "Inventario", crumb: "Recursos / Inventario" },
  facturacion: { title: "Facturación", crumb: "Finanzas / Facturación" },
};

function Sidebar({ view, setView }) {
  return (
    <aside className="sidebar">
      <div className="d-flex align-items-center gap-2 px-3 pt-3 pb-3">
        <div className="brand-mark">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3C7 7 6 13 8 19" /><path d="M12 3c5 4 6 10 4 16" opacity="0.8" /><path d="M12 3v18" opacity="0.55" />
          </svg>
        </div>
        <div>
          <div className="fw-bold lh-1" style={{ letterSpacing: "-0.01em" }}>El Sauce</div>
          <div className="text-secondary text-uppercase fw-semibold" style={{ fontSize: ".62rem", letterSpacing: ".05em" }}>Funeraria</div>
        </div>
      </div>

      <nav className="flex-grow-1 overflow-auto px-2 pb-2 content-scroll">
        {NAV_BS.map((g) => (
          <div className="mt-3" key={g.group}>
            <div className="nav-section">{g.group}</div>
            {g.items.map((it) => (
              <button key={it.id} className={"nav-link-sb " + (view === it.id ? "active" : "")} onClick={() => setView(it.id)}>
                <I name={it.icon} />
                <span>{it.label}</span>
                {it.count != null && <span className="nav-count tnum">{it.count}</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="border-top p-2">
        <div className="d-flex align-items-center gap-2 p-2 rounded-3">
          <Avatar name="Carla Méndez" size={36} />
          <div className="flex-grow-1" style={{ minWidth: 0 }}>
            <div className="fw-bold" style={{ fontSize: ".85rem" }}>Carla Méndez</div>
            <div className="text-secondary" style={{ fontSize: ".75rem" }}>Coordinadora</div>
          </div>
          <I name="box-arrow-right" className="text-secondary" />
        </div>
      </div>
    </aside>
  );
}

function Topbar({ view, onNew }) {
  const m = PAGE_META_BS[view] || {};
  return (
    <header className="topbar d-flex align-items-center gap-3 px-4">
      <div>
        <div className="text-secondary fw-semibold" style={{ fontSize: ".72rem" }}>{m.crumb}</div>
        <div className="fw-bold ls-tight" style={{ fontSize: "1.15rem" }}>{m.title}</div>
      </div>
      <div className="flex-grow-1" />
      <div className="input-group input-group-sm" style={{ width: 280 }}>
        <span className="input-group-text bg-white border-end-0 text-secondary"><I name="search" /></span>
        <input className="form-control border-start-0 ps-0" placeholder="Buscar caso, cliente, folio…" />
      </div>
      <button className="icon-btn"><I name="bell" /><span className="ping" /></button>
      <button className="btn btn-primary d-inline-flex align-items-center gap-2" onClick={onNew}><I name="plus-lg" />Nuevo servicio</button>
    </header>
  );
}

function Dashboard({ openCase }) {
  const activos = CASES.filter((c) => c.estado === "En curso" || c.estado === "Programado").length;
  const hoy = AGENDA.filter((a) => a.tipo === "Velorio" || a.tipo === "Ceremonia").length;
  const ingresos = CASES.filter((c) => c.estado !== "Pendiente").reduce((s, c) => s + c.pagado, 0);
  const lowStock = INVENTORY.filter((i) => i.stock < i.min);

  return (
    <div className="content-wrap">
      <PageHead title="Buenos días, Carla" sub="Lunes 2 de junio, 2026 · Resumen operativo de la jornada">
        <div className="d-flex gap-2">
          <FilterChip label="Periodo" value="Este mes" />
          <button className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"><I name="download" />Exportar</button>
        </div>
      </PageHead>

      <div className="row g-3 mb-4">
        <div className="col-6 col-xl-3"><Stat label="Servicios activos" icon="folder-fill" value={activos} delta="+2" tintBg="#e7f0e9" tintFg="#3d6b50" /></div>
        <div className="col-6 col-xl-3"><Stat label="Eventos hoy" icon="calendar3" value={hoy} delta="3 salas" tintBg="#e6edf6" tintFg="#3a5e92" /></div>
        <div className="col-6 col-xl-3"><Stat label="Ingresos del mes" icon="cash-stack" value={CLP(ingresos)} delta="+14%" tintBg="var(--brand-tint)" tintFg="var(--brand)" /></div>
        <div className="col-6 col-xl-3"><Stat label="Alertas de stock" icon="exclamation-triangle-fill" value={lowStock.length} delta="revisar" deltaDir="down" tintBg="#f6efdf" tintFg="#8a6a1f" /></div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-xl-7">
          <div className="card">
            <div className="card-header d-flex align-items-center">
              <div className="flex-grow-1">
                <div className="fw-bold">Servicios en curso</div>
                <div className="text-secondary fw-normal" style={{ fontSize: ".78rem" }}>Casos que requieren seguimiento hoy</div>
              </div>
              <button className="btn btn-soft btn-sm">Ver todos <I name="chevron-right" /></button>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead><tr><th className="ps-4">Folio / Fallecido</th><th>Sala</th><th>Estado</th><th className="text-end pe-4">Pago</th></tr></thead>
                <tbody>
                  {CASES.filter((c) => c.estado === "En curso" || c.estado === "Programado").map((c) => (
                    <tr key={c.folio} onClick={() => openCase(c)}>
                      <td className="ps-4"><div className="fw-bold">{c.fallecido}</div><div className="tnum text-secondary" style={{ fontSize: ".75rem" }}>{c.folio} · {c.plan}</div></td>
                      <td className="text-body-secondary">{c.sala}</td>
                      <td><EstadoBadge estado={c.estado} /></td>
                      <td className="text-end pe-4">
                        <div className="tnum fw-bold">{Math.round((c.pagado / c.total) * 100)}%</div>
                        <div style={{ width: 70, marginLeft: "auto", marginTop: 4 }}><Progress value={(c.pagado / c.total) * 100} /></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-5">
          <div className="d-flex flex-column gap-4">
            <div className="card">
              <div className="card-header"><div className="fw-bold">Agenda de hoy</div></div>
              <div className="list-group list-group-flush">
                {AGENDA.filter((a) => a.color !== "neutral").slice(0, 4).map((a, i) => {
                  const c = AG_COLOR[a.color];
                  return (
                    <div key={i} className="list-group-item d-flex align-items-center gap-3 border-0" style={{ borderBottom: i < 3 ? "1px solid #f0f2f0" : "none" }}>
                      <div style={{ width: 4, height: 38, borderRadius: 4, background: c.bar, flex: "none" }} />
                      <div className="flex-grow-1"><div className="fw-bold" style={{ fontSize: ".85rem" }}>{a.tipo} · {a.titulo}</div><div className="text-secondary" style={{ fontSize: ".78rem" }}>{SALAS[a.sala]}</div></div>
                      <div className="tnum fw-bold text-body-secondary" style={{ fontSize: ".82rem" }}>{String(a.start).padStart(2, "0")}:00</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <div className="card-header d-flex align-items-center"><span className="fw-bold flex-grow-1">Inventario bajo mínimo</span><Badge cls="b-warn" dot>{lowStock.length}</Badge></div>
              <div className="list-group list-group-flush">
                {lowStock.slice(0, 4).map((it, i) => (
                  <div key={it.sku} className="list-group-item d-flex align-items-center gap-3 border-0" style={{ borderBottom: i < Math.min(3, lowStock.length - 1) ? "1px solid #f0f2f0" : "none" }}>
                    <div className="icon-tile" style={{ width: 32, height: 32, background: "#f6efdf", color: "#8a6a1f", fontSize: "1rem" }}><I name="exclamation-triangle-fill" /></div>
                    <div className="flex-grow-1"><div className="fw-semibold" style={{ fontSize: ".82rem" }}>{it.item}</div><div className="tnum text-secondary" style={{ fontSize: ".75rem" }}>{it.sku}</div></div>
                    <div className="text-end"><span className="tnum fw-800 text-danger">{it.stock}</span><span className="tnum text-secondary" style={{ fontSize: ".75rem" }}> / {it.min} mín</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Sidebar, Topbar, Dashboard, NAV_BS, PAGE_META_BS });
