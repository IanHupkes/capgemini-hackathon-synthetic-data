// screen-download.jsx — choose format, preview, real download.

function DownloadScreen({ t, result, cfg, onBack }) {
  const { useState } = React;
  const [downloaded, setDownloaded] = useState(false);

  const buurt = result.loc.buurt;
  const fileBase = `synth_${buurt.code}_${cfg.sampleSize}`;
  const fileName = `${fileBase}.csv`;
  const cols = ["persoon_id", "leeftijd", "geslacht", "huishoudtype", "woningtype", "hoogbouw", "mobiliteit", "gevaccineerd", "buurtcode"];

  function doDownload() {
    const csv = toCSV(result);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDownloaded(true);
  }

  return (
    <main id="hoofdinhoud" style={dl.main}>
      <button onClick={onBack} style={dl.backLink}><Icon name="arrowLeft" size={16} /> {t.dashTitle}</button>
      <div style={dl.head}>
        <h1 style={dl.h1}>{t.dlTitle}</h1>
        <p style={dl.sub}>{t.dlSub}</p>
      </div>

      <div style={dl.grid}>
        <div style={dl.left}>
          <Card>
            <CardHeader title={t.dlPreview} sub={`${cols.length} ${t.lang === "en" ? "columns" : "kolommen"} · ${cfg.sampleSize.toLocaleString("nl-NL")} ${t.dlRows}`} />
            <div style={dl.tableWrap} tabIndex={0} role="region" aria-label={t.dlPreview}>
              <table style={dl.table}>
                <thead>
                  <tr>{cols.map((c) => <th key={c} style={dl.th} scope="col">{c}</th>)}</tr>
                </thead>
                <tbody>
                  {result.persons.map((p, i) => (
                    <tr key={i} style={i % 2 ? dl.trAlt : undefined}>
                      <td style={dl.tdMono}>{p.id}</td>
                      <td style={dl.tdNum}>{p.leeftijd}</td>
                      <td style={dl.td}>{p.geslacht}</td>
                      <td style={dl.td}>{p.huishouden}</td>
                      <td style={dl.td}>{p.woning}</td>
                      <td style={dl.td}>{p.hoogbouw}</td>
                      <td style={dl.td}>{p.mobiliteit}</td>
                      <td style={dl.td}>{p.gevaccineerd}</td>
                      <td style={dl.tdMono}>{p.buurt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <aside style={dl.right}>
          <div style={dl.dlCard}>
            <div style={dl.fmtStatic}>
              <span style={dl.fmtBadge} aria-hidden="true">CSV</span>
              <span style={{ minWidth: 0 }}>
                <span style={dl.fmtLabel}>{t.lang === "en" ? "CSV file" : "CSV-bestand"}</span>
                <span style={dl.fmtNote}>{t.lang === "en" ? "Universal, opens in Excel, Python or Java" : "Universeel, opent in Excel, Python of Java"}</span>
              </span>
            </div>

            <div style={dl.fileInfo}>
              <span style={dl.fileIcon} aria-hidden="true"><Icon name="file" size={22} /></span>
              <span style={{ minWidth: 0 }}>
                <span style={dl.fileName}>{fileName}</span>
                <span style={dl.fileMeta}>{t.dlIncludes}: {cfg.vars.map((id) => (VARIABLES.find((v) => v.id === id) || {}).naam).filter(Boolean).join(", ")}</span>
              </span>
            </div>

            <Button variant="primary" size="lg" full onClick={doDownload} icon={<Icon name="download" size={20} />}>
              {t.dlBtn} CSV
            </Button>

            {downloaded && (
              <p style={dl.ready} role="status"><Icon name="check" size={16} stroke={3} /> {t.dlReady}</p>
            )}
            <p style={dl.license}><Icon name="info" size={14} /> {t.dlLicense}</p>
          </div>
        </aside>
      </div>
    </main>
  );
}

const dl = {
  main: { maxWidth: "var(--maxw)", margin: "0 auto", padding: "24px 24px 72px" },
  backLink: { display: "inline-flex", alignItems: "center", gap: 7, background: "none", border: "none", color: "var(--accent-dark)", fontWeight: 600, fontSize: 15, fontFamily: "inherit", cursor: "pointer", padding: "6px 8px 6px 0", marginBottom: 8 },
  head: { marginBottom: 22 },
  h1: { fontSize: 28, fontWeight: 700, margin: "0 0 6px", color: "var(--fg)" },
  sub: { fontSize: 16, color: "var(--fg-muted)", margin: 0 },

  grid: { display: "grid", gridTemplateColumns: "1fr 332px", gap: 24, alignItems: "start" },
  left: { minWidth: 0 },
  tableWrap: { overflowX: "auto", border: "1px solid var(--border)", borderRadius: "var(--radius)" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13.5, minWidth: 640 },
  th: { textAlign: "left", padding: "10px 12px", background: "var(--bg-sunken)", fontWeight: 700, color: "var(--fg)", whiteSpace: "nowrap", borderBottom: "1px solid var(--border)", fontFamily: "ui-monospace, monospace", fontSize: 12.5 },
  td: { padding: "9px 12px", color: "var(--fg-muted)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" },
  tdNum: { padding: "9px 12px", color: "var(--fg)", borderBottom: "1px solid var(--border)", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600 },
  tdMono: { padding: "9px 12px", color: "var(--fg-subtle)", borderBottom: "1px solid var(--border)", fontFamily: "ui-monospace, monospace", fontSize: 12.5, whiteSpace: "nowrap" },
  trAlt: { background: "var(--bg-muted)" },

  right: { position: "sticky", top: 92 },
  dlCard: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 22, boxShadow: "var(--shadow-md)" },
  fmtStatic: { display: "flex", alignItems: "center", gap: 13, padding: "13px 15px", border: "1.5px solid var(--primary)", background: "color-mix(in srgb, var(--primary) 5%, white)", borderRadius: "var(--radius)" },
  fmtBadge: { display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, width: 42, height: 42, borderRadius: 8, background: "var(--primary)", color: "#fff", fontWeight: 700, fontSize: 13, letterSpacing: ".02em" },
  fmtLabel: { display: "block", fontWeight: 700, fontSize: 15, color: "var(--fg)" },
  fmtNote: { display: "block", fontSize: 12.5, color: "var(--fg-subtle)", marginTop: 2, lineHeight: 1.4 },

  fileInfo: { display: "flex", gap: 12, alignItems: "center", margin: "18px 0", padding: "13px 15px", background: "var(--bg-sunken)", borderRadius: "var(--radius)" },
  fileIcon: { color: "var(--primary)", flexShrink: 0 },
  fileName: { display: "block", fontWeight: 700, fontSize: 14.5, color: "var(--fg)", fontFamily: "ui-monospace, monospace", wordBreak: "break-all" },
  fileMeta: { display: "block", fontSize: 12.5, color: "var(--fg-subtle)", marginTop: 3, lineHeight: 1.4 },

  ready: { display: "flex", alignItems: "center", gap: 8, justifyContent: "center", color: "var(--ok)", fontWeight: 700, fontSize: 14.5, margin: "14px 0 0" },
  license: { display: "flex", alignItems: "center", gap: 7, justifyContent: "center", fontSize: 12.5, color: "var(--fg-subtle)", margin: "14px 0 0" },
};

Object.assign(window, { DownloadScreen });
