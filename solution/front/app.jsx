// app.jsx — orchestration: routing, theming, tweaks.

const { useState, useEffect, useMemo } = React;

const THEMES = {
  rijksblauw: { primary: "#154273", accent: "#007bc7", naam: "Rijksblauw" },
  marineblauw: { primary: "#0b3d6e", accent: "#2b7de9", naam: "Marineblauw" },
  donkergroen: { primary: "#275937", accent: "#39870c", naam: "Donkergroen" },
  bordeaux: { primary: "#6b1e3c", accent: "#a90061", naam: "Bordeaux" },
};
const FONTS = {
  poppins: '"Poppins", system-ui, sans-serif',
  source: '"Source Sans 3", system-ui, sans-serif',
  public: '"Public Sans", system-ui, sans-serif',
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "rijksblauw",
  "font": "poppins",
  "density": "regular"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen] = useState("select");
  const [result, setResult] = useState(null);
  const [cfg, setCfg] = useState({
    personaId: "lena",
    gemeente: "", wijk: "", buurt: "",
    vars: ["mobiliteit", "woning", "leeftijd", "huishouden"],
    sampleSize: 10000,
    method: "ipf",
  });

  const lang = "nl";
  const tr = useMemo(() => ({ ...I18N[lang], lang }), [lang]);

  // apply theme + font + density to :root
  useEffect(() => {
    const root = document.documentElement;
    const th = THEMES[t.theme] || THEMES.rijksblauw;
    root.style.setProperty("--primary", th.primary);
    root.style.setProperty("--primary-dark", `color-mix(in srgb, ${th.primary} 78%, black)`);
    root.style.setProperty("--accent", th.accent);
    root.style.setProperty("--accent-dark", `color-mix(in srgb, ${th.accent} 80%, black)`);
    root.style.setProperty("--c1", th.primary);
    root.style.setProperty("--c2", th.accent);
    root.style.setProperty("--font", FONTS[t.font] || FONTS.poppins);
    root.style.setProperty("--density", t.density === "compact" ? "0.82" : t.density === "comfy" ? "1.18" : "1");
    document.documentElement.lang = lang;
  }, [t.theme, t.font, t.density, lang]);

  function go(next) { setScreen(next); window.scrollTo({ top: 0, behavior: "auto" }); }

  async function runGenerate() {
    if (cfg.buurt) {
      try {
        const response = await fetch("http://127.0.0.1:5000/get-synth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ buurt_code: cfg.buurt }),
        });
        const data = await response.json();
        console.log("POST /get-synth response", data);
      } catch (error) {
        console.error("POST /get-synth failed", error);
      }
    }

    setResult(generate(cfg.buurt, cfg.vars, cfg.sampleSize));
    go("pipeline");
  }
  function restart() { setResult(null); go("select"); }

  const stepIndex = { select: 0, pipeline: 1, dashboard: 2, report: 2, download: 2 }[screen];

  return (
    <div style={app.root}>
      <AppHeader t={tr} onHome={() => go("select")} right={null} />
      {stepIndex !== undefined && <Stepper t={tr} current={stepIndex} />}

      <div key={screen} style={app.fade}>
        {screen === "select" && <SelectScreen t={tr} cfg={cfg} setCfg={setCfg} onGenerate={runGenerate} />}
        {screen === "pipeline" && <PipelineScreen t={tr} cfg={cfg} onDone={() => go("dashboard")} />}
        {screen === "dashboard" && result && <DashboardScreen t={tr} result={result} cfg={cfg} density={t.density}
          onReport={() => go("report")} onDownload={() => go("download")} onNew={restart} />}
        {screen === "report" && result && <ReportScreen t={tr} result={result} cfg={cfg}
          onBack={() => go("dashboard")} onDownload={() => go("download")} />}
        {screen === "download" && result && <DownloadScreen t={tr} result={result} cfg={cfg} onBack={() => go("dashboard")} />}
      </div>

      <footer style={app.footer}>
        <div style={app.footerInner}>
          <span>{tr.appName} · {tr.appSub}</span>
          <span style={{ color: "var(--fg-subtle)" }}>{tr.privacyNote}</span>
        </div>
      </footer>

      <TweaksPanel title={tr.tweaksTitle}>
        <TweakSection label="Thema" />
        <TweakSelect label="Kleurthema" value={t.theme}
          options={Object.keys(THEMES).map((k) => ({ value: k, label: THEMES[k].naam }))}
          onChange={(v) => setTweak("theme", v)} />
        <TweakSelect label="Lettertype" value={t.font}
          options={[{ value: "poppins", label: "Poppins" }, { value: "source", label: "Source Sans 3" }, { value: "public", label: "Public Sans" }]}
          onChange={(v) => setTweak("font", v)} />
        <TweakSection label="Weergave" />
        <TweakRadio label="Dichtheid" value={t.density}
          options={["compact", "regular", "comfy"]} onChange={(v) => setTweak("density", v)} />
      </TweaksPanel>

      <style>{`
        @keyframes sd-fade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}

const app = {
  root: { minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-muted)" },
  fade: { flex: 1, animation: "sd-fade .3s ease both" },
  footer: { background: "var(--bg)", borderTop: "1px solid var(--border)", marginTop: "auto" },
  footerInner: { maxWidth: "var(--maxw)", margin: "0 auto", padding: "18px 24px", display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", fontSize: 13.5, color: "var(--fg-muted)" },
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
