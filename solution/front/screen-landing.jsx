// screen-landing.jsx — intro / hero + "how it works"

function LandingScreen({ t, onStart }) {
  const steps = [
    { icon: "sliders", title: t.stepSelect, body: t.lang === "en" ? "Persona, area and variables." : "Persona, gebied en variabelen." },
    { icon: "sparkles", title: t.stepGenerate, body: t.lang === "en" ? "AI pipeline upscales the aggregates." : "AI-pipeline schaalt aggregaten op." },
    { icon: "chart", title: t.stepDashboard, body: t.lang === "en" ? "Inspect the population in charts." : "Bekijk de populatie in grafieken." },
    { icon: "download", title: t.stepDownload, body: t.lang === "en" ? "Open CSV/Parquet for your models." : "Open CSV/Parquet voor uw modellen." },
  ];
  return (
    <main id="hoofdinhoud" style={land.main}>
      <section style={land.hero}>
        <div style={land.heroInner}>
          <div style={land.heroCopy}>
            <span style={land.tag}><Icon name="shieldCheck" size={15} /> {t.landTag}</span>
            <h1 style={land.title}>{t.landTitle}</h1>
            <p style={land.body}>{t.landBody}</p>
            <div style={land.ctaRow}>
              <Button variant="primary" size="lg" onClick={onStart}
                icon={<Icon name="arrowRight" size={20} />}>{t.landStart}</Button>
              <a href="#hoe" style={land.textLink}>{t.landHow}</a>
            </div>
            <p style={land.privacy}><Icon name="lock" size={15} /> {t.privacyNote}</p>
          </div>
          <aside style={land.heroPanel} aria-hidden="true">
            <div style={land.panelHead}>
              <span style={land.panelDot} /><span style={land.panelDot2} /><span style={land.panelDot3} />
              <span style={land.panelTitle}>synthese.py</span>
            </div>
            <pre style={land.code}>
{`> buurt = "Bospolder, Rotterdam"
> bron  = CBS.buurt(buurt)        # aggregaten
> pop   = IPF.fit(bron, k=12)     # synthese
> pop.head()
 id        leeftijd  huishouden     woning
 SYN-1042  34        Paar+kind.     Koop
 SYN-1042  8         Paar+kind.     Koop
 SYN-1042  71        Eenpersoons    Huur
✓ 8.120 personen · match 98,4% · k=12`}
            </pre>
            <div style={land.panelBadges}>
              <Badge tone="info">CBS StatLine</Badge>
              <Badge tone="info">RIVM</Badge>
              <Badge tone="ok">privacy by design</Badge>
            </div>
          </aside>
        </div>
      </section>

      <section id="hoe" style={land.how} aria-labelledby="how-title">
        <h2 id="how-title" style={land.howTitle}>{t.landStepsTitle}</h2>
        <ol style={land.stepGrid}>
          {steps.map((s, i) => (
            <li key={s.title} style={land.stepCard}>
              <span style={land.stepNum}>{i + 1}</span>
              <span style={land.stepIcon}><Icon name={s.icon} size={24} /></span>
              <h3 style={land.stepCardTitle}>{s.title}</h3>
              <p style={land.stepCardBody}>{s.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}

const land = {
  main: { maxWidth: "var(--maxw)", margin: "0 auto", padding: "0 24px 64px" },
  hero: { padding: "48px 0 16px" },
  heroInner: { display: "grid", gridTemplateColumns: "1.05fr .95fr", gap: 48, alignItems: "center" },
  heroCopy: { minWidth: 0 },
  tag: { display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, color: "var(--accent-dark)", background: "color-mix(in srgb, var(--accent) 12%, white)", padding: "6px 12px", borderRadius: 999, marginBottom: 20 },
  title: { fontSize: "clamp(30px, 4vw, 46px)", lineHeight: 1.08, fontWeight: 700, margin: "0 0 18px", letterSpacing: "-0.015em", textWrap: "balance", color: "var(--fg)" },
  body: { fontSize: "clamp(16px, 1.5vw, 19px)", lineHeight: 1.55, color: "var(--fg-muted)", margin: "0 0 28px", maxWidth: 560, textWrap: "pretty" },
  ctaRow: { display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" },
  textLink: { color: "var(--accent-dark)", fontWeight: 600, fontSize: 16, textDecoration: "underline", textUnderlineOffset: 3 },
  privacy: { display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--fg-subtle)", marginTop: 26 },

  heroPanel: { background: "var(--primary)", borderRadius: "var(--radius-lg)", padding: 18, boxShadow: "var(--shadow-md)", minWidth: 0 },
  panelHead: { display: "flex", alignItems: "center", gap: 7, marginBottom: 14 },
  panelDot: { width: 11, height: 11, borderRadius: "50%", background: "#ff5f57" },
  panelDot2: { width: 11, height: 11, borderRadius: "50%", background: "#febc2e" },
  panelDot3: { width: 11, height: 11, borderRadius: "50%", background: "#28c840" },
  panelTitle: { marginLeft: 8, color: "rgba(255,255,255,.7)", fontSize: 13, fontFamily: "ui-monospace, monospace" },
  code: { margin: 0, padding: 16, background: "rgba(0,0,0,.28)", borderRadius: 6, color: "#dbe7f5", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12.5, lineHeight: 1.7, overflowX: "auto", whiteSpace: "pre" },
  panelBadges: { display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" },

  how: { marginTop: 56 },
  howTitle: { fontSize: 24, fontWeight: 700, margin: "0 0 22px", color: "var(--fg)" },
  stepGrid: { listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 },
  stepCard: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 22, position: "relative", boxShadow: "var(--shadow-sm)" },
  stepNum: { position: "absolute", top: 16, right: 18, fontSize: 13, fontWeight: 700, color: "var(--fg-subtle)" },
  stepIcon: { display: "inline-flex", width: 48, height: 48, borderRadius: 10, background: "color-mix(in srgb, var(--primary) 9%, white)", color: "var(--primary)", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  stepCardTitle: { margin: "0 0 6px", fontSize: 17, fontWeight: 700, color: "var(--fg)" },
  stepCardBody: { margin: 0, fontSize: 14, color: "var(--fg-muted)", lineHeight: 1.5 },
};

Object.assign(window, { LandingScreen });
