// screen-pipeline.jsx — animated AI pipeline progress.

function PipelineScreen({ t, cfg, onDone }) {
  const { useState, useEffect, useRef } = React;
  const [active, setActive] = useState(0);     // index of running step
  const [done, setDone] = useState(false);
  const buurt = (findBuurt(cfg.buurt) || {}).buurt;

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const per = reduce ? 220 : 720;
    let i = 0;
    const tick = () => {
      i += 1;
      if (i <= PIPELINE_STEPS.length) {
        setActive(i);
        if (i < PIPELINE_STEPS.length) timer = setTimeout(tick, per);
        else { setDone(true); }
      }
    };
    let timer = setTimeout(tick, per);
    return () => clearTimeout(timer);
  }, []);

  const pct = Math.round((active / PIPELINE_STEPS.length) * 100);

  return (
    <main id="hoofdinhoud" style={pipe.main}>
      <div style={pipe.box}>
        <div style={pipe.spinnerWrap} aria-hidden="true">
          {!done ? <span style={pipe.spinner} /> : <span style={pipe.doneMark}><Icon name="check" size={34} stroke={3} /></span>}
        </div>
        <h1 style={pipe.title}>{done ? (t.lang === "en" ? "Synthetic population ready" : "Synthetische populatie gereed") : t.pipeTitle}</h1>
        <p style={pipe.sub}>{buurt ? `${buurt.naam} · ${cfg.sampleSize.toLocaleString("nl-NL")} ${t.lang === "en" ? "individuals" : "personen"}` : t.pipeSub}</p>

        <div style={pipe.progressTrack} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={t.pipeTitle}>
          <div style={{ ...pipe.progressFill, width: `${pct}%` }} />
        </div>
        <span style={pipe.pctLabel}>{pct}%</span>

        <ol style={pipe.steps}>
          {PIPELINE_STEPS.map((s, i) => {
            const state = i < active ? "done" : i === active && !done ? "running" : i < active ? "done" : (done ? "done" : "todo");
            const isDone = i < active || done;
            const isRunning = i === active && !done;
            return (
              <li key={s.id} style={pipe.step}>
                <span style={{
                  ...pipe.stepIcon,
                  ...(isDone ? pipe.stepIconDone : {}),
                  ...(isRunning ? pipe.stepIconRun : {}),
                }} aria-hidden="true">
                  {isDone ? <Icon name="check" size={15} stroke={3} /> : isRunning ? <span style={pipe.miniSpin} /> : i + 1}
                </span>
                <span style={{ ...pipe.stepLabel, color: (isDone || isRunning) ? "var(--fg)" : "var(--fg-subtle)", fontWeight: isRunning ? 700 : 500 }}>
                  {t.lang === "en" ? s.en : s.nl}
                </span>
                <span style={pipe.stepStatus} aria-hidden="true">
                  {isDone ? (t.lang === "en" ? "done" : "klaar") : isRunning ? (t.lang === "en" ? "running…" : "bezig…") : ""}
                </span>
              </li>
            );
          })}
        </ol>

        {done && (
          <div style={pipe.cta}>
            <Button variant="primary" size="lg" onClick={onDone} icon={<Icon name="chart" size={20} />}>{t.pipeView}</Button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes sd-spin { to { transform: rotate(360deg); } }
        @keyframes sd-pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
      `}</style>
    </main>
  );
}

const pipe = {
  main: { maxWidth: 640, margin: "0 auto", padding: "56px 24px 72px", display: "flex", justifyContent: "center" },
  box: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "40px 36px", boxShadow: "var(--shadow-md)", width: "100%", textAlign: "center" },
  spinnerWrap: { display: "flex", justifyContent: "center", marginBottom: 20 },
  spinner: { width: 56, height: 56, borderRadius: "50%", border: "5px solid var(--bg-sunken)", borderTopColor: "var(--primary)", animation: "sd-spin 1s linear infinite", display: "block" },
  doneMark: { width: 56, height: 56, borderRadius: "50%", background: "var(--ok)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontWeight: 700, margin: "0 0 6px", color: "var(--fg)" },
  sub: { fontSize: 15, color: "var(--fg-muted)", margin: "0 0 26px" },

  progressTrack: { height: 10, background: "var(--bg-sunken)", borderRadius: 999, overflow: "hidden", marginBottom: 6 },
  progressFill: { height: "100%", background: "var(--primary)", borderRadius: 999, transition: "width .6s cubic-bezier(.3,.7,.3,1)" },
  pctLabel: { display: "block", textAlign: "right", fontSize: 13, fontWeight: 700, color: "var(--fg-muted)", marginBottom: 22, fontVariantNumeric: "tabular-nums" },

  steps: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4, textAlign: "left" },
  step: { display: "flex", alignItems: "center", gap: 13, padding: "11px 10px", borderRadius: "var(--radius)" },
  stepIcon: { width: 28, height: 28, borderRadius: "50%", background: "var(--bg-sunken)", color: "var(--fg-subtle)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 },
  stepIconDone: { background: "var(--ok)", color: "#fff" },
  stepIconRun: { background: "var(--primary)", color: "#fff" },
  stepLabel: { flex: 1, fontSize: 15.5 },
  stepStatus: { fontSize: 13, color: "var(--fg-subtle)", fontVariantNumeric: "tabular-nums" },
  miniSpin: { width: 14, height: 14, borderRadius: "50%", border: "2.5px solid rgba(255,255,255,.4)", borderTopColor: "#fff", animation: "sd-spin .8s linear infinite", display: "block" },

  cta: { marginTop: 28, display: "flex", justifyContent: "center" },
};

Object.assign(window, { PipelineScreen });
