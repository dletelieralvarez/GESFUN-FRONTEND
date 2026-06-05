/* ===== Catálogo · Cotización · Inventario · Clientes · Facturación — Bootstrap ===== */

function Catalogo() {
  return (
    <div className="content-wrap">
      <PageHead title="Catálogo y planes" sub="Planes de servicio y prestaciones adicionales">
        <button className="btn btn-outline-secondary d-inline-flex align-items-center gap-2"><I name="plus-lg" />Nuevo plan</button>
      </PageHead>

      <div className="row g-4 mb-4">
        {PLANS.map((p) => (
          <div className="col-12 col-lg-4" key={p.name}>
            <div className={"card h-100 position-relative " + (p.popular ? "border-2" : "")} style={p.popular ? { borderColor: "var(--brand)" } : {}}>
              {p.popular && <span className="badge text-bg-light position-absolute" style={{ top: -11, left: 20, background: "var(--brand)", color: "#fff" }}>MÁS SOLICITADO</span>}
              <div className="card-body pb-2">
                <Badge cls={p.tag}>{p.name}</Badge>
                <div className="tnum fw-800 ls-tight mt-2" style={{ fontSize: "1.85rem" }}>{CLP(p.price)}</div>
                <p className="text-secondary mt-2 mb-0" style={{ fontSize: ".84rem", textWrap: "pretty" }}>{p.desc}</p>
              </div>
              <hr className="my-2 text-body-tertiary" />
              <div className="card-body pt-2 flex-grow-1">
                <div className="d-flex flex-column gap-2">
                  {p.items.map((it) => (
                    <div key={it} className="d-flex gap-2" style={{ fontSize: ".84rem" }}>
                      <I name="check-lg" style={{ color: "var(--brand)", marginTop: 1 }} />
                      <span className="text-body-secondary">{it}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card-body pt-0">
                <button className={"btn w-100 d-inline-flex align-items-center justify-content-center gap-2 " + (p.popular ? "btn-primary" : "btn-outline-secondary")}><I name="file-earmark-text" />Cotizar este plan</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header"><div className="fw-bold">Servicios y prestaciones adicionales</div><div className="text-secondary fw-normal" style={{ fontSize: ".78rem" }}>Se agregan a cualquier plan según necesidad de la familia</div></div>
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead><tr><th className="ps-4">Servicio</th><th>Categoría</th><th className="text-end">Valor</th><th className="pe-4" style={{ width: 110 }}></th></tr></thead>
            <tbody>
              {SERVICIOS_SUELTOS.map((s) => (
                <tr key={s.name}>
                  <td className="ps-4 fw-semibold">{s.name}</td>
                  <td><Badge cls="b-neutral">{s.cat}</Badge></td>
                  <td className="text-end tnum fw-bold">{CLP(s.price)}</td>
                  <td className="text-end pe-4"><button className="btn btn-soft btn-sm d-inline-flex align-items-center gap-1"><I name="plus-lg" />Agregar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Cotizacion() {
  const [plan, setPlan] = useState(PLANS[1]);
  const [extras, setExtras] = useState({ 1: true, 4: true });
  const toggle = (i) => setExtras((e) => ({ ...e, [i]: !e[i] }));
  const extrasTotal = SERVICIOS_SUELTOS.reduce((s, x, i) => s + (extras[i] ? x.price : 0), 0);
  const subtotal = plan.price + extrasTotal;
  const iva = Math.round(subtotal * 0.19);
  const total = subtotal + iva;

  return (
    <div className="content-wrap">
      <PageHead title="Nueva cotización" sub="Arma una propuesta de servicio para la familia" />
      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <div className="d-flex flex-column gap-4">
            <div className="card">
              <div className="card-header"><span className="fw-bold">Datos de la familia</span></div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6"><label className="form-label fw-semibold small">Familiar responsable</label><input className="form-control" defaultValue="Roberto Soto Vidal" /></div>
                  <div className="col-md-6"><label className="form-label fw-semibold small">RUT</label><input className="form-control" defaultValue="10.224.881-5" /></div>
                  <div className="col-md-6"><label className="form-label fw-semibold small">Teléfono</label><input className="form-control" defaultValue="+56 9 8421 5530" /></div>
                  <div className="col-md-6"><label className="form-label fw-semibold small">Comuna</label><input className="form-control" defaultValue="Ñuñoa" /></div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><span className="fw-bold">Plan base</span></div>
              <div className="card-body d-flex flex-column gap-2">
                {PLANS.map((p) => {
                  const sel = plan.name === p.name;
                  return (
                    <label key={p.name} onClick={() => setPlan(p)} className="d-flex align-items-center gap-3 p-3 rounded-3" style={{ border: `1.5px solid ${sel ? "var(--brand)" : "#e3e7e3"}`, cursor: "pointer", background: sel ? "var(--brand-faint)" : "#fff" }}>
                      <div style={{ width: 19, height: 19, borderRadius: "50%", border: `2px solid ${sel ? "var(--brand)" : "#c3cac3"}`, display: "grid", placeItems: "center", flex: "none" }}>
                        {sel && <div style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--brand)" }} />}
                      </div>
                      <div className="flex-grow-1"><div className="fw-bold">{p.name}</div><div className="text-secondary" style={{ fontSize: ".78rem" }}>{p.items.length} prestaciones incluidas</div></div>
                      <div className="tnum fw-800">{CLP(p.price)}</div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><span className="fw-bold">Servicios adicionales</span></div>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <tbody>
                    {SERVICIOS_SUELTOS.map((s, i) => (
                      <tr key={s.name} onClick={() => toggle(i)}>
                        <td className="ps-4" style={{ width: 50 }}>
                          <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${extras[i] ? "var(--brand)" : "#c3cac3"}`, background: extras[i] ? "var(--brand)" : "transparent", display: "grid", placeItems: "center" }}>
                            {extras[i] && <I name="check-lg" style={{ color: "#fff", fontSize: ".8rem" }} />}
                          </div>
                        </td>
                        <td className="fw-semibold">{s.name}</td>
                        <td><Badge cls="b-neutral">{s.cat}</Badge></td>
                        <td className="text-end pe-4 tnum fw-bold">{CLP(s.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card" style={{ position: "sticky", top: 0 }}>
            <div className="card-header"><span className="fw-bold">Resumen de cotización</span></div>
            <div className="card-body">
              <div className="d-flex justify-content-between mb-2" style={{ fontSize: ".84rem" }}><span className="text-body-secondary">{plan.name}</span><span className="tnum fw-semibold">{CLP(plan.price)}</span></div>
              {SERVICIOS_SUELTOS.map((s, i) => extras[i] && (
                <div key={i} className="d-flex justify-content-between mb-2 text-secondary" style={{ fontSize: ".82rem" }}><span>+ {s.name}</span><span className="tnum">{CLP(s.price)}</span></div>
              ))}
              <hr className="text-body-tertiary" />
              <div className="d-flex justify-content-between mb-2" style={{ fontSize: ".84rem" }}><span className="text-body-secondary">Subtotal</span><span className="tnum fw-semibold">{CLP(subtotal)}</span></div>
              <div className="d-flex justify-content-between mb-2" style={{ fontSize: ".84rem" }}><span className="text-body-secondary">IVA (19%)</span><span className="tnum fw-semibold">{CLP(iva)}</span></div>
              <hr className="text-body-tertiary" />
              <div className="d-flex justify-content-between align-items-baseline mb-3"><span className="fw-bold">Total</span><span className="tnum fw-800 text-primary" style={{ fontSize: "1.5rem" }}>{CLP(total)}</span></div>
              <button className="btn btn-primary w-100 mb-2 d-inline-flex align-items-center justify-content-center gap-2"><I name="check-lg" />Generar cotización</button>
              <button className="btn btn-outline-secondary w-100 d-inline-flex align-items-center justify-content-center gap-2"><I name="printer" />Imprimir / PDF</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Inventario() {
  const [cat, setCat] = useState("Todas");
  const cats = ["Todas", "Ataúdes", "Urnas", "Flores", "Insumos"];
  const rows = useMemo(() => cat === "Todas" ? INVENTORY : INVENTORY.filter((i) => i.cat === cat), [cat]);
  const valorTotal = INVENTORY.reduce((s, i) => s + i.stock * i.price, 0);
  const low = INVENTORY.filter((i) => i.stock < i.min).length;

  return (
    <div className="content-wrap">
      <PageHead title="Inventario" sub="Control de existencias de ataúdes, urnas, flores e insumos">
        <button className="btn btn-primary d-inline-flex align-items-center gap-2"><I name="plus-lg" />Ingresar stock</button>
      </PageHead>

      <div className="row g-3 mb-4">
        <div className="col-md-4"><Stat label="Ítems en catálogo" icon="box-seam-fill" value={INVENTORY.length} tintBg="#e6edf6" tintFg="#3a5e92" /></div>
        <div className="col-md-4"><Stat label="Valor del inventario" icon="cash-stack" value={CLP(valorTotal)} tintBg="var(--brand-tint)" tintFg="var(--brand)" /></div>
        <div className="col-md-4"><Stat label="Bajo el mínimo" icon="exclamation-triangle-fill" value={low} delta="reponer" deltaDir="down" tintBg="#f6efdf" tintFg="#8a6a1f" /></div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <Pills tabs={cats} active={cat} onChange={setCat} />
        <div className="input-group input-group-sm" style={{ width: 260 }}>
          <span className="input-group-text bg-white border-end-0 text-secondary"><I name="search" /></span>
          <input className="form-control border-start-0 ps-0" placeholder="Buscar por SKU o nombre…" />
        </div>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead><tr><th className="ps-4">SKU</th><th>Producto</th><th>Categoría</th><th className="text-center">Existencias</th><th>Nivel</th><th className="text-end pe-4">Valor unit.</th></tr></thead>
            <tbody>
              {rows.map((it) => {
                const isLow = it.stock < it.min;
                const ratio = Math.min(100, (it.stock / (it.min * 2)) * 100);
                return (
                  <tr key={it.sku}>
                    <td className="ps-4 tnum fw-bold text-secondary">{it.sku}</td>
                    <td className="fw-semibold">{it.item}</td>
                    <td><Badge cls="b-neutral">{it.cat}</Badge></td>
                    <td className="text-center"><span className={"tnum fw-800 " + (isLow ? "text-danger" : "")} style={{ fontSize: "1rem" }}>{it.stock}</span><span className="tnum text-secondary" style={{ fontSize: ".75rem" }}> / {it.min}</span></td>
                    <td style={{ width: 180 }}>
                      <div className="d-flex align-items-center gap-2">
                        <div className="flex-grow-1"><Progress value={ratio} color={isLow ? "#b5402f" : ratio < 60 ? "#c79a3a" : "var(--brand)"} /></div>
                        {isLow && <Badge cls="b-danger" dot>Bajo</Badge>}
                      </div>
                    </td>
                    <td className="text-end pe-4 tnum fw-bold">{CLP(it.price)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Clientes() {
  return (
    <div className="content-wrap">
      <PageHead title="Clientes" sub={`${CLIENTS.length} familias registradas`}>
        <button className="btn btn-primary d-inline-flex align-items-center gap-2"><I name="plus-lg" />Nuevo cliente</button>
      </PageHead>
      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead><tr><th className="ps-4">Cliente</th><th>RUT</th><th>Contacto</th><th>Comuna</th><th className="text-center">Servicios</th><th className="pe-4">Último folio</th></tr></thead>
            <tbody>
              {CLIENTS.map((c) => (
                <tr key={c.rut}>
                  <td className="ps-4">
                    <div className="d-flex align-items-center gap-2">
                      <Avatar name={c.name} size={34} />
                      <div><div className="fw-bold">{c.name}</div><div className="text-secondary" style={{ fontSize: ".75rem" }}>{c.email}</div></div>
                    </div>
                  </td>
                  <td className="tnum text-body-secondary">{c.rut}</td>
                  <td className="tnum text-body-secondary">{c.telefono}</td>
                  <td className="text-body-secondary">{c.comuna}</td>
                  <td className="text-center"><Badge cls="b-neutral">{c.casos}</Badge></td>
                  <td className="pe-4 tnum fw-bold text-primary">{c.ultimo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Facturacion() {
  const [tab, setTab] = useState("Todas");
  const tabs = ["Todas", "Pendiente", "Parcial", "Pagada", "Vencida"];
  const rows = useMemo(() => tab === "Todas" ? INVOICES : INVOICES.filter((i) => i.estado === tab), [tab]);
  const porCobrar = INVOICES.reduce((s, i) => s + (i.monto - i.abonado), 0);
  const cobrado = INVOICES.reduce((s, i) => s + i.abonado, 0);
  const vencidas = INVOICES.filter((i) => i.estado === "Vencida").length;

  return (
    <div className="content-wrap">
      <PageHead title="Facturación" sub="Estado de cobranza de los servicios">
        <button className="btn btn-primary d-inline-flex align-items-center gap-2"><I name="plus-lg" />Emitir factura</button>
      </PageHead>

      <div className="row g-3 mb-4">
        <div className="col-md-4"><Stat label="Cobrado este mes" icon="check-circle-fill" value={CLP(cobrado)} delta="+14%" tintBg="#e7f0e9" tintFg="#3d6b50" /></div>
        <div className="col-md-4"><Stat label="Por cobrar" icon="clock-fill" value={CLP(porCobrar)} tintBg="#f6efdf" tintFg="#8a6a1f" /></div>
        <div className="col-md-4"><Stat label="Facturas vencidas" icon="exclamation-octagon-fill" value={vencidas} delta="gestionar" deltaDir="down" tintBg="#f6e6e3" tintFg="#9a3b2c" /></div>
      </div>

      <div className="mb-4"><Pills tabs={tabs} active={tab} onChange={setTab} /></div>

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead><tr><th className="ps-4">Folio</th><th>Caso</th><th>Cliente</th><th>Emitida</th><th>Vence</th><th>Estado</th><th className="text-end">Monto</th><th className="text-end pe-4">Saldo</th></tr></thead>
            <tbody>
              {rows.map((f) => {
                const saldo = f.monto - f.abonado;
                return (
                  <tr key={f.folio}>
                    <td className="ps-4 tnum fw-bold text-primary">{f.folio}</td>
                    <td className="tnum text-secondary">{f.caso}</td>
                    <td className="fw-semibold">{f.cliente}</td>
                    <td className="tnum text-body-secondary">{f.emitida}</td>
                    <td className={"tnum " + (f.estado === "Vencida" ? "text-danger fw-bold" : "text-body-secondary")}>{f.vence}</td>
                    <td><Badge cls={INV_ESTADO[f.estado]} dot>{f.estado}</Badge></td>
                    <td className="text-end tnum fw-semibold">{CLP(f.monto)}</td>
                    <td className={"text-end pe-4 tnum fw-bold " + (saldo > 0 ? "text-danger" : "")} style={saldo > 0 ? {} : { color: "var(--brand)" }}>{saldo > 0 ? CLP(saldo) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Catalogo, Cotizacion, Inventario, Clientes, Facturacion });
