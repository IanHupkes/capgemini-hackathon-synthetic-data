// screen-select.jsx — minimal start screen: location + data + generate.

function SelectScreen({ t, cfg, setCfg, onGenerate }) {
  const gemeente = LOCATIONS.find((g) => g.code === cfg.gemeente) || null;
  const wijk = gemeente ? gemeente.wijken.find((w) => w.code === cfg.wijk) : null;
  const buurt = wijk ? wijk.buurten.find((b) => b.code === cfg.buurt) : null;

  const mustVars = VARIABLES.filter((v) => v.prioriteit === "must").map((v) => v.id);
  const canGenerate = !!buurt && cfg.vars.length > 0;

  function setGemeente(code) { setCfg({ ...cfg, gemeente: code, wijk: "", buurt: "" }); }
  function setWijk(code) { setCfg({ ...cfg, wijk: code, buurt: "" }); }
  function toggleVar(id) {
    if (mustVars.includes(id)) return;              // verplicht — niet uitschakelbaar
    setCfg({ ...cfg, vars: cfg.vars.includes(id) ? cfg.vars.filter((v) => v !== id) : [...cfg.vars, id] });
  }

  const presets = [5000, 10000, 25000];

  return (
    <main id="hoofdinhoud" style={sel.main}>
      <div style={sel.head}>
        <h1 style={sel.h1}>{t.selTitle}</h1>
        <p style={sel.sub}>{t.selSub}</p>
      </div>

      <div style={sel.card}>
        {/* Locatie */}
        <section style={sel.section}>
          <div style={sel.secHead}>
            <span style={sel.secIcon} aria-hidden="true"><Icon name="mapPin" size={18} /></span>
            <h2 style={sel.secTitle}>{t.selLocation}</h2>
          </div>
          <div style={sel.locGrid}>
            <Field label={t.selGemeente} htmlFor="f-gem">
              <Select id="f-gem" value={cfg.gemeente} onChange={setGemeente}
                placeholder={t.lang === "en" ? "Choose…" : "Kies…"}
                options={LOCATIONS.map((g) => ({ value: g.code, label: g.naam }))} />
            </Field>
            <Field label={t.selWijk} htmlFor="f-wijk">
              <Select id="f-wijk" value={cfg.wijk} onChange={setWijk}
                disabled={!gemeente}
                placeholder={t.lang === "en" ? "Choose…" : "Kies…"}
                options={gemeente ? gemeente.wijken.map((w) => ({ value: w.code, label: w.naam })) : []} />
            </Field>
            <Field label={t.selBuurt} htmlFor="f-buurt">
              <Select id="f-buurt" value={cfg.buurt} onChange={(v) => setCfg({ ...cfg, buurt: v })}
                disabled={!wijk}
                placeholder={t.lang === "en" ? "Choose…" : "Kies…"}
                options={wijk ? wijk.buurten.map((b) => ({ value: b.code, label: b.naam })) : []} />
            </Field>
          </div>
          {buurt && (
            <div style={sel.mapBlock}>
              <MiniMap buurt={buurt} wijk={wijk} />
              <p style={sel.locInfo}>
                <Icon name="mapPin" size={15} style={{ color: "var(--accent-dark)", flexShrink: 0 }} />
                <span><strong style={{ color: "var(--fg)", fontWeight: 700 }}>{buurt.naam}</strong> · {buurt.code} · {buurt.inw.toLocaleString("nl-NL")} {t.selInhabitants}</span>
              </p>
            </div>
          )}
        </section>

        <hr style={sel.divider} />

        {/* Gegevens */}
        <section style={sel.section}>
          <div style={sel.secHead}>
            <span style={sel.secIcon} aria-hidden="true"><Icon name="layers" size={18} /></span>
            <h2 style={sel.secTitle}>{t.selVars}</h2>
          </div>
          <div style={sel.chips} role="group" aria-label={t.selVars}>
            {VARIABLES.map((v) => {
              const on = cfg.vars.includes(v.id);
              const locked = mustVars.includes(v.id);
              return (
                <button key={v.id} type="button" onClick={() => toggleVar(v.id)}
                  aria-pressed={on} disabled={locked}
                  title={locked ? (t.lang === "en" ? "Required" : "Verplicht") : v.beschrijving}
                  style={{ ...sel.chip, ...(on ? sel.chipOn : {}), ...(locked ? sel.chipLocked : {}) }}>
                  <span style={sel.chipMark} aria-hidden="true">
                    {on ? <Icon name="check" size={15} stroke={3} /> : <Icon name="plus" size={15} stroke={2.5} />}
                  </span>
                  {v.naam}
                </button>
              );
            })}
          </div>
          <p style={sel.note}>{t.lang === "en" ? "Required fields are always included." : "Verplichte gegevens zijn altijd inbegrepen."}</p>
        </section>

        <hr style={sel.divider} />

        <div style={sel.actions}>
          <Button variant="primary" size="lg" disabled={!canGenerate} onClick={onGenerate}
            icon={<Icon name="sparkles" size={20} />}>{t.selGenerate}</Button>
          {!buurt && <span style={sel.hint}>{t.lang === "en" ? "Select an area first." : "Selecteer eerst een gebied."}</span>}
        </div>
      </div>
    </main>
  );
}

