/* ===== Servicios (lista + offcanvas) + Agenda — Bootstrap ===== */

function CasesList({ openCase, onNew }) {
  const [tab, setTab] = useState("Todos");
  const tabs = ["Todos", "En curso", "Programado", "Pendiente", "Completado"];
  const rows = useMemo(() => tab === "Todos" ? CASES : CASES.filter((c) => c.estado === tab), [tab]);

  return (
    <div className="content-wrap">
      <PageHead title="Servicios funerarios" sub={`${CASES.length} servicios registrados · 4 activos esta semana`}>
        <button className="btn btn-primary d-inline-flex align-items-center gap-2" onClick={onNew}><I name="plus-lg" />Nuevo servicio</button>
      </PageHead>

      <div className="d-flex justify-content-between align-items-center gap-2 mb-4 flex-wrap">
        <Pills tabs={tabs} active={tab} onChange={setTab} />
        <div className="d-flex gap-2">
          <FilterChip label="Sala" value="Todas" />
          <FilterChip label="Encargado" value="Todos" />
          <button className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"><I name="funnel" />Filtros</button>
        </div>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead><tr>
              <th className="ps-4">Folio</th><th>Fallecido</th><th>Familiar responsable</th>
              <th>Plan</th><th>Sala</th><th>Velorio</th><th>Estado</th><th className="text-end pe-4">Saldo</th>
            </tr></thead>
            <tbody>
              {rows.map((c) => {
                const saldo = c.total - c.pagado;
                return (
                  <tr key={c.folio} onClick={() => openCase(c)}>
                    <td className="ps-4 tnum fw-bold text-primary">{c.folio}</td>
                    <td><div className="fw-semibold">{c.fallecido}</div><div className="text-secondary" style={{ fontSize: ".75rem" }}>{c.edad} años · {c.comuna}</div></td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <Avatar name={c.familiar} size={30} />
                        <div><div className="fw-semibold" style={{ fontSize: ".82rem" }}>{c.familiar}</div><div className="text-secondary" style={{ fontSize: ".72rem" }}>{c.parentesco}</div></div>
                      </div>
                    </td>
                    <td className="text-body-secondary">{c.plan}</td>
                    <td className="text-body-secondary">{c.sala}</td>
                    <td className="tnum text-body-secondary">{c.velorio}</td>
                    <td><EstadoBadge estado={c.estado} /></td>
                    <td className={"text-end pe-4 tnum fw-bold " + (saldo > 0 ? "text-danger" : "")} style={saldo > 0 ? {} : { color: "var(--brand)" }}>{saldo > 0 ? CLP(saldo) : "Pagado"}</td>
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

function CaseDrawer({ data, onClose }) {
  const [tab, setTab] = useState("Resumen");
  const show = !!data;
  const c = data || {};
  const saldo = (c.total || 0) - (c.pagado || 0);
  const pct = c.total ? Math.round((c.pagado / c.total) * 100) : 0;

  return (
    <>
      <div className={"offcanvas-backdrop fade " + (show ? "show" : "d-none")} onClick={onClose} style={{ opacity: show ? 0.4 : 0 }} />
      <div className={"offcanvas offcanvas-end offcanvas-case " + (show ? "show" : "")} style={{ visibility: show ? "visible" : "hidden" }} tabIndex="-1">
        {show && (
          <>
            <div className="p-4 border-bottom bg-white">
              <div className="d-flex align-items-start gap-3">
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className="tnum fw-800 text-primary" style={{ fontSize: ".8rem" }}>{c.folio}</span>
                    <EstadoBadge estado={c.estado} />
                  </div>
                  <h2 className="h4 fw-800 ls-tight mb-1">{c.fallecido}</h2>
                  <div className="text-secondary" style={{ fontSize: ".82rem" }}>{c.edad} años · RUT {c.rut} · {c.comuna}</div>
                </div>
                <button className="icon-btn" onClick={onClose}><I name="x-lg" /></button>
              </div>
              <div className="d-flex gap-2 mt-3">
                <button className="btn btn-primary btn-sm d-inline-flex align-items-center gap-2"><I name="pencil-square" />Editar caso</button>
                <button className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"><I name="printer" />Hoja de servicio</button>
                <button className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"><I name="telephone" />Llamar familia</button>
              </div>
            </div>

            <div className="px-4 pt-3 bg-white">
              <Pills tabs={["Resumen", "Línea de tiempo", "Pagos"]} active={tab} onChange={setTab} />
            </div>

            <div className="offcanvas-body content-scroll" style={{ padding: "1.5rem" }}>
              {tab === "Resumen" && (
                <div className="d-flex flex-column gap-4">
                  <div className="meta-grid">
                    <div className="meta-cell"><div className="meta-k">Familiar responsable</div><div className="fw-semibold">{c.familiar}</div><div className="text-secondary" style={{ fontSize: ".78rem" }}>{c.parentesco} · {c.telefono}</div></div>
                    <div className="meta-cell"><div className="meta-k">Encargado</div><div className="fw-semibold">{c.encargado}</div><div className="text-secondary" style={{ fontSize: ".78rem" }}>Ingreso {c.ingreso}</div></div>
                    <div className="meta-cell"><div className="meta-k">Plan contratado</div><div className="fw-semibold">{c.plan}</div></div>
                    <div className="meta-cell"><div className="meta-k">Sala asignada</div><div className="fw-semibold">{c.sala}</div></div>
                    <div className="meta-cell"><div className="meta-k">Velorio</div><div className="fw-semibold tnum">{c.velorio}</div></div>
                    <div className="meta-cell"><div className="meta-k">Ceremonia</div><div className="fw-semibold tnum">{c.ceremonia}</div></div>
                  </div>

                  <div className="card">
                    <div className="card-header"><span className="fw-bold">Destino final</span></div>
                    <div className="card-body d-flex align-items-center gap-3">
                      <div className="icon-tile" style={{ background: "var(--brand-tint)", color: "var(--brand)" }}><I name="geo-alt-fill" /></div>
                      <div><div className="fw-bold">{c.destino}</div><div className="text-secondary" style={{ fontSize: ".8rem" }}>Coordinación confirmada</div></div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header"><span className="fw-bold">Estado de pago</span></div>
                    <div className="card-body">
                      <div className="d-flex justify-content-between mb-2">
                        <div><div className="text-secondary fw-semibold" style={{ fontSize: ".75rem" }}>Abonado</div><div className="tnum fw-800 fs-5" style={{ color: "var(--brand)" }}>{CLP(c.pagado)}</div></div>
                        <div className="text-end"><div className="text-secondary fw-semibold" style={{ fontSize: ".75rem" }}>Saldo</div><div className={"tnum fw-800 fs-5 " + (saldo > 0 ? "text-danger" : "")} style={saldo > 0 ? {} : { color: "var(--brand)" }}>{CLP(saldo)}</div></div>
                      </div>
                      <Progress value={pct} />
                      <div className="tnum text-secondary mt-2" style={{ fontSize: ".78rem" }}>{pct}% pagado · Total {CLP(c.total)}</div>
                    </div>
                  </div>
                </div>
              )}

              {tab === "Línea de tiempo" && (
                <div className="timeline">
                  {TIMELINE_SAMPLE.map((t, i) => (
                    <div key={i} className={"tl-item " + (t.state === "done" ? "done" : t.state === "active" ? "active" : "")}>
                      <div className="d-flex justify-content-between gap-2">
                        <div className="fw-bold">{t.t}</div>
                        <div className="tnum text-secondary text-nowrap" style={{ fontSize: ".76rem" }}>{t.d}</div>
                      </div>
                      <div className="text-body-secondary mt-1" style={{ fontSize: ".84rem" }}>{t.note}</div>
                      <div className="text-secondary mt-1" style={{ fontSize: ".78rem" }}>{t.who}</div>
                    </div>
                  ))}
                </div>
              )}

              {tab === "Pagos" && (
                <div className="card">
                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead><tr><th className="ps-3">Fecha</th><th>Concepto</th><th>Medio</th><th className="text-end pe-3">Monto</th></tr></thead>
                      <tbody>
                        <tr><td className="ps-3 tnum">01-06-2026</td><td>Abono inicial (50%)</td><td>Transferencia</td><td className="text-end pe-3 tnum fw-bold">{CLP(c.pagado)}</td></tr>
                        {saldo > 0 && <tr><td className="ps-3 tnum text-secondary">Por cobrar</td><td className="text-secondary">Saldo pendiente</td><td className="text-secondary">—</td><td className="text-end pe-3 tnum fw-bold text-danger">{CLP(saldo)}</td></tr>}
                      </tbody>
                    </table>
                  </div>
                  {saldo > 0 && <div className="p-3"><button className="btn btn-primary d-inline-flex align-items-center gap-2"><I name="plus-lg" />Registrar abono</button></div>}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function Agenda() {
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
  const ROW_H = 46;
  return (
    <div className="content-wrap">
      <PageHead title="Agenda de salas" sub="Martes 2 de junio, 2026 · 4 salas de velatorio">
        <div className="d-flex gap-2 align-items-center">
          <ul className="nav nav-pills"><li className="nav-item"><button className="nav-link">Día</button></li><li className="nav-item"><button className="nav-link active">Semana</button></li><li className="nav-item"><button className="nav-link">Mes</button></li></ul>
          <button className="btn btn-primary btn-sm d-inline-flex align-items-center gap-2"><I name="plus-lg" />Reservar sala</button>
        </div>
      </PageHead>

      <div className="row g-3 mb-4">
        {SALAS.map((s, i) => {
          const ev = AGENDA.filter((a) => a.sala === i);
          const ocupada = ev.some((e) => e.color === "ok");
          return (
            <div className="col-6 col-lg-3" key={s}>
              <div className="card room-card h-100">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="fw-bold" style={{ fontSize: ".85rem" }}>{s}</div>
                  <Badge cls={ocupada ? "b-ok" : "b-neutral"} dot>{ocupada ? "Ocupada" : "Disponible"}</Badge>
                </div>
                <div className="text-secondary mt-1" style={{ fontSize: ".78rem" }}>{ev.length} evento{ev.length !== 1 ? "s" : ""} hoy</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card overflow-hidden">
        <div style={{ display: "grid", gridTemplateColumns: "60px repeat(4, 1fr)" }}>
          <div style={{ borderBottom: "1px solid #e3e7e3", background: "#f7f8f7" }} />
          {SALAS.map((s) => (
            <div key={s} className="fw-bold" style={{ borderBottom: "1px solid #e3e7e3", borderLeft: "1px solid #f0f2f0", background: "#f7f8f7", padding: "12px 14px", fontSize: ".82rem" }}>{s}</div>
          ))}
          {hours.map((h) => (
            <React.Fragment key={h}>
              <div className="tnum text-secondary fw-semibold" style={{ borderRight: "1px solid #f0f2f0", borderBottom: "1px solid #f0f2f0", fontSize: ".68rem", padding: "4px 8px", textAlign: "right", height: ROW_H }}>{String(h).padStart(2, "0")}:00</div>
              {SALAS.map((s, si) => {
                const ev = AGENDA.find((a) => a.sala === si && a.start === h);
                return (
                  <div key={si} className="agenda-cell" style={{ height: ROW_H }}>
                    {ev && (() => {
                      const col = AG_COLOR[ev.color];
                      const span = ev.end - ev.start;
                      return (
                        <div className="ag-event" style={{ height: span * ROW_H - 4, background: col.bg, borderLeftColor: col.bar, cursor: "pointer" }}>
                          <div className="fw-bold text-uppercase" style={{ fontSize: ".64rem", letterSpacing: ".03em", color: col.fg }}>{ev.tipo}</div>
                          <div className="fw-bold" style={{ fontSize: ".78rem", marginTop: 1 }}>{ev.titulo}</div>
                          <div className="text-secondary" style={{ fontSize: ".72rem" }}>{ev.sub}</div>
                          <div className="tnum text-secondary" style={{ fontSize: ".68rem", marginTop: 2 }}>{String(ev.start).padStart(2,"0")}:00–{String(ev.end).padStart(2,"0")}:00</div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CasesList, CaseDrawer, Agenda });
