/* ===== App Bootstrap: router + tweaks ===== */

const PALETTES_BS = {
  "Sauce (verde)":    { brand: "#3f6b54", strong: "#2f5240", tint: "#e7efe9", faint: "#f3f7f4", rgb: "63, 107, 84" },
  "Pizarra (azul)":   { brand: "#3f5e8c", strong: "#314c73", tint: "#e7edf5", faint: "#f3f6fb", rgb: "63, 94, 140" },
  "Arcilla (tierra)": { brand: "#8a6a3f", strong: "#6e5231", tint: "#f1ebe1", faint: "#f8f5ef", rgb: "138, 106, 63" },
  "Carbón (neutro)":  { brand: "#4a514d", strong: "#363b38", tint: "#eceeed", faint: "#f6f7f6", rgb: "74, 81, 77" },
};
const FONTS_BS = {
  "Public Sans": '"Public Sans", system-ui, sans-serif',
  "Hanken Grotesk": '"Hanken Grotesk", system-ui, sans-serif',
  "Libre Franklin": '"Libre Franklin", system-ui, sans-serif',
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "Sauce (verde)",
  "font": "Public Sans",
  "density": "regular"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [view, setView] = useState("dashboard");
  const [activeCase, setActiveCase] = useState(null);

  useEffect(() => {
    const root = document.documentElement;
    const p = PALETTES_BS[t.palette] || PALETTES_BS["Sauce (verde)"];
    root.style.setProperty("--brand", p.brand);
    root.style.setProperty("--brand-strong", p.strong);
    root.style.setProperty("--brand-tint", p.tint);
    root.style.setProperty("--brand-faint", p.faint);
    root.style.setProperty("--brand-rgb", p.rgb);
    root.style.setProperty("--bs-body-font-family", FONTS_BS[t.font] || FONTS_BS["Public Sans"]);
    root.setAttribute("data-density", t.density);
  }, [t.palette, t.font, t.density]);

  const newService = () => setView("cotizacion");

  const VIEWS = {
    dashboard:   <Dashboard openCase={setActiveCase} />,
    casos:       <CasesList openCase={setActiveCase} onNew={newService} />,
    agenda:      <Agenda />,
    catalogo:    <Catalogo />,
    cotizacion:  <Cotizacion />,
    clientes:    <Clientes />,
    inventario:  <Inventario />,
    facturacion: <Facturacion />,
  };

  return (
    <div className="app-grid">
      <Sidebar view={view} setView={setView} />
      <div className="d-flex flex-column overflow-hidden">
        <Topbar view={view} onNew={newService} />
        <div className="flex-grow-1 content-scroll">{VIEWS[view]}</div>
      </div>

      <CaseDrawer data={activeCase} onClose={() => setActiveCase(null)} />

      <TweaksPanel>
        <TweakSection label="Identidad visual" />
        <TweakSelect label="Paleta" value={t.palette} options={Object.keys(PALETTES_BS)} onChange={(v) => setTweak("palette", v)} />
        <TweakSelect label="Tipografía" value={t.font} options={Object.keys(FONTS_BS)} onChange={(v) => setTweak("font", v)} />
        <TweakSection label="Disposición" />
        <TweakRadio label="Densidad" value={t.density} options={["compact", "regular", "comfy"]} onChange={(v) => setTweak("density", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