const sel = {
  main: { maxWidth: 720, margin: "0 auto", padding: "40px 24px 72px" },
  head: { marginBottom: 22, textAlign: "center" },
  h1: { fontSize: 28, fontWeight: 700, margin: "0 0 6px", color: "var(--fg)" },
  sub: { fontSize: 16, color: "var(--fg-muted)", margin: 0 },

  card: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "calc(26px * var(--density))", boxShadow: "var(--shadow-sm)" },
  section: {},
  sectionRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, alignItems: "start" },
  secHead: { display: "flex", alignItems: "center", gap: 10, marginBottom: 14 },
  secIcon: { width: 32, height: 32, borderRadius: 8, background: "color-mix(in srgb, var(--primary) 9%, white)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  secTitle: { margin: 0, fontSize: 16, fontWeight: 700, color: "var(--fg)" },
  divider: { border: "none", borderTop: "1px solid var(--border)", margin: "22px 0" },

  locGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 },
  mapBlock: { marginTop: 14 },
  mapWrap: { position: "relative", borderRadius: "var(--radius)", overflow: "hidden", border: "1px solid var(--border)" },
  mapEl: { width: "100%", height: 200, background: "var(--bg-sunken)" },
  mapBadge: { position: "absolute", left: 10, top: 10, zIndex: 500, background: "var(--surface)", color: "var(--fg)", fontSize: 12.5, fontWeight: 700, padding: "4px 10px", borderRadius: 999, boxShadow: "var(--shadow-sm)", lineHeight: 1.2, pointerEvents: "none" },
  locInfo: { display: "flex", alignItems: "center", gap: 8, margin: "12px 0 0", fontSize: 13.5, color: "var(--fg-subtle)" },

  chips: { display: "flex", flexWrap: "wrap", gap: 9 },
  chip: { display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 15px 9px 11px", border: "1.5px solid var(--border)", borderRadius: 999, background: "var(--bg)", color: "var(--fg-muted)", fontFamily: "inherit", fontSize: 14.5, fontWeight: 600, cursor: "pointer", transition: "border-color .15s, background .15s, color .15s" },
  chipOn: { borderColor: "var(--primary)", background: "color-mix(in srgb, var(--primary) 6%, white)", color: "var(--primary-dark)" },
  chipLocked: { cursor: "default" },
  chipMark: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 16, height: 16, flexShrink: 0, color: "currentColor", opacity: 0.65 },
  note: { margin: "12px 0 0", fontSize: 13, color: "var(--fg-subtle)" },

  presets: { display: "flex", gap: 8 },
  preset: { flex: 1, padding: "11px 8px", border: "1.5px solid var(--border)", borderRadius: "var(--radius)", background: "var(--bg)", color: "var(--fg-muted)", fontFamily: "inherit", fontSize: 14.5, fontWeight: 700, cursor: "pointer", fontVariantNumeric: "tabular-nums", transition: "border-color .15s, background .15s, color .15s" },
  presetOn: { borderColor: "var(--primary)", background: "var(--primary)", color: "#fff" },

  actions: { display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 16 },
  hint: { fontSize: 13.5, color: "var(--fg-subtle)" },
};

Object.assign(window, { SelectScreen });

/* ----------------------- MiniMap: real OSM map (Leaflet) ----------------------- */
// Shows the selected buurt on an OpenStreetMap basemap with a pin.
function MiniMap({ buurt, wijk }) {
  const elRef = React.useRef(null);
  const mapRef = React.useRef(null);
  const markerRef = React.useRef(null);

  React.useEffect(() => {
    if (!window.L || !elRef.current) return;
    const L = window.L;
    const center = [buurt.lat, buurt.lng];

    if (!mapRef.current) {
      const map = L.map(elRef.current, {
        center, zoom: 15, zoomControl: true, scrollWheelZoom: false,
        attributionControl: true,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '© OpenStreetMap',
      }).addTo(map);
      mapRef.current = map;
    }

    const map = mapRef.current;
    map.setView(center, 15, { animate: false });

    // colored pin matching the brand
    const primary = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() || "#154273";
    const html = `<span style="display:block;width:22px;height:22px;border-radius:50% 50% 50% 0;background:${primary};transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.4);border:2.5px solid #fff;"></span>`;
    const icon = L.divIcon({ className: "sd-pin", html, iconSize: [22, 22], iconAnchor: [11, 22] });

    if (markerRef.current) markerRef.current.remove();
    markerRef.current = L.marker(center, { icon, keyboard: false, title: buurt.naam }).addTo(map)
      .bindPopup(`<strong>${buurt.naam}</strong><br>${buurt.code}`);

    // fix tiles after the container becomes visible / resizes
    setTimeout(() => map.invalidateSize(), 60);
  }, [buurt.code]);

  React.useEffect(() => () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } }, []);

  return (
    <div style={sel.mapWrap}>
      <div ref={elRef} style={sel.mapEl}
        role="img" aria-label={`Kaart van ${buurt.naam}${wijk ? ", wijk " + wijk.naam : ""}`} />
      <span style={sel.mapBadge}>{wijk ? wijk.naam : ""}</span>
    </div>
  );
}
Object.assign(window, { MiniMap });
