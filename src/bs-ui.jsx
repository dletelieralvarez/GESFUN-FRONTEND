/* ===== Primitivas con clases Bootstrap + Bootstrap Icons ===== */
const { useState, useMemo, useEffect } = React;

function Avatar({ name, size = 34 }) {
  return (
    <div className="avatar" style={{ width: size, height: size, background: colorFor(name), fontSize: size * 0.37 }}>
      {initials(name)}
    </div>
  );
}

function Badge({ cls, children, dot }) {
  return <span className={"badge rounded-pill " + cls}>{dot && <span className="dotb" />}{children}</span>;
}

const ESTADO_BS = {
  "Pendiente": "b-warn", "Programado": "b-info", "En curso": "b-ok", "Completado": "b-neutral",
};
function EstadoBadge({ estado }) {
  return <Badge cls={ESTADO_BS[estado] || "b-neutral"} dot>{estado}</Badge>;
}

/* Icon helper — inline SVG map (robust; mirrors Bootstrap Icon names).
   En un build Angular real puedes reemplazar por <i class="bi bi-{name}">. */
const SVG_ICONS = {
  "grid-1x2-fill": <><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></>,
  "folder-fill": <><path d="M3 8a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></>,
  "calendar3": <><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></>,
  "grid-fill": <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
  "file-earmark-text-fill": <><path d="M6 2h8l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/><path d="M14 2v5h5M8.5 12h7M8.5 15.5h7"/></>,
  "file-earmark-text": <><path d="M6 2h8l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/><path d="M14 2v5h5M8.5 12h7M8.5 15.5h5"/></>,
  "people-fill": <><circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 5.5a3 3 0 0 1 0 5.6M21 20a5.5 5.5 0 0 0-3.5-5.1"/></>,
  "box-seam-fill": <><path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10M7.5 5l9 4"/></>,
  "receipt": <><path d="M5 3h14v18l-3-1.6L13 21l-3-1.6L7 21 5 19.5z"/><path d="M9 8h6M9 12h6"/></>,
  "box-arrow-right": <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></>,
  "search": <><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></>,
  "bell": <><path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></>,
  "plus-lg": <><path d="M12 5v14M5 12h14"/></>,
  "download": <><path d="M12 3v12M7 10l5 5 5-5M4 21h16"/></>,
  "chevron-right": <><path d="m9 6 6 6-6 6"/></>,
  "chevron-down": <><path d="m6 9 6 6 6-6"/></>,
  "funnel": <><path d="M3 5h18l-7 8v6l-4 2v-8z"/></>,
  "arrow-up-short": <><path d="M12 19V7M6 12l6-6 6 6"/></>,
  "arrow-down-short": <><path d="M12 5v12M6 12l6 6 6-6"/></>,
  "exclamation-triangle-fill": <><path d="M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6A2 2 0 0 0 22 18L13.7 3.9a2 2 0 0 0-3.4 0"/><path d="M12 9v4.5M12 17h.01"/></>,
  "exclamation-octagon-fill": <><path d="M8.3 3h7.4L21 8.3v7.4L15.7 21H8.3L3 15.7V8.3z"/><path d="M12 8v5M12 16.5h.01"/></>,
  "cash-stack": <><rect x="2" y="7" width="20" height="11" rx="2"/><circle cx="12" cy="12.5" r="2.4"/><path d="M6 10v5M18 10v5"/></>,
  "x-lg": <><path d="M18 6 6 18M6 6l12 12"/></>,
  "pencil-square": <><path d="M12 20h9"/><path d="M16.5 3.5a2 2 0 0 1 3 3L7 19l-4 1 1-4z"/></>,
  "printer": <><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="7" rx="1"/></>,
  "telephone": <><path d="M5 4h4l2 5-3 2a14 14 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A18 18 0 0 1 3 6a2 2 0 0 1 2-2"/></>,
  "geo-alt-fill": <><path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11"/><circle cx="12" cy="10" r="2.5"/></>,
  "check-lg": <><path d="M20 6 9 17l-5-5"/></>,
  "check-circle-fill": <><circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/></>,
  "clock-fill": <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
};
function I({ name, className, style }) {
  const sw = /-fill$/.test(name) ? 1.6 : 1.7;
  return (
    <svg className={className} style={{ width: "1em", height: "1em", verticalAlign: "-0.125em", flex: "none", ...style }}
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {SVG_ICONS[name] || null}
    </svg>
  );
}

function Stat({ label, icon, value, delta, deltaDir, tintBg, tintFg }) {
  return (
    <div className="card h-100">
      <div className="card-body">
        <div className="d-flex align-items-start justify-content-between mb-3">
          <div className="icon-tile" style={{ background: tintBg, color: tintFg }}><I name={icon} /></div>
          {delta && (
            <span className={"small fw-semibold d-inline-flex align-items-center gap-1 " + (deltaDir === "down" ? "text-danger" : "")}
              style={deltaDir === "down" ? {} : { color: "var(--brand)" }}>
              <I name={deltaDir === "down" ? "arrow-down-short" : "arrow-up-short"} />{delta}
            </span>
          )}
        </div>
        <div className="kpi-val tnum">{value}</div>
        <div className="text-secondary small fw-semibold mt-1">{label}</div>
      </div>
    </div>
  );
}

function Pills({ tabs, active, onChange }) {
  return (
    <ul className="nav nav-pills">
      {tabs.map((t) => (
        <li className="nav-item" key={t}>
          <button className={"nav-link " + (active === t ? "active" : "")} onClick={() => onChange(t)}>{t}</button>
        </li>
      ))}
    </ul>
  );
}

function PageHead({ title, sub, children }) {
  return (
    <div className="d-flex align-items-end gap-3 flex-wrap mb-4">
      <div className="flex-grow-1" style={{ minWidth: 200 }}>
        <h1 className="h3 fw-800 ls-tight mb-0">{title}</h1>
        {sub && <p className="text-secondary mb-0 mt-1" style={{ fontSize: ".9rem" }}>{sub}</p>}
      </div>
      {children}
    </div>
  );
}

function Progress({ value, color }) {
  return (
    <div className="progress" style={{ height: 7 }}>
      <div className="progress-bar" style={{ width: Math.min(100, value) + "%", background: color || "var(--brand)" }} />
    </div>
  );
}

/* lightweight dropdown-looking filter (non-functional select chip) */
function FilterChip({ label, value }) {
  return (
    <button className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2">
      {label && <span className="text-secondary">{label}</span>}
      <span>{value}</span>
      <I name="chevron-down" style={{ fontSize: ".7rem" }} />
    </button>
  );
}

Object.assign(window, { Avatar, Badge, EstadoBadge, I, Stat, Pills, PageHead, Progress, FilterChip, useState, useMemo, useEffect });
