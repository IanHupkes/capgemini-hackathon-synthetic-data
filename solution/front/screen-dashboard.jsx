// screen-dashboard.jsx — results dashboard with KPIs + charts.

function DashboardScreen({ t, result, cfg, density, onReport, onDownload, onNew }) {
  const buurt = result.loc.buurt;
  const has = (id) => cfg.vars.includes(id);

  const kpis = [
    { icon: "users", label: t.kpiPersons, value: cfg.sampleSize.toLocaleString("nl-NL") },
    { icon: "home", label: t.kpiHouseholds, value: result.households.toLocaleString("nl-NL") },
    { icon: "shieldCheck", label: t.kpiFit, value: result.quality.fit + "%", tone: "ok" },
    { icon: "layers", label: t.kpiDensity, value: result.density.toLocaleString("nl-NL") },
  ];

  // chart cards depend on selected variables
  const cards = [];
  if (has("leeftijd")) cards.push({ key: "age", title: t.chartAge, sub: t.pctOfPop, wide: true,
    body: <HistogramV data={result.age} title={t.chartAge} /> });
  if (has("huishouden")) cards.push({ key: "hh", title: t.chartHH, sub: t.pctOfHH,
    body: <BarChartH data={result.hh} title={t.chartHH} /> });
  if (has("woning")) cards.push({ key: "house", title: t.chartHouse, sub: `${t.lang === "en" ? "Occupancy" : "Bezetting"} ${result.occupancy} ${t.lang === "en" ? "p/home" : "p/woning"}`,
    body: <Donut data={result.house} title={t.chartHouse} /> });
  if (has("mobiliteit")) cards.push({ key: "mob", title: t.chartMob, sub: t.pctOfMob, wide: true,
    body: <BarChartH data={result.mobility} title={t.chartMob} /> });
  if (has("vaccinatie")) cards.push({ key: "vacc", title: t.chartVacc, sub: t.pctVacc, wide: true,
    body: <BarChartH data={result.vaccinatie} title={t.chartVacc} color="var(--c3)" /> });
  if (has("hoogbouw")) cards.push({ key: "hoog", title: t.chartHoog, sub: t.pctOfHomes,
    body: <Donut data={result.hoogbouw} title={t.chartHoog} /> });

  const cols = density === "compact" ? 3 : density === "comfy" ? 1 : 2;

  return (
    <main id="hoofdinhoud" style={dash.main}>
      <button onClick={onNew} style={dash.backLink}>
        <Icon name="arrowLeft" size={16} /> {t.newRun}
      </button>
      <div style={dash.head}>
        <div>
          <p style={dash.eyebrow}>{t.dashFor}</p>
          <h1 style={dash.h1}>{buurt.naam}</h1>
          <p style={dash.meta}>{result.loc.gemeente.naam} · {buurt.code} · {t.lang === "en" ? "generated" : "gegenereerd"} {result.generatedAt.toLocaleString("nl-NL", { dateStyle: "medium", timeStyle: "short" })}</p>
        </div>
        <div style={dash.headActions}>
          <Button variant="secondary" onClick={onReport} icon={<Icon name="shieldCheck" size={18} />}>{t.viewReport}</Button>
          <Button variant="primary" onClick={onDownload} icon={<Icon name="download" size={18} />}>{t.goDownload}</Button>
        </div>
      </div>

      <div style={dash.kpiRow}>
        {kpis.map((k) => (
          <div key={k.label} style={dash.kpi}>
            <span style={{ ...dash.kpiIcon, ...(k.tone === "ok" ? { background: "var(--ok-bg)", color: "var(--ok)" } : {}) }} aria-hidden="true">
              <Icon name={k.icon} size={20} />
            </span>
            <span style={dash.kpiVal}>{k.value}</span>
            <span style={dash.kpiLabel}>{k.label}</span>
          </div>
        ))}
      </div>

      <div style={{ ...dash.chartGrid, gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {cards.map((c) => (
          <Card key={c.key} style={{ gridColumn: c.wide && cols > 1 ? "span 2" : undefined, minWidth: 0 }}>
            <CardHeader title={c.title} sub={c.sub} />
            {c.body}
          </Card>
        ))}
      </div>
    </main>
  );
}

const dash = {
  main: { maxWidth: "var(--maxw)", margin: "0 auto", padding: "24px 24px 72px" },
  backLink: { display: "inline-flex", alignItems: "center", gap: 7, background: "none", border: "none", color: "var(--accent-dark)", fontWeight: 600, fontSize: 15, fontFamily: "inherit", cursor: "pointer", padding: "6px 8px 6px 0", marginBottom: 8 },
  head: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 20, flexWrap: "wrap", marginBottom: 22 },
  eyebrow: { fontSize: 13, fontWeight: 600, color: "var(--fg-subtle)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: ".04em" },
  h1: { fontSize: 30, fontWeight: 700, margin: "0 0 4px", color: "var(--fg)" },
  meta: { fontSize: 14, color: "var(--fg-subtle)", margin: 0 },
  headActions: { display: "flex", gap: 10, flexWrap: "wrap" },

  kpiRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 },
  kpi: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "18px 20px", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: 4 },
  kpiIcon: { width: 40, height: 40, borderRadius: 9, background: "color-mix(in srgb, var(--primary) 9%, white)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  kpiVal: { fontSize: 28, fontWeight: 700, color: "var(--fg)", fontVariantNumeric: "tabular-nums", lineHeight: 1.1 },
  kpiLabel: { fontSize: 13.5, color: "var(--fg-muted)" },

  chartGrid: { display: "grid", gap: 18 },
};

Object.assign(window, { DashboardScreen });
