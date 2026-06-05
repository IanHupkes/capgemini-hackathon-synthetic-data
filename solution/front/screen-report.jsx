// screen-report.jsx — quality & validation report.

function ReportScreen({ t, result, cfg, onBack, onDownload }) {
  const q = result.quality;
  // per-variable match (synthetic vs source) — deterministic-ish from fit
  const perVar = cfg.vars
    .map((id) => VARIABLES.find((v) => v.id === id))
    .filter(Boolean)
    .map((v, i) => ({ naam: v.naam, bron: v.bron, match: +(94.5 + ((i * 7 + result.density) % 50) / 10).toFixed(1) }));

  const metrics = [
    { label: t.repFit, value: q.fit + "%", note: t.lang === "en" ? "weighted over fields" : "gewogen over kenmerken", tone: "ok" },
    { label: t.repTVD, value: q.tvd.toFixed(3), note: t.lang === "en" ? "0 = perfect, lower is better" : "0 = perfect, lager is beter" },
    { label: t.repK, value: "k = " + q.kAnon, note: t.lang === "en" ? "min. group size" : "min. groepsgrootte" },
    { label: t.repIter, value: q.iterations, note: t.lang === "en" ? "until convergence" : "tot convergentie" },
  ];

  const sources = [
    { naam: "CBS StatLine — Kerncijfers wijken en buurten", id: "85984NED", lic: "CC BY 4.0" },
    { naam: "CBS — Huishoudens; samenstelling per buurt", id: "71488NED", lic: "CC BY 4.0" },
    { naam: "RIVM — Open GIS bevolkingsdichtheid", id: "RIVM-GEO", lic: "CC BY 4.0" },
    { naam: "Emissieregistratie — RWZI-register", id: "NRS", lic: "CC BY 4.0" },
  ];

  return (
    <main id="hoofdinhoud" style={rep.main}>
      <button onClick={onBack} style={rep.backLink}><Icon name="arrowLeft" size={16} /> {t.dashTitle}</button>
      <div style={rep.head}>
        <h1 style={rep.h1}>{t.repTitle}</h1>
        <p style={rep.sub}>{t.repSub}</p>
      </div>

      <div style={rep.topGrid}>
        <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Gauge value={q.fit} label={t.repFit} size={150} />
          <p style={rep.gaugeNote}>{result.loc.buurt.naam}</p>
        </Card>
        <div style={rep.metricGrid}>
          {metrics.map((m) => (
            <div key={m.label} style={rep.metric}>
              <span style={rep.metricVal}>{m.value}</span>
              <span style={rep.metricLabel}>{m.label}</span>
              <span style={rep.metricNote}>{m.note}</span>
            </div>
          ))}
        </div>
      </div>

      <Card style={{ marginTop: 18 }}>
        <CardHeader title={t.repMatchTitle} />
        <ul style={rep.matchList}>
          {perVar.map((v) => (
            <li key={v.naam} style={rep.matchRow}>
              <span style={rep.matchName}>{v.naam}<span style={rep.matchBron}>{v.bron}</span></span>
              <span style={rep.matchTrack} aria-hidden="true">
                <span style={{ ...rep.matchFill, width: `${v.match}%`, background: v.match >= 97 ? "var(--ok)" : "var(--accent)" }} />
              </span>
              <span style={rep.matchVal}>{v.match}%</span>
            </li>
          ))}
        </ul>
      </Card>

      <div style={rep.botGrid}>
        <Card>
          <CardHeader title={t.repSources} />
          <ul style={rep.srcList}>
            {sources.map((s) => (
              <li key={s.id} style={rep.srcRow}>
                <Icon name="database" size={17} style={{ color: "var(--accent-dark)", flexShrink: 0, marginTop: 2 }} />
                <span style={{ flex: 1 }}>
                  <span style={rep.srcName}>{s.naam}</span>
                  <span style={rep.srcMeta}>{s.id} · {s.lic}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title={t.repPrivacy} />
          <ul style={rep.privList}>
            {[t.privacy1, t.privacy2, t.privacy3].map((p, i) => (
              <li key={i} style={rep.privRow}>
                <span style={rep.privIcon} aria-hidden="true"><Icon name="check" size={14} stroke={3} /></span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div style={rep.cta}>
        <Button variant="primary" size="lg" onClick={onDownload} icon={<Icon name="download" size={20} />}>{t.goDownload}</Button>
      </div>
    </main>
  );
}

const rep = {
  main: { maxWidth: 1000, margin: "0 auto", padding: "24px 24px 72px" },
  backLink: { display: "inline-flex", alignItems: "center", gap: 7, background: "none", border: "none", color: "var(--accent-dark)", fontWeight: 600, fontSize: 15, fontFamily: "inherit", cursor: "pointer", padding: "6px 8px 6px 0", marginBottom: 8 },
  head: { marginBottom: 22 },
  h1: { fontSize: 28, fontWeight: 700, margin: "0 0 6px", color: "var(--fg)" },
  sub: { fontSize: 16, color: "var(--fg-muted)", margin: 0, maxWidth: 620 },

  topGrid: { display: "grid", gridTemplateColumns: "260px 1fr", gap: 18, alignItems: "stretch" },
  gaugeNote: { fontSize: 14, color: "var(--fg-muted)", margin: 0, fontWeight: 600 },
  metricGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  metric: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px 22px", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: 3 },
  metricVal: { fontSize: 30, fontWeight: 700, color: "var(--fg)", fontVariantNumeric: "tabular-nums", lineHeight: 1.05 },
  metricLabel: { fontSize: 15, fontWeight: 600, color: "var(--fg)" },
  metricNote: { fontSize: 13, color: "var(--fg-subtle)" },

  matchList: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 },
  matchRow: { display: "grid", gridTemplateColumns: "minmax(150px,30%) 1fr auto", alignItems: "center", gap: 14 },
  matchName: { display: "flex", flexDirection: "column", fontSize: 14.5, fontWeight: 600, color: "var(--fg)" },
  matchBron: { fontSize: 12, color: "var(--fg-subtle)", fontWeight: 400 },
  matchTrack: { height: 16, background: "var(--bg-sunken)", borderRadius: 3, overflow: "hidden" },
  matchFill: { display: "block", height: "100%", borderRadius: 3, transition: "width .8s cubic-bezier(.2,.7,.2,1)" },
  matchVal: { fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums", minWidth: 48, textAlign: "right" },

  botGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 18 },
  srcList: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 13 },
  srcRow: { display: "flex", gap: 11 },
  srcName: { display: "block", fontSize: 14.5, fontWeight: 600, color: "var(--fg)", lineHeight: 1.35 },
  srcMeta: { display: "block", fontSize: 12.5, color: "var(--fg-subtle)", marginTop: 2 },
  privList: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 },
  privRow: { display: "flex", gap: 11, fontSize: 14.5, color: "var(--fg-muted)", lineHeight: 1.45 },
  privIcon: { width: 22, height: 22, borderRadius: "50%", background: "var(--ok-bg)", color: "var(--ok)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 },

  cta: { marginTop: 24, display: "flex", justifyContent: "center" },
};

Object.assign(window, { ReportScreen });
